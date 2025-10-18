# Church Management App - Configuration Guide

## Overview

This is a white-label church management mobile application built with React Native and Expo. The app is fully configurable and can be redeployed for multiple churches with custom branding.

## Key Features

1. **Home Page** - Displays church announcements fetched from a custom URL
2. **Family Information** - View and edit family profiles with photo, address, phone, and email
3. **Church Directory** - Searchable member directory with partial name matching
4. **Donations Tracking** - View donation history with date range filtering and print functionality
5. **Calendar** - Display church events (Google Calendar integration ready)
6. **Settings** - User profile and secure password change functionality

## Technology Stack

- **Frontend**: React Native with Expo SDK 54
- **Navigation**: Expo Router (tab-based)
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth (email/password)
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native

## White-Label Configuration

### Database Configuration

The app uses a `church_configurations` table in Supabase to store church-specific settings:

```sql
-- Example configuration
{
  "church_name": "Mar Thoma Church Of San Francisco",
  "primary_color": "#C41E3A",
  "secondary_color": "#FFD700",
  "accent_color": "#FFFFFF",
  "api_endpoints": {
    "iconcmo": "https://api.iconcmo.com",
    "announcements": "https://www.marthomasf.org/mobilemessage",
    "standardPayments": "https://marthomasf.org/standard-payments/"
  },
  "calendar_id": "admin@marthomasf.org"
}
```

### Customizing for a New Church

1. **Update Church Configuration in Database**:

```sql
UPDATE church_configurations
SET
  church_name = 'Your Church Name',
  primary_color = '#YOUR_COLOR',
  secondary_color = '#YOUR_SECONDARY',
  api_endpoints = jsonb_set(
    api_endpoints,
    '{announcements}',
    '"https://yourchurch.org/mobilemessage"'
  ),
  calendar_id = 'admin@yourchurch.org'
WHERE id = 'your-config-id';
```

2. **Update Environment Variables** (`.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Update App Metadata** (`app.json`):

```json
{
  "expo": {
    "name": "Your Church Name",
    "slug": "your-church-app",
    "version": "1.0.0"
  }
}
```

## Database Schema

### Tables

1. **church_configurations** - Church branding and settings
2. **families** - Family information (one per user)
3. **members** - Church directory members
4. **donations** - Donation records
5. **user_settings** - User preferences

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Church directory is visible to all authenticated users
- Church configuration is publicly readable

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`

4. Run database migrations in Supabase

5. Insert default church configuration

### Running the App

**Development:**
```bash
npm run dev
```

**Web Build:**
```bash
npm run build:web
```

**Type Check:**
```bash
npm run typecheck
```

## API Integration

### ICONCMO API

The app is designed to integrate with the ICONCMO Developer API for:
- Member data synchronization
- Donation records
- Family information

To integrate:
1. Set up Supabase Edge Functions to proxy API calls
2. Update the `api_endpoints.iconcmo` URL in configuration
3. Implement authentication using ICONCMO credentials

### Announcements API

The home page fetches announcements from a custom URL:
- Configure the URL in `api_endpoints.announcements`
- Returns plain text that is displayed on the home screen
- Gracefully handles errors with fallback message

### Google Calendar Integration

The calendar screen is ready for Google Calendar API integration:
1. Set up Google Calendar API credentials
2. Configure OAuth 2.0
3. Update `calendar_id` in church configuration
4. Implement API calls in the calendar screen

## Deployment

### iOS Deployment

1. Build iOS binary:
```bash
eas build --platform ios
```

2. Submit to App Store:
```bash
eas submit --platform ios
```

### Android Deployment

1. Build Android binary:
```bash
eas build --platform android
```

2. Submit to Play Store:
```bash
eas submit --platform android
```

### Web Deployment

1. Build web version:
```bash
npm run build:web
```

2. Deploy the `dist` folder to your hosting provider

## User Roles and Permissions

Currently, the app has a single user role with these permissions:
- View and edit own family information
- View church directory
- View own donation history
- Change own password

Future enhancements can include:
- Admin role for managing members
- Treasurer role for managing donations
- Multiple family members per account

## Customization Options

### Colors

Primary, secondary, and accent colors are fully configurable via the database. The app dynamically applies these colors throughout the UI.

### Logo

Currently, the app uses a text-based placeholder. To add custom logos:
1. Add logo files to `assets/images/`
2. Update image references in login and home screens
3. Ensure proper image formats (PNG recommended)

### Features

To enable/disable features:
- Comment out tabs in `app/(tabs)/_layout.tsx`
- Remove corresponding menu items from home screen
- Adjust navigation routes as needed

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use Supabase RLS policies** for all data access
3. **Implement proper authentication** before allowing app access
4. **Validate all user inputs** on both client and server
5. **Use HTTPS** for all API communications
6. **Regularly update dependencies** for security patches

## Troubleshooting

### Build Issues

If you encounter build errors:
1. Clear Metro bundler cache: `expo start -c`
2. Delete `node_modules` and reinstall
3. Check for conflicting dependencies

### Authentication Issues

If users can't sign in:
1. Verify Supabase credentials in `.env`
2. Check that email confirmation is disabled in Supabase Auth settings
3. Ensure RLS policies are correctly configured

### Data Not Showing

If data doesn't appear:
1. Check Supabase RLS policies
2. Verify database connection in browser console
3. Ensure user is properly authenticated

## Support and Maintenance

For ongoing support:
- Monitor error logs in Supabase dashboard
- Review user feedback regularly
- Keep Expo SDK and dependencies updated
- Test thoroughly after each update

## License

This project is proprietary and configured for church use only.
