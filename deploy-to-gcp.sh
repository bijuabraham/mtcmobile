#!/bin/bash

# Church Management App - Google Cloud Run Deployment Script
# This script deploys your backend API and admin panel to Google Cloud Run

set -e

echo "🏛️  Church Management App - Google Cloud Run Deployment"
echo "=========================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prompt for project ID if not set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "📋 Enter your Google Cloud Project ID:"
    read GCP_PROJECT_ID
fi

echo ""
echo "🔧 Configuration:"
echo "   Project ID: $GCP_PROJECT_ID"
echo "   Region: us-central1"
echo "   Service Name: church-app-backend"
echo ""

# Set the project
echo "🔑 Setting Google Cloud project..."
gcloud config set project $GCP_PROJECT_ID

# Enable required APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Deploy from source (easiest method - Cloud Run builds the Docker image)
echo ""
echo "🚀 Deploying to Cloud Run..."
echo "   This will:"
echo "   1. Build a Docker container from your code"
echo "   2. Push it to Google Container Registry"
echo "   3. Deploy it to Cloud Run"
echo ""

gcloud run deploy church-app-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production"

# Get the deployed URL
SERVICE_URL=$(gcloud run services describe church-app-backend --region us-central1 --format 'value(status.url)')

echo ""
echo "✅ Deployment Complete!"
echo "=========================================================="
echo ""
echo "🌐 Your backend API is live at:"
echo "   $SERVICE_URL"
echo ""
echo "📱 Admin Panel:"
echo "   $SERVICE_URL/admin/login.html"
echo ""
echo "🔧 API Health Check:"
echo "   $SERVICE_URL/api/health"
echo ""
echo "📊 View in Google Cloud Console:"
echo "   https://console.cloud.google.com/run/detail/us-central1/church-app-backend/metrics?project=$GCP_PROJECT_ID"
echo ""
echo "⚙️  Next Steps:"
echo "   1. Set up your database connection (add DATABASE_URL secret)"
echo "   2. Update your mobile app's API URL to: $SERVICE_URL"
echo "   3. Test the admin panel at: $SERVICE_URL/admin/login.html"
echo ""
