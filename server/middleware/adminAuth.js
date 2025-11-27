const db = require('../db');

const AUTHORIZED_ADMIN_EMAIL = 'admin@marthomasf.org';

async function requireAdmin(req, res, next) {
  try {
    console.log('=== Admin Auth Check ===');
    console.log('Path:', req.path);
    console.log('Session ID:', req.sessionID);
    console.log('Has session:', !!req.session);
    console.log('Session passport:', JSON.stringify(req.session?.passport));
    console.log('req.user:', req.user ? JSON.stringify({ id: req.user.dbUser?.id }) : 'null');
    
    // Try to get user from passport first
    let userId = req.user?.dbUser?.id;
    
    // If passport doesn't have the user but we have a session with passport data,
    // try to reload the user from the database
    if (!userId && req.session?.passport?.user?.dbUserId) {
      console.log('Attempting to reload user from session passport data...');
      const dbUserId = req.session.passport.user.dbUserId;
      const userResult = await db.query("SELECT * FROM users WHERE id = $1", [dbUserId]);
      if (userResult.rows.length > 0) {
        // Reconstruct req.user manually
        req.user = { dbUser: userResult.rows[0] };
        userId = req.user.dbUser.id;
        console.log('User reloaded successfully, id:', userId);
      }
    }
    
    if (!userId) {
      console.log('Auth failed - no userId found');
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
