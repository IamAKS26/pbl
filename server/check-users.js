require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        if (uri && uri.endsWith('/')) {
            uri += 'pbl';
        }

        await mongoose.connect(uri);

        const users = await User.find({}).select('+password');

        const summary = users.map(u => ({
            name: u.name,
            email: u.email,
            role: u.role,
            hasPassword: !!u.password
        }));

        console.log(JSON.stringify(summary, null, 2));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
