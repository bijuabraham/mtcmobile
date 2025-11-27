const db = require('../db');

const AUTHORIZED_ADMIN_EMAIL = 'admin@marthomasf.org';

async function requireAdmin(req, res, next) {
  try {
    // Try to get user from passport first
    let userId = req.user?.dbUser?.id;
    
    // If passport doesn't have the user but we have a session with passport data,
    // try to reload the user from the database
    if (!userId && req.session?.passport?.user?.dbUserId) {
      const dbUserId = req.session.passport.user.dbUserId;
      const userResult = await db.query("SELECT * FROM users WHERE id = $1", [dbUserId]);
      if (userResult.rows.length > 0) {
        // Reconstruct req.user manually
        req.user = { dbUser: userResult.rows[0] };
        userId = req.user.dbUser.id;
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const result = await db.query(
      'SELECT id, email, is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    if (user.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied. Only the authorized administrator can access this panel.' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { requireAdmin };
