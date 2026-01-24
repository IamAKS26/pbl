const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a project title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a project description'],
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deadline: {
        type: Date,
        required: [true, 'Please provide a deadline'],
    },
    columns: {
        type: [String],
        default: ['Planning', 'To Do', 'In Progress', 'Review', 'Completed'],
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: true,
});

// Index for faster queries
projectSchema.index({ teacher: 1 });
projectSchema.index({ students: 1 });

module.exports = mongoose.model('Project', projectSchema);
