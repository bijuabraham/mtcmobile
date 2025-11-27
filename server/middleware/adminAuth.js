const db = require('../db');

const AUTHORIZED_ADMIN_EMAIL = 'admin@marthomasf.org';

async function requireAdmin(req, res, next) {
  try {
    console.log('Admin auth check:', {
      path: req.path,
      hasIsAuthenticated: !!req.isAuthenticated,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      hasUser: !!req.user,
      sessionID: req.sessionID,
      hasSession: !!req.session
    });
    
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      console.log('Auth failed - not authenticated');
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const userId = req.user.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Session invalid. Please log in again.' });
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
