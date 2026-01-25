const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication',
        });
    }
};

// Middleware to check if user is a teacher
const authorizeTeacher = (req, res, next) => {
    if (req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Teachers only.',
        });
    }
    next();
};

// Middleware to check if user is a student
const authorizeStudent = (req, res, next) => {
    if (req.user.role !== 'Student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Students only.',
        });
    }
    next();
};

// Middleware to check if user is an admin
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admins only.',
        });
    }
    next();
};

module.exports = { protect, authorizeTeacher, authorizeStudent, authorizeAdmin };
