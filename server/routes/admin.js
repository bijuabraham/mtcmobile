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
    const { 
      churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, timezone, apiEndpoints,
      vicarName, vicarPhotoUrl, vicarPhone, vicarEmail, churchAddress, executiveBoard
    } = req.body;

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

    if (vicarPhotoUrl && !isValidUrl(vicarPhotoUrl)) {
      return res.status(400).json({ error: 'Vicar photo URL must be a valid HTTPS/HTTP URL' });
    }

    if (timezone && typeof timezone !== 'string') {
      return res.status(400).json({ error: 'Timezone must be a valid string' });
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
           timezone = $7,
           api_endpoints = $8,
           vicar_name = $9,
           vicar_photo_url = $10,
           vicar_phone = $11,
           vicar_email = $12,
           church_address = $13,
           executive_board = $14,
           updated_at = NOW()
       WHERE id = (SELECT id FROM church_configurations LIMIT 1)
       RETURNING *`,
      [
        churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, 
        timezone || 'America/New_York', JSON.stringify(apiEndpoints),
        vicarName, vicarPhotoUrl, vicarPhone, vicarEmail, churchAddress, 
        JSON.stringify(executiveBoard || [])
      ]
    );

    if (result.rows.length === 0) {
      const insertResult = await db.query(
        `INSERT INTO church_configurations 
         (church_name, primary_color, secondary_color, accent_color, logo_url, calendar_id, timezone, api_endpoints,
          vicar_name, vicar_photo_url, vicar_phone, vicar_email, church_address, executive_board)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          churchName, primaryColor, secondaryColor, accentColor, logoUrl, calendarId, 
          timezone || 'America/New_York', JSON.stringify(apiEndpoints),
          vicarName, vicarPhotoUrl, vicarPhone, vicarEmail, churchAddress,
          JSON.stringify(executiveBoard || [])
        ]
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

    // Clear existing members data before importing
    await db.query('TRUNCATE TABLE members RESTART IDENTITY CASCADE');

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

    // Clear existing data before importing
    // First, unlink users from households to prevent cascade to users table
    await db.query('UPDATE users SET household_id = NULL');
    // Use DELETE instead of TRUNCATE to respect foreign key constraints
    await db.query('DELETE FROM members');
    await db.query('DELETE FROM households');
    // Reset sequences for auto-increment IDs
    await db.query('ALTER SEQUENCE IF EXISTS members_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE IF EXISTS households_id_seq RESTART WITH 1');

    let inserted = 0;
    let updated = 0;

    for (const row of data) {
      if (!row.household_id || !row.mail_to) {
        continue; // Skip invalid rows instead of failing entire upload
      }

      // Build full address from components if available
      let fullAddress = row.address || null;
      if (isIconCMOFormat && row.address && row.city && row.state && row.zip) {
        fullAddress = `${row.address}, ${row.city}, ${row.state} ${row.zip}`;
      }

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
    let formatType = 'Standard';

    // Check if this is IconCMO format (has metadata rows at the top)
    if (rawData.length > 2 && rawData[2] && rawData[2]['Donations Report'] === 'Household ID') {
      data = rawData.slice(2);
      formatType = 'IconCMO';
    }
    // Check if this is Fund Activity format (from backend software)
    else if (rawData.length > 0 && rawData[0]['Fund Name'] !== undefined && rawData[0]['Donor Number'] !== undefined) {
      formatType = 'FundActivity';
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data rows found in Excel file' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    // Clear existing donations data before importing
    await db.query('TRUNCATE TABLE donations RESTART IDENTITY CASCADE');

    // Pre-fetch all households for Fund Activity format (to look up household_id by donor_number)
    let householdsByDonor = {};
    if (formatType === 'FundActivity') {
      const householdsResult = await db.query('SELECT household_id, donor_id FROM households WHERE donor_id IS NOT NULL');
      for (const h of householdsResult.rows) {
        householdsByDonor[String(h.donor_id)] = h.household_id;
      }
    }

    let inserted = 0;
    let skipped = 0;
    let skippedRows = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const rowNum = rowIndex + 2; // +2 for 1-based index and header row
      
      let householdId, donorNumber, fund, amount, donationDate, paymentMethod, description;

      if (formatType === 'IconCMO') {
        // IconCMO format mapping
        householdId = row['Donations Report'];
        donorNumber = row['__EMPTY'];
        fund = row['__EMPTY_1'];
        amount = row['__EMPTY_2'];
        donationDate = null;
        paymentMethod = null;
        description = null;
      } else if (formatType === 'FundActivity') {
        // Fund Activity format from backend software
        donorNumber = row['Donor Number'];
        fund = row['Fund Name'];
        amount = row['Amount'];
        paymentMethod = row['Currency Type'] || null;
        description = row['Comment'] || null;
        
        // Parse date from MM/DD/YYYY format
        const givingDate = row['Giving Date'];
        if (givingDate) {
          const parts = String(givingDate).split('/');
          if (parts.length === 3) {
            donationDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        
        // Look up household_id from donor_number
        householdId = householdsByDonor[String(donorNumber)] || null;
      } else {
        // Standard template format
        householdId = row.household_id;
        donorNumber = row.donor_number;
        fund = row.fund;
        amount = row.amount;
        donationDate = row.donation_date || null;
        paymentMethod = row.payment_method || null;
        description = row.description || null;
      }

      // Skip header row (if it wasn't already skipped)
      if (householdId === 'Household ID' || householdId === 'household_id' || fund === 'Fund Name') {
        skipped++;
        continue;
      }

      // Skip empty rows
      if (!donorNumber && !fund && amount == null) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: 'Empty row' });
        continue;
      }

      // Skip rows with missing required data
      if (!donorNumber) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: 'Missing Donor Number', fund: fund || '-' });
        continue;
      }
      
      if (!fund) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: 'Missing Fund Name', donorNumber: donorNumber });
        continue;
      }
      
      if (amount == null) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: 'Missing Amount', donorNumber: donorNumber, fund: fund });
        continue;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: `Invalid amount: "${amount}"`, donorNumber: donorNumber, fund: fund });
        continue;
      }
      
      if (amountValue === 0) {
        skipped++;
        skippedRows.push({ row: rowNum, reason: 'Amount is zero', donorNumber: donorNumber, fund: fund });
        continue;
      }

      // Use today's date if no donation date provided
      const finalDonationDate = donationDate || new Date().toISOString().split('T')[0];

      try {
        await db.query(
          `INSERT INTO donations 
           (household_id, donor_number, category, amount, donation_date, payment_method, description, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            householdId ? String(householdId) : null,
            String(donorNumber),
            String(fund),
            amountValue,
            finalDonationDate,
            paymentMethod,
            description
          ]
        );
        inserted++;
      } catch (dbError) {
        console.error('Error inserting donation:', dbError.message);
        skipped++;
        skippedRows.push({ row: rowNum, reason: `Database error: ${dbError.message}`, donorNumber: donorNumber, fund: fund });
      }
    }

    // Limit skipped rows details to first 50 to avoid huge responses
    const skippedDetails = skippedRows.slice(0, 50);
    const hasMoreSkipped = skippedRows.length > 50;

    res.json({
      success: true,
      inserted,
      skipped,
      total: data.length,
      format: formatType,
      skippedDetails,
      hasMoreSkipped
    });
  } catch (error) {
    console.error('Upload donations error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload donations data' });
  }
});

router.post('/upload/prayer-groups', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.length > 0) {
        const rowStr = row.map(cell => String(cell || '').toLowerCase()).join('|');
        if (rowStr.includes('household') && (rowStr.includes('grp') || rowStr.includes('group') || rowStr.includes('prayer'))) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({ 
        error: 'Could not find headers. Expected columns containing: household ID and prayer group name' 
      });
    }

    const headers = rawData[headerRowIndex];
    const householdIdIndex = headers.findIndex(h => {
      const normalized = String(h || '').toLowerCase().replace(/[_\s]/g, '');
      return normalized.includes('household') && (normalized.includes('id') || normalized.includes('record'));
    });
    const grpNameIndex = headers.findIndex(h => {
      const normalized = String(h || '').toLowerCase().replace(/[_\s]/g, '');
      // Exclude columns with "record" in the name, prioritize columns with "name"
      if (normalized.includes('record')) return false;
      return (normalized.includes('grp') && normalized.includes('name')) || 
             normalized.includes('grpname') ||
             (normalized.includes('prayer') && normalized.includes('group')) ||
             normalized.includes('prayergroup');
    });

    if (householdIdIndex === -1 || grpNameIndex === -1) {
      return res.status(400).json({ 
        error: 'Missing required columns: Household Record ID and grpName' 
      });
    }

    const data = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every(cell => !cell)) continue;

      const householdId = row[householdIdIndex] ? String(row[householdIdIndex]).trim() : null;
      const grpName = row[grpNameIndex] ? String(row[grpNameIndex]).trim() : null;

      if (householdId && grpName) {
        data.push({ householdId, grpName });
      }
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found with both Household ID and Prayer Group name' });
    }

    if (data.length > 10000) {
      return res.status(400).json({ error: 'Too many rows. Maximum 10,000 rows allowed' });
    }

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const { householdId, grpName } of data) {
      try {
        const result = await db.query(
          `UPDATE households 
           SET prayer_group = $1, updated_at = NOW() 
           WHERE household_id = $2
           RETURNING id`,
          [grpName, householdId]
        );

        if (result.rows.length > 0) {
          updated++;
        } else {
          notFound++;
        }
      } catch (err) {
        console.error(`Error updating household ${householdId}:`, err);
        errors++;
      }
    }

    res.json({
      success: true,
      updated,
      notFound,
      errors,
      total: data.length,
      message: `Updated ${updated} households with prayer group assignments`
    });
  } catch (error) {
    console.error('Upload prayer groups error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload prayer groups data' });
  }
});

// ===========================================
// 3-STEP CHURCH DIRECTORY IMPORT ENDPOINTS
// Step 1: Church Directory (ExportFile.xls) - households and members
// Step 2: Area Mapping (GroupsH.xls) - prayer group assignments
// Step 3: Donor Mapping (Envelope.xls) - donor numbers
// ===========================================

// Helper function to parse Excel date serial number
function parseExcelDate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    // Already a date string like "07/29/1966"
    const parts = serial.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return serial;
  }
  if (typeof serial === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + serial * 86400000);
    return jsDate.toISOString().split('T')[0];
  }
  return null;
}

// Step 1: Upload Church Directory (ExportFile.xls)
// Creates households and members from single-row format
router.post('/upload/church-directory', upload.single('file'), async (req, res) => {
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

    // Check for expected columns
    const firstRow = rawData[0];
    if (!('Household Record ID' in firstRow) || !('LastName' in firstRow)) {
      return res.status(400).json({ 
        error: 'Invalid format. Expected Church Directory export with columns: Household Record ID, LastName, FirstName, etc.' 
      });
    }

    // Clear existing data before importing
    // First, unlink users from households to prevent cascade to users table
    await db.query('UPDATE users SET household_id = NULL');
    // Use DELETE instead of TRUNCATE to respect foreign key constraints
    await db.query('DELETE FROM members');
    await db.query('DELETE FROM households');
    // Reset sequences for auto-increment IDs
    await db.query('ALTER SEQUENCE IF EXISTS members_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE IF EXISTS households_id_seq RESTART WITH 1');

    let householdsInserted = 0;
    let membersInserted = 0;
    let skippedRows = [];

    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      const rowNum = rowIndex + 2; // +2 for header and 1-based index

      try {
        const householdRecordId = row['Household Record ID'];
        if (!householdRecordId) {
          skippedRows.push({ row: rowNum, reason: 'Missing Household Record ID' });
          continue;
        }

        // Build household address
        const addressParts = [
          row['Address Line One'],
          row['Address Line Two'],
          row['City'],
          row['State'],
          row['Zip']
        ].filter(Boolean);
        const fullAddress = addressParts.length > 0 
          ? `${row['Address Line One'] || ''}${row['Address Line Two'] ? ', ' + row['Address Line Two'] : ''}, ${row['City'] || ''}, ${row['State'] || ''} ${row['Zip'] || ''}`.replace(/^, |, $/g, '')
          : null;

        // Create family name from LastName and FirstName
        const familyName = row['MailTo'] || `${row['FirstName'] || ''} ${row['LastName'] || ''}`.trim();

        // Insert household
        await db.query(
          `INSERT INTO households (household_id, family_name, address, phone, email, prayer_group, donor_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (household_id) DO UPDATE SET
             family_name = EXCLUDED.family_name,
             address = EXCLUDED.address,
             phone = EXCLUDED.phone,
             updated_at = NOW()`,
          [
            String(householdRecordId),
            familyName,
            fullAddress,
            row['HousePhone'] || null,
            null, // Email will be populated from members
            null, // Prayer group will be set in step 2
            null  // Donor ID will be set in step 3
          ]
        );
        householdsInserted++;

        // Get the household UUID for member linking
        const householdResult = await db.query(
          'SELECT id FROM households WHERE household_id = $1',
          [String(householdRecordId)]
        );
        const householdUuid = householdResult.rows[0]?.id;

        // Extract members (up to 8 per row)
        for (let memberNum = 1; memberNum <= 8; memberNum++) {
          const memberName = row[`Member${memberNum}`];
          if (!memberName || memberName.toString().trim() === '') continue;

          const relationship = row[`Relationship${memberNum}`] || null;
          const gender = row[`Gender${memberNum}`] || null;
          const birthDateRaw = row[`BirthDate${memberNum}`];
          const birthDate = parseExcelDate(birthDateRaw);
          const marriageDateRaw = row[`Marriage${memberNum}`];
          const marriageDate = parseExcelDate(marriageDateRaw);
          const personalEmail = row[`Personal Email${memberNum}`] || null;
          const workEmail = row[`Work Email${memberNum}`] || null;
          const mobile = row[`Mobile${memberNum}`] || null;
          const home = row[`Home${memberNum}`] || null;
          const occupation = row[`Occupation${memberNum}`] || null;

          // Use personal email, fall back to work email
          const email = personalEmail || workEmail;
          // Use mobile, fall back to home phone
          const phone = mobile || home;

          // Generate a unique member ID
          const memberId = `${householdRecordId}-${memberNum}`;

          // Parse first and last name from member name
          // Member names are typically just first names (like "Bijou", "Taji")
          const memberNameStr = String(memberName).trim();
          const lastName = row['LastName'] || '';

          await db.query(
            `INSERT INTO members 
             (member_id, household_id, first_name, last_name, relationship, birth_date, wed_date, email, phone, gender)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              memberId,
              householdUuid,
              memberNameStr,
              lastName,
              relationship,
              birthDate,
              marriageDate,
              email,
              phone,
              gender
            ]
          );
          membersInserted++;
        }

      } catch (rowError) {
        console.error(`Error processing row ${rowNum}:`, rowError.message);
        skippedRows.push({ row: rowNum, reason: rowError.message, householdId: row['Household Record ID'] });
      }
    }

    // Filter out empty row errors for cleaner reporting
    const significantSkipped = skippedRows.filter(s => s.reason !== 'Empty row');
    const skippedDetails = significantSkipped.slice(0, 50);
    const hasMoreSkipped = significantSkipped.length > 50;

    res.json({
      success: true,
      step: 1,
      householdsInserted,
      membersInserted,
      skipped: skippedRows.length,
      total: rawData.length,
      skippedDetails,
      hasMoreSkipped,
      message: `Step 1 complete: Created ${householdsInserted} households with ${membersInserted} members. Please proceed to upload Area Mapping file.`
    });
  } catch (error) {
    console.error('Upload church directory error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload church directory data' });
  }
});

