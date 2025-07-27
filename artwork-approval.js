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
    
    // Update header for client mode
    const adminIndicator = document.querySelector('.admin-indicator');
    const profileSwitcher = document.querySelector('.profile-switcher');
    const subtitle = document.querySelector('.subtitle');
    
    // Hide admin indicator and profile switcher for clients
    if (adminIndicator) adminIndicator.style.display = 'none';
    if (profileSwitcher) profileSwitcher.style.display = 'none';
    
    // Update subtitle for client view
    if (subtitle) {
      subtitle.textContent = 'Please review and approve or request changes to your artwork below.';
    }
    
    // Switch to client view immediately
    currentProfile = 'client';
    profileBtns.forEach(b => b.classList.remove('active'));
    const clientBtn = document.querySelector('[data-profile="client"]');
    if (clientBtn) clientBtn.classList.add('active');
    
    if (adminSection) adminSection.style.display = 'none';
    if (clientSection) clientSection.style.display = 'block';
    
    try {
      // Show loading state
      if (artworkPreview) {
        artworkPreview.innerHTML = '<div style="text-align: center; color: #666; font-size: 1.1rem;">Loading artwork...</div>';
      }
      
      const response = await fetch(`/api/artwork/${reviewId}`);
      const data = await response.json();
      
      if (data.artworkUrl) {
        console.log('Loading artwork from:', data.artworkUrl);
        
        // Detect file type from URL extension
        const fileExtension = data.artworkUrl.toLowerCase().split('.').pop();
        const isPDF = fileExtension === 'pdf';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension);
        
        if (artworkPreview) {
          artworkPreview.innerHTML = '';
          
          if (isPDF) {
            // Handle PDF files
            console.log('Displaying PDF artwork');
            const embed = document.createElement('embed');
            embed.src = data.artworkUrl;
            embed.type = 'application/pdf';
            embed.width = '100%';
            embed.height = '100%';
            embed.style.minHeight = '400px';
            
            // Add error handling for PDF
            embed.onerror = function() {
              console.error('Failed to load PDF:', data.artworkUrl);
              artworkPreview.innerHTML = `
                <div style="text-align: center; color: #e74c3c; font-size: 1.1rem;">
                  <p>Unable to display PDF inline</p>
                  <p style="font-size: 0.9rem; margin-top: 10px;">
                    <a href="${data.artworkUrl}" target="_blank" style="color: #0074d9; text-decoration: none; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px solid #dee2e6;">📄 Open PDF in New Tab</a>
                  </p>
                </div>`;
            };
            
            artworkPreview.appendChild(embed);
            
          } else if (isImage) {
            // Handle image files
            console.log('Displaying image artwork');
            const img = document.createElement('img');
            img.src = data.artworkUrl;
            img.alt = 'Artwork for approval';
            
            // Add error handling for images
            img.onerror = function() {
              console.error('Failed to load image:', data.artworkUrl);
              artworkPreview.innerHTML = `
                <div style="text-align: center; color: #e74c3c; font-size: 1.1rem;">
                  <p>Unable to load artwork</p>
                  <p style="font-size: 0.9rem; margin-top: 10px;">
                    <a href="${data.artworkUrl}" target="_blank" style="color: #0074d9; text-decoration: none; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px solid #dee2e6;">🖼️ View Image Directly</a>
                  </p>
                </div>`;
            };
            
            // Add load success handling
            img.onload = function() {
              console.log('Image loaded successfully');
            };
            
            // Set a timeout for slow loading images
            setTimeout(() => {
              if (!img.complete && artworkPreview && artworkPreview.contains(img)) {
                console.warn('Image taking too long to load, showing fallback');
                artworkPreview.innerHTML = `
                  <div style="text-align: center; color: #f39c12; font-size: 1.1rem;">
                    <p>Image is taking longer than expected to load</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">
                      <a href="${data.artworkUrl}" target="_blank" style="color: #0074d9; text-decoration: none; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px solid #dee2e6;">🖼️ View Image Directly</a>
                    </p>
                  </div>`;
              }
            }, 10000); // 10 second timeout
            
            artworkPreview.appendChild(img);
            
          } else {
            // Handle unsupported file types
            console.log('Unsupported file type:', fileExtension);
            artworkPreview.innerHTML = `
              <div style="text-align: center; color: #666; font-size: 1.1rem;">
                <p>Preview not available for this file type (.${fileExtension})</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">
                  <a href="${data.artworkUrl}" target="_blank" style="color: #0074d9; text-decoration: none; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px solid #dee2e6;">📁 Download File</a>
                </p>
              </div>`;
          }
        }
      } else {
        if (artworkPreview) {
          artworkPreview.innerHTML = '<div style="text-align: center; color: #e74c3c; font-size: 1.1rem;">No artwork found</div>';
        }
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
      if (artworkPreview) {
        artworkPreview.innerHTML = `
          <div style="text-align: center; color: #e74c3c; font-size: 1.1rem;">
            <p>Error loading artwork</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">Please refresh the page or contact support</p>
          </div>`;
      }
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
  
  // Show loading state
  const originalText = sendToClientBtn.textContent;
  sendToClientBtn.textContent = 'Sending...';
  sendToClientBtn.disabled = true;

  try {
    console.log('Uploading artwork...');
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Upload result:', result);
    
    if (result.success) {
      alert(`✅ Artwork sent successfully to ${email}!\n\nReview URL: ${result.reviewUrl}`);
      // Clear form
      clientEmailAdmin.value = '';
      artworkUpload.value = '';
      artworkPreview.innerHTML = '';
      if (customFileLabel) customFileLabel.textContent = 'Choose Artwork File';
    } else {
      alert('❌ Server Error: ' + (result.error || 'Unknown error occurred'));
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // More specific error messages
    let errorMessage = '❌ Upload Failed: ';
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Cannot connect to server. The server may be starting up (this can take 30-60 seconds on the first request). Please wait a moment and try again.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage += 'Network connection problem. Please check your internet connection and try again.';
    } else if (error.message.includes('Server error: 5')) {
      errorMessage += 'Server error occurred. Please try again in a few moments.';
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  } finally {
    // Reset button
    sendToClientBtn.textContent = originalText;
    sendToClientBtn.disabled = false;
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
  
  // Validation
  if (!email) {
    formMessage.textContent = 'Please enter your email address.';
    formMessage.style.color = '#e74c3c';
    clientEmail.focus();
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    formMessage.textContent = 'Please enter a valid email address.';
    formMessage.style.color = '#e74c3c';
    clientEmail.focus();
    return;
  }
  
  if (!approvalStatus) {
    formMessage.textContent = 'Please select either "Approve Artwork" or "Amend Artwork".';
    formMessage.style.color = '#e74c3c';
    return;
  }
  
  // Check for amend notes
  if (approvalStatus === 'amend' && !amendText.value.trim()) {
    formMessage.textContent = 'Please provide details about the changes you would like.';
    formMessage.style.color = '#e74c3c';
    amendText.focus();
    return;
  }
  
  // Get review ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const reviewId = urlParams.get('id');
  
  if (!reviewId) {
    formMessage.textContent = 'No review ID found. Please use the link sent to your email.';
    formMessage.style.color = '#e74c3c';
    return;
  }
  
  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending Response...';
  submitBtn.disabled = true;
  
  try {
    console.log('Submitting response:', { action: approvalStatus, email, reviewId });
    
    const response = await fetch(`/api/review/${reviewId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: approvalStatus,
        notes: amendText.value.trim(),
        clientEmail: email
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Response result:', result);
    
    if (result.success) {
      const statusIcon = approvalStatus === 'approved' ? '✅' : '🔄';
      const statusText = approvalStatus === 'approved' ? 'APPROVED' : 'AMENDMENT REQUESTED';
      
      formMessage.innerHTML = `
        <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; text-align: center;">
          <h4 style="margin: 0 0 10px 0;">${statusIcon} Response Submitted Successfully!</h4>
          <p style="margin: 0;">Your ${statusText} response has been sent to PBJA.<br>
          You should receive a confirmation shortly.</p>
        </div>
      `;
      
      // Disable form after successful submission
      approveBtn.disabled = true;
      amendBtn.disabled = true;
      amendText.disabled = true;
      clientEmail.disabled = true;
      submitBtn.style.display = 'none';
      
    } else {
      formMessage.textContent = '❌ Server Error: ' + (result.error || 'Unknown error occurred');
      formMessage.style.color = '#e74c3c';
    }
  } catch (error) {
    console.error('Submission error:', error);
    
    let errorMessage = '❌ Submission Failed: ';
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Cannot connect to server. Please check your internet connection and try again.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage += 'Network connection problem. Please try again.';
    } else {
      errorMessage += error.message;
    }
    
    formMessage.textContent = errorMessage;
    formMessage.style.color = '#e74c3c';
  } finally {
    // Reset button if still enabled
    if (!submitBtn.disabled) {
      submitBtn.textContent = originalText;
    }
    submitBtn.disabled = false;
  }
}); 