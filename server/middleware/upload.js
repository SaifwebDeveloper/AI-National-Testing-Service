const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload folder based on file type
    if (file.fieldname === 'profilePicture') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'testDocument') {
      uploadPath += 'tests/';
    } else if (file.fieldname === 'applicationDocument') {
      uploadPath += 'applications/';
    } else if (file.fieldname === 'screenshot') {
      uploadPath += 'screenshots/';
    } else {
      uploadPath += 'misc/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for different file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    
    // Text
    'text/plain': ['.txt'],
    'text/csv': ['.csv']
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${Object.keys(allowedTypes).join(', ')}`), false);
  }
};

// Configure multer for different upload scenarios
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Single file uploads
const uploadProfilePicture = upload.single('profilePicture');
const uploadTestDocument = upload.single('testDocument');
const uploadApplicationDocument = upload.single('applicationDocument');
const uploadScreenshot = upload.single('screenshot');

// Multiple file uploads
const uploadMultipleDocuments = upload.array('documents', 5); // Max 5 files
const uploadTestImages = upload.array('images', 10); // Max 10 images

// Handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Clean up old files (optional utility)
const cleanupOldFiles = (directory, daysOld = 7) => {
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  const deleteOldFiles = (dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.isDirectory()) {
            deleteOldFiles(filePath);
          } else if (stats.mtimeMs < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (err) console.error(`Failed to delete ${filePath}:`, err);
            });
          }
        });
      });
    });
  };
  
  deleteOldFiles(directory);
};

// Get file URL for response
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Delete file from server
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) return resolve();
    
    fs.unlink(filePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  upload,
  uploadProfilePicture,
  uploadTestDocument,
  uploadApplicationDocument,
  uploadScreenshot,
  uploadMultipleDocuments,
  uploadTestImages,
  handleUploadError,
  cleanupOldFiles,
  getFileUrl,
  deleteFile
};