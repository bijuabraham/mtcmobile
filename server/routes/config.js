const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM church_configurations ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Church configuration not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get church configuration' });
  }
});

module.exports = router;
