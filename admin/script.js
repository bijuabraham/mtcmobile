const API_BASE = '/api';

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/admin/auth/check`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      window.location.href = '/admin/login.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/admin/login.html';
    return false;
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Auto-load data when switching to specific tabs
    if (tabName === 'contact') {
      loadContactConfig();
    } else if (tabName === 'approvals') {
      loadPendingUsers();
      loadAllUsers();
    } else if (tabName === 'announcements') {
      loadAnnouncements();
    } else if (tabName === 'admins') {
      loadAdmins();
    }
  });
});

// Notification helper
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  setTimeout(() => {
    notification.className = 'notification';
  }, 4000);
}

// Load current configuration
async function loadConfig() {
  try {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error('Failed to load configuration');
    
    const config = await response.json();
    
    document.getElementById('churchName').value = config.churchName || '';
    document.getElementById('primaryColor').value = config.primaryColor || '#C41E3A';
    document.getElementById('secondaryColor').value = config.secondaryColor || '#FFD700';
    document.getElementById('accentColor').value = config.accentColor || '#FFFFFF';
    document.getElementById('logoUrl').value = config.logoUrl || '';
    document.getElementById('calendarId').value = config.calendarId || '';
    document.getElementById('timezone').value = config.timezone || 'America/New_York';
    
    if (config.apiEndpoints) {
      document.getElementById('iconcmo').value = config.apiEndpoints.iconcmo || '';
      document.getElementById('standardPayments').value = config.apiEndpoints.standardPayments || '';
    }
    
    updatePreview();
    showNotification('Configuration loaded successfully');
  } catch (error) {
    console.error('Error loading config:', error);
    showNotification('Failed to load configuration', 'error');
  }
}

// Update preview
function updatePreview() {
  const primaryColor = document.getElementById('primaryColor').value;
  const churchName = document.getElementById('churchName').value;
  const logoUrl = document.getElementById('logoUrl').value;
  
  const previewHeader = document.getElementById('previewHeader');
  const previewLogo = document.getElementById('previewLogo');
  const previewChurchName = document.getElementById('previewChurchName');
  
  previewHeader.style.backgroundColor = primaryColor;
  previewChurchName.textContent = churchName || 'Church Management';
  
  if (logoUrl) {
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'Logo';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: contain; border-radius: 50%;';
    previewLogo.innerHTML = '';
    previewLogo.appendChild(img);
  } else {
    previewLogo.textContent = 'Church';
  }
}

// Save configuration
document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    churchName: document.getElementById('churchName').value,
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value,
    accentColor: document.getElementById('accentColor').value,
    logoUrl: document.getElementById('logoUrl').value,
    calendarId: document.getElementById('calendarId').value,
    timezone: document.getElementById('timezone').value,
    apiEndpoints: {
      iconcmo: document.getElementById('iconcmo').value,
      standardPayments: document.getElementById('standardPayments').value
    }
  };
  
  try {
    const response = await fetch(`${API_BASE}/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save configuration');
    }
    
    showNotification('Configuration saved successfully!');
  } catch (error) {
    console.error('Error saving config:', error);
    showNotification(error.message, 'error');
  }
});

// Load Contact Us configuration
async function loadContactConfig() {
  try {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error('Failed to load configuration');
    
    const config = await response.json();
    
    // Load vicar info
    document.getElementById('vicarName').value = config.vicarName || '';
    document.getElementById('vicarPhotoUrl').value = config.vicarPhotoUrl || '';
    document.getElementById('vicarPhone').value = config.vicarPhone || '';
    document.getElementById('vicarEmail').value = config.vicarEmail || '';
    
    // Load church address
    document.getElementById('churchAddress').value = config.churchAddress || '';
    
    // Load executive board
    if (config.executiveBoard && Array.isArray(config.executiveBoard)) {
      config.executiveBoard.forEach(member => {
        const inputs = document.querySelectorAll(`[data-position="${member.position}"]`);
        inputs.forEach(input => {
          const field = input.dataset.field;
          if (field && member[field]) {
            input.value = member[field];
          }
        });
      });
    }
    
    showNotification('Contact configuration loaded successfully');
  } catch (error) {
    console.error('Error loading contact config:', error);
    showNotification('Failed to load contact configuration', 'error');
  }
}

