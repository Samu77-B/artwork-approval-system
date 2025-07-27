// DOM Elements
const artworkUpload = document.getElementById('artwork-upload');
const artworkPreview = document.getElementById('artwork-preview');
const approveBtn = document.getElementById('approve-btn');
const amendBtn = document.getElementById('amend-btn');
const amendText = document.getElementById('amend-text');
const submitBtn = document.getElementById('submit-btn');
const clientEmail = document.getElementById('client-email');
const clientEmailAdmin = document.getElementById('client-email-admin');
const sendToClientBtn = document.getElementById('send-to-client-btn');
const formMessage = document.getElementById('form-message');
const adminSection = document.getElementById('admin-section');
const clientSection = document.getElementById('client-section');
const profileBtns = document.querySelectorAll('.profile-btn');
const customFileLabel = document.getElementById('custom-file-label');

let approvalStatus = '';
let currentProfile = 'admin';

// Load artwork if review ID is present
async function loadArtworkFromReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const reviewId = urlParams.get('id');
  
  if (reviewId) {
    console.log('Review ID found:', reviewId);
    
    // Hide profile switcher buttons for clients
    const profileSwitcher = document.querySelector('.profile-switcher');
    if (profileSwitcher) profileSwitcher.style.display = 'none';
    
    // Switch to client view immediately
    currentProfile = 'client';
    profileBtns.forEach(b => b.classList.remove('active'));
    const clientBtn = document.querySelector('[data-profile="client"]');
    if (clientBtn) clientBtn.classList.add('active');
    
    if (adminSection) adminSection.style.display = 'none';
    if (clientSection) clientSection.style.display = 'block';
    
    try {
      const response = await fetch(`/api/artwork/${reviewId}`);
      const data = await response.json();
      
      if (data.artworkUrl) {
        // Display artwork
        const img = document.createElement('img');
        img.src = data.artworkUrl;
        img.style.objectFit = 'contain';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '400px';
        if (artworkPreview) {
        artworkPreview.innerHTML = '';
        artworkPreview.appendChild(img);
        }
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
    }
  }
}

// Initialize
loadArtworkFromReview();

// Profile switching
profileBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const profile = this.dataset.profile;
    if (profile === currentProfile) return;
    
    currentProfile = profile;
    profileBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    if (profile === 'admin') {
      adminSection.style.display = 'block';
      clientSection.style.display = 'none';
    } else {
      adminSection.style.display = 'none';
      clientSection.style.display = 'block';
    }
  });
});

// Send artwork to client
sendToClientBtn.addEventListener('click', async function() {
  const email = clientEmailAdmin.value.trim();
  const file = artworkUpload.files[0];
  
  if (!email || !file) {
    alert('Please enter client email and select artwork file');
    return;
  }
  
  const formData = new FormData();
  formData.append('artwork', file);
  formData.append('clientEmail', email);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (result.success) {
      alert(`Artwork sent to ${email}! Review URL: ${result.reviewUrl}`);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Error sending artwork: ' + error.message);
  }
});

artworkUpload.addEventListener('change', function() {
  artworkPreview.innerHTML = '';
  const file = this.files[0];
  if (customFileLabel) customFileLabel.textContent = file ? file.name : 'Choose Artwork File';
  if (!file) return;
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    img.style.objectFit = 'contain';
    artworkPreview.appendChild(img);
  } else if (file.type === 'application/pdf') {
    const embed = document.createElement('embed');
    embed.src = URL.createObjectURL(file);
    embed.type = 'application/pdf';
    embed.width = '100%';
    embed.height = '100%';
    artworkPreview.appendChild(embed);
  } else {
    artworkPreview.textContent = 'Preview not available for this file type.';
  }
});

approveBtn.addEventListener('click', function() {
  approvalStatus = 'approved';
  approveBtn.classList.add('active');
  amendBtn.classList.remove('active');
  amendText.style.display = 'none';
});

amendBtn.addEventListener('click', function() {
  approvalStatus = 'amend';
  amendBtn.classList.add('active');
  approveBtn.classList.remove('active');
  amendText.style.display = 'block';
  amendText.focus();
});

submitBtn.addEventListener('click', async function() {
  formMessage.textContent = '';
  const email = clientEmail.value.trim();
  if (!email) {
    formMessage.textContent = 'Please enter your email.';
    formMessage.style.color = '#e74c3c';
    return;
  }
  if (!approvalStatus) {
    formMessage.textContent = 'Please select Approve or Amend.';
    formMessage.style.color = '#e74c3c';
    return;
  }
  
  // Get review ID from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const reviewId = urlParams.get('id');
  
  if (!reviewId) {
    formMessage.textContent = 'No review ID found. Please use the link sent to your email.';
    formMessage.style.color = '#e74c3c';
    return;
  }
  
  try {
    const response = await fetch(`/api/review/${reviewId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: approvalStatus,
        notes: amendText.value,
        clientEmail: email
      })
    });
    
    const result = await response.json();
    if (result.success) {
      formMessage.textContent = 'Thank you! Your response has been submitted successfully.';
      formMessage.style.color = '#27ae60';
    } else {
      formMessage.textContent = 'Error: ' + result.error;
      formMessage.style.color = '#e74c3c';
    }
  } catch (error) {
    formMessage.textContent = 'Error submitting response: ' + error.message;
    formMessage.style.color = '#e74c3c';
  }
}); 