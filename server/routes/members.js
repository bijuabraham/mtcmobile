const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = 'SELECT * FROM members WHERE is_visible = true';
    let params = [];

    if (search) {
      query += ` AND (LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1)`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ' ORDER BY last_name, first_name';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

module.exports = router;
