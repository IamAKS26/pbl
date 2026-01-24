const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// @desc    Execute code via Judge0
// @route   POST /api/judge0/submit
// @access  Private (or Public if you want execution without login)
router.post('/submit', async (req, res) => {
    try {
        const { source_code, language_id, stdin } = req.body;

        // 1. Submit Code
        const submissionResponse = await axios.post(
            'https://judge0-ce.p.rapidapi.com/submissions',
            {
                source_code: source_code,
                language_id: language_id || 63, // Default to Node.js (63)
                stdin: stdin || "",
            },
            {
                params: { base64_encoded: 'false', fields: '*' },
                headers: {
                    'content-type': 'application/json',
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            }
        );

        const token = submissionResponse.data.token;

        // 2. Poll for Status (Simple implementation: Wait 2s then check)
        // In prod, frontend should poll, but for simplicity we can do a quick check or return token.
        // Let's return token and let frontend poll? Or do one check here? 
        // Better: Return token to frontend, frontend polls another endpoint or same one.
        // Actually, for better UX without frontend complexity, let's wait a bit and return result if fast enough.
        // But standard practice: Return token.

        // However, to make it "easy step by step", let's try to get result immediately if it's quick.
        // Judge0 usually takes a second.

        // Setup for frontend polling is more robust. Let's implementing polling on frontend.
        // So just return the token.

        res.status(200).json({
            success: true,
            token: token
        });

    } catch (error) {
        console.error('Judge0 Submission Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Code execution failed',
            error: error.response?.data?.message || error.message
        });
    }
});

// @desc    Get Submission Result
// @route   GET /api/judge0/result/:token
router.get('/result/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const response = await axios.get(
            `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            {
                params: { base64_encoded: 'false', fields: '*' },
                headers: {
                    'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            }
        );

        res.status(200).json({
            success: true,
            result: response.data
        });

    } catch (error) {
        console.error('Judge0 Result Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch results',
            error: error.response?.data?.message || error.message
        });
    }
});

module.exports = router;
