const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM donations WHERE user_id = $1';
    let params = [req.userId];

    if (start_date && end_date) {
      query += ' AND donation_date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY donation_date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to get donations' });
  }
});

module.exports = router;
