# Church Management Mobile Application

## Overview
This white-label church management mobile application, built with React Native and Expo, provides a comprehensive platform for church members. It allows access to announcements, family information, directories, donation tracking, calendars, and staff contacts. The application is highly configurable and deployable for multiple churches with custom branding via a database-driven system, aiming for broad market potential in church administration.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (Nov 2025)
- **Authentication Migration**: Migrated from email/password to Google OAuth using Replit Auth
- **Admin Approval Workflow**: New users must be approved by an administrator before accessing church data
- **User Approvals Tab**: Added to admin panel for reviewing and approving/rejecting pending users
- **Server-side Authorization**: Protected routes (directory, members, donations) now enforce approval status at the API level
- **User Management Features**: Admin panel now includes:
  - Delete user functionality (cannot delete admin users)
  - Suspend/unsuspend user functionality with audit trail (suspended_at, suspended_by)
  - Suspended users are blocked from accessing protected data and see a dedicated "Account Suspended" screen with contact information
- **Profile Completion Redirect Fix**: Root layout now properly redirects new users to complete-profile screen based on authentication state priority (suspended > incomplete profile > pending approval > approved)
- **Donor Number in Settings**: Users can now view and edit their Donor Number in the Settings page with inline editing
- **Household Linking on Approval**: When admin approves a user, the system automatically links them to their household by matching user's donor_number with household's donor_id

## System Architecture

### Frontend
- **Framework**: React Native with Expo SDK 54, utilizing Expo Router for file-based, tab-based navigation.
- **State Management**: React Context API for global state, including `AuthContext` (session-based with Google OAuth) and `ChurchConfigContext` for dynamic, database-driven branding.
- **UI/Styling**: React Native StyleSheet with dynamic theming based on church configuration. Uses Lucide React Native for iconography and RenderHTML for rich text. Custom components are used throughout without external UI libraries.

### Backend
- **Database**: Replit PostgreSQL, managed via environment variables.
- **Server**: Node.js with Express (unified server on port 5000), providing RESTful API endpoints for all application data.
- **Authentication**: Hybrid authentication system:
  - **Google OAuth (Primary)**: Uses Replit Auth with session-based storage (PostgreSQL-backed via connect-pg-simple)
  - **Manual Admin Approval**: New users complete profile (First Name, Last Name, Donor Number) and wait for administrator approval
  - **Legacy JWT Auth**: Preserved for backward compatibility, extended to check approval status
- **Authorization Middleware**: `authenticateAndRequireApproval` middleware enforces both authentication and approval status on protected routes
- **Data Models**: Key tables include `users` (with google_id, profile_complete, is_approved, approved_at, approved_by fields), `church_configurations`, `households`, `members`, `donations`, `announcements`, and `contact_us`.
- **Admin Panel**: A separate web-based admin panel (`/admin/login.html`) with tabs for:
  - Church Configuration (branding, contact info)
  - Announcement Management
  - Data Uploads (members, households, donations, prayer groups)
  - Admin User Management
  - **User Approvals** (new) - review pending users, approve/reject with full audit trail
- **Contact Us Configuration**: The church_configurations table includes fields for vicar information (name, photo URL, phone, email), church address, and executive board members (stored as JSONB array with 8 positions).

### White-Label Configuration
- **Database-Driven Branding**: A single `church_configurations` table stores all branding and configuration settings (e.g., name, colors, logo, API endpoints). This enables a single codebase to serve multiple churches without code changes for new deployments.

### Authentication Flow (Updated)
1. **Google Sign-In**: User taps "Sign in with Google" button, opens OAuth flow via expo-web-browser
2. **Profile Completion**: First-time users provide First Name, Last Name, and Donor Number
3. **Pending Approval**: User sees "waiting for approval" screen
4. **Admin Approval**: Administrator reviews pending users in admin panel, approves or rejects
5. **Access Granted**: Approved users can access all church data (directory, donations, etc.)

### Data Flow
- **Session-Based Auth**: Google OAuth callback creates session stored in PostgreSQL
- **Profile Completion**: POST to `/api/auth/complete-profile` with firstName, lastName, donorNumber
- **Authorization Check**: API routes check both `profile_complete` and `is_approved` flags before granting access
- **Directory Privacy**: Only approved users can view the directory (enforced at API level with proper error codes)
- **Data Fetching**: An API client (`project/lib/api.ts`) handles all backend communication with session credentials
- **Donation Tracking**: Donations are linked to `households` rather than individual users, allowing family-based tracking.

## External Dependencies

### Primary Services
- **Replit PostgreSQL**: Database hosting for the backend.
- **Google Calendar**: Planned integration for public iCal feeds.

### NPM Packages (Frontend)
- **Core**: `expo`, `react-native`, `react`.
- **Navigation**: `expo-router`, `@react-navigation/native`, `@react-navigation/bottom-tabs`.
- **Storage**: `@react-native-async-storage/async-storage`.
- **UI**: `lucide-react-native`, `react-native-render-html`, `react-native-webview`, `react-native-svg`.
- **Expo Modules**: `expo-linear-gradient`, `expo-blur`, `expo-camera`, `expo-web-browser`, `expo-font`, `expo-linking`.

### NPM Packages (Backend)
- **Server**: `express`, `cors`, `dotenv`.
- **Database**: `pg`.
- **Authentication**: `jsonwebtoken`, `bcrypt`.

### External APIs
- **Church-Specific Endpoints**: Configurable external donation processing URLs.