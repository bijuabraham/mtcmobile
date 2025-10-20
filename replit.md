# Church Management Mobile Application

## Overview
This white-label church management mobile application, built with React Native and Expo, provides a comprehensive platform for church members. It allows access to announcements, family information, directories, donation tracking, calendars, and staff contacts. The application is highly configurable and deployable for multiple churches with custom branding via a database-driven system, aiming for broad market potential in church administration.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React Native with Expo SDK 54, utilizing Expo Router for file-based, tab-based navigation.
- **State Management**: React Context API for global state, including `AuthContext` (JWT-based) and `ChurchConfigContext` for dynamic, database-driven branding.
- **UI/Styling**: React Native StyleSheet with dynamic theming based on church configuration. Uses Lucide React Native for iconography and RenderHTML for rich text. Custom components are used throughout without external UI libraries.

### Backend
- **Database**: Replit PostgreSQL, managed via environment variables.
- **Server**: Node.js with Express (port 3000), providing RESTful API endpoints for all application data.
- **Authentication**: Custom JWT-based system with email/password (bcrypt hashing) for secure session management. Includes email verification via Replit Mail - users must verify their email address before logging in.
- **Data Models**: Key tables include `users`, `church_configurations` (singleton with contact info fields), `households`, `members`, `donations`, `announcements`, and `contact_us`.
- **Admin Panel**: A separate web-based admin panel (`/admin/login.html`) allows church configuration, contact us configuration (vicar info, church address, executive board), announcement management, bulk data uploads (members, households, donations, prayer groups with IconCMO format auto-detection), and admin user management with role-based access control.
- **Contact Us Configuration**: The church_configurations table includes fields for vicar information (name, photo URL, phone, email), church address, and executive board members (stored as JSONB array with 8 positions: Vice President, Secretary, Treasurer - Cash, Treasurer - Accounts, Lay Leader Malayalam, Lay Leader English, Mandalam Member, Assembly Members). Each board member can have name, phone, and email.

### White-Label Configuration
- **Database-Driven Branding**: A single `church_configurations` table stores all branding and configuration settings (e.g., name, colors, logo, API endpoints). This enables a single codebase to serve multiple churches without code changes for new deployments.

### Data Flow
- **Authentication**: Users sign up and receive a verification email. After verifying their email address, they can log in to receive a JWT token, stored in AsyncStorage, and used for subsequent API requests.
- **Email Verification**: New users receive a verification email with a secure 24-hour token. Users cannot log in until their email is verified.
- **Directory Privacy**: Only users whose email address exists in the members table can view the directory. This ensures only registered church members have access.
- **Data Fetching**: An API client (`project/lib/api.ts`) handles all backend communication, managing loading states and error handling.
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