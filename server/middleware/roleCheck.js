// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// Check if user is student
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Student privileges required.' 
    });
  }
};

// Check if user has specific role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
  };
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.role === 'admin' || req.user.id === resourceUserId) {
        next();
      } else {
        res.status(403).json({ 
          message: 'Access denied. You do not own this resource.' 
        });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// Check if user can access test (student who applied or admin)
const canAccessTest = async (req, res, next) => {
  try {
    const testId = req.params.id || req.params.testId;
    const Test = require('../models/Test');
    const StudentApplication = require('../models/StudentApplication');
    
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Admin can access any test
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Student can only access if approved
    const application = await StudentApplication.findOne({
      testId,
      studentId: req.user.id,
      status: 'approved'
    });
    
    if (application) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Access denied. You are not authorized to take this test.' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if user can view result (owner or admin)
const canViewResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const Result = require('../models/Result');
    
    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    if (req.user.role === 'admin' || result.studentId.toString() === req.user.id) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Access denied. You cannot view this result.' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate limiting for role-based access (optional)
const rateLimitByRole = {
  admin: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
  student: { windowMs: 60 * 1000, max: 30 }  // 30 requests per minute
};

module.exports = {
  isAdmin,
  isStudent,
  hasRole,
  isOwnerOrAdmin,
  canAccessTest,
  canViewResult,
  rateLimitByRole
};