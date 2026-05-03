// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB duplicate key error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  const message = `Duplicate value for ${field}. Please use another value.`;
  return new AppError(message, 400);
};

// Handle MongoDB validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

// Handle CastError (invalid MongoDB ID)
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // Handle specific errors
  let error = { ...err };
  error.message = err.message;
  
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'CastError') error = handleCastError(err);
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 404 handler for routes not found
const notFound = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server!`, 404);
  next(error);
};

// Async handler wrapper to avoid try-catch blocks
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Request logger for debugging (optional)
const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Sanitize request body (remove dangerous characters)
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove HTML tags and dangerous characters
          obj[key] = obj[key]
            .replace(/<[^>]*>/g, '')
            .replace(/[&<>]/g, '')
            .trim();
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
};

// Rate limiting by IP (basic implementation)
const rateLimit = new Map();
const rateLimiter = (windowMs = 60 * 1000, max = 100) => {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimit.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= max) {
      return res.status(429).json({
        message: 'Too many requests, please try again later.'
      });
    }
    
    record.count++;
    next();
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  requestLogger,
  performanceMonitor,
  sanitizeBody,
  rateLimiter
};