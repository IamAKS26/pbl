const express = require('express');
const router = express.Router();
const axios = require('axios');

// @desc    Execute code via Piston API
// @route   POST /api/run
// @access  Public (or Private if you want to restrict)
router.post('/', async (req, res) => {
    const { language, source_code, stdin } = req.body;

    if (!language || !source_code) {
        return res.status(400).json({
            success: false,
            message: 'Language and source code are required'
        });
    }

    try {
        // Map common language names to Piston versions/names if needed
        // Piston expects 'javascript', 'python', 'java', etc.
        // We ensure we send 'version: "*"' to use the latest available.

        let pistonLang = language;
        if (language === 'nodejs') pistonLang = 'javascript';
        if (language === 'cpp') pistonLang = 'c++';

        const payload = {
            language: pistonLang,
            version: '*',
            files: [
                {
                    content: source_code
                }
            ],
            stdin: stdin || '',
            run_timeout: 3000,
            compile_timeout: 10000
        };

        const response = await axios.post('https://emkc.org/api/v2/piston/execute', payload);

        // Piston returns: { run: { stdout, stderr, code, signal, ... }, compile: { ... } }
        const result = response.data;

        res.status(200).json({
            success: true,
            run: result.run,
            compile: result.compile
        });

    } catch (error) {
        console.error('Piston Execution Error:', error.message);
        if (error.response) {
            console.error('Piston Data:', error.response.data);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to execute code',
            error: error.message
        });
    }
});

module.exports = router;
