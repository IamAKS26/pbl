const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'To Do',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
    },
    evidenceLinks: [{
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        resourceType: {
            type: String,
            enum: ['image', 'video'],
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    githubRepo: {
        url: String,
        owner: String,
        repo: String,
    },
    githubCommits: [{
        sha: String,
        message: String,
        author: String,
        email: String,
        timestamp: Date,
        url: String,
    }],
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Update lastUpdated on any modification
taskSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

// Indexes for faster queries
taskSchema.index({ project: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Task', taskSchema);
