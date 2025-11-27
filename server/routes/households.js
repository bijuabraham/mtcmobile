const express = require('express');
const db = require('../db');
const { authenticateToken, authenticateAndRequireApproval } = require('../middleware/auth');
const { keysToCamelCase } = require('../utils/camelCase');

const router = express.Router();

// Get all households for directory listing (requires approval)
router.get('/directory', authenticateAndRequireApproval, async (req, res) => {
  try {
    // Get the current user's email to check if they are in the members table
    const userResult = await db.query('SELECT email FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      console.log('❌ Household directory access: User not found, userId:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userEmail = userResult.rows[0].email;
    console.log('🔍 Household directory access attempt by:', userEmail);
    
    // Check if the user's email exists in the members table
    const memberCheck = await db.query('SELECT id FROM members WHERE LOWER(email) = LOWER($1)', [userEmail]);
    const userIsInDirectory = memberCheck.rows.length > 0;
    
    console.log('📋 Email found in members table:', userIsInDirectory, '(matches:', memberCheck.rows.length, ')');
    
    // If user's email is not in members table, return empty array
    if (!userIsInDirectory) {
      console.log('⛔ Household directory access DENIED - email not in members table');
      return res.json([]);
    }
    
    console.log('✅ Household directory access GRANTED - returning households');
    
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
    const userResult = await db.query(
      'SELECT household_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (!userResult.rows.length || !userResult.rows[0].household_id) {
      return res.json(null);
    }

    const result = await db.query(
      'SELECT * FROM households WHERE household_id = $1',
      [userResult.rows[0].household_id]
    );

    res.json(result.rows.length > 0 ? keysToCamelCase(result.rows[0]) : null);
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
