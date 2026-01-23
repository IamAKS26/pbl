const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('MONGO_URI is:', process.env.MONGO_URI ? 'Defined' : 'Undefined');

const checkStudentGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Search for 'test5'
        const users = await User.find({ name: /test5/i });

        if (users.length === 0) {
            console.log('No user found with name "test5"');
        } else {
            for (const user of users) {
                console.log(`Checking groups for: ${user.name} (${user.email}, ID: ${user._id})`);
                const groups = await Group.find({ members: user._id });
                console.log(`Found ${groups.length} groups:`);
                groups.forEach(g => {
                    console.log(` - Group: "${g.name}" (ID: ${g._id})`);
                });
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStudentGroups();
