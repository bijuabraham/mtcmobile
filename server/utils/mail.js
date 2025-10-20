// Replit Mail integration for sending verification emails
// Based on blueprint:replitmail

function getAuthToken() {
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error(
      "No authentication token found. Running in non-Replit environment - email sending disabled."
    );
  }

  return xReplitToken;
}

async function sendEmail(message) {
  // Validate required fields
  if (!message.to) {
    throw new Error('Recipient email (to) is required');
  }
  if (!message.subject) {
    throw new Error('Email subject is required');
  }
  if (!message.text && !message.html) {
    throw new Error('Email must have either text or html content');
  }

  try {
    const authToken = getAuthToken();

    const response = await fetch(
      "https://connectors.replit.com/api/v2/mailer/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X_REPLIT_TOKEN": authToken,
        },
        body: JSON.stringify({
          to: message.to,
          cc: message.cc,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments: message.attachments,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw error;
  }
}

/**
 * Send verification email to new users
 */
async function sendVerificationEmail(userEmail, verificationToken, churchName = 'Church') {
  const verificationUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${churchName}!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for creating an account with ${churchName} Management System.</p>
          <p>To complete your registration and access your account, please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${churchName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to ${churchName}!

Thank you for creating an account with ${churchName} Management System.

To complete your registration and access your account, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

© ${new Date().getFullYear()} ${churchName}. All rights reserved.
  `.trim();

  return sendEmail({
    to: userEmail,
    subject: `Verify Your Email - ${churchName}`,
    html: htmlContent,
    text: textContent,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
};
