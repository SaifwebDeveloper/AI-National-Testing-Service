/**
 * Validate email address
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  // At least 6 characters, contains letters and numbers
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate CNIC (Pakistan)
 */
export const isValidCNIC = (cnic) => {
  // Remove any existing dashes or spaces
  const cleanCNIC = cnic.replace(/[-\s]/g, '');
  const cnicRegex = /^[0-9]{13}$/;
  return cnicRegex.test(cleanCNIC);
};

/**
 * Format CNIC with dashes
 */
export const formatCNIC = (cnic) => {
  const clean = cnic.replace(/[-\s]/g, '');
  if (clean.length === 13) {
    return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
  }
  return cnic;
};

/**
 * Validate phone number (Pakistan)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{11}$/;
  const cleanPhone = phone.replace(/[-\s]/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate name
 */
export const isValidName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate URL
 */
export const isValidURL = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return urlRegex.test(url);
};

/**
 * Validate required field
 */
export const isRequired = (value) => {
  return value !== undefined && value !== null && value.toString().trim() !== '';
};

/**
 * Validate minimum length
 */
export const minLength = (value, length) => {
  if (!value) return false;
  return value.toString().length >= length;
};

/**
 * Validate maximum length
 */
export const maxLength = (value, length) => {
  if (!value) return true;
  return value.toString().length <= length;
};

/**
 * Validate range
 */
export const isInRange = (value, min, max) => {
  const num = Number(value);
  return num >= min && num <= max;
};

/**
 * Validate number
 */
export const isNumber = (value) => {
  return !isNaN(Number(value));
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validate integer
 */
export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

/**
 * Validate date
 */
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Validate future date
 */
export const isFutureDate = (date) => {
  const d = new Date(date);
  return d > new Date();
};

/**
 * Validate past date
 */
export const isPastDate = (date) => {
  const d = new Date(date);
  return d < new Date();
};

/**
 * Validate date range
 */
export const isDateRangeValid = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate image file
 */
export const isValidImage = (file) => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validImageTypes.includes(file.type);
};

/**
 * Validate PDF file
 */
export const isValidPDF = (file) => {
  return file.type === 'application/pdf';
};

/**
 * Validate Word document
 */
export const isValidWordDoc = (file) => {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
         file.type === 'application/msword';
};

/**
 * Validate test duration
 */
export const isValidDuration = (minutes) => {
  const mins = Number(minutes);
  return !isNaN(mins) && mins >= 1 && mins <= 360; // 1 minute to 6 hours
};

/**
 * Validate marks
 */
export const isValidMarks = (marks) => {
  const markValue = Number(marks);
  return !isNaN(markValue) && markValue >= 0 && markValue <= 1000;
};

/**
 * Validate passing percentage
 */
export const isValidPassingPercentage = (percentage) => {
  const percent = Number(percentage);
  return !isNaN(percent) && percent >= 0 && percent <= 100;
};

/**
 * Validate question options
 */
export const isValidQuestionOptions = (options) => {
  if (!options || options.length !== 4) return false;
  return options.every(opt => opt && opt.trim() !== '');
};

/**
 * Validate answer
 */
export const isValidAnswer = (answer, totalOptions) => {
  const answerNum = Number(answer);
  return !isNaN(answerNum) && answerNum >= 0 && answerNum < totalOptions;
};

/**
 * Validate form data with schema
 */
export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const value = data[field];
    const rules = schema[field];
    
    if (rules.required && !isRequired(value)) {
      errors[field] = rules.messages?.required || `${field} is required`;
    }
    
    if (value && rules.minLength && !minLength(value, rules.minLength)) {
      errors[field] = rules.messages?.minLength || `${field} must be at least ${rules.minLength} characters`;
    }
    
    if (value && rules.maxLength && !maxLength(value, rules.maxLength)) {
      errors[field] = rules.messages?.maxLength || `${field} must not exceed ${rules.maxLength} characters`;
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.messages?.pattern || `${field} is invalid`;
    }
    
    if (value && rules.custom && !rules.custom(value)) {
      errors[field] = rules.messages?.custom || `${field} is invalid`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Create validation schema for login
 */
export const loginSchema = {
  email: {
    required: true,
    pattern: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
    messages: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address',
    },
  },
  password: {
    required: true,
    minLength: 6,
    messages: {
      required: 'Password is required',
      minLength: 'Password must be at least 6 characters',
    },
  },
};

/**
 * Create validation schema for registration
 */
export const registerSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]{2,50}$/,
    messages: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name must not exceed 50 characters',
      pattern: 'Name can only contain letters and spaces',
    },
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
    messages: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address',
    },
  },
  password: {
    required: true,
    minLength: 6,
    custom: isStrongPassword,
    messages: {
      required: 'Password is required',
      minLength: 'Password must be at least 6 characters',
      custom: 'Password must contain at least one letter and one number',
    },
  },
  confirmPassword: {
    required: true,
    custom: (value, data) => value === data.password,
    messages: {
      required: 'Please confirm your password',
      custom: 'Passwords do not match',
    },
  },
};

/**
 * Create validation schema for test creation
 */
export const testSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    messages: {
      required: 'Test title is required',
      minLength: 'Title must be at least 3 characters',
      maxLength: 'Title must not exceed 100 characters',
    },
  },
  totalMarks: {
    required: true,
    custom: isValidMarks,
    messages: {
      required: 'Total marks is required',
      custom: 'Total marks must be between 0 and 1000',
    },
  },
  duration: {
    required: true,
    custom: isValidDuration,
    messages: {
      required: 'Duration is required',
      custom: 'Duration must be between 1 and 360 minutes',
    },
  },
  passingMarks: {
    required: true,
    custom: isValidMarks,
    messages: {
      required: 'Passing marks is required',
      custom: 'Passing marks must be between 0 and 1000',
    },
  },
  startDate: {
    required: true,
    custom: isFutureDate,
    messages: {
      required: 'Start date is required',
      custom: 'Start date must be in the future',
    },
  },
  endDate: {
    required: true,
    custom: (value, data) => isFutureDate(value) && isDateRangeValid(data.startDate, value),
    messages: {
      required: 'End date is required',
      custom: 'End date must be after start date',
    },
  },
};