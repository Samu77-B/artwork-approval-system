# Artwork Approval System

A web-based system for managing artwork approval workflows between PBJA and clients.

## Features

- **Admin Interface**: Upload artwork and send to clients for review
- **Client Interface**: Review artwork and approve or request changes
- **Email Notifications**: Automated email system for workflow management
- **File Management**: Secure file upload and storage
- **Responsive Design**: Works on desktop and mobile devices

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3001/artwork-approval.html
```

## Usage

### Admin Workflow
1. Switch to "Admin" mode using the profile switcher
2. Enter the client's email address
3. Upload artwork file (images or PDFs supported)
4. Click "Send Artwork to Client"
5. The system will generate a review link and log the email details

### Client Workflow
1. Client receives email with review link
2. Clicking the link opens the approval interface
3. Review the artwork in the preview area
4. Choose "Approve Artwork" or "Amend Artwork"
5. If amending, provide detailed feedback
6. Enter email address and submit response

## Development

### File Structure
```
├── artwork-approval.html      # Main frontend interface
├── artwork-approval.css       # Styles
├── artwork-approval.js        # Frontend logic
├── backend/
│   ├── server.js             # Express server
│   ├── package.json          # Backend dependencies
│   └── uploads/              # File storage (auto-created)
└── img/
    └── PBJA_logo.svg         # Brand logo
```

### Email Configuration

For production, update the email settings in `backend/server.js`:

1. Uncomment the email sending code
2. Set environment variables:
   - `EMAIL_USER`: Your email address
   - `EMAIL_PASS`: Your email password/app password
   - `BASE_URL`: Your domain URL

### Environment Variables
```bash
EMAIL_USER=your@email.com
EMAIL_PASS=your_password
BASE_URL=https://yourdomain.com
```

## API Endpoints

- `POST /api/upload` - Upload artwork and send to client
- `GET /review/:id` - Redirect to review page
- `GET /api/artwork/:id` - Get artwork data
- `POST /api/review/:id` - Submit approval/amendment

## Security Notes

- File uploads are restricted to images and PDFs
- Files are stored with unique UUIDs
- Email addresses are validated
- Review links use UUIDs for security

## Future Enhancements

- User authentication system
- Database integration (replace in-memory storage)
- File compression and optimization
- Advanced email templates
- Admin dashboard for tracking approvals
- Multiple artwork versions support 