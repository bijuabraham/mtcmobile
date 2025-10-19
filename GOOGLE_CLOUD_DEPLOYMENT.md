# Deploying Your Church App to Google Cloud Run

This guide will help you deploy your church management backend API and admin panel to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account** ✅ (You already have this!)
2. **Google Cloud Project** - Create one at https://console.cloud.google.com
3. **gcloud CLI** - Install from https://cloud.google.com/sdk/docs/install

## Why Google Cloud Run?

- **💰 Cost-Effective**: Free tier includes 2 million requests/month
- **📈 Auto-Scaling**: Automatically handles traffic spikes
- **🔒 Secure**: Built-in SSL certificates
- **⚡ Fast**: Low latency, global deployment
- **🎯 Pay-as-you-go**: Only pay when your app is processing requests

## Step-by-Step Deployment

### Option 1: Quick Deploy (Recommended)

We've created a deployment script that does everything for you:

```bash
# 1. Make sure you're logged in to Google Cloud
gcloud auth login

# 2. Run the deployment script
./deploy-to-gcp.sh
```

When prompted, enter your Google Cloud Project ID. That's it!

### Option 2: Manual Deploy

If you prefer to do it manually:

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project ID
gcloud config set project YOUR_PROJECT_ID

# 3. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 4. Deploy
gcloud run deploy church-app-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production"
```

## Setting Up Your Database

Your app needs to connect to your PostgreSQL database. You have two options:

### Option A: Use Cloud SQL (Recommended for Production)

```bash
# Create a PostgreSQL instance
gcloud sql instances create church-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create the database
gcloud sql databases create church_management --instance=church-db

# Connect it to Cloud Run
gcloud run services update church-app-backend \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:church-db \
  --region us-central1
```

### Option B: Use External Database

If you want to keep using your Replit database or another external database:

```bash
# Add DATABASE_URL as a secret
echo -n "postgresql://user:password@host:5432/database" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Update your Cloud Run service to use the secret
gcloud run services update church-app-backend \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --region us-central1
```

## Connecting Your Mobile App

After deployment, you'll get a URL like:
```
https://church-app-backend-xxxxxxxxx-uc.a.run.app
```

### Update Your Expo App

In your mobile app code, update the API URL:

```javascript
// project/lib/api.ts
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development
  : 'https://church-app-backend-xxxxxxxxx-uc.a.run.app/api';  // Production
```

Or use environment variables:

```javascript
// project/app.config.js
export default {
  // ... other config
  extra: {
    apiUrl: process.env.API_URL || 'https://church-app-backend-xxxxxxxxx-uc.a.run.app/api'
  }
};
```

## Useful Commands

### View Service URL
```bash
gcloud run services describe church-app-backend --region us-central1 --format 'value(status.url)'
```

### View Logs
```bash
gcloud run services logs read church-app-backend --region us-central1
```

### Update Environment Variables
```bash
gcloud run services update church-app-backend \
  --set-env-vars "KEY=value" \
  --region us-central1
```

### Delete Service
```bash
gcloud run services delete church-app-backend --region us-central1
```

## Cost Estimation

**Free Tier (More than enough for most churches):**
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**Typical Church Usage:**
- Small church (100-200 members): ~FREE
- Medium church (500-1000 members): $5-10/month
- Large church (2000+ members): $20-30/month

**Additional Costs:**
- Cloud SQL (if used): $7-10/month for smallest instance
- Storage: Minimal (usually < $1/month)

## CI/CD - Automatic Deployments

Want automatic deployments when you push code to GitHub?

1. Connect your GitHub repo to Cloud Build
2. The `cloudbuild.yaml` file is already set up
3. Every push to main branch = automatic deployment

```bash
# Set up Cloud Build trigger
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Monitoring & Management

**View your deployment:**
https://console.cloud.google.com/run

**Monitor metrics:**
- Request count
- Response times
- Error rates
- CPU & Memory usage

## Troubleshooting

### Issue: "Permission denied"
```bash
# Give yourself necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:your-email@gmail.com" \
  --role="roles/run.admin"
```

### Issue: "Port not responding"
Make sure your app listens on the PORT environment variable:
```javascript
const PORT = process.env.PORT || 8080;
```

### Issue: Cold starts are slow
Set minimum instances:
```bash
gcloud run services update church-app-backend \
  --min-instances 1 \
  --region us-central1
```

## Support

- Google Cloud Run Docs: https://cloud.google.com/run/docs
- Google Cloud Free Tier: https://cloud.google.com/free
- Community Support: https://cloud.google.com/support

---

**Ready to deploy?** Run `./deploy-to-gcp.sh` and you'll be live in minutes!
