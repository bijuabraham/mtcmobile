const API_BASE = '/api';

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
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
    apiEndpoints: {
      iconcmo: document.getElementById('iconcmo').value,
      standardPayments: document.getElementById('standardPayments').value
    }
  };
  
  try {
    const response = await fetch(`${API_BASE}/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
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
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken')}`);
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
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/announcements/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    const token = localStorage.getItem('adminToken');
    
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login.html';
});

// Admin Management Functions
async function loadAdmins() {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/admin/users/admins`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

async function loadAllUsers() {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load users');
    
    const users = await response.json();
    const userSelect = document.getElementById('userSelect');
    
    const nonAdminUsers = users.filter(user => !user.isAdmin);
    
    userSelect.innerHTML = '<option value="">-- Select a user --</option>' +
      nonAdminUsers.map(user => 
        `<option value="${user.id}" data-email="${user.email}" data-household="${user.householdId || 'None'}">${user.email}</option>`
      ).join('');
    
  } catch (error) {
    console.error('Error loading users:', error);
    showNotification('Failed to load users', 'error');
  }
}

async function revokeAdmin(userId, email) {
  if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/admin/users/${userId}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isAdmin: false })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to revoke admin access');
    }
    
    showNotification(result.message || 'Admin access revoked successfully');
    loadAdmins();
    loadAllUsers();
  } catch (error) {
    console.error('Error revoking admin:', error);
    showNotification(error.message, 'error');
  }
}

// User select change handler
document.getElementById('userSelect').addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const infoDiv = document.getElementById('selectedUserInfo');
  
  if (selectedOption.value) {
    document.getElementById('selectedEmail').textContent = selectedOption.dataset.email;
    document.getElementById('selectedHousehold').textContent = selectedOption.dataset.household;
    infoDiv.style.display = 'block';
  } else {
    infoDiv.style.display = 'none';
  }
});

// Grant admin form
document.getElementById('grantAdminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userId = document.getElementById('userSelect').value;
  const email = document.getElementById('userSelect').options[document.getElementById('userSelect').selectedIndex].dataset.email;
  
  if (!userId) {
    showNotification('Please select a user', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/admin/users/${userId}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
    document.getElementById('selectedUserInfo').style.display = 'none';
    
    loadAdmins();
    loadAllUsers();
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
  loadAllUsers();
});

// Load config on page load
window.addEventListener('load', () => {
  // Check if logged in
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login.html';
    return;
  }
  
  loadConfig();
  loadAnnouncements();
  loadAdmins();
  loadAllUsers();
});
