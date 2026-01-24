const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Load environment variables
dotenv.config(); // Loads .env from current directory by default

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pbl';
        if (uri && uri.endsWith('/') && !uri.includes('pbl')) {
            uri += 'pbl';
        }
        await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected`);
    } catch (error) {
        console.error(`❌ Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const migrateProjects = async () => {
    await connectDB();

    try {
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects.`);

        for (const project of projects) {
            console.log(`Migrating Project: ${project.title} (${project._id})`);

            // 1. Update Columns
            project.columns = ['Backlog', 'In Progress', 'Ready for Review', 'Done'];
            await project.save();

            // 2. Update Tasks Status
            // Map old statuses to new ones
            const statusMap = {
                'Planning': 'Backlog',
                'To Do': 'Backlog',
                'In Progress': 'In Progress',
                'Under Review': 'Ready for Review',
                'Review': 'Ready for Review',
                'Ready for Review': 'Ready for Review',
                'Completed': 'Done',
                'Done': 'Done'
            };

            const tasks = await Task.find({ project: project._id });
            for (const task of tasks) {
                // Default to Backlog if unknown
                const newStatus = statusMap[task.status] || 'Backlog';
                if (task.status !== newStatus) {
                    console.log(`   Task "${task.title}": ${task.status} -> ${newStatus}`);
                    task.status = newStatus;
                    await task.save();
                }
            }
        }

        console.log('✅ Migration Complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrateProjects();
