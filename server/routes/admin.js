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
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
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
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    let data = [];
    let formatType = 'standard';

    const hasIconCMOHeader = rawData.some((row, idx) => 
      idx < 10 && Array.isArray(row) && 
      row.some(cell => typeof cell === 'string' && cell.includes('Family ID'))
    );

    if (hasIconCMOHeader) {
      formatType = 'iconcmo';
      const headerRowIndex = rawData.findIndex(row => 
        Array.isArray(row) && row[0] === 'Family ID'
      );

      if (headerRowIndex === -1) {
        return res.status(400).json({ error: 'Could not find header row in IconCMO format' });
      }

      const headers = rawData[headerRowIndex];
      const dataStartIndex = headerRowIndex + 2;

      for (let i = dataStartIndex; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0 || !row[0]) continue;

        const familyId = row[0] ? String(row[0]) : null;
        const memberId = row[1] ? String(row[1]) : null;
        const lastName = row[2] || '';
        const firstName = row[3] || '';
        const relationship = row[5] || null;
        const phone = row[6] || null;
        const email = row[7] || null;
        const birthMonth = row[8] || null;
        const birthDay = row[9] || null;
        const marriageSerial = row[10] || null;

        let birthDate = null;
        if (birthMonth && birthDay) {
          const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
          };
          const month = monthMap[birthMonth];
          if (month) {
            const year = 2000;
            birthDate = `${year}-${String(month).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
          }
        }

        let wedDate = null;
        if (marriageSerial && typeof marriageSerial === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + marriageSerial * 86400000);
          wedDate = jsDate.toISOString().split('T')[0];
        }

        data.push({
          family_id: familyId,
          member_id: memberId,
          first_name: firstName,
          last_name: lastName,
          relationship: relationship,
          phone: phone,
          email: email,
          birth_date: birthDate,
          wed_date: wedDate
        });
      }
    } else {
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({ error: 'Excel file is empty' });
      }

      const requiredColumns = ['household_id', 'member_id', 'first_name', 'last_name'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return res.status(400).json({ 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        });
      }

      data = jsonData.map(row => ({
        household_id: row.household_id,
        member_id: row.member_id,
        first_name: row.first_name,
        last_name: row.last_name,
        relationship: row.relationship || null,
        phone: row.phone || null,
        email: row.email || null,
        birth_date: row.birth_date || null,
        wed_date: row.wed_date || null
      }));
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const row of data) {
      try {
        if (!row.member_id || !row.first_name || !row.last_name) {
          errors++;
          continue;
        }

        let householdUuid = null;
        
        if (formatType === 'iconcmo' && row.family_id) {
          const householdResult = await db.query(
            'SELECT id FROM households WHERE household_id = $1',
            [row.family_id]
          );
          
          if (householdResult.rows.length > 0) {
            householdUuid = householdResult.rows[0].id;
          }
        } else if (row.household_id) {
          householdUuid = row.household_id;
        }

        const checkResult = await db.query(
          'SELECT member_id FROM members WHERE member_id = $1',
          [row.member_id]
        );

        if (checkResult.rows.length > 0) {
          await db.query(
            `UPDATE members 
             SET household_id = $1, first_name = $2, last_name = $3, relationship = $4, 
                 birth_date = $5, wed_date = $6, email = $7, phone = $8, updated_at = NOW()
             WHERE member_id = $9`,
            [
              householdUuid,
              row.first_name,
              row.last_name,
              row.relationship,
              row.birth_date,
              row.wed_date,
              row.email,
              row.phone,
              row.member_id
            ]
          );
          updated++;
        } else {
          await db.query(
            `INSERT INTO members 
             (member_id, household_id, first_name, last_name, relationship, birth_date, wed_date, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              row.member_id,
              householdUuid,
              row.first_name,
              row.last_name,
              row.relationship,
              row.birth_date,
              row.wed_date,
              row.email,
              row.phone
            ]
          );
          inserted++;
        }
      } catch (rowError) {
        console.error('Error processing member row:', rowError);
        errors++;
      }
    }

    res.json({
      success: true,
      format: formatType,
      inserted,
      updated,
      errors,
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
    
    // First, try reading as raw array to detect IconCMO format
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    let data;
    let isIconCMOFormat = false;

    // Check if this is IconCMO format (row 5 contains headers: Picture, ID, Mail To, Phone, etc.)
    if (rawRows.length > 6 && rawRows[5] && rawRows[5][1] === 'ID' && rawRows[5][2] === 'Mail To') {
      isIconCMOFormat = true;
      // Skip metadata rows (0-5) and get actual data starting from row 7 (index 6)
      const headers = rawRows[5]; // Row 5 is the header row
      data = [];
      
      for (let i = 6; i < rawRows.length; i++) {
        const row = rawRows[i];
        // Skip empty rows
        if (!row || row.every(cell => !cell)) continue;
        
        // Map columns to our schema
        const mappedRow = {
          household_id: row[1] ? String(row[1]) : null,  // ID column
          mail_to: row[2] || null,                        // Mail To column
          phone: row[3] || null,                          // Phone column
          address: row[4] || null,                        // Address Line 1 column
          city: row[5] || null,                           // City column
          state: row[6] || null,                          // State column
          zip: row[7] ? String(row[7]) : null,           // Zip column
          donor_id: row[8] ? String(row[8]) : null,      // Donor # column
          prayer_group: row[9] || null                    // Prayer Group column (optional)
        };
        
        // Only add rows with valid household_id and mail_to
        if (mappedRow.household_id && mappedRow.mail_to) {
          data.push(mappedRow);
        }
      }
    } else {
      // Standard CSV format - use normal parsing
      data = xlsx.utils.sheet_to_json(worksheet);
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or no valid data rows found' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    // Validate required columns for standard format
    if (!isIconCMOFormat) {
      const requiredColumns = ['household_id', 'mail_to'];
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return res.status(400).json({ 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        });
      }
    }

    let inserted = 0;
    let updated = 0;

    for (const row of data) {
      if (!row.household_id || !row.mail_to) {
        continue; // Skip invalid rows instead of failing entire upload
      }

      const checkResult = await db.query(
        'SELECT household_id FROM households WHERE household_id = $1',
        [row.household_id]
      );

      // Build full address from components if available
      let fullAddress = row.address || null;
      if (isIconCMOFormat && row.address && row.city && row.state && row.zip) {
        fullAddress = `${row.address}, ${row.city}, ${row.state} ${row.zip}`;
      }

      if (checkResult.rows.length > 0) {
        await db.query(
          `UPDATE households 
           SET family_name = $1, address = $2, phone = $3, email = $4, 
               prayer_group = $5, donor_id = $6, updated_at = NOW()
           WHERE household_id = $7`,
          [
            row.mail_to,              // family_name (Mail To)
            fullAddress,              // address
            row.phone || null,
            row.email || null,
            row.prayer_group || null,
            row.donor_id || row.donor_number || null,
            row.household_id
          ]
        );
        updated++;
      } else {
        await db.query(
          `INSERT INTO households 
           (household_id, family_name, address, phone, email, prayer_group, donor_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            row.household_id,
            row.mail_to,              // family_name (Mail To)
            fullAddress,              // address
            row.phone || null,
            row.email || null,
            row.prayer_group || null,
            row.donor_id || row.donor_number || null
          ]
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      inserted,
      updated,
      total: data.length,
      format: isIconCMOFormat ? 'IconCMO' : 'Standard'
    });
  } catch (error) {
    console.error('Upload households error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload households data' });
  }
});

router.post('/upload/donations', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    let data = rawData;
    let isIconCMOFormat = false;

    // Check if this is IconCMO format (has metadata rows at the top)
    if (rawData.length > 2 && rawData[2] && rawData[2]['Donations Report'] === 'Household ID') {
      // IconCMO format detected - skip first 2 metadata rows
      data = rawData.slice(2);
      isIconCMOFormat = true;
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data rows found in Excel file' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const row of data) {
      let householdId, donorNumber, fund, amount;

      if (isIconCMOFormat) {
        // IconCMO format mapping
        householdId = row['Donations Report'];
        donorNumber = row['__EMPTY'];
        fund = row['__EMPTY_1'];
        amount = row['__EMPTY_2'];
      } else {
        // Standard template format
        householdId = row.household_id;
        donorNumber = row.donor_number;
        fund = row.fund;
        amount = row.amount;
      }

      // Skip header row (if it wasn't already skipped)
      if (householdId === 'Household ID' || householdId === 'household_id') {
        skipped++;
        continue;
      }

      // Skip rows with missing required data
      if (!householdId || !donorNumber || !fund || amount == null) {
        skipped++;
        continue;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        skipped++;
        continue;
      }

      const donationDate = row.donation_date || new Date().toISOString().split('T')[0];

      try {
        await db.query(
          `INSERT INTO donations 
           (household_id, donor_number, category, amount, donation_date, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            String(householdId),
            String(donorNumber),
            String(fund),
            amountValue,
            donationDate
          ]
        );
        inserted++;
      } catch (dbError) {
        console.error('Error inserting donation:', dbError.message);
        skipped++;
      }
    }

    res.json({
      success: true,
      inserted,
      skipped,
      total: data.length,
      format: isIconCMOFormat ? 'IconCMO' : 'Standard'
    });
  } catch (error) {
    console.error('Upload donations error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload donations data' });
  }
});

module.exports = router;
