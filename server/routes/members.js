const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { keysToCamelCase } = require('../utils/camelCase');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get the current user's email to check if they are in the members table
    const userResult = await db.query('SELECT email FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userEmail = userResult.rows[0].email;
    
    // Check if the user's email exists in the members table
    const memberCheck = await db.query('SELECT id FROM members WHERE LOWER(email) = LOWER($1)', [userEmail]);
    const userIsInDirectory = memberCheck.rows.length > 0;
    
    // If user's email is not in members table, return empty array
    if (!userIsInDirectory) {
      return res.json([]);
    }
    
    let query = `
      SELECT 
        m.*,
        h.donor_id,
        h.prayer_group
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      WHERE m.is_visible = true
    `;
    let params = [];

    if (search) {
      query += ` AND (LOWER(m.first_name) LIKE $1 OR LOWER(m.last_name) LIKE $1)`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ' ORDER BY m.last_name, m.first_name';

    const result = await db.query(query, params);
    res.json(keysToCamelCase(result.rows));
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

module.exports = router;
