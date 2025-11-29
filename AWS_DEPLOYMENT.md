# AWS Elastic Beanstalk Deployment Guide

This guide walks you through deploying the Mar Thoma Church backend to AWS Elastic Beanstalk with PostgreSQL on RDS.

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com (free tier eligible)
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **EB CLI** - Install with `pip install awsebcli`
4. **PostgreSQL Client** - Install with `brew install postgresql` (Mac) or `apt install postgresql-client` (Linux)

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
   - **Master password**: (create a strong password - avoid special characters like `!` `$` `@` if possible)
3. Under **Connectivity**:
   - **Public access**: Yes (for initial setup)
   - **VPC security group**: Create new
4. Under **Additional configuration**:
   - **Initial database name**: Leave blank (we'll create it manually)
5. Click **Create database**
6. Wait 5-10 minutes for creation
7. Note the **Endpoint** from the "Connectivity & security" tab (e.g., `church-app-db.xxxxx.us-west-2.rds.amazonaws.com`)

### Security Group Configuration:

1. Go to **EC2 → Security Groups**
2. Find the RDS security group
3. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (or restrict to your Elastic Beanstalk security group later)

## Step 3: Import Database Schema

### Set Environment Variable

**IMPORTANT:** If your password contains special characters like `!`, use **single quotes** to prevent bash interpretation:

```bash
# Use SINGLE QUOTES for passwords with special characters
export DATABASE_URL='postgresql://churchadmin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/churchapp'
```

Double quotes will cause errors like `event not found` if password contains `!`.

### Create the Database

The database "churchapp" doesn't exist by default - you must create it first:

```bash
# Connect to the default 'postgres' database to create your database
psql 'postgresql://churchadmin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres' -c "CREATE DATABASE churchapp;"
```

### Import the Schema

```bash
# Now import the schema into the churchapp database
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

## Step 5: Prepare Server Directory

Before initializing Elastic Beanstalk, ensure the server directory is clean:

```bash
cd server

# IMPORTANT: Remove .ebextensions if it exists (NodeCommand is deprecated on Amazon Linux 2023)
rm -rf .ebextensions

# Verify these files exist:
ls package.json  # Backend dependencies
ls Procfile      # Should contain: web: node unified-server.js
```

**Note:** The `NodeCommand` option in `.ebextensions` is deprecated on Node.js 24 / Amazon Linux 2023. Use only the `Procfile` to specify your start command.

## Step 6: Initialize Elastic Beanstalk

```bash
# Navigate to the server directory
cd server

# Initialize EB application
eb init --region us-west-2

# Follow prompts:
# - Application name: church-app
# - Platform: Node.js (Yes)
# - Node.js version: Node.js 24 (or latest)
# - SSH: No (unless you need direct instance access)
```

**Important:** All EB commands must be run from the `server/` directory where package.json is located.

### If SSH Setup Fails

If you see an error about `ec2:ImportKeyPair`, your IAM user lacks permission. Simply choose **No** for SSH - it's optional and you can still deploy without it.

## Step 7: Create Environment

```bash
# Create single-instance environment (free tier eligible)
eb create church-app-prod --single
```

Wait 5-10 minutes for environment creation.

### If Creation Fails

If you see errors during creation:

```bash
# Check what went wrong
eb events

# If environment partially created, terminate it first
eb terminate church-app-prod

# Then try again
eb create church-app-prod --single
```

**Common error:** `Unknown or duplicate parameter: NodeCommand`
- **Fix:** Delete the `.ebextensions` folder and try again

## Step 8: Configure Environment Variables

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

## Step 9: Deploy

```bash
eb deploy
```

## Step 10: Verify Deployment

```bash
# Open your app
eb open

# Check logs if issues
eb logs
```

Your app will be available at:
`http://church-app-prod.region.elasticbeanstalk.com`

## Step 11: Update Google OAuth Redirect

Go back to Google Cloud Console and update the redirect URI to:
```
https://church-app-prod.region.elasticbeanstalk.com/api/auth/google/callback
```

---

## Troubleshooting

### "Environment not found" Error

The previous `eb create` failed. Create a new environment:
```bash
eb create church-app-prod --single
```

### "Unknown or duplicate parameter: NodeCommand"

The `.ebextensions/nodecommand.config` file uses a deprecated option. Remove it:
```bash
rm -rf .ebextensions
eb create church-app-prod --single
```

### "database does not exist"

Create the database first:
```bash
psql 'postgresql://user:pass@endpoint:5432/postgres' -c "CREATE DATABASE churchapp;"
```

### "event not found" when setting DATABASE_URL

Your password contains `!`. Use single quotes:
```bash
export DATABASE_URL='postgresql://user:p@ss!word@endpoint:5432/db'
```

### "psql: command not found"

Install PostgreSQL client:
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt install postgresql-client`

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

## Useful Commands

| Command | Description |
|---------|-------------|
| `eb init` | Initialize EB application |
| `eb create name --single` | Create environment |
| `eb deploy` | Deploy latest code |
| `eb open` | Open app in browser |
| `eb logs` | View logs |
| `eb status` | Check environment status |
| `eb events` | View recent events |
| `eb ssh` | SSH into instance |
| `eb terminate name` | Delete environment |
| `eb setenv KEY=value` | Set env variable |
| `eb list` | List all environments |

---

## Files Required for Deployment

All deployment files are in the `server/` directory:

| File | Purpose |
|------|---------|
| `package.json` | Backend dependencies (separate from frontend) |
| `Procfile` | Tells EB how to start your app: `web: node unified-server.js` |
| `.ebignore` | Files to exclude from deployment |
| `.env.example` | Template for environment variables |

**Do NOT include:** `.ebextensions/` folder (deprecated NodeCommand causes errors)

---

## Cost Optimization

### Free Tier (First 12 Months):
- Use `--single` instance mode
- Choose t2.micro or t3.micro instance type
- RDS db.t3.micro

### After Free Tier:
- Consider Reserved Instances for 30-40% savings
- Use Auto Scaling only when needed
- Monitor with AWS Cost Explorer

---

## Adding Custom Domain (Optional)

1. Register domain in **Route 53** or your registrar
2. In Elastic Beanstalk console, go to **Configuration → Load Balancer**
3. Add HTTPS listener with ACM certificate
4. Create Route 53 alias record pointing to your EB environment

---

## Quick Start Checklist

- [ ] AWS CLI configured with access keys
- [ ] RDS PostgreSQL database created
- [ ] Security group allows port 5432 from anywhere
- [ ] Database "churchapp" created: `CREATE DATABASE churchapp;`
- [ ] Schema imported: `psql $DATABASE_URL < server/schema.sql`
- [ ] `.ebextensions` folder deleted from server/
- [ ] `eb init` completed in server/ directory
- [ ] `eb create church-app-prod --single` successful
- [ ] Environment variables set via `eb setenv`
- [ ] Google OAuth redirect URI updated
- [ ] App accessible via `eb open`
