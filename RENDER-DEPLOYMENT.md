# Render Deployment Guide

This guide explains how to deploy the Artwork Approval System to [Render.com](https://render.com).

## Prerequisite: Render Account
Ensure you have an account at [Render.com](https://render.com).

## Deployment Methods

### Option 1: Blueprints (Recommended)
This method uses the `render.yaml` file to automatically configure the service.

1.  Push your code to a GitHub repository.
2.  In Render Dashboard, click **"New"** -> **"Blueprint"**.
3.  Connect your GitHub repository.
4.  Render will detect the `render.yaml` file.
5.  Click **"Apply"**.
6.  You will be prompted to enter Environment Variables:
    *   `RESEND_API_KEY`: Your API key from Resend.com.
    *   `BASE_URL`: The URL of your Render app (e.g., `https://your-app-name.onrender.com`). You can set this later if you don't know it yet.

### Option 2: Manual Web Service
If you prefer to configure manually:

1.  In Render Dashboard, click **"New"** -> **"Web Service"**.
2.  Connect your GitHub repository.
3.  **Name**: Give it a name (e.g., `paperboy-artwork`).
4.  **Region**: Select a region close to you/your clients.
5.  **Branch**: `main` (or your working branch).
6.  **Root Directory**: Leave empty (defaults to repo root).
7.  **Runtime**: `Node`
8.  **Build Command**: `cd backend && npm install`
    *   *Important*: This ensures the backend dependencies (including `resend`) are installed.
9.  **Start Command**: `cd backend && npm start`
10. **Instance Type**: `Free` (or select a paid plan).
11. **Environment Variables** (Advanced):
    *   Add `NODE_ENV` = `production`
    *   Add `RESEND_API_KEY` = `your_resend_api_key_here`
    *   Add `BASE_URL` = `https://your-app-name.onrender.com`

## ⚠️ Important Note on Free Tier & File Storage
**The Render Free Tier (and most cloud Web Services) uses "Ephemeral Filesystems".**

This means **files uploaded to the disk (the `uploads/` folder) will be deleted** whenever the app restarts, redeploys, or "spins down" after inactivity.

*   **For Production**: You should use a persistent storage service like AWS S3, Cloudinary, or Render's paid "Disk" feature (requires paid Team plan).
*   **For Demo/Testing**: The current setup works, but uploaded artwork will disappear if the server restarts.

## Post-Deployment
1.  Once deployed, Render will provide a URL (e.g., `https://paperboy-artwork.onrender.com`).
2.  Update the `BASE_URL` environment variable in the Render Dashboard if you haven't already.
3.  The app may take ~50 seconds to spin up on the Free tier if it has been inactive.

