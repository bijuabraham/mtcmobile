const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const connectPg = require("connect-pg-simple");
const db = require("./db");

const AUTHORIZED_ADMIN_EMAIL = 'admin@marthomasf.org';

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
    secret: process.env.SESSION_SECRET || 'church-app-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

async function upsertUser(profile) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const firstName = profile.name?.givenName || null;
  const lastName = profile.name?.familyName || null;
  const profileImageUrl = profile.photos?.[0]?.value || null;
  
  const isAdminEmail = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const existingUser = await db.query(
    "SELECT * FROM users WHERE google_id = $1 OR email = $2",
    [googleId, email]
  );

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
    
    if (isAdminEmail) {
      await db.query(
        `UPDATE users SET 
          google_id = COALESCE($1, google_id),
          email = COALESCE($2, email),
          first_name = COALESCE($3, first_name),
          last_name = COALESCE($4, last_name),
          profile_image_url = COALESCE($5, profile_image_url),
          is_admin = TRUE,
          is_approved = TRUE,
          profile_complete = TRUE,
          updated_at = NOW()
         WHERE id = $6`,
        [googleId, email, firstName, lastName, profileImageUrl, user.id]
      );
      return { ...user, google_id: googleId, email, first_name: firstName, last_name: lastName, profile_image_url: profileImageUrl, is_admin: true, is_approved: true, profile_complete: true };
    } else {
      await db.query(
        `UPDATE users SET 
          google_id = COALESCE($1, google_id),
          email = COALESCE($2, email),
          first_name = COALESCE(NULLIF($3, ''), first_name),
          last_name = COALESCE(NULLIF($4, ''), last_name),
          profile_image_url = COALESCE($5, profile_image_url),
          updated_at = NOW()
         WHERE id = $6`,
        [googleId, email, firstName, lastName, profileImageUrl, user.id]
      );
      return { ...user, google_id: googleId, email, profile_image_url: profileImageUrl };
    }
  } else {
    if (isAdminEmail) {
      const result = await db.query(
        `INSERT INTO users (email, google_id, first_name, last_name, profile_image_url, email_verified, profile_complete, is_approved, is_admin)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, TRUE, TRUE)
         RETURNING *`,
        [email, googleId, firstName, lastName, profileImageUrl]
      );
      return result.rows[0];
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
}

async function setupAuth(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.error("❌ Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: "/api/auth/google/callback",
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const dbUser = await upsertUser(profile);
      return done(null, { 
        dbUser,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error("Auth verification error:", error);
      return done(error);
    }
  }));

  passport.serializeUser((user, cb) => {
    cb(null, { dbUserId: user.dbUser?.id });
  });

  passport.deserializeUser(async (data, cb) => {
    try {
      if (!data?.dbUserId) {
        return cb(null, null);
      }
      const result = await db.query("SELECT * FROM users WHERE id = $1", [data.dbUserId]);
      if (result.rows.length === 0) {
        return cb(null, null);
      }
      cb(null, { dbUser: result.rows[0] });
    } catch (error) {
      cb(error);
    }
  });

  app.get("/api/auth/login", passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/login?error=auth_failed" 
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
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
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
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
    const userId = req.user.dbUser?.id;

    const userCheck = await db.query("SELECT email FROM users WHERE id = $1", [userId]);
    const userEmail = userCheck.rows[0]?.email?.toLowerCase();
    const isAdminEmail = userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

    if (!isAdminEmail && (!firstName || !lastName || !donorNumber)) {
      return res.status(400).json({ error: "First name, last name, and donor number are required" });
    }

    if (isAdminEmail && (!firstName || !lastName)) {
      return res.status(400).json({ error: "First name and last name are required" });
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
         RETURNING id, email, first_name, last_name, donor_number, is_approved, profile_complete, is_admin`,
        [firstName, lastName, donorNumber || null, userId]
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
          profileComplete: dbUser.profile_complete,
          isAdmin: dbUser.is_admin
        }
      });
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  console.log("✅ Google OAuth initialized");
}

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
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
