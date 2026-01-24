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
        required: false
    },
    status: {
        type: String,
        required: true,
        default: 'To Do',
    },
    points: {
        type: Number,
        default: 10, // Default XP points per task
        min: 0
    },
    xpAwarded: {
        type: Boolean,
        default: false
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
            required: false, // Optional for external links
        },
        resourceType: {
            type: String,
            enum: ['image', 'video', 'link', 'raw', 'auto'], // Added link
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
    submissionType: {
        type: String,
        enum: ['link', 'file', 'code', 'none'],
        default: 'none'
    },
    codeSubmission: {
        code: String,
        language: String,
        submittedAt: Date,
    },
    // New fields for teacher feedback
    feedback: {
        type: String,
        default: ''
    },
    feedbackBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    feedbackAt: {
        type: Date
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
