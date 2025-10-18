const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const householdRoutes = require('./routes/households');
const memberRoutes = require('./routes/members');
const donationRoutes = require('./routes/donations');
const announcementRoutes = require('./routes/announcements');
const contactRoutes = require('./routes/contacts');

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/contacts', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Church Management API is running' });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Church Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      config: '/api/config',
      households: '/api/households',
      members: '/api/members',
      donations: '/api/donations',
      announcements: '/api/announcements',
      contacts: '/api/contacts'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Church Management API server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
