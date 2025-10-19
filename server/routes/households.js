const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { keysToCamelCase } = require('../utils/camelCase');

const router = express.Router();

// Get all households for directory listing
router.get('/directory', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, household_id, family_name, address, phone, email, photo_url, donor_id, prayer_group, created_at, updated_at
       FROM households
       ORDER BY family_name ASC`
    );

    res.json(keysToCamelCase(result.rows));
  } catch (error) {
    console.error('Get all households error:', error);
    res.status(500).json({ error: 'Failed to get households' });
  }
});

// Get user's own household
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM households WHERE user_id = $1',
      [req.userId]
    );

    res.json(result.rows.length > 0 ? result.rows[0] : null);
  } catch (error) {
    console.error('Get household error:', error);
    res.status(500).json({ error: 'Failed to get household' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { family_name, address, phone, email, photo_url, donor_id, prayer_group } = req.body;

    if (!family_name) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    const result = await db.query(
      `INSERT INTO households (user_id, family_name, address, phone, email, photo_url, donor_id, prayer_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, family_name, address, phone, email, photo_url, donor_id, prayer_group]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { family_name, address, phone, email, photo_url, donor_id, prayer_group } = req.body;

    const result = await db.query(
      `UPDATE households 
       SET family_name = COALESCE($2, family_name),
           address = COALESCE($3, address),
           phone = COALESCE($4, phone),
           email = COALESCE($5, email),
           photo_url = COALESCE($6, photo_url),
           donor_id = COALESCE($7, donor_id),
           prayer_group = COALESCE($8, prayer_group),
           updated_at = now()
       WHERE user_id = $1
       RETURNING *`,
      [req.userId, family_name, address, phone, email, photo_url, donor_id, prayer_group]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update household error:', error);
    res.status(500).json({ error: 'Failed to update household' });
  }
});

module.exports = router;
