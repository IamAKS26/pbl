require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const seedStudents = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        if (uri.endsWith('/')) {
            uri += 'pbl'; // Default DB name
        }
        console.log(`Connecting to DB...`);

        await mongoose.connect(uri);
        console.log('MongoDB Connected...');

        // Clear existing students
        await User.deleteMany({ role: 'Student' });
        console.log('Existing students removed.');

        const students = [];
        // All students will have password 'password123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

        for (let i = 1; i <= 20; i++) {
            const mastery = {};
            // Generate random scores for 3-5 subjects
            const numSubjects = 3 + Math.floor(Math.random() * 3);
            const shuffledSubjects = subjects.sort(() => 0.5 - Math.random());
            const selectedSubjects = shuffledSubjects.slice(0, numSubjects);

            selectedSubjects.forEach(sub => {
                mastery[sub] = Math.floor(Math.random() * 40) + 60; // Score between 60-100 for decent data
            });

            students.push({
                name: `Student ${i}`,
                email: `student${i}@example.com`,
                password: hashedPassword,
                role: 'Student',
                mastery: mastery
            });
        }

        await User.insertMany(students);
        console.log('20 Dummy Students Imported!');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedStudents();
