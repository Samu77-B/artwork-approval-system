# Simple Artwork Approval Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Set Up Formspree (Free Email Service)
1. **Go to [formspree.io](https://formspree.io)**
2. **Sign up** with your email
3. **Create a new form**
4. **Copy your form ID** (looks like: `xrgjabrg`)

### Step 2: Upload Artwork to Google Drive
1. **Upload your artwork** to Google Drive
2. **Right-click the file** → "Share" → "Copy link"
3. **Make sure it's set to "Anyone with the link can view"**

### Step 3: Update the HTML File
1. **Open `simple-artwork-approval.html`**
2. **Replace `YOUR_FORM_ID`** with your Formspree form ID
3. **Replace `YOUR_FILE_ID`** with your Google Drive file ID

**To get Google Drive File ID:**
- From the sharing link: `https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing`
- Copy the part between `/d/` and `/view`

### Step 4: Host the File
**Option A: GitHub Pages (Free)**
1. Upload to GitHub
2. Enable GitHub Pages
3. Your URL: `https://yourusername.github.io/repository/simple-artwork-approval.html`

**Option B: Netlify (Free)**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the HTML file
3. Get instant URL

**Option C: Any Web Hosting**
- Upload to any web hosting service
- Works on any server

## 📧 How It Works

1. **Admin uploads artwork** to Google Drive
2. **Updates the HTML file** with the new link
3. **Sends the page URL** to client
4. **Client views artwork** and submits response
5. **Admin receives email** via Formspree

## 🔧 Customization

**Change colors:** Edit the CSS variables in the `<style>` section
**Add logo:** Replace `img/PBJA_logo.svg` with your logo
**Custom domain:** Point your domain to the hosted file

## 💡 Tips

- **Test the form** before sending to clients
- **Keep backup copies** of artwork files
- **Use descriptive filenames** in Google Drive
- **Check spam folder** for Formspree emails

## 🆘 Troubleshooting

**Form not working:** Check Formspree form ID is correct
**Image not showing:** Verify Google Drive sharing settings
**No emails received:** Check spam folder and Formspree dashboard

## 📱 Mobile Friendly

The page works perfectly on mobile devices and tablets! 