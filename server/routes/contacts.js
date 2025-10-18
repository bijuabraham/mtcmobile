const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM contact_us 
       WHERE is_active = true 
       ORDER BY display_order ASC, title ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

module.exports = router;
