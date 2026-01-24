const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('../models/Project');
const Task = require('../models/Task');

dotenv.config();

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

const debugProject = async () => {
    await connectDB();

    try {
        // Get the most recent project
        const project = await Project.findOne().sort({ createdAt: -1 });
        if (!project) {
            console.log('No projects found.');
            process.exit(0);
        }

        console.log(`Project: ${project.title} (${project._id})`);
        console.log('Columns:', JSON.stringify(project.columns));

        const tasks = await Task.find({ project: project._id });
        console.log(`Found ${tasks.length} tasks.`);
        tasks.forEach(t => {
            console.log(`- Task: "${t.title}" | Status: "${t.status}" | Matches a column? ${project.columns.includes(t.status)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Debug Failed:', error);
        process.exit(1);
    }
};

debugProject();
