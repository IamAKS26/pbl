const mongoose = require('mongoose');
const User = require('./server/models/User');
const Group = require('./server/models/Group');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const checkStudentGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const student = await User.findOne({ email: 'test5@example.com' }); // Assuming email, or I can search by name if needed

        if (!student) {
            // If specific email not found, let's list all users with 'test5' in name
            const students = await User.find({ name: /test5/i });
            console.log('Found students matching "test5":', students.map(s => `${s.name} (${s.email})`));
            if (students.length > 0) {
                const groups = await Group.find({ members: students[0]._id });
                console.log(`Groups for ${students[0].name}:`, groups.map(g => g.name));
            }
        } else {
            console.log(`Checking groups for student: ${student.name} (${student.email})`);
            const groups = await Group.find({ members: student._id });
            console.log('Groups found:', groups.map(g => ({ id: g._id, name: g.name, project: g.project })));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStudentGroups();
