const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { keysToCamelCase } = require('../utils/camelCase');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        m.*,
        h.donor_id,
        h.prayer_group
      FROM members m
      LEFT JOIN households h ON m.household_id = h.household_id
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
