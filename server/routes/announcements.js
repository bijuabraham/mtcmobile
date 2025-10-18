const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM announcements 
       WHERE is_active = true 
       AND start_date <= now() 
       AND end_date >= now()
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

module.exports = router;
