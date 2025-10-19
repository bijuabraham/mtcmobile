const express = require('express');
const router = express.Router();
const db = require('../db');
const { keysToCamelCase } = require('../utils/camelCase');
const multer = require('multer');
const xlsx = require('xlsx');
const { requireAdmin } = require('../middleware/adminAuth');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

router.use(requireAdmin);

function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function isValidUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const urlString = url.toLowerCase();
    if (urlString.includes('<script') || urlString.includes('javascript:') || urlString.includes('onerror=')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

router.put('/config', async (req, res) => {
  try {
    const { churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, apiEndpoints } = req.body;

    if (!churchName || typeof churchName !== 'string' || churchName.trim().length === 0) {
      return res.status(400).json({ error: 'Church name is required and must be a non-empty string' });
    }

    if (!primaryColor || !isValidHexColor(primaryColor)) {
      return res.status(400).json({ error: 'Primary color must be a valid hex color (e.g., #C41E3A)' });
    }

    if (!secondaryColor || !isValidHexColor(secondaryColor)) {
      return res.status(400).json({ error: 'Secondary color must be a valid hex color' });
    }

    if (accentColor && !isValidHexColor(accentColor)) {
      return res.status(400).json({ error: 'Accent color must be a valid hex color' });
    }

    if (logoUrl && !isValidUrl(logoUrl)) {
      return res.status(400).json({ error: 'Logo URL must be a valid HTTPS/HTTP URL' });
    }

    if (apiEndpoints) {
      if (apiEndpoints.iconcmo && !isValidUrl(apiEndpoints.iconcmo)) {
        return res.status(400).json({ error: 'IconCMO URL must be a valid HTTPS/HTTP URL' });
      }
      if (apiEndpoints.announcements && !isValidUrl(apiEndpoints.announcements)) {
        return res.status(400).json({ error: 'Announcements URL must be a valid HTTPS/HTTP URL' });
      }
      if (apiEndpoints.standardPayments && !isValidUrl(apiEndpoints.standardPayments)) {
        return res.status(400).json({ error: 'Standard Payments URL must be a valid HTTPS/HTTP URL' });
      }
    }

    const result = await db.query(
      `UPDATE church_configurations 
       SET church_name = $1, 
           primary_color = $2, 
           secondary_color = $3, 
           accent_color = $4, 
           logo_url = $5, 
           calendar_id = $6, 
           api_endpoints = $7,
           updated_at = NOW()
       WHERE id = (SELECT id FROM church_configurations LIMIT 1)
       RETURNING *`,
      [churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, JSON.stringify(apiEndpoints)]
    );

    if (result.rows.length === 0) {
      const insertResult = await db.query(
        `INSERT INTO church_configurations 
         (church_name, primary_color, secondary_color, accent_color, logo_url, calendar_id, api_endpoints)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, JSON.stringify(apiEndpoints)]
      );
      return res.json(keysToCamelCase(insertResult.rows[0]));
    }

    res.json(keysToCamelCase(result.rows[0]));
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update church configuration' });
  }
});

router.post('/upload/members', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    const requiredColumns = ['household_id', 'member_id', 'firstname', 'lastname'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      });
    }

    let inserted = 0;
    let updated = 0;

    for (const row of data) {
      if (!row.household_id || !row.member_id || !row.firstname || !row.lastname) {
        return res.status(400).json({ 
          error: `Invalid row: household_id, member_id, firstname, and lastname are required` 
        });
      }

      const checkResult = await db.query(
        'SELECT member_id FROM members WHERE member_id = $1',
        [row.member_id]
      );

      if (checkResult.rows.length > 0) {
        await db.query(
          `UPDATE members 
           SET household_id = $1, firstname = $2, lastname = $3, relationship = $4, 
               birth_date = $5, wed_date = $6, email = $7, phone = $8, updated_at = NOW()
           WHERE member_id = $9`,
          [
            row.household_id,
            row.firstname,
            row.lastname,
            row.relationship || null,
            row.birth_date || null,
            row.wed_date || null,
            row.email || null,
            row.phone || null,
            row.member_id
          ]
        );
        updated++;
      } else {
        await db.query(
          `INSERT INTO members 
           (member_id, household_id, firstname, lastname, relationship, birth_date, wed_date, email, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            row.member_id,
            row.household_id,
            row.firstname,
            row.lastname,
            row.relationship || null,
            row.birth_date || null,
            row.wed_date || null,
            row.email || null,
            row.phone || null
          ]
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      inserted,
      updated,
      total: data.length
    });
  } catch (error) {
    console.error('Upload members error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload members data' });
  }
});

router.post('/upload/households', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    const requiredColumns = ['household_id', 'mail_to'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      });
    }

    let inserted = 0;
    let updated = 0;

    for (const row of data) {
      if (!row.household_id || !row.mail_to) {
        return res.status(400).json({ 
          error: `Invalid row: household_id and mail_to are required` 
        });
      }

      const checkResult = await db.query(
        'SELECT household_id FROM households WHERE household_id = $1',
        [row.household_id]
      );

      if (checkResult.rows.length > 0) {
        await db.query(
          `UPDATE households 
           SET mail_to = $1, address = $2, city = $3, state = $4, zip = $5, 
               phone = $6, email = $7, prayer_group = $8, donor_id = $9, updated_at = NOW()
           WHERE household_id = $10`,
          [
            row.mail_to,
            row.address || null,
            row.city || null,
            row.state || null,
            row.zip || null,
            row.phone || null,
            row.email || null,
            row.prayer_group || null,
            row.donor_number || null,
            row.household_id
          ]
        );
        updated++;
      } else {
        await db.query(
          `INSERT INTO households 
           (household_id, mail_to, address, city, state, zip, phone, email, prayer_group, donor_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            row.household_id,
            row.mail_to,
            row.address || null,
            row.city || null,
            row.state || null,
            row.zip || null,
            row.phone || null,
            row.email || null,
            row.prayer_group || null,
            row.donor_number || null
          ]
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      inserted,
      updated,
      total: data.length
    });
  } catch (error) {
    console.error('Upload households error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload households data' });
  }
});

module.exports = router;