// Step 2: Upload Area Mapping (GroupsH.xls)
// Updates households with prayer group/area assignments using Household Record ID only
router.post('/upload/area-mapping', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // GroupsH.xls structure (based on actual file analysis):
    // Column 7 (grpName) = Area/Prayer Group name (e.g., "Central Valley")
    // Column 10 (Household Record ID) = The linking key to households table
    const headers = rawData[0] || [];
    
    // Find column indices dynamically from headers
    let areaIndex = 7;  // Default: grpName column
    let householdIdIndex = 10;  // Default: Household Record ID column
    
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').toLowerCase();
      if (header === 'grpname' || header === 'grp name') areaIndex = i;
      if (header.includes('household record id')) householdIdIndex = i;
    }

    // Build set of valid household IDs from database
    const householdsResult = await db.query('SELECT household_id FROM households');
    const validHouseholdIds = new Set(householdsResult.rows.map(h => String(h.household_id)));

    let updated = 0;
    let notFound = 0;
    let skippedRows = [];
    const processedHouseholds = new Set();

    // Skip header row (index 0)
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      const rowNum = rowIndex + 1;

      if (!row || row.every(cell => !cell)) continue;

      const area = row[areaIndex] ? String(row[areaIndex]).trim() : null;
      const householdId = row[householdIdIndex] ? String(row[householdIdIndex]).trim() : null;

      // Skip rows without required data
      if (!area || !householdId) {
        continue;
      }

      // Skip if we already processed this household
      if (processedHouseholds.has(householdId)) continue;
      processedHouseholds.add(householdId);

      // Check if household exists in database
      if (validHouseholdIds.has(householdId)) {
        try {
          await db.query(
            `UPDATE households SET prayer_group = $1, updated_at = NOW() WHERE household_id = $2`,
            [area, parseInt(householdId)]
          );
          updated++;
        } catch (err) {
          skippedRows.push({ row: rowNum, reason: err.message, householdId });
        }
      } else {
        notFound++;
        if (notFound <= 20) {
          skippedRows.push({ row: rowNum, reason: 'Household ID not found in database', householdId });
        }
      }
    }

    res.json({
      success: true,
      step: 2,
      updated,
      notFound,
      total: processedHouseholds.size,
      skippedDetails: skippedRows.slice(0, 50),
      hasMoreSkipped: skippedRows.length > 50,
      message: `Step 2 complete: Updated ${updated} households with area/prayer group.${notFound > 0 ? ` ${notFound} Household IDs not found in database.` : ''} Please proceed to upload Donor Mapping file.`
    });
  } catch (error) {
    console.error('Upload area mapping error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload area mapping data' });
  }
});

