require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createTeacher = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        if (uri && uri.endsWith('/')) {
            uri += 'pbl';
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const email = 'teacher@example.com';
        const password = 'password123';

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User teacher@example.com already exists. Updating password...');
            existing.password = password; // Will be hashed by pre-save hook
            await existing.save();
            console.log('Password updated to: password123');
        } else {
            console.log('Creating new teacher...');
            await User.create({
                name: 'Demo Teacher',
                email: email,
                password: password,
                role: 'Teacher',
                xp: 1000,
                badges: ['Early Adopter']
            });
            console.log('User created: teacher@example.com / password123');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTeacher();
