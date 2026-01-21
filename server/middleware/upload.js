const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine resource type based on file mimetype
        const isVideo = file.mimetype.startsWith('video/');

        return {
            folder: 'pbl-evidence',
            resource_type: isVideo ? 'video' : 'image',
            allowed_formats: isVideo
                ? ['mp4', 'mov', 'avi', 'mkv', 'webm']
                : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: isVideo
                ? [{ quality: 'auto' }]
                : [{ quality: 'auto', fetch_format: 'auto' }],
        };
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
});

module.exports = upload;
