#!/bin/bash

# Hostinger Deployment Script
# Run this script to prepare your project for Hostinger deployment

echo "🚀 Preparing Artwork Approval System for Hostinger deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env-template.txt .env
    echo "📝 Please edit .env file with your production settings"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install
cd ..

# Create uploads directory if it doesn't exist
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 644 *.html *.css *.js
chmod 755 backend/
chmod 755 img/
chmod 600 .env

# Check for required files
echo "✅ Checking required files..."
required_files=(
    "artwork-approval.html"
    "artwork-approval.css"
    "artwork-approval.js"
    "backend/server.js"
    "backend/package.json"
    "img/PBJA_logo.svg"
    ".htaccess"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload all files to Hostinger via File Manager"
echo "2. Configure Node.js in Hostinger control panel"
echo "3. Set startup file to: backend/server.js"
echo "4. Install dependencies via Terminal: npm install"
echo "5. Configure email settings in .env file"
echo "6. Start the application"
echo ""
echo "📖 See HOSTINGER-DEPLOYMENT.md for detailed instructions"