// Step 3: Upload Donor Mapping (Envelope.xls)
// Updates households with donor numbers
router.post('/upload/donor-mapping', upload.single('file'), async (req, res) => {
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

    // Check for expected columns from Envelope.xls
    const firstRow = rawData[0];
    if (!('Household Record ID' in firstRow) || !('Donor Number' in firstRow)) {
      return res.status(400).json({ 
        error: 'Invalid format. Expected Envelope export with columns: Household Record ID, Donor Number' 
      });
    }

    let updated = 0;
    let notFound = 0;
    let skippedRows = [];
    const processedHouseholds = new Set();

    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      const rowNum = rowIndex + 2;

      const householdRecordId = row['Household Record ID'];
      const donorNumber = row['Donor Number'];

      if (!householdRecordId || !donorNumber) {
        skippedRows.push({ 
          row: rowNum, 
          reason: !householdRecordId ? 'Missing Household Record ID' : 'Missing Donor Number',
          householdId: householdRecordId
        });
        continue;
      }

      // Skip if already processed this household
      const householdIdStr = String(householdRecordId);
      if (processedHouseholds.has(householdIdStr)) continue;
      processedHouseholds.add(householdIdStr);

      try {
        const result = await db.query(
          `UPDATE households SET donor_id = $1, updated_at = NOW() WHERE household_id = $2 RETURNING id`,
          [String(donorNumber), householdIdStr]
        );

        if (result.rows.length > 0) {
          updated++;
        } else {
          notFound++;
          skippedRows.push({ row: rowNum, reason: 'Household not found in database', householdId: householdIdStr });
        }
      } catch (err) {
        skippedRows.push({ row: rowNum, reason: err.message, householdId: householdIdStr });
      }
    }

    res.json({
      success: true,
      step: 3,
      updated,
      notFound,
      total: processedHouseholds.size,
      skippedDetails: skippedRows.slice(0, 50),
      hasMoreSkipped: skippedRows.length > 50,
      message: `Step 3 complete: Updated ${updated} households with donor numbers. ${notFound} households not found. Import process complete!`
    });
  } catch (error) {
    console.error('Upload donor mapping error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload donor mapping data' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, donor_number, is_admin, is_approved, profile_complete, 
              is_suspended, suspended_at, household_id, created_at, approved_at 
       FROM users ORDER BY email ASC`
    );
    
    const users = result.rows.map(user => keysToCamelCase(user));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/pending', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, donor_number, profile_complete, created_at 
       FROM users 
       WHERE profile_complete = TRUE AND is_approved = FALSE 
       ORDER BY created_at DESC`
    );
    
    const users = result.rows.map(user => keysToCamelCase(user));
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

router.put('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    const checkResult = await db.query('SELECT id, email, donor_number FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDonorNumber = checkResult.rows[0].donor_number;
    let householdId = null;
    let householdMessage = '';
    
    if (userDonorNumber) {
      const householdResult = await db.query(
        'SELECT household_id, family_name FROM households WHERE donor_id = $1',
        [userDonorNumber]
      );
      
      if (householdResult.rows.length > 0) {
        householdId = householdResult.rows[0].household_id;
        householdMessage = ` and linked to household "${householdResult.rows[0].family_name}"`;
      } else {
        householdMessage = ' (no matching household found for donor number)';
      }
    }
    
    const result = await db.query(
      `UPDATE users SET 
         is_approved = TRUE, 
         approved_at = NOW(), 
         approved_by = $1,
         household_id = COALESCE($3, household_id),
         updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, email, first_name, last_name, donor_number, is_approved, approved_at, household_id`,
      [adminId, id, householdId]
    );
    
    const user = keysToCamelCase(result.rows[0]);
    res.json({ 
      success: true, 
      user,
      message: `User ${user.email} has been approved${householdMessage}`
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

router.put('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: `User has been rejected and removed`
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

router.get('/users/admins', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, household_id, created_at FROM users WHERE is_admin = true ORDER BY email ASC'
    );
    
    const admins = result.rows.map(admin => keysToCamelCase(admin));
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

router.put('/users/:id/admin', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean value' });
    }
    
    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const adminCountResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
    const adminCount = parseInt(adminCountResult.rows[0].count);
    
    if (!isAdmin && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin. At least one admin must remain.' });
    }
    
    const result = await db.query(
      'UPDATE users SET is_admin = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_admin, household_id',
      [isAdmin, id]
    );
    
    const user = keysToCamelCase(result.rows[0]);
    res.json({ 
      success: true, 
      user,
      message: isAdmin ? 'Admin access granted' : 'Admin access revoked'
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await db.query('SELECT id, email, is_admin FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = checkResult.rows[0];
    
    if (user.is_admin) {
      const adminCountResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
      const adminCount = parseInt(adminCountResult.rows[0].count);
      
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin. At least one admin must remain.' });
      }
    }
    
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: `User ${user.email} has been permanently deleted`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    const checkResult = await db.query('SELECT id, email, is_admin, is_suspended FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = checkResult.rows[0];
    
    if (user.is_admin) {
      return res.status(400).json({ error: 'Cannot suspend an admin user. Remove admin privileges first.' });
    }
    
    if (user.is_suspended) {
      return res.status(400).json({ error: 'User is already suspended' });
    }
    
    const result = await db.query(
      `UPDATE users SET 
         is_suspended = TRUE, 
         suspended_at = NOW(), 
         suspended_by = $1,
         updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, email, first_name, last_name, is_suspended, suspended_at`,
      [adminId, id]
    );
    
    const updatedUser = keysToCamelCase(result.rows[0]);
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `User ${updatedUser.email} has been suspended`
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

router.put('/users/:id/unsuspend', async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await db.query('SELECT id, email, is_suspended FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = checkResult.rows[0];
    
    if (!user.is_suspended) {
      return res.status(400).json({ error: 'User is not suspended' });
    }
    
    const result = await db.query(
      `UPDATE users SET 
         is_suspended = FALSE, 
         suspended_at = NULL, 
         suspended_by = NULL,
         updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, email, first_name, last_name, is_suspended`,
      [id]
    );
    
    const updatedUser = keysToCamelCase(result.rows[0]);
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `User ${updatedUser.email} access has been restored`
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ error: 'Failed to restore user access' });
  }
});

router.put('/users/:id/donor-number', async (req, res) => {
  try {
    const { id } = req.params;
    const { donorNumber } = req.body;
    
    if (!donorNumber || typeof donorNumber !== 'string') {
      return res.status(400).json({ error: 'Donor number is required' });
    }
    
    const checkResult = await db.query('SELECT id, email, donor_number FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const trimmedDonorNumber = donorNumber.trim();
    
    let householdId = null;
    let householdMessage = '';
    
    const householdResult = await db.query(
      'SELECT household_id, family_name FROM households WHERE donor_id = $1',
      [trimmedDonorNumber]
    );
    
    if (householdResult.rows.length > 0) {
      householdId = householdResult.rows[0].household_id;
      householdMessage = ` and linked to household "${householdResult.rows[0].family_name}"`;
    } else {
      householdMessage = ' (no matching household found)';
    }
    
    const result = await db.query(
      `UPDATE users SET 
         donor_number = $1, 
         household_id = COALESCE($2, household_id),
         updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, email, first_name, last_name, donor_number, household_id`,
      [trimmedDonorNumber, householdId, id]
    );
    
    const updatedUser = keysToCamelCase(result.rows[0]);
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `Donor number updated to ${trimmedDonorNumber}${householdMessage}`
    });
  } catch (error) {
    console.error('Error updating donor number:', error);
    res.status(500).json({ error: 'Failed to update donor number' });
  }
});

module.exports = router;
