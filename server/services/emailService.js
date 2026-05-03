const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email sending will be simulated.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true,
    maxConnections: 5,
    rateLimit: true
  });
};

// Send email with retry logic
const sendEmailWithRetry = async (transporter, mailOptions, retries = 3) => {
  // If no transporter (no credentials), simulate successful send
  if (!transporter) {
    console.log('Email simulation - would send:', mailOptions.subject);
    console.log('To:', mailOptions.to);
    return { success: true, simulated: true };
  }

  for (let i = 0; i < retries; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${mailOptions.to}`);
      return { success: true, info };
    } catch (error) {
      console.error(`Email send attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        return { success: false, error: error.message };
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"AINTS" <${process.env.EMAIL_USER || 'noreply@aints.com'}>`,
    to: userEmail,
    subject: 'Password Reset Request - AINTS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <!-- Header with AINTS Logo -->
            <div style="background: linear-gradient(135deg, #2563EB, #4F46E5); padding: 40px 30px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 60px; margin-bottom: 20px;">
                <div style="background: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span style="color: white; font-size: 24px; font-weight: bold;">AINTS</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">AI Integrated National Testing Service</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin-top: 0;">Hello ${userName},</h2>
              <p style="color: #4B5563; line-height: 1.6; font-size: 16px;">We received a request to reset your password for your AINTS account.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563EB, #4F46E5); color: white; padding: 14px 35px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Reset Password</a>
              </div>
              
              <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="color: #4B5563; margin: 0 0 8px 0; font-size: 14px;">Or copy and paste this link:</p>
                <p style="background: white; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #4F46E5; margin: 0; font-family: monospace;">
                  ${resetUrl}
                </p>
              </div>
              
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  ⏰ This link will expire in <strong>1 hour</strong>
                </p>
              </div>
              
              <p style="color: #6B7280; line-height: 1.6; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
              
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                🔒 This is a secure email from AINTS • AI Integrated National Testing Service
              </p>
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 10px;">
                © 2026 AINTS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AINTS - Password Reset Request
      
      Hello ${userName},
      
      We received a request to reset your password for your AINTS account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      For security, this link can only be used once.
      
      © 2026 AINTS - AI Integrated National Testing Service. All rights reserved.
    `
  };
  
  return await sendEmailWithRetry(transporter, mailOptions);
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName, role = 'student') => {
  const transporter = createTransporter();
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
  const dashboardUrl = role === 'admin' 
    ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/dashboard`
    : `${process.env.CLIENT_URL || 'http://localhost:5173'}/student/dashboard`;
  
  const mailOptions = {
    from: `"AINTS" <${process.env.EMAIL_USER || 'noreply@aints.com'}>`,
    to: userEmail,
    subject: `Welcome to AINTS - AI Integrated National Testing Service`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563EB, #4F46E5); padding: 40px 30px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 60px; margin-bottom: 20px;">
                <div style="background: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span style="color: white; font-size: 24px; font-weight: bold;">AINTS</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AINTS!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">AI Integrated National Testing Service</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin-top: 0;">Hello ${userName},</h2>
              <p style="color: #4B5563; line-height: 1.6; font-size: 16px;">Thank you for registering with AINTS! We're excited to have you on board.</p>
              
              <div style="background: linear-gradient(135deg, #EFF6FF, #F0F9FF); padding: 25px; border-radius: 16px; margin: 25px 0;">
                <h3 style="color: #1F2937; margin-top: 0; font-size: 18px;">✨ Getting Started</h3>
                <ul style="color: #4B5563; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li>Complete your profile information</li>
                  <li>Browse available AI-powered tests</li>
                  <li>Apply for tests and get instant approval</li>
                  <li>Take proctored exams with AI monitoring</li>
                  <li>Track your progress and performance</li>
                  <li>Download certificates on completion</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #2563EB, #4F46E5); color: white; padding: 14px 35px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Go to Dashboard</a>
              </div>
              
              <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="color: #1F2937; margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">🔐 Account Details</p>
                <p style="color: #4B5563; margin: 5px 0; font-size: 13px;">Email: ${userEmail}</p>
                <p style="color: #4B5563; margin: 5px 0; font-size: 13px;">Role: ${role === 'admin' ? 'Administrator' : 'Student'}</p>
              </div>
              
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  💡 <strong>Pro Tip:</strong> All tests are AI-proctored with advanced anti-cheating measures including webcam monitoring and tab switching detection.
                </p>
              </div>
              
              <p style="color: #6B7280; line-height: 1.6; font-size: 14px;">
                Need help? Contact our support team at <a href="mailto:support@aints.com" style="color: #2563EB;">support@aints.com</a>
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
              
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                🧠 AINTS - AI Integrated National Testing Service
              </p>
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 10px;">
                Revolutionizing examinations with AI-powered technology
              </p>
              <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin-top: 10px;">
                © 2026 AINTS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to AINTS - AI Integrated National Testing Service!
      
      Hello ${userName},
      
      Thank you for registering with AINTS! We're excited to have you on board.
      
      Getting Started:
      - Complete your profile information
      - Browse available AI-powered tests
      - Apply for tests and get instant approval
      - Take proctored exams with AI monitoring
      - Track your progress and performance
      - Download certificates on completion
      
      Login to your dashboard:
      ${dashboardUrl}
      
      Account Details:
      Email: ${userEmail}
      Role: ${role === 'admin' ? 'Administrator' : 'Student'}
      
      Pro Tip: All tests are AI-proctored with advanced anti-cheating measures.
      
      Need help? Contact us at support@aints.com
      
      © 2026 AINTS - AI Integrated National Testing Service. All rights reserved.
    `
  };
  
  return await sendEmailWithRetry(transporter, mailOptions);
};

