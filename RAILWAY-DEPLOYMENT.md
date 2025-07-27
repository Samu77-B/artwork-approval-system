# Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Create a new project

## Step 2: Deploy Your Project
1. **Option A: Connect GitHub Repository**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect it's a Node.js project

2. **Option B: Deploy from Local Files**
   - Click "Deploy from template"
   - Choose "Empty Project"
   - Upload your project files

## Step 3: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
EMAIL_USER=your-email@paperboyja.com
EMAIL_PASS=your-gmail-app-password
BASE_URL=https://your-railway-app-url.railway.app
NODE_ENV=production
```

## Step 4: Deploy
1. Railway will automatically build and deploy your app
2. Wait for deployment to complete
3. Your app will be available at the provided URL

## Step 5: Test Your Application
1. Visit your Railway app URL
2. Test the artwork upload and approval workflow
3. Check the logs in Railway dashboard for any issues

## Step 6: Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain (e.g., artwork.paperboyja.com)
3. Update DNS settings as instructed

## Troubleshooting
- Check Railway logs for errors
- Verify environment variables are set correctly
- Ensure all dependencies are in package.json
- Test locally first with `npm start`

## File Structure for Railway
```
/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/ (auto-created)
├── artwork-approval.html
├── artwork-approval.css
├── artwork-approval.js
├── img/
│   └── PBJA_logo.svg
├── railway.json
├── Procfile
└── .env (environment variables set in Railway dashboard)
``` 