#!/bin/bash

# Set API URL for the frontend
export EXPO_PUBLIC_API_URL="https://${REPLIT_DEV_DOMAIN}/api"
export API_PORT=3000

echo "🚀 Starting Church Management App..."
echo "📡 API will be available at: ${EXPO_PUBLIC_API_URL}"
echo "🌐 Frontend will be available at: https://${REPLIT_DEV_DOMAIN}"

# Start the backend API server in the background
echo "⚙️  Starting backend API server on port 3000..."
cd server && node server.js &
API_PID=$!

# Wait for API to be ready
sleep 3

# Start the frontend
echo "🎨 Starting Expo web frontend on port 5000..."
cd project && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $API_PID $FRONTEND_PID
