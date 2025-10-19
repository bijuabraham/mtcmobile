# Excel Upload Templates

These templates show the required format for uploading member and household data to the church management app.

## How to Use

1. Download the CSV template files
2. Open them in Excel, Google Sheets, or any spreadsheet program
3. Replace the example data with your actual church data
4. Save as Excel (.xlsx) or keep as CSV
5. Upload through the admin panel

## Members Template (`members_template.csv`)

### Required Columns
- **household_id**: Unique identifier for the household (must match a household_id in households)
- **member_id**: Unique identifier for this member
- **firstname**: Member's first name
- **lastname**: Member's last name

### Optional Columns
- **relationship**: Relationship to household head (e.g., "Head", "Spouse", "Child", "Other")
- **birth_date**: Date of birth (format: YYYY-MM-DD)
- **wed_date**: Wedding anniversary date (format: YYYY-MM-DD)
- **email**: Member's email address
- **phone**: Member's phone number

### Notes
- Each row represents one person
- Multiple members can belong to the same household (use the same household_id)
- Leave optional fields blank if not applicable (e.g., children typically don't have wed_date)

## Households Template (`households_template.csv`)

### Required Columns
- **household_id**: Unique identifier for this household
- **mail_to**: Name(s) for mailing address (e.g., "John & Jane Doe" or "The Smith Family")

### Optional Columns
- **address**: Street address
- **city**: City name
- **state**: State abbreviation (e.g., "IL", "CA", "TX")
- **zip**: ZIP/postal code
- **phone**: Household phone number
- **email**: Household email address
- **prayer_group**: Prayer group name or identifier
- **donor_number**: Donor ID or number for tracking donations

### Notes
- Each row represents one household/family unit
- The household_id should be used consistently across both files
- Upload households BEFORE uploading members (members reference household_id)

## Upload Order

**Important:** Upload in this order:
1. **Households first** - This creates the household records
2. **Members second** - This links members to their households

## Tips

- Keep household_id and member_id simple and consistent (e.g., H001, H002 or M001, M002)
- Use YYYY-MM-DD format for all dates
- Make sure household_id in members file matches household_id in households file
- The system will update existing records if the ID already exists
- Maximum 10,000 rows per file

## Donations Template (`donations_template.csv`)

### Required Columns
- **household_id**: Household identifier (must match a household_id in households)
- **donor_number**: Donor ID/number (should match donor_number in households)
- **fund**: Fund name or category (e.g., "General Fund", "Building Fund", "Mission Fund")
- **amount**: Donation amount (numeric, can include decimals)

### Optional Columns
- **donation_date**: Date of donation (format: YYYY-MM-DD). If not provided, current date is used.

### Notes
- Each row represents one donation transaction
- The `updated_at` field is automatically set to the current timestamp when uploaded
- Multiple donations can be recorded for the same household
- Amount should be numeric (e.g., 500.00, 1000, 250.50)
- Fund names are free-form text - use consistent naming for reporting

## Example Data

The template files contain example data showing:

**Households & Members:**
- A family with both parents and a child (Doe family - H001)
- A married couple without children (Smith family - H002)  
- A single person household (Johnson - H003)
- Another family (Williams - H004)

**Donations:**
- Multiple donations from different households
- Various fund types (General, Building, Mission)
- Different donation amounts
- Sample donation dates

Replace this example data with your actual church information.
