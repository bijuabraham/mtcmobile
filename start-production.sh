#!/bin/bash

echo "🚀 Starting Church Management Backend API..."
echo "📡 Backend API will be available on port 5000"
echo "🔧 Admin panel will be accessible at /admin/login.html"

# Start the unified server (backend API + admin panel)
cd server && node unified-server.js
