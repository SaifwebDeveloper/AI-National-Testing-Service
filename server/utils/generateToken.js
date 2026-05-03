const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, type: 'refresh' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Generate email verification token
const generateEmailVerificationToken = (id, email) => {
  return jwt.sign(
    { id, email, type: 'email-verification' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// Generate password reset token
const generatePasswordResetToken = (id, email) => {
  return jwt.sign(
    { id, email, type: 'password-reset' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
};

// Verify token and decode
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { 
      valid: false, 
      error: error.name === 'TokenExpiredError' ? 'expired' : 'invalid' 
    };
  }
};

// Decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

// Generate random string for temporary tokens
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique ID (for certificates, etc.)
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${random}`.toUpperCase();
  return prefix ? `${prefix}-${id}` : id;
};

// Generate OTP (for two-factor authentication)
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate test access code
const generateAccessCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // Removed similar looking chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    else code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate certificate number
const generateCertificateNumber = (testId, studentId, date) => {
  const testShort = testId.toString().slice(-6).toUpperCase();
  const studentShort = studentId.toString().slice(-6).toUpperCase();
  const dateStr = new Date(date).getFullYear().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-${dateStr}-${testShort}-${studentShort}-${random}`;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  generateRandomString,
  generateUniqueId,
  generateOTP,
  generateAccessCode,
  generateCertificateNumber
};