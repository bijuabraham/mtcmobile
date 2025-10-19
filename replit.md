# Church Management Mobile Application

## Overview

This is a white-label church management mobile application built with React Native and Expo. The app provides a comprehensive platform for church members to access announcements, manage family information, view church directories, track donations, check calendars, and contact church staff. The application is designed to be fully configurable and deployable for multiple churches with custom branding through a database-driven configuration system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- The application uses Expo's managed workflow for simplified development and deployment
- Expo Router (v6) provides file-based routing with tab-based navigation
- React 19.1.0 with functional components and hooks throughout

**Navigation Structure**:
- Authentication flow separates logged-in users from guest users
- Tab-based navigation with 7 main screens: Home, Family, Directory, Donations, Calendar, Contact, and Settings
- Protected routes redirect unauthenticated users to login screen
- Route protection implemented in `app/_layout.tsx` using segments-based logic

**State Management**:
- React Context API for global state (no Redux or external state libraries)
- `AuthContext` manages user authentication state and session via JWT tokens
- `ChurchConfigContext` provides church-specific branding and configuration
- Configuration loaded from API on app start

**UI/Styling Approach**:
- React Native StyleSheet for component styling (no CSS-in-JS libraries)
- Dynamic theming based on church configuration (primary, secondary, accent colors)
- Lucide React Native for consistent iconography
- RenderHTML for displaying rich-text announcements
- No UI component library - custom components throughout

### Backend Architecture

**Database**: Replit PostgreSQL
- PostgreSQL database hosted on Replit infrastructure
- Managed via environment variables (DATABASE_URL, PGHOST, PGUSER, etc.)
- Connection pooling via pg library

**Backend Server**: Node.js with Express (port 3000)
- RESTful API endpoints for all app data
- Location: `server/server.js`
- CORS enabled for cross-origin requests from frontend

**Authentication**: JWT-based Custom Auth
- Email/password authentication with bcrypt hashing
- JWT tokens for session management (expires in 7 days)
- Tokens stored in AsyncStorage on mobile app
- Password change requires current password verification

**API Endpoints**:
- `POST /api/auth/login`: User login with email/password
- `POST /api/auth/signup`: User registration (admin-only)
- `PUT /api/auth/change-password`: Update user password
- `GET /api/config`: Fetch church configuration
- `GET /api/members`: Get all church members
- `GET /api/donations`: Get user donations
- `GET /api/announcements`: Get active announcements
- `GET /api/contacts`: Get church contact information

**Data Models** (server/schema.sql):
- `users`: User accounts with hashed passwords
- `church_configurations`: White-label branding and API endpoints (singleton pattern)
- `households`: Family/household information with contact details
- `members`: Individual church members linked to households
- `donations`: User donation records with categories and payment methods
- `announcements`: Church-wide announcements with date-based visibility
- `contact_us`: Church staff contact information with display ordering

### White-Label Configuration Strategy

**Database-Driven Branding**:
- Single `church_configurations` table stores all branding settings
- Configuration includes: church name, color scheme, logo URL, API endpoints, calendar ID
- Context provider fetches configuration on app load and subscribes to changes
- All UI components consume configuration for dynamic theming

**Deployment Model**:
- One codebase serves multiple churches
- Single backend API and frontend deployed together
- Configuration stored in database determines church-specific behavior and appearance
- No code changes required for new church deployments

### Data Flow Patterns

**Authentication Flow**:
1. User credentials submitted to `/api/auth/login` endpoint
2. JWT token returned and stored in AsyncStorage
3. Token included in Authorization header for all API requests
4. AuthContext propagates user state throughout app
5. Route guards redirect based on authentication status

**Data Fetching Pattern**:
- API client (`project/lib/api.ts`) handles all backend communication
- Loading states managed locally in components
- Error handling with Alert dialogs
- Pull-to-refresh functionality on key screens

**Data Flow**:
- All data fetched via RESTful API endpoints
- Configuration loaded on app start
- Members and household data fetched on-demand

## External Dependencies

### Primary Services

