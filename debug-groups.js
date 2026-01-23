const mongoose = require('mongoose');
const Group = require('./server/models/Group');
const User = require('./server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const debugGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the student
        // You might need to adjust the email to match the user you are testing with
        // Since I don't know the exact email, I'll list all students and their groups

        const students = await User.find({ role: 'Student' });
        console.log(`Found ${students.length} students.`);

        for (const student of students) {
            console.log(`\nChecking student: ${student.name} (${student.email}) ID: ${student._id}`);

            // Query used in the route
            const query = { members: student._id };
            const groups = await Group.find(query);

            console.log(`Groups found via query { members: student._id }: ${groups.length}`);
            if (groups.length > 0) {
                console.log(` - Group Name: ${groups[0].name}`);
                console.log(` - Group Members: ${groups[0].members.map(m => m.toString())}`);
            }

            // Double check by finding ALL groups and checking members array manually
            const allGroups = await Group.find({});
            const manualMatch = allGroups.find(g => g.members.some(m => m.toString() === student._id.toString()));

            if (manualMatch && groups.length === 0) {
                console.error("!!! MISMATCH DETECTED !!!");
                console.error("Manual check found group, but query failed.");
                console.error("Group Members (Raw):", manualMatch.members);
                console.error("Student ID:", student._id);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

debugGroups();
