const express = require('express');
const db = require('../db');
const { keysToCamelCase } = require('../utils/camelCase');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Get active announcements (public endpoint for mobile app)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, content, start_date, end_date, created_at, updated_at
       FROM announcements 
       WHERE is_active = true 
       AND start_date <= now() 
       AND end_date >= now()
       ORDER BY created_at DESC
       LIMIT 2`
    );

    res.json(result.rows.map(row => keysToCamelCase(row)));
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// Get all announcements for admin (last 2 created)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, content, start_date, end_date, is_active, created_at, updated_at
       FROM announcements 
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT 2`
    );

    res.json(result.rows.map(row => keysToCamelCase(row)));
  } catch (error) {
    console.error('Get admin announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// Save/update announcements (admin only)
router.post('/admin/save', requireAdmin, async (req, res) => {
  try {
    const { announcements } = req.body;

    if (!Array.isArray(announcements) || announcements.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 announcements required' });
    }

    const results = [];

    for (const announcement of announcements) {
      const { id, content, startDate, endDate } = announcement;

      if (!content || !startDate || !endDate) {
        return res.status(400).json({ error: 'Content, start date, and end date are required' });
      }

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }

      if (id) {
        // Update existing announcement
        const result = await db.query(
          `UPDATE announcements 
           SET content = $1, start_date = $2, end_date = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [content, startDate, endDate, id]
        );
        results.push(keysToCamelCase(result.rows[0]));
      } else {
        // Create new announcement
        const result = await db.query(
          `INSERT INTO announcements (content, start_date, end_date, is_active)
           VALUES ($1, $2, $3, true)
           RETURNING *`,
          [content, startDate, endDate]
        );
        results.push(keysToCamelCase(result.rows[0]));
      }
    }

    res.json({
      success: true,
      announcements: results
    });
  } catch (error) {
    console.error('Save announcements error:', error);
    res.status(500).json({ error: 'Failed to save announcements' });
  }
});

module.exports = router;
