const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit - the pool will handle reconnection automatically
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
