const client = require("openid-client");
const { Strategy } = require("openid-client/passport");
const passport = require("passport");
const session = require("express-session");
const connectPg = require("connect-pg-simple");
const db = require("./db");

let oidcConfig = null;
let configFetchedAt = null;
const CONFIG_TTL = 3600 * 1000;

async function getOidcConfig() {
  if (oidcConfig && configFetchedAt && Date.now() - configFetchedAt < CONFIG_TTL) {
    return oidcConfig;
  }
  oidcConfig = await client.discovery(
    new URL(process.env.ISSUER_URL || "https://replit.com/oidc"),
    process.env.REPL_ID
  );
  configFetchedAt = Date.now();
  return oidcConfig;
}

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims) {
  const googleId = claims["sub"];
  const email = claims["email"]?.toLowerCase();
  const firstName = claims["first_name"] || null;
  const lastName = claims["last_name"] || null;
  const profileImageUrl = claims["profile_image_url"] || null;

  const existingUser = await db.query(
    "SELECT * FROM users WHERE google_id = $1 OR email = $2",
    [googleId, email]
  );

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
    await db.query(
      `UPDATE users SET 
        google_id = COALESCE($1, google_id),
        email = COALESCE($2, email),
        profile_image_url = COALESCE($3, profile_image_url),
        updated_at = NOW()
       WHERE id = $4`,
      [googleId, email, profileImageUrl, user.id]
    );
    return { ...user, google_id: googleId, email, profile_image_url: profileImageUrl };
  } else {
    const result = await db.query(
      `INSERT INTO users (email, google_id, first_name, last_name, profile_image_url, email_verified, profile_complete, is_approved)
       VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, FALSE)
       RETURNING *`,
      [email, googleId, firstName, lastName, profileImageUrl]
    );
    return result.rows[0];
  }
}

async function setupAuth(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (tokens, verified) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      const dbUser = await upsertUser(tokens.claims());
      user.dbUser = dbUser;
      verified(null, user);
    } catch (error) {
      console.error("Auth verification error:", error);
      verified(error);
    }
  };

  const registeredStrategies = new Set();

  const ensureStrategy = (domain) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/auth/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get("/api/auth/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/auth/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      failureRedirect: "/login?error=auth_failed",
    })(req, res, (err) => {
      if (err) {
        console.error("Auth callback error:", err);
        return res.redirect("/login?error=auth_failed");
      }
      res.redirect("/");
    });
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const dbUser = await db.query(
        "SELECT id, email, first_name, last_name, donor_number, is_approved, profile_complete, profile_image_url, is_admin FROM users WHERE id = $1",
        [req.user.dbUser?.id]
      );

      if (dbUser.rows.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json(dbUser.rows[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.json({ user: null });
    }

    try {
      const dbUser = await db.query(
        "SELECT id, email, first_name, last_name, donor_number, is_approved, profile_complete, profile_image_url, is_admin FROM users WHERE id = $1",
        [req.user.dbUser?.id]
      );

      if (dbUser.rows.length === 0) {
        return res.json({ user: null });
      }

      const user = dbUser.rows[0];
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          donorNumber: user.donor_number,
          isApproved: user.is_approved,
          profileComplete: user.profile_complete,
          profileImageUrl: user.profile_image_url,
          isAdmin: user.is_admin
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { firstName, lastName, donorNumber } = req.body;

    if (!firstName || !lastName || !donorNumber) {
      return res.status(400).json({ error: "First name, last name, and donor number are required" });
    }

    try {
      const result = await db.query(
        `UPDATE users SET 
          first_name = $1, 
          last_name = $2, 
          donor_number = $3, 
          profile_complete = TRUE, 
          updated_at = NOW()
         WHERE id = $4 
         RETURNING id, email, first_name, last_name, donor_number, is_approved, profile_complete`,
        [firstName, lastName, donorNumber, req.user.dbUser?.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const dbUser = result.rows[0];
      req.user.dbUser = dbUser;
      res.json({ 
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          donorNumber: dbUser.donor_number,
          isApproved: dbUser.is_approved,
          profileComplete: dbUser.profile_complete
        }
      });
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
}

const isAuthenticated = async (req, res, next) => {
  const user = req.user;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const isApproved = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await db.query(
      "SELECT is_approved, profile_complete FROM users WHERE id = $1",
      [req.user.dbUser?.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (!user.profile_complete) {
      return res.status(403).json({ error: "Profile not complete", code: "PROFILE_INCOMPLETE" });
    }

    if (!user.is_approved) {
      return res.status(403).json({ error: "Account pending approval", code: "PENDING_APPROVAL" });
    }

    next();
  } catch (error) {
    console.error("Error checking approval:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { setupAuth, isAuthenticated, isApproved };
