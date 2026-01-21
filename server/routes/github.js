const express = require('express');
const router = express.Router();
const { fetchCommits, parseGitHubUrl } = require('../config/github');
const { protect } = require('../middleware/auth');

// @desc    Fetch commits from GitHub repository
// @route   GET /api/github/commits/:owner/:repo
// @access  Private
router.get('/commits/:owner/:repo', protect, async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { token } = req.query;

        const commits = await fetchCommits(owner, repo, token);

        res.status(200).json({
            success: true,
            count: commits.length,
            commits,
        });
    } catch (error) {
        console.error('Fetch commits error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching commits',
        });
    }
});

// @desc    Validate GitHub repository URL
// @route   POST /api/github/validate-url
// @access  Private
router.post('/validate-url', protect, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a repository URL',
            });
        }

        const { owner, repo } = parseGitHubUrl(url);

        res.status(200).json({
            success: true,
            message: 'Valid GitHub repository URL',
            repository: {
                owner,
                repo,
                fullName: `${owner}/${repo}`,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Invalid GitHub repository URL',
        });
    }
});

module.exports = router;
