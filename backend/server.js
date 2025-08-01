const express = require('express');
const multer = require('multer');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
console.log('BASE_URL:', process.env.BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Test endpoint to simulate email subject generation
app.get('/api/test-email-subject/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = artworkDB[id];
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    let artworkName = record?.originalName || record.file || 'Artwork';
    
    // Clean up the artwork name if needed
    if (artworkName === record.file && record.file && record.file.includes('-')) {
      const extension = path.extname(record.file);
      artworkName = `Artwork${extension}`;
    }
    
    const clientSubject = `Artwork Approval Request - PBJA - ${artworkName}`;
    const adminSubject = `Artwork Approval Response - PBJA - ${artworkName} - APPROVED`;
    
    res.json({
      record: record,
      artworkName: artworkName,
      clientEmailSubject: clientSubject,
      adminEmailSubject: adminSubject
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
    originalName: req.file.originalname, // Store original filename
    clientEmail,
    status: 'pending',
    notes: ''
  };
  saveDB(artworkDB); // Save to file
  // Send email to client with review link (pass original filename)
  sendClientEmail(clientEmail, id, req.file.originalname)
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
async function sendClientEmail(clientEmail, id, filename) {
  const reviewUrl = `${BASE_URL}/review/${id}`;
  
  // Get the artwork record to access original filename
  const record = artworkDB[id];
  let artworkName = record?.originalName || filename || 'Artwork';
  
  // Clean up the artwork name if needed
  if (artworkName === filename && filename.includes('-')) {
    // If using UUID filename as fallback, create a cleaner name
    const extension = path.extname(filename);
    artworkName = `Artwork${extension}`;
  }
  
  // Create subject with artwork name
  const subject = `Artwork Approval Request - PBJA - ${artworkName}`;
  
  // For development, log the email details
  console.log('=== EMAIL TO CLIENT ===');
  console.log('To:', clientEmail);
  console.log('From: info@paperboyja.com');
  console.log('Subject:', subject);
  console.log('Artwork ID:', id);
  console.log('Record found:', !!record);
  console.log('Original filename:', record?.originalName);
  console.log('Passed filename:', filename);
  console.log('Final artwork name:', artworkName);
  console.log('Review URL:', reviewUrl);
  console.log('========================');
  
  // Send email using Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email send');
      return Promise.resolve();
    }
    
    return await resend.emails.send({
      from: 'PBJA Artwork Team <info@paperboyja.com>',
      to: clientEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <img src="${BASE_URL}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 10px;">
            <h2 style="margin: 0; color: #333;">Artwork Ready for Your Review</h2>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; font-weight: 500;">
                📧 This email is from <strong>Paperboy JA</strong><br>
                📞 Contact us on <a href="mailto:info@paperboyja.com" style="color: #cce7ff;">info@paperboyja.com</a> or call <a href="tel:+18769225483" style="color: #cce7ff;">+1 (876) 922-5483</a>
              </p>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
              Your artwork <strong>"${artworkName}"</strong> has been prepared and is ready for your review and approval.
            </p>
            
            <div style="background: #e8f4fd; border-left: 4px solid #0074d9; padding: 20px; margin: 25px 0; border-radius: 0 6px 6px 0;">
              <h4 style="margin: 0 0 10px 0; color: #0074d9;">📋 What You Need to Do:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Click the review button below</li>
                <li>View your artwork</li>
                <li>Choose "Approve" or "Request Changes"</li>
                <li>Submit your response</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" 
                 style="background: #0074d9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 500;">
                🎨 Review Artwork Now
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Need Help?</strong> If you have any questions or need assistance, please don't hesitate to contact us at 
                <a href="mailto:info@paperboyja.com" style="color: #0074d9;">info@paperboyja.com</a>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 16px; color: #333; margin-bottom: 5px;">Best regards,</p>
            <p style="font-size: 16px; color: #333; margin: 0;"><strong>The PBJA Team</strong></p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
              This email was sent from the PBJA Artwork Approval System
            </p>
          </div>
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

async function sendAdminEmail(action, notes, record, clientEmail) {
  // Use original filename if available, otherwise use current filename
  let artworkName = record.originalName || record.file;
  
  // If still using UUID filename, create a clean name
  if (!record.originalName) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(artworkName)) {
      const extension = path.extname(artworkName);
      artworkName = `Artwork${extension}`;
    }
  }
  
  // Create subject with status and artwork name
  const status = action === 'approved' ? 'APPROVED' : 'AMENDMENT REQUESTED';
  const subject = `Artwork Approval Response - PBJA - ${artworkName} - ${status}`;
  
  // For development, log the email details
  console.log('=== EMAIL TO ADMIN ===');
  console.log('To: info@paperboyja.com');
  console.log('Subject:', subject);
  console.log('Client:', clientEmail || record.clientEmail);
  console.log('Status:', action);
  if (notes) console.log('Notes:', notes);
  console.log('Artwork:', `${BASE_URL}/uploads/${record.file}`);
  console.log('========================');
  
  // Send email using Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping admin email');
      return Promise.resolve();
    }
    
    // Create status-specific content
    const statusColor = action === 'approved' ? '#27ae60' : '#f39c12';
    const statusIcon = action === 'approved' ? '✅' : '🔄';
    const statusMessage = action === 'approved' ? 
      'The client has APPROVED the artwork and it\'s ready for production!' :
      'The client has requested AMENDMENTS to the artwork.';
    
    return await resend.emails.send({
      from: 'PBJA Artwork Team <info@paperboyja.com>',
      to: 'info@paperboyja.com',
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <img src="${BASE_URL}/img/PBJA_logo.svg" alt="PBJA Logo" style="width: 120px; margin-bottom: 10px;">
            <h2 style="margin: 0; color: #333;">Artwork Approval Response</h2>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 18px;">${statusIcon} ${status}</h3>
            </div>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 25px;">${statusMessage}</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h4 style="margin-top: 0; color: #333;">Project Details:</h4>
              <p style="margin: 8px 0;"><strong>Client Email:</strong> ${clientEmail || record.clientEmail}</p>
              <p style="margin: 8px 0;"><strong>Artwork:</strong> ${artworkName}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> ${action.toUpperCase()}</p>
              ${notes ? `
                <div style="margin-top: 15px;">
                  <strong>Client Notes:</strong>
                  <div style="background: white; padding: 12px; border-left: 4px solid ${statusColor}; margin-top: 8px; border-radius: 0 4px 4px 0;">
                    ${notes.replace(/\n/g, '<br>')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${BASE_URL}/uploads/${record.file}" 
                 style="background: #0074d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px;">
                📎 View Artwork File
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
              This is an automated notification from the PBJA Artwork Approval System
            </p>
          </div>
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