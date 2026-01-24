const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine resource type based on file mimetype
        const isVideo = file.mimetype.startsWith('video/');
        const isPdf = file.mimetype === 'application/pdf';

        return {
            folder: 'pbl-evidence',
            resource_type: isVideo ? 'video' : (isPdf ? 'raw' : 'image'), // Use 'raw' or 'auto' for PDFs to be safe, or 'image' if you want thumbnails
            allowed_formats: isVideo
                ? ['mp4', 'mov', 'avi', 'mkv', 'webm']
                : (isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp']),
            transformation: isVideo
                ? [{ quality: 'auto' }]
                : (isPdf ? [] : [{ quality: 'auto', fetch_format: 'auto' }]),
        };
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images, videos, and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image, video, and PDF files are allowed!'), false);
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
