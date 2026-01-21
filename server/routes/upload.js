const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: req.file.path,
                publicId: req.file.filename,
                resourceType: req.file.resource_type || (req.file.mimetype.startsWith('video/') ? 'video' : 'image'),
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message,
        });
    }
});

// @desc    Delete file from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
    try {
        const { publicId } = req.params;
        const { resourceType } = req.query; // 'image' or 'video'

        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType || 'image',
        });

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message,
        });
    }
});

module.exports = router;
