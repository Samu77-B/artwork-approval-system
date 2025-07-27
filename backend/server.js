const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Storage for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Simple file-based storage (better than in-memory for deployments)
const dbFile = path.join(__dirname, 'artwork-db.json');

function loadDB() {
  try {
    if (fs.existsSync(dbFile)) {
      return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading DB:', error);
  }
  return {};
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving DB:', error);
  }
}

// Load existing data or start with empty DB
const artworkDB = loadDB();

app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Serve the main artwork approval page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'artwork-approval.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'Artwork Approval System'
  });
});

// Test endpoint to check uploads directory
app.get('/api/test-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    res.json({
      uploadDir,
      exists: fs.existsSync(uploadDir),
      files: files,
      dbRecords: Object.keys(artworkDB).length,
      dbContents: artworkDB
    });
  } catch (error) {
    res.json({ error: error.message, uploadDir });
  }
});

// Test endpoint to create a sample image
app.get('/api/create-test-image', (req, res) => {
  try {
    // Create a simple SVG test image
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f6fa"/>
      <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
        Test Artwork
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
        PBJA Artwork Approval System
      </text>
    </svg>`;
    
    const testFileName = 'test-artwork.svg';
    const testFilePath = path.join(uploadDir, testFileName);
    
    fs.writeFileSync(testFilePath, svgContent);
    
    res.json({
      success: true,
      message: 'Test image created',
      filename: testFileName,
      url: `/uploads/${testFileName}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin uploads artwork and sends to client
app.post('/api/upload', upload.single('artwork'), (req, res) => {
  const { clientEmail } = req.body;
  if (!req.file || !clientEmail) return res.status(400).json({ error: 'Missing file or client email' });
  const id = uuidv4();
  artworkDB[id] = {
    file: req.file.filename,
    clientEmail,
    status: 'pending',
    notes: ''
  };
  saveDB(artworkDB); // Save to file
  // Send email to client with review link
  sendClientEmail(clientEmail, id, req.file.filename)
    .then(() => res.json({ success: true, reviewUrl: `/review/${id}` }))
    .catch(err => {
      console.error('Email error:', err);
      res.json({ success: true, reviewUrl: `/review/${id}`, emailError: 'Email not sent, but review URL created' });
    });
});

// Serve review page
app.get('/review/:id', (req, res) => {
  const { id } = req.params;
  const record = artworkDB[id];
  if (!record) return res.status(404).send('Review not found');
  
  // Redirect to main page with review ID
  res.redirect(`/artwork-approval.html?id=${id}`);
});

// API endpoint to get artwork data
app.get('/api/artwork/:id', (req, res) => {
  const { id } = req.params;
  const record = artworkDB[id];
  console.log('=== ARTWORK REQUEST ===');
  console.log('ID:', id);
  console.log('Record found:', !!record);
  
  if (record) {
    console.log('Expected file:', record.file);
    console.log('Full path:', path.join(uploadDir, record.file));
    console.log('File exists:', fs.existsSync(path.join(uploadDir, record.file)));
    
    // Check what files actually exist
    try {
      const actualFiles = fs.readdirSync(uploadDir);
      console.log('Actual files in directory:', actualFiles);
      
      // If the expected file doesn't exist but there are other files, use the first available
      if (!fs.existsSync(path.join(uploadDir, record.file)) && actualFiles.length > 0) {
        console.log('Expected file missing, using fallback:', actualFiles[0]);
        record.file = actualFiles[0]; // Update with available file
        saveDB(artworkDB); // Save the correction
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }
  }
  console.log('======================');
  
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json({
    artworkUrl: `/uploads/${record.file}`,
    status: record.status,
    notes: record.notes
  });
});

// Client submits approval or amendment
app.post('/api/review/:id', (req, res) => {
  const { id } = req.params;
  const { action, notes, clientEmail } = req.body;
  const record = artworkDB[id];
  if (!record) return res.status(404).json({ error: 'Not found' });
  record.status = action;
  record.notes = notes || '';
  saveDB(artworkDB); // Save to file
  // Send email to admin
  sendAdminEmail(action, notes, record, clientEmail)
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ error: 'Failed to send email', details: err.message }));
});

// Email sending functions (placeholders)
function sendClientEmail(clientEmail, id, filename) {
  // TODO: Replace with your domain and email settings
  const reviewUrl = `${BASE_URL}/review/${id}`;
  
  // For development, just log the email
  console.log('=== EMAIL TO CLIENT ===');
  console.log('To:', clientEmail);
  console.log('Subject: Artwork Approval Request - PBJA');
  console.log('Review URL:', reviewUrl);
  console.log('========================');
  
  // Try to send actual email, but don't fail if it doesn't work
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, skipping email send');
      return Promise.resolve();
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: 'Artwork Approval Request - PBJA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${BASE_URL}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 20px;">
          <h2>Artwork Approval Request</h2>
          <p>Hello,</p>
          <p>We have prepared your artwork for review. Please click the link below to view and approve or request changes:</p>
          <a href="${reviewUrl}" style="background: #0074d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Review Artwork</a>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The PBJA Team</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Email setup error:', error);
    return Promise.resolve();
  }
  
  // Uncomment and configure for production
  /*
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // or your SMTP host
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  return transporter.sendMail({
    from: 'no-reply@paperboyja.com',
    to: clientEmail,
    subject: 'Artwork Approval Request - PBJA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${baseUrl}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 20px;">
        <h2>Artwork Approval Request</h2>
        <p>Hello,</p>
        <p>We have prepared your artwork for review. Please click the link below to view and approve or request changes:</p>
        <a href="${reviewUrl}" style="background: #0074d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Review Artwork</a>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The PBJA Team</p>
      </div>
    `
  });
  */
}

function sendAdminEmail(action, notes, record, clientEmail) {
  
  // For development, just log the email
  console.log('=== EMAIL TO ADMIN ===');
  console.log('To: contact@paperboyja.com');
  console.log('Subject: Artwork Approval Response');
  console.log('Client:', clientEmail || record.clientEmail);
  console.log('Status:', action);
  if (notes) console.log('Notes:', notes);
  console.log('Artwork:', `${BASE_URL}/uploads/${record.file}`);
  console.log('========================');
  
  // Try to send actual email, but don't fail if it doesn't work
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, skipping admin email');
      return Promise.resolve();
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send admin notifications to yourself
      subject: 'Artwork Approval Response',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${BASE_URL}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 20px;">
          <h2>Artwork Approval Response</h2>
          <p><strong>Client:</strong> ${clientEmail || record.clientEmail}</p>
          <p><strong>Status:</strong> ${action}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p><strong>Artwork:</strong> <a href="${BASE_URL}/uploads/${record.file}">View Artwork</a></p>
        </div>
      `
    });
  } catch (error) {
    console.error('Admin email error:', error);
    return Promise.resolve();
  }
  
  // Uncomment and configure for production
  /*
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  let subject = 'Artwork Approval Response';
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <img src="${baseUrl}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 20px;">
      <h2>Artwork Approval Response</h2>
      <p><strong>Client:</strong> ${clientEmail || record.clientEmail}</p>
      <p><strong>Status:</strong> ${action}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      <p><strong>Artwork:</strong> <a href="${baseUrl}/uploads/${record.file}">${record.file}</a></p>
    </div>
  `;
  return transporter.sendMail({
    from: 'no-reply@paperboyja.com',
    to: 'contact@paperboyja.com',
    subject,
    html
  });
  */
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 