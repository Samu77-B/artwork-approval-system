# Hostinger Deployment Guide

## Prerequisites
- Hostinger Premium or higher plan (supports Node.js)
- Domain (e.g., paperboyja.com)
- Node.js support enabled

## Step 1: Prepare Project
1. Create `.env` file with production settings:
```
EMAIL_USER=your-email@paperboyja.com
EMAIL_PASS=your-app-password
BASE_URL=https://yourdomain.com
NODE_ENV=production
PORT=3001
```

## Step 2: Hostinger Setup
1. Log into Hostinger control panel
2. Go to "Advanced" → "Node.js"
3. Enable Node.js for your domain
4. Set Node.js version to 16.x or higher
5. Set Application Root to `/public_html`
6. Set Startup File to `backend/server.js`

## Step 3: Upload Files
1. Go to "Files" → "File Manager"
2. Upload all project files to root directory
3. Ensure proper file permissions

## Step 4: Install Dependencies
1. Go to "Advanced" → "Terminal"
2. Navigate to project directory
3. Run: `npm install`

## Step 5: Configure Email
1. Uncomment email code in `backend/server.js`
2. Set up Gmail App Password
3. Update `.env` with email credentials

## Step 6: Start Application
1. Go to "Advanced" → "Node.js"
2. Click "Restart" application
3. Test at: `https://yourdomain.com/artwork-approval.html`

## Troubleshooting
- Check Node.js logs in control panel
- Verify file permissions
- Test email configuration
- Ensure SSL is enabled