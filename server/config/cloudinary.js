const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
const testConnection = async () => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn('⚠️ Cloudinary credentials missing in .env');
            return;
        }
        await cloudinary.api.ping();
        console.log('✅ Cloudinary Connected');
    } catch (error) {
        console.error('❌ Cloudinary Connection Warning:', error.message || error);
        // Do not throw/crash, just warn.
    }
};

testConnection();

module.exports = cloudinary;
