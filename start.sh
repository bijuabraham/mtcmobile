#!/bin/bash

echo "🚀 Starting Church Management App..."
echo "🌐 App will be available at: https://${REPLIT_DEV_DOMAIN}"

# Start Expo dev server on port 8081 in the background with tunnel for mobile access
echo "🎨 Starting Expo dev server on port 8081..."
echo "📱 Tunnel mode enabled - scan QR code with Expo Go app"
cd project && EXPO_NO_TELEMETRY=1 BROWSER=none EXPO_ADDITIONAL_ORIGINS="https://${REPLIT_DEV_DOMAIN}" npx expo start --web --tunnel --port 8081 &
EXPO_PID=$!

# Wait for Expo to be ready
sleep 5

# Start the unified server on port 5000 (handles both API and proxying to Expo)
echo "⚙️  Starting unified server on port 5000..."
cd server && node unified-server.js &
SERVER_PID=$!

# Wait for both processes
wait $EXPO_PID $SERVER_PID
