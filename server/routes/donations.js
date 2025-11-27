const express = require('express');
const db = require('../db');
const { isApproved } = require('../googleAuth');
const { keysToCamelCase } = require('../utils/camelCase');

const router = express.Router();

// Get user's donations (requires approval)
router.get('/', isApproved, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const userId = req.user?.dbUser?.id;
    const userResult = await db.query(
      'SELECT household_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows.length || !userResult.rows[0].household_id) {
      return res.json([]);
    }

    const externalHouseholdId = userResult.rows[0].household_id;

    let query = 'SELECT * FROM donations WHERE household_id = $1';
    let params = [externalHouseholdId];

    if (start_date && end_date) {
      query += ' AND donation_date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY donation_date DESC';

    const result = await db.query(query, params);
    res.json(keysToCamelCase(result.rows));
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to get donations' });
  }
});

module.exports = router;
