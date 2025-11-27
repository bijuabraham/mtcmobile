const { verifyToken } = require('../utils/jwt');
const db = require('../db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
}

async function authenticateAndRequireApproval(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    const result = await db.query(
      'SELECT id, is_approved, profile_complete FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.profile_complete) {
      return res.status(403).json({ 
        error: 'Profile incomplete', 
        code: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile before accessing this resource'
      });
    }

    if (!user.is_approved) {
      return res.status(403).json({ 
        error: 'Approval pending', 
        code: 'APPROVAL_PENDING',
        message: 'Your account is pending admin approval'
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Error checking user approval:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { authenticateToken, authenticateAndRequireApproval };
