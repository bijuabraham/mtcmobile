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
- `AuthContext` manages user authentication state and session
- `ChurchConfigContext` provides church-specific branding and configuration
- Real-time subscription to configuration changes via Supabase channels

**UI/Styling Approach**:
- React Native StyleSheet for component styling (no CSS-in-JS libraries)
- Dynamic theming based on church configuration (primary, secondary, accent colors)
- Lucide React Native for consistent iconography
- RenderHTML for displaying rich-text announcements
- No UI component library - custom components throughout

### Backend Architecture

**Database**: Supabase (PostgreSQL)
- Serverless PostgreSQL database hosted on Supabase
- Real-time subscriptions for live data updates
- Row-level security policies for data access control

**Authentication**: Supabase Auth
- Email/password authentication strategy
- Session management with automatic token refresh
- User creation and password updates via Supabase Edge Functions

**Data Models**:
- `church_configurations`: White-label branding and API endpoints (singleton pattern)
- `households`: Family/household information with contact details
- `members`: Individual church members linked to households
- `donations`: User donation records with categories and payment methods
- `announcements`: Church-wide announcements with date-based visibility
- `contact_us`: Church staff contact information with display ordering
- `user_settings`: User-specific preferences (notifications, language)

**Edge Functions** (Deno runtime):
- `create-user`: Admin function for creating user accounts
- `update-user-password`: Admin function for password resets
- `get-calendar-events`: Fetches and parses Google Calendar iCal feeds

### White-Label Configuration Strategy

**Database-Driven Branding**:
- Single `church_configurations` table stores all branding settings
- Configuration includes: church name, color scheme, logo URL, API endpoints, calendar ID
- Context provider fetches configuration on app load and subscribes to changes
- All UI components consume configuration for dynamic theming

**Deployment Model**:
- One codebase serves multiple churches
- Each deployment connects to different Supabase project via environment variables
- Configuration determines church-specific behavior and appearance
- No code changes required for new church deployments

### Data Flow Patterns

**Authentication Flow**:
1. User credentials submitted to Supabase Auth
2. Session token stored in local storage (Expo SecureStore on native)
3. AuthContext propagates user state throughout app
4. Route guards redirect based on authentication status

**Data Fetching Pattern**:
- Direct Supabase client queries from component hooks
- Loading states managed locally in components
- Error handling with Alert dialogs
- Pull-to-refresh functionality on key screens

**Real-time Updates**:
- Church configuration changes broadcast via Supabase channels
- Automatic re-render when configuration updates
- Members and household data fetched on-demand (no real-time subscriptions)

## External Dependencies

### Primary Services

**Supabase** (Backend-as-a-Service)
- PostgreSQL database hosting
- User authentication and session management
- Edge Functions runtime (Deno)
- Real-time subscriptions via WebSocket channels
- Row-level security for data access control
- Configuration via environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Google Calendar**
- Public iCal feed integration for church events
- Fetched server-side via Edge Function to parse iCal format
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
- `@supabase/supabase-js` (^2.58.0): Supabase client library
- `react-native-url-polyfill` (^2.0.0): URL API polyfill for React Native

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
- `api.iconcmo.com`: Church management API integration (referenced but not actively used)
- Announcements endpoint: Custom URL for fetching church announcements (legacy, now uses Supabase)
- Standard Payments URL: External donation processing link

**Third-Party Services**:
- No payment processing integration (external link only)
- No push notification service (planned feature)
- No analytics or crash reporting configured
- No CDN for asset hosting (Expo asset system)