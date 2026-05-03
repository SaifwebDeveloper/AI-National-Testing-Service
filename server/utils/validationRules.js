// Common validation patterns
const patterns = {
  email: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
  cnic: /^\d{13}$/,
  phone: /^\d{11}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  alphaNumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100|[1-9]?\d(\.\d{1,2})?)$/
};

// Validation rules for different data types
const validationRules = {
  // Required field
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  // Email validation
  email: (value, fieldName = 'Email') => {
    if (value && !patterns.email.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },
  
  // Password validation
  password: (value, fieldName = 'Password') => {
    if (value && !patterns.password.test(value)) {
      return `${fieldName} must be at least 6 characters with at least one letter and one number`;
    }
    return null;
  },
  
  // CNIC validation (Pakistan)
  cnic: (value, fieldName = 'CNIC') => {
    if (value && !patterns.cnic.test(value)) {
      return `${fieldName} must be 13 digits`;
    }
    return null;
  },
  
  // Phone validation (Pakistan)
  phone: (value, fieldName = 'Phone number') => {
    if (value && !patterns.phone.test(value)) {
      return `${fieldName} must be 11 digits`;
    }
    return null;
  },
  
  // Name validation
  name: (value, fieldName = 'Name') => {
    if (value && !patterns.name.test(value)) {
      return `${fieldName} must be 2-50 characters and contain only letters and spaces`;
    }
    return null;
  },
  
  // Min length validation
  minLength: (value, length, fieldName) => {
    if (value && value.length < length) {
      return `${fieldName} must be at least ${length} characters`;
    }
    return null;
  },
  
  // Max length validation
  maxLength: (value, length, fieldName) => {
    if (value && value.length > length) {
      return `${fieldName} must not exceed ${length} characters`;
    }
    return null;
  },
  
  // Min value validation
  minValue: (value, min, fieldName) => {
    if (value !== undefined && value !== null && Number(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },
  
  // Max value validation
  maxValue: (value, max, fieldName) => {
    if (value !== undefined && value !== null && Number(value) > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },
  
  // Date validation
  date: (value, fieldName = 'Date') => {
    if (value && isNaN(new Date(value).getTime())) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },
  
  // Future date validation
  futureDate: (value, fieldName = 'Date') => {
    if (value && new Date(value) <= new Date()) {
      return `${fieldName} must be in the future`;
    }
    return null;
  },
  
  // Past date validation
  pastDate: (value, fieldName = 'Date') => {
    if (value && new Date(value) >= new Date()) {
      return `${fieldName} must be in the past`;
    }
    return null;
  },
  
  // Date range validation
  dateRange: (startDate, endDate, startField = 'Start date', endField = 'End date') => {
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return `${endField} must be after ${startField}`;
    }
    return null;
  },
  
  // Numeric validation
  numeric: (value, fieldName = 'Value') => {
    if (value !== undefined && value !== null && !patterns.numeric.test(String(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },
  
  // Decimal validation
  decimal: (value, fieldName = 'Value') => {
    if (value !== undefined && value !== null && !patterns.decimal.test(String(value))) {
      return `${fieldName} must be a decimal number with up to 2 decimal places`;
    }
    return null;
  },
  
  // Percentage validation
  percentage: (value, fieldName = 'Percentage') => {
    if (value !== undefined && value !== null && !patterns.percentage.test(String(value))) {
      return `${fieldName} must be between 0 and 100`;
    }
    return null;
  },
  
  // MongoDB ID validation
  mongoId: (value, fieldName = 'ID') => {
    if (value && !patterns.mongoId.test(value)) {
      return `${fieldName} must be a valid MongoDB ID`;
    }
    return null;
  },
  
  // Alpha-numeric validation
  alphaNumeric: (value, fieldName = 'Value') => {
    if (value && !patterns.alphaNumeric.test(value)) {
      return `${fieldName} must contain only letters and numbers`;
    }
    return null;
  },
  
  // URL validation
  url: (value, fieldName = 'URL') => {
    if (value && !patterns.url.test(value)) {
      return `${fieldName} must be a valid URL`;
    }
    return null;
  },
  
  // Enum validation
  enum: (value, allowedValues, fieldName) => {
    if (value && !allowedValues.includes(value)) {
      return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },
  
  // Match validation (confirm password)
  match: (value, matchValue, fieldName, matchFieldName) => {
    if (value !== matchValue) {
      return `${fieldName} does not match ${matchFieldName}`;
    }
    return null;
  }
};

// Validate entire object with multiple rules
const validateObject = (data, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      let error = null;
      
      if (typeof rule === 'function') {
        error = rule(value, field);
      } else if (rule.rule) {
        const { rule: ruleName, params, message } = rule;
        error = validationRules[ruleName](value, ...(params || []), message || field);
      }
      
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Pre-defined validation schemas
const schemas = {
  // User registration schema
  userRegistration: {
    name: [
      { rule: 'required', params: [] },
      { rule: 'name', params: [] }
    ],
    email: [
      { rule: 'required', params: [] },
      { rule: 'email', params: [] }
    ],
    password: [
      { rule: 'required', params: [] },
      { rule: 'password', params: [] }
    ],
    cnic: [
      { rule: 'cnic', params: [] }
    ],
    phone: [
      { rule: 'phone', params: [] }
    ]
  },
  
  // User login schema
  userLogin: {
    email: [
      { rule: 'required', params: [] },
      { rule: 'email', params: [] }
    ],
    password: [
      { rule: 'required', params: [] }
    ]
  },
  
  // Test creation schema
  testCreation: {
    title: [
      { rule: 'required', params: [] },
      { rule: 'minLength', params: [3] },
      { rule: 'maxLength', params: [200] }
    ],
    totalMarks: [
      { rule: 'required', params: [] },
      { rule: 'minValue', params: [1] },
      { rule: 'maxValue', params: [1000] }
    ],
    passingMarks: [
      { rule: 'required', params: [] },
      { rule: 'minValue', params: [0] }
    ],
    duration: [
      { rule: 'required', params: [] },
      { rule: 'minValue', params: [1] },
      { rule: 'maxValue', params: [360] }
    ],
    startDate: [
      { rule: 'required', params: [] },
      { rule: 'date', params: [] },
      { rule: 'futureDate', params: [] }
    ],
    endDate: [
      { rule: 'required', params: [] },
      { rule: 'date', params: [] }
    ]
  },
  
  // Question creation schema
  questionCreation: {
    text: [
      { rule: 'required', params: [] },
      { rule: 'minLength', params: [5] },
      { rule: 'maxLength', params: [1000] }
    ],
    options: [
      { rule: 'required', params: [] },
      (value) => {
        if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
          return 'Options must be an array with 2-6 items';
        }
        return null;
      }
    ],
    correctAnswer: [
      { rule: 'required', params: [] },
      { rule: 'minValue', params: [0] }
    ],
    marks: [
      { rule: 'required', params: [] },
      { rule: 'minValue', params: [1] },
      { rule: 'maxValue', params: [100] }
    ]
  },
  
  // Application submission schema
  applicationSubmission: {
    cnic: [
      { rule: 'cnic', params: [] }
    ],
    education: [
      { rule: 'maxLength', params: [500] }
    ]
  },
  
  // Password change schema
  passwordChange: {
    currentPassword: [
      { rule: 'required', params: [] }
    ],
    newPassword: [
      { rule: 'required', params: [] },
      { rule: 'password', params: [] }
    ],
    confirmPassword: [
      { rule: 'required', params: [] },
      (value, field, data) => {
        if (value !== data.newPassword) {
          return 'Passwords do not match';
        }
        return null;
      }
    ]
  }
};

// Sanitize input (remove dangerous characters)
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
  return input;
};

// Sanitize entire object
const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

module.exports = {
  patterns,
  validationRules,
  validateObject,
  schemas,
  sanitizeInput,
  sanitizeObject
};