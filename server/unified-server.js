const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const householdRoutes = require('./routes/households');
const memberRoutes = require('./routes/members');
const donationRoutes = require('./routes/donations');
const announcementRoutes = require('./routes/announcements');
const contactRoutes = require('./routes/contacts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Serve admin panel static files with absolute path
const adminPath = path.join(__dirname, '..', 'admin');
app.use('/admin', express.static(adminPath, { 
  dotfiles: 'deny',
  index: false,
  extensions: ['html']
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Church Management API is running' });
});

// Serve API info page at root (production mode)
app.get('/', (req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Church Management API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    h1 { color: #333; margin-bottom: 10px; font-size: 32px; }
    .subtitle { color: #666; margin-bottom: 30px; font-size: 16px; }
    .status {
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .section { margin-bottom: 30px; }
    .section h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 20px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 8px;
    }
    .link-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #667eea;
    }
    .link-box h3 { color: #667eea; margin-bottom: 8px; font-size: 16px; }
    .link-box p { color: #666; font-size: 14px; margin-bottom: 8px; }
    .link-box a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      word-break: break-all;
    }
    .link-box a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏛️ Church Management API</h1>
    <p class="subtitle">Backend API & Admin Portal</p>
    <div class="status">✓ API Running</div>
    <div class="section">
      <h2>Admin Portal</h2>
      <div class="link-box">
        <h3>Configuration Dashboard</h3>
        <p>Manage church settings, colors, logo, and upload member data</p>
        <a href="/admin/login.html">Access Admin Portal →</a>
      </div>
    </div>
    <div class="section">
      <h2>API Endpoints</h2>
      <p style="color: #666; font-size: 14px;">
        Authentication • Configuration • Members • Households • Donations • Announcements • Contacts
      </p>
    </div>
  </div>
</body>
</html>
  `);
});

// In development, proxy other requests to Expo dev server on port 8081 (if available)
if (process.env.NODE_ENV !== 'production') {
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:8081',
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
    filter: (pathname, req) => {
      return !pathname.startsWith('/admin') && !pathname.startsWith('/api') && pathname !== '/';
    }
  }));
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Unified server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend proxied from port 8081`);
});

module.exports = app;
