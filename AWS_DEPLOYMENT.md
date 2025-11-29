# AWS Elastic Beanstalk Deployment Guide

This guide walks you through deploying the Mar Thoma Church backend to AWS Elastic Beanstalk with PostgreSQL on RDS.

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com (free tier eligible)
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **EB CLI** - Install with `pip install awsebcli`

## Step 1: Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-west-2)
- Default output format: json

## Step 2: Create RDS PostgreSQL Database

### Via AWS Console:

1. Go to **AWS Console → RDS → Create database**
2. Choose:
   - **Engine**: PostgreSQL
   - **Template**: Free tier
   - **DB instance identifier**: church-app-db
   - **Master username**: churchadmin
   - **Master password**: (create a strong password)
3. Under **Connectivity**:
   - **Public access**: Yes (for initial setup)
   - **VPC security group**: Create new
4. Under **Additional configuration**:
   - **Initial database name**: churchapp
5. Click **Create database**
6. Wait 5-10 minutes for creation
7. Note the **Endpoint** (e.g., church-app-db.xxxxx.us-west-2.rds.amazonaws.com)

### Security Group Configuration:

1. Go to **EC2 → Security Groups**
2. Find the RDS security group
3. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (or restrict to your Elastic Beanstalk security group later)

## Step 3: Import Database Schema

From your local machine or this Replit:

```bash
# Set your database URL
export DATABASE_URL="postgresql://churchadmin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/churchapp"

# Import schema
psql $DATABASE_URL < server/schema.sql
```

## Step 4: Set Up Google OAuth

1. Go to **Google Cloud Console** → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (or use existing)
3. Add authorized redirect URI:
   ```
   http://your-eb-environment.region.elasticbeanstalk.com/api/auth/google/callback
   ```
   (You'll update this after getting your EB URL)

## Step 5: Initialize Elastic Beanstalk

```bash
# Navigate to the server directory (contains package.json and all backend code)
cd server

# Verify package.json exists
ls package.json

# Initialize EB application
eb init

# Follow prompts:
# - Select region (same as RDS)
# - Application name: church-app
# - Platform: Node.js
# - Node.js version: 18
# - SSH: Yes (recommended)
```

**Important:** All EB commands must be run from the `server/` directory where package.json is located.

## Step 6: Create Environment

```bash
# Create single-instance environment (free tier)
eb create church-app-prod --single

# Or with load balancer (costs more)
# eb create church-app-prod --elb-type application
```

Wait 5-10 minutes for environment creation.

## Step 7: Configure Environment Variables

### Via EB CLI:

```bash
eb setenv \
  DATABASE_URL="postgresql://churchadmin:PASSWORD@your-rds-endpoint:5432/churchapp" \
  GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="your-secret" \
  SESSION_SECRET="random-32-char-string" \
  NODE_ENV="production"
```

### Via AWS Console:

1. Go to **Elastic Beanstalk → Your Environment → Configuration**
2. Click **Edit** on "Software"
3. Scroll to "Environment properties"
4. Add each variable

## Step 8: Deploy

```bash
eb deploy
```

## Step 9: Verify Deployment

```bash
# Open your app
eb open

# Check logs if issues
eb logs
```

Your app will be available at:
`http://church-app-prod.region.elasticbeanstalk.com`

## Step 10: Update Google OAuth Redirect

Go back to Google Cloud Console and update the redirect URI to:
```
https://church-app-prod.region.elasticbeanstalk.com/api/auth/google/callback
```

---

## Useful Commands

```bash
# View status
eb status

# View logs
eb logs

# SSH into instance
eb ssh

# Terminate environment (stops billing)
eb terminate church-app-prod

# List environments
eb list
```

## Adding Custom Domain (Optional)

1. Register domain in **Route 53** or your registrar
2. In Elastic Beanstalk console, go to **Configuration → Load Balancer**
3. Add HTTPS listener with ACM certificate
4. Create Route 53 alias record pointing to your EB environment

## Cost Optimization

### Free Tier (First 12 Months):
- Use `--single` instance mode
- Choose t2.micro instance type
- RDS db.t2.micro

### After Free Tier:
- Consider Reserved Instances for 30-40% savings
- Use Auto Scaling only when needed
- Monitor with AWS Cost Explorer

## Troubleshooting

### App not starting:
```bash
eb logs
# Look for errors in /var/log/web.stdout.log
```

### Database connection failed:
- Check RDS security group allows inbound from EB
- Verify DATABASE_URL is correct
- Ensure RDS is in same VPC or publicly accessible

### OAuth not working:
- Update Google OAuth redirect URI to your EB URL
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `eb init` | Initialize EB application |
| `eb create name --single` | Create environment |
| `eb deploy` | Deploy latest code |
| `eb open` | Open app in browser |
| `eb logs` | View logs |
| `eb ssh` | SSH into instance |
| `eb terminate name` | Delete environment |
| `eb setenv KEY=value` | Set env variable |

---

## Files Created for Deployment

All deployment files are in the `server/` directory:

- `package.json` - Backend dependencies (separate from frontend)
- `Procfile` - Tells EB how to start your app (`npm start`)
- `.ebextensions/` - AWS configuration files
- `.ebignore` - Files to exclude from deployment
- `.env.example` - Template for environment variables