**Replit PostgreSQL**
- PostgreSQL database hosting on Replit infrastructure
- Managed via environment variables (DATABASE_URL, PGHOST, etc.)
- Direct database connection from Node.js backend

**Google Calendar** (Future Integration)
- Public iCal feed integration for church events planned
- Calendar ID stored in church configuration
- No direct Google API authentication required (public calendars only)

### NPM Packages

**Core Framework**:
- `expo` (^54.0.10): Development platform and build tools
- `react-native` (0.81.4): Mobile framework
- `react` (19.1.0): UI library

**Navigation & Routing**:
- `expo-router` (~6.0.8): File-based routing system
- `@react-navigation/native` (^7.0.14): Navigation primitives
- `@react-navigation/bottom-tabs` (^7.2.0): Tab navigation

**Authentication & Data**:
- `@react-native-async-storage/async-storage`: Local storage for JWT tokens
- Custom API client (`project/lib/api.ts`) for backend communication

**UI Components & Display**:
- `lucide-react-native` (^0.544.0): Icon library
- `react-native-render-html` (^6.3.4): HTML content rendering
- `react-native-webview` (13.15.0): WebView component
- `react-native-svg` (15.12.1): SVG rendering

**Expo Modules**:
- `expo-linear-gradient`: Gradient backgrounds
- `expo-blur`: Blur effects
- `expo-camera`: Camera access (future feature)
- `expo-web-browser`: In-app browser
- `expo-font`: Custom font loading
- `expo-linking`: Deep linking support

### External APIs

**Church-Specific Endpoints** (configured per church):
- Standard Payments URL: External donation processing link (configured in database)

**Third-Party Services**:
- No payment processing integration (external link only)
- No push notification service (planned feature)
- No analytics or crash reporting configured
- No CDN for asset hosting (Expo asset system)

## Backend NPM Packages

**Server Framework**:
- `express` (^4.18.2): Web server framework
- `cors` (^2.8.5): Cross-origin resource sharing
- `dotenv` (^16.3.1): Environment variable management

**Database**:
- `pg` (^8.11.3): PostgreSQL client for Node.js

**Authentication**:
- `jsonwebtoken` (^9.0.2): JWT token generation and verification
- `bcrypt` (^5.1.1): Password hashing

## Deployment Configuration

**Startup Script** (`start.sh`):
- Starts backend API server on port 3000
- Starts Expo frontend on port 5000 (web)
- Both services run concurrently

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGPORT`, `PGDATABASE`: Database credentials
- `JWT_SECRET`: Secret key for JWT token signing (auto-generated if not set)

## Recent Changes (October 2025)

**Migration from Supabase to Replit Backend**:
- Migrated from Supabase BaaS to custom Node.js/Express backend
- Replaced Supabase Auth with JWT-based authentication
- Migrated PostgreSQL database from Supabase to Replit
- Updated all React Native screens to use new API client
- Removed `@supabase/supabase-js` dependency
- Added custom API client (`project/lib/api.ts`)
- Backend API runs on unified server (port 5000)
- Both services managed by single workflow via `start.sh`

**Admin Web Panel (October 2025)**:
- Added separate web-based admin panel accessible at `/admin/login.html`
- Admin panel features:
  - Church configuration management (name, colors, logo, calendar ID, API endpoints)
  - **Announcements management** - Two announcement slots with start/end dates (database-driven)
  - Excel file upload for members, households, and donations data (bulk import)
  - Downloadable CSV templates for members, households, and donations data
  - Live configuration preview
  - Role-based access control (admins only)
- Security features:
  - JWT tokens include is_admin flag for role verification
  - Admin middleware validates both token claim and database role
  - URL validation prevents XSS attacks
  - Excel upload validation (file type, size limits, required columns)
- Admin user: john.doe@example.com (is_admin=true)
- Static files served from `admin/` directory
- Templates served from `templates/` directory
- API endpoints: 
  - PUT /api/admin/config
  - POST /api/admin/upload/members
  - POST /api/admin/upload/households
  - POST /api/admin/upload/donations
  - GET /api/announcements/admin/all
  - POST /api/announcements/admin/save