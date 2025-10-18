# Church Admin Panel

## Accessing the Admin Panel

Visit `/admin/login.html` in your browser to access the admin panel.

**Admin Login Credentials:**
- Only users with admin privileges can access the admin panel
- Current admin: john.doe@example.com / password123
- To make another user an admin, update their account in the database:
  ```sql
  UPDATE users SET is_admin = TRUE WHERE email = 'user@example.com';
  ```

## Features

### 1. Configuration Management
- Update church name, colors, and logo
- Manage API endpoints
- Live preview of your changes
- All mobile app users will see the new branding immediately

### 2. Members Upload
Upload Excel files (.xlsx) with member data.

**Required Columns:**
- household_id
- member_id
- firstname
- lastname
- relationship (optional)
- birth_date (optional, format: YYYY-MM-DD)
- wed_date (optional, format: YYYY-MM-DD)
- email (optional)
- phone (optional)

**Sample file:** `sample_members.csv` (convert to Excel before uploading)

### 3. Households Upload
Upload Excel files (.xlsx) with household data.

**Required Columns:**
- household_id
- mail_to (household name)
- address (optional)
- city (optional)
- state (optional)
- zip (optional)
- phone (optional)
- email (optional)
- prayer_group (optional)

**Sample file:** `sample_households.csv` (convert to Excel before uploading)

## How to Prepare Excel Files

1. Open the sample CSV files in Excel or Google Sheets
2. Add your church's data following the same format
3. Save as Excel (.xlsx) file
4. Upload through the admin panel

## Notes

- The system automatically handles both inserts (new records) and updates (existing records)
- Existing records are matched by `member_id` or `household_id`
- All uploads are authenticated - you must be logged in
- Changes to church configuration are reflected immediately in the mobile app