// Save Contact Us configuration
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Collect executive board data
  const positions = [
    'Vice President',
    'Secretary',
    'Treasurer - Cash',
    'Treasurer - Accounts',
    'Lay Leader (Malayalam)',
    'Lay Leader (English)',
    'Mandalam Member',
    'Assembly Members'
  ];
  
  const executiveBoard = positions.map(position => {
    const nameInput = document.querySelector(`[data-position="${position}"][data-field="name"]`);
    const phoneInput = document.querySelector(`[data-position="${position}"][data-field="phone"]`);
    const emailInput = document.querySelector(`[data-position="${position}"][data-field="email"]`);
    
    const member = {
      position: position,
      name: nameInput ? nameInput.value.trim() : ''
    };
    
    if (phoneInput && phoneInput.value.trim()) {
      member.phone = phoneInput.value.trim();
    }
    
    if (emailInput && emailInput.value.trim()) {
      member.email = emailInput.value.trim();
    }
    
    return member;
  }).filter(member => member.name);  // Only include members with names
  
  const formData = {
    vicarName: document.getElementById('vicarName').value.trim(),
    vicarPhotoUrl: document.getElementById('vicarPhotoUrl').value.trim(),
    vicarPhone: document.getElementById('vicarPhone').value.trim(),
    vicarEmail: document.getElementById('vicarEmail').value.trim(),
    churchAddress: document.getElementById('churchAddress').value.trim(),
    executiveBoard: executiveBoard
  };
  
  try {
    // First load current config
    const currentResponse = await fetch(`${API_BASE}/config`);
    if (!currentResponse.ok) throw new Error('Failed to load current configuration');
    const currentConfig = await currentResponse.json();
    
    // Merge with contact data
    const mergedData = {
      churchName: currentConfig.churchName,
      primaryColor: currentConfig.primaryColor,
      secondaryColor: currentConfig.secondaryColor,
      accentColor: currentConfig.accentColor,
      logoUrl: currentConfig.logoUrl,
      calendarId: currentConfig.calendarId,
      timezone: currentConfig.timezone,
      apiEndpoints: currentConfig.apiEndpoints,
      ...formData
    };
    
    const response = await fetch(`${API_BASE}/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(mergedData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save contact configuration');
    }
    
    showNotification('Contact configuration saved successfully!');
  } catch (error) {
    console.error('Error saving contact config:', error);
    showNotification(error.message, 'error');
  }
});

// Load Contact button
document.getElementById('loadContactBtn').addEventListener('click', loadContactConfig);

// Helper function to upload with progress tracking
function uploadWithProgress(url, file, progressContainerId, progressFillId, progressTextId, uploadBtnId) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    const progressContainer = document.getElementById(progressContainerId);
    const progressFill = document.getElementById(progressFillId);
    const progressText = document.getElementById(progressTextId);
    const uploadBtn = document.getElementById(uploadBtnId);
    
    // Show progress bar and disable button
    progressContainer.style.display = 'block';
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = '0.6';
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = percentComplete + '%';
        progressFill.textContent = `${percentComplete}%`;
        progressText.textContent = `Uploading file... ${percentComplete}%`;
      }
    });
    
    xhr.addEventListener('load', () => {
      // Upload complete, now processing on server
      progressFill.style.width = '100%';
      progressFill.textContent = '100%';
      progressText.textContent = 'Processing data and updating database... This may take a minute for large files.';
      progressText.style.color = '#764ba2';
      progressText.style.fontWeight = '600';
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);
        progressContainer.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        progressFill.style.width = '0%';
        progressFill.textContent = '';
        progressText.textContent = '';
        progressText.style.color = '#667eea';
        progressText.style.fontWeight = '500';
        resolve(result);
      } else {
        const error = JSON.parse(xhr.responseText);
        progressContainer.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        progressFill.style.width = '0%';
        progressFill.textContent = '';
        progressText.textContent = '';
        progressText.style.color = '#667eea';
        progressText.style.fontWeight = '500';
        reject(new Error(error.error || 'Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => {
      progressContainer.style.display = 'none';
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = '1';
      progressFill.style.width = '0%';
      reject(new Error('Network error'));
    });
    
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

// Upload members
document.getElementById('membersUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('membersFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Please select a file', 'error');
    return;
  }
  
  try {
    const result = await uploadWithProgress(
      `${API_BASE}/admin/upload/members`,
      file,
      'membersProgress',
      'membersProgressFill',
      'membersProgressText',
      'membersUploadBtn'
    );
    
    const resultBox = document.getElementById('membersResult');
    resultBox.className = 'result-box success';
    resultBox.innerHTML = `
      <strong>Upload Successful!</strong><br>
      Format: ${result.format || 'Standard'}<br>
      ${result.inserted} members inserted<br>
      ${result.errors ? result.errors + ' errors<br>' : ''}
      Total processed: ${result.total}
    `;
    
    showNotification('Members uploaded successfully!');
    fileInput.value = '';
  } catch (error) {
    console.error('Error uploading members:', error);
    const resultBox = document.getElementById('membersResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Upload households
document.getElementById('householdsUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('householdsFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Please select a file', 'error');
    return;
  }
  
  try {
    const result = await uploadWithProgress(
      `${API_BASE}/admin/upload/households`,
      file,
      'householdsProgress',
      'householdsProgressFill',
      'householdsProgressText',
      'householdsUploadBtn'
    );
    
    const resultBox = document.getElementById('householdsResult');
    resultBox.className = 'result-box success';
    resultBox.innerHTML = `
      <strong>Upload Successful!</strong><br>
      Format: ${result.format || 'Standard'}<br>
      ${result.inserted} households inserted<br>
      Total processed: ${result.total}
    `;
    
    showNotification('Households uploaded successfully!');
    fileInput.value = '';
  } catch (error) {
    console.error('Error uploading households:', error);
    const resultBox = document.getElementById('householdsResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Live preview updates
['churchName', 'primaryColor', 'secondaryColor', 'logoUrl'].forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('input', updatePreview);
  }
});

// Load config button
document.getElementById('loadConfigBtn').addEventListener('click', loadConfig);

// Announcements Management
async function loadAnnouncements() {
  try {
    const response = await fetch(`${API_BASE}/announcements/admin/all`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to load announcements');
    
    const announcements = await response.json();
    
    // Fill in announcement 1
    if (announcements[0]) {
      document.getElementById('announcement1Id').value = announcements[0].id || '';
      document.getElementById('announcement1Content').value = announcements[0].content || '';
      document.getElementById('announcement1StartDate').value = formatDateForInput(announcements[0].startDate);
      document.getElementById('announcement1EndDate').value = formatDateForInput(announcements[0].endDate);
    }
    
    // Fill in announcement 2
    if (announcements[1]) {
      document.getElementById('announcement2Id').value = announcements[1].id || '';
      document.getElementById('announcement2Content').value = announcements[1].content || '';
      document.getElementById('announcement2StartDate').value = formatDateForInput(announcements[1].startDate);
      document.getElementById('announcement2EndDate').value = formatDateForInput(announcements[1].endDate);
    }
    
    showNotification('Announcements loaded successfully');
  } catch (error) {
    console.error('Error loading announcements:', error);
    showNotification('Failed to load announcements', 'error');
  }
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

// Save announcements
document.getElementById('announcementsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const announcements = [
      {
        id: document.getElementById('announcement1Id').value || null,
        content: document.getElementById('announcement1Content').value,
        startDate: document.getElementById('announcement1StartDate').value,
        endDate: document.getElementById('announcement1EndDate').value
      },
      {
        id: document.getElementById('announcement2Id').value || null,
        content: document.getElementById('announcement2Content').value,
        startDate: document.getElementById('announcement2StartDate').value,
        endDate: document.getElementById('announcement2EndDate').value
      }
    ];
    
    const response = await fetch(`${API_BASE}/announcements/admin/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ announcements })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save announcements');
    }
    
    const result = await response.json();
    
    // Update IDs for newly created announcements
    if (result.announcements[0]) {
      document.getElementById('announcement1Id').value = result.announcements[0].id;
    }
    if (result.announcements[1]) {
      document.getElementById('announcement2Id').value = result.announcements[1].id;
    }
    
    const resultBox = document.getElementById('announcementsResult');
    resultBox.className = 'result-box success';
    resultBox.textContent = 'Announcements saved successfully!';
    
    showNotification('Announcements saved successfully!');
  } catch (error) {
    console.error('Error saving announcements:', error);
    const resultBox = document.getElementById('announcementsResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Load announcements button
document.getElementById('loadAnnouncementsBtn').addEventListener('click', loadAnnouncements);

// Upload donations
document.getElementById('donationsUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('donationsFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Please select a file', 'error');
    return;
  }
  
  try {
    const result = await uploadWithProgress(
      `${API_BASE}/admin/upload/donations`,
      file,
      'donationsProgress',
      'donationsProgressFill',
      'donationsProgressText',
      'donationsUploadBtn'
    );
    
    const resultBox = document.getElementById('donationsResult');
    resultBox.className = 'result-box success';
    resultBox.innerHTML = `
      <strong>Upload Successful!</strong><br>
      Format: ${result.format || 'Standard'}<br>
      ${result.inserted} donations inserted<br>
      ${result.skipped} rows skipped<br>
      Total processed: ${result.total}
    `;
    
    showNotification('Donations uploaded successfully!');
    fileInput.value = '';
  } catch (error) {
    console.error('Error uploading donations:', error);
    const resultBox = document.getElementById('donationsResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Upload prayer groups
document.getElementById('prayerGroupsUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('prayerGroupsFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Please select a file', 'error');
    return;
  }
  
  try {
    const result = await uploadWithProgress(
      `${API_BASE}/admin/upload/prayer-groups`,
      file,
      'prayerGroupsProgress',
      'prayerGroupsProgressFill',
      'prayerGroupsProgressText',
      'prayerGroupsUploadBtn'
    );
    
    const resultBox = document.getElementById('prayerGroupsResult');
    resultBox.className = 'result-box success';
    resultBox.innerHTML = `
      <strong>Upload Successful!</strong><br>
      ${result.updated} households updated with prayer group assignments<br>
      ${result.notFound > 0 ? result.notFound + ' households not found<br>' : ''}
      ${result.errors > 0 ? result.errors + ' errors<br>' : ''}
      Total processed: ${result.total}
    `;
    
    showNotification('Prayer groups uploaded successfully!');
    fileInput.value = '';
  } catch (error) {
    console.error('Error uploading prayer groups:', error);
    const resultBox = document.getElementById('prayerGroupsResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  window.location.href = '/admin/login.html';
});

// Admin Management Functions
async function loadAdmins() {
  try {
    const response = await fetch(`${API_BASE}/admin/users/admins`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to load admins');
    
    const admins = await response.json();
    const adminsList = document.getElementById('adminsList');
    
    if (admins.length === 0) {
      adminsList.innerHTML = '<p style="color: #999; text-align: center;">No administrators found.</p>';
      return;
    }
    
    adminsList.innerHTML = admins.map(admin => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
        <div>
          <div style="font-weight: 600; color: #333;">${admin.email}</div>
          <div style="font-size: 13px; color: #666; margin-top: 4px;">
            Household: ${admin.householdId || 'Not linked'} | 
            Added: ${new Date(admin.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button 
          class="btn-danger" 
          onclick="revokeAdmin('${admin.id}', '${admin.email}')"
          style="padding: 6px 14px; font-size: 13px;"
        >
          Revoke Access
        </button>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading admins:', error);
    document.getElementById('adminsList').innerHTML = 
      '<p style="color: #c62828; text-align: center;">Failed to load administrators</p>';
  }
}


async function revokeAdmin(userId, email) {
  if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ isAdmin: false })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to revoke admin access');
    }
    
    showNotification(result.message || 'Admin access revoked successfully');
    loadAdmins();
  } catch (error) {
    console.error('Error revoking admin:', error);
    showNotification(error.message, 'error');
  }
}

// Grant admin form
document.getElementById('grantAdminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('userEmail').value.trim();
  
  if (!email) {
    showNotification('Please enter an email address', 'error');
    return;
  }
  
  try {
    const usersResponse = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });
    
    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await usersResponse.json();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found. Please check the email address.');
    }
    
    if (user.isAdmin) {
      throw new Error('This user is already an administrator.');
    }
    
    const response = await fetch(`${API_BASE}/admin/users/${user.id}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ isAdmin: true })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to grant admin access');
    }
    
    const resultBox = document.getElementById('grantAdminResult');
    resultBox.className = 'result-box success';
    resultBox.textContent = `Admin access granted to ${email}`;
    
    showNotification(result.message || 'Admin access granted successfully');
    
    document.getElementById('grantAdminForm').reset();
    
    loadAdmins();
  } catch (error) {
    console.error('Error granting admin:', error);
    const resultBox = document.getElementById('grantAdminResult');
    resultBox.className = 'result-box error';
    resultBox.textContent = error.message;
    showNotification(error.message, 'error');
  }
});

// Refresh admins button
document.getElementById('refreshAdminsBtn').addEventListener('click', () => {
  loadAdmins();
});

// User Approvals Functions
async function loadPendingUsers() {
  const container = document.getElementById('pendingUsersContainer');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/pending`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load pending users');
    }
    
    const users = await response.json();
    
    if (users.length === 0) {
      container.innerHTML = `
        <div class="info-box" style="text-align: center; padding: 30px;">
          <p style="color: #666; font-size: 16px;">No pending user approvals</p>
          <p style="color: #888; font-size: 14px;">Users who register will appear here for approval</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="pending-users-list">
        <h3 style="color: #f59e0b; margin-bottom: 15px;">Pending Approvals (${users.length})</h3>
        ${users.map(user => `
          <div class="user-card pending" data-user-id="${user.id}">
            <div class="user-info">
              <div class="user-name">${user.firstName || ''} ${user.lastName || ''}</div>
              <div class="user-email">${user.email}</div>
              <div class="user-meta">
                <span class="donor-number">Donor #: ${user.donorNumber || 'N/A'}</span>
                <span class="registered-date">Registered: ${new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="user-actions">
              <button class="btn-approve" onclick="approveUser(${user.id})">Approve</button>
              <button class="btn-reject" onclick="rejectUser(${user.id})">Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading pending users:', error);
    container.innerHTML = `
      <div class="result-box error">
        <p>Error loading pending users: ${error.message}</p>
        <button class="btn-secondary" onclick="loadPendingUsers()">Retry</button>
      </div>
    `;
  }
}

async function loadAllUsers() {
  const container = document.getElementById('allUsersContainer');
  
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load users');
    }
    
    const users = await response.json();
    
    if (users.length === 0) {
      container.innerHTML = '<p style="color: #666;">No registered users</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Donor #</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="${user.isSuspended ? 'suspended' : (user.isApproved ? 'approved' : (user.profileComplete ? 'pending' : 'incomplete'))}">
                <td>${user.firstName || ''} ${user.lastName || ''}</td>
                <td>${user.email}</td>
                <td>${user.donorNumber || '-'}</td>
                <td>
                  <span class="status-badge ${user.isSuspended ? 'status-suspended' : (user.isApproved ? 'status-approved' : (user.profileComplete ? 'status-pending' : 'status-incomplete'))}">
                    ${user.isSuspended ? 'Suspended' : (user.isApproved ? 'Active' : (user.profileComplete ? 'Pending' : 'Incomplete'))}
                  </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td class="action-buttons">
                  ${!user.isApproved && user.profileComplete && !user.isSuspended ? `
                    <button class="btn-approve-small" onclick="approveUser('${user.id}')">Approve</button>
                  ` : ''}
                  ${user.isApproved && !user.isSuspended && !user.isAdmin ? `
                    <button class="btn-suspend" onclick="suspendUser('${user.id}', '${user.email}')">Suspend</button>
                  ` : ''}
                  ${user.isSuspended ? `
                    <button class="btn-restore" onclick="unsuspendUser('${user.id}', '${user.email}')">Restore</button>
                  ` : ''}
                  ${!user.isAdmin ? `
                    <button class="btn-delete" onclick="deleteUser('${user.id}', '${user.email}')">Delete</button>
                  ` : '<span style="color: #6b7280; font-size: 12px;">Admin</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = `
      <div class="result-box error">
        <p>Error loading users: ${error.message}</p>
        <button class="btn-secondary" onclick="loadAllUsers()">Retry</button>
      </div>
    `;
  }
}

async function approveUser(userId) {
  if (!confirm('Are you sure you want to approve this user?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to approve user');
    }
    
    showNotification(result.message || 'User approved successfully');
    loadPendingUsers();
    loadAllUsers();
  } catch (error) {
    console.error('Error approving user:', error);
    showNotification(error.message, 'error');
  }
}

async function rejectUser(userId) {
  if (!confirm('Are you sure you want to reject this user? This will permanently delete their registration.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to reject user');
    }
    
    showNotification(result.message || 'User rejected successfully');
    loadPendingUsers();
    loadAllUsers();
  } catch (error) {
    console.error('Error rejecting user:', error);
    showNotification(error.message, 'error');
  }
}

async function suspendUser(userId, email) {
  if (!confirm(`Are you sure you want to suspend ${email}? They will not be able to access the app until you restore their access.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to suspend user');
    }
    
    showNotification(result.message || 'User suspended successfully');
    loadAllUsers();
  } catch (error) {
    console.error('Error suspending user:', error);
    showNotification(error.message, 'error');
  }
}

async function unsuspendUser(userId, email) {
  if (!confirm(`Are you sure you want to restore access for ${email}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/unsuspend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to restore user access');
    }
    
    showNotification(result.message || 'User access restored successfully');
    loadAllUsers();
  } catch (error) {
    console.error('Error restoring user:', error);
    showNotification(error.message, 'error');
  }
}

async function deleteUser(userId, email) {
  if (!confirm(`Are you sure you want to permanently delete ${email}? This action cannot be undone.`)) {
    return;
  }
  
  if (!confirm(`FINAL WARNING: This will permanently delete all data for ${email}. Are you absolutely sure?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete user');
    }
    
    showNotification(result.message || 'User deleted successfully');
    loadPendingUsers();
    loadAllUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification(error.message, 'error');
  }
}

// Load config on page load
window.addEventListener('load', async () => {
  // Check if logged in with session
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return;
  }
  
  loadConfig();
  loadAnnouncements();
  loadAdmins();
  loadPendingUsers();
  loadAllUsers();
});