// Send test result email
const sendTestResultEmail = async (userEmail, userName, testTitle, score, percentage, grade, resultId) => {
  const transporter = createTransporter();
  const resultUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/student/result/${resultId}`;
  const isPassed = percentage >= 50;
  
  const mailOptions = {
    from: `"AINTS" <${process.env.EMAIL_USER || 'noreply@aints.com'}>`,
    to: userEmail,
    subject: `Your AINTS Test Result: ${testTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="background: ${isPassed ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'}; padding: 40px 30px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 60px; margin-bottom: 20px;">
                <div style="background: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span style="color: white; font-size: 20px; font-weight: bold;">AINTS</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px;">Test Result</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">${testTitle}</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin-top: 0;">Hello ${userName},</h2>
              
              <div style="text-align: center; margin: 25px 0; padding: 20px; background: ${isPassed ? '#ECFDF5' : '#FEF2F2'}; border-radius: 16px;">
                <div style="font-size: 48px; font-weight: bold; color: ${isPassed ? '#10B981' : '#EF4444'};">
                  ${percentage}%
                </div>
                <p style="color: ${isPassed ? '#065F46' : '#991B1B'}; margin-top: 10px; font-size: 18px; font-weight: bold;">
                  ${isPassed ? '🎉 PASSED!' : '📝 NEED IMPROVEMENT'}
                </p>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
                <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; text-align: center;">
                  <p style="color: #6B7280; margin: 0; font-size: 12px;">Score</p>
                  <p style="color: #1F2937; margin: 5px 0 0; font-size: 24px; font-weight: bold;">${score}</p>
                </div>
                <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; text-align: center;">
                  <p style="color: #6B7280; margin: 0; font-size: 12px;">Grade</p>
                  <p style="color: #1F2937; margin: 5px 0 0; font-size: 24px; font-weight: bold;">${grade}</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resultUrl}" style="background: linear-gradient(135deg, #2563EB, #4F46E5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold;">View Detailed Report</a>
              </div>
              
              ${isPassed ? `
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  🎓 <strong>Certificate Available!</strong> You can download your achievement certificate from the results page.
                </p>
              </div>
              ` : `
              <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="color: #4B5563; margin: 0; font-size: 14px;">
                  💪 Keep practicing! Review your answers and try again to improve your score.
                </p>
              </div>
              `}
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
              
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                © 2026 AINTS - AI Integrated National Testing Service
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AINTS Test Result: ${testTitle}
      
      Hello ${userName},
      
      Your test result is ready!
      
      Score: ${score}
      Percentage: ${percentage}%
      Grade: ${grade}
      Status: ${isPassed ? 'PASSED' : 'FAILED'}
      
      View detailed results: ${resultUrl}
      
      ${isPassed ? 'Certificate available for download from the results page.' : 'Keep practicing to improve your score!'}
      
      © 2026 AINTS - AI Integrated National Testing Service
    `
  };
  
  return await sendEmailWithRetry(transporter, mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTestResultEmail
};