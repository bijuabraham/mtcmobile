const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mail');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate verification token (secure random 32-byte hex string)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 24 hours
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_token_expires) 
       VALUES ($1, $2, FALSE, $3, $4) 
       RETURNING id, email, created_at, email_verified`,
      [email.toLowerCase(), passwordHash, verificationToken, tokenExpires]
    );

    const user = result.rows[0];

    // Get church name from configuration for personalized email
    let churchName = 'Church Management';
    try {
      const configResult = await db.query('SELECT church_name FROM church_configurations LIMIT 1');
      if (configResult.rows.length > 0 && configResult.rows[0].church_name) {
        churchName = configResult.rows[0].church_name;
      }
    } catch (err) {
      console.log('Could not fetch church name, using default');
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, churchName);
      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup if email fails, but log the error
    }

    // Don't return a token yet - user needs to verify email first
    res.status(201).json({
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: false
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>The verification link is invalid or missing. Please check your email and try again.</p>
          </div>
        </body>
        </html>
      `);
    }

    const result = await db.query(
      'SELECT id, email, email_verified, verification_token_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Token</h1>
            <p>This verification link is invalid. Please request a new verification email.</p>
          </div>
        </body>
        </html>
      `);
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Verified</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #27ae60; }
            p { color: #666; line-height: 1.6; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Already Verified</h1>
            <p>Your email address is already verified! You can log in to your account.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Check if token has expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Link Expired</h1>
            <p>This verification link has expired. Please request a new verification email from the app.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Mark email as verified
    await db.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
          h1 { color: #27ae60; }
          p { color: #666; line-height: 1.6; }
          .success-icon { font-size: 64px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Email Verified!</h1>
          <p>Your email address has been successfully verified.</p>
          <p>You can now log in to your account using the mobile app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
          h1 { color: #e74c3c; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>An error occurred while verifying your email. Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query(
      'SELECT id, email, password_hash, is_admin, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your email for the verification link.',
        emailNotVerified: true
      });
    }

    const token = generateToken(user.id, user.is_admin || false);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin || false,
        emailVerified: user.email_verified
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [newPasswordHash, req.userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Forgot Password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await db.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success even if email doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (result.rows.length === 0) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate reset token (secure random 32-byte hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Save reset token to database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, tokenExpires, user.id]
    );

    // Get church name from configuration for personalized email
    let churchName = 'Church Management';
    try {
      const configResult = await db.query('SELECT church_name FROM church_configurations LIMIT 1');
      if (configResult.rows.length > 0 && configResult.rows[0].church_name) {
        churchName = configResult.rows[0].church_name;
      }
    } catch (err) {
      console.log('Could not fetch church name, using default');
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, churchName);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, but log the error
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset Password - Handle password reset with token
router.get('/reset-password', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Password</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>The password reset link is invalid or missing.</p>
          </div>
        </body>
        </html>
      `);
    }

    const result = await db.query(
      'SELECT id, email, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Password</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Token</h1>
            <p>This password reset link is invalid or has already been used.</p>
          </div>
        </body>
        </html>
      `);
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Password</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Link Expired</h1>
            <p>This password reset link has expired. Please request a new password reset.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Show password reset form
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 500px; width: 100%; }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; line-height: 1.6; margin-bottom: 20px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; }
          input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
          button { width: 100%; background: #667eea; color: white; padding: 14px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
          button:hover { background: #5568d3; }
          button:disabled { background: #ccc; cursor: not-allowed; }
          .error { color: #e74c3c; margin-bottom: 15px; display: none; }
          .success { color: #27ae60; margin-bottom: 15px; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔒 Reset Your Password</h1>
          <p>Enter your new password below.</p>
          <div id="error" class="error"></div>
          <div id="success" class="success"></div>
          <form id="resetForm">
            <div class="form-group">
              <label for="password">New Password</label>
              <input type="password" id="password" name="password" required minlength="6" placeholder="At least 6 characters">
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Re-enter your password">
            </div>
            <button type="submit" id="submitBtn">Reset Password</button>
          </form>
        </div>
        <script>
          const form = document.getElementById('resetForm');
          const errorDiv = document.getElementById('error');
          const successDiv = document.getElementById('success');
          const submitBtn = document.getElementById('submitBtn');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            if (password !== confirmPassword) {
              errorDiv.textContent = 'Passwords do not match';
              errorDiv.style.display = 'block';
              return;
            }
            
            if (password.length < 6) {
              errorDiv.textContent = 'Password must be at least 6 characters';
              errorDiv.style.display = 'block';
              return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Resetting...';
            
            try {
              const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: '${token}', password })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                successDiv.textContent = data.message;
                successDiv.style.display = 'block';
                form.style.display = 'none';
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              } else {
                errorDiv.textContent = data.error || 'Failed to reset password';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
              }
            } catch (error) {
              errorDiv.textContent = 'An error occurred. Please try again.';
              errorDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Reset password GET error:', error);
    res.status(500).send('An error occurred');
  }
});

// Reset Password - POST endpoint to update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await db.query(
      'SELECT id, email, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = now() WHERE id = $2',
      [newPasswordHash, user.id]
    );

    console.log(`Password successfully reset for user: ${user.email}`);

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password POST error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
