require('dotenv').config();
const axios = require('axios');

async function testRestApi() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Missing API Key");
        return;
    }

    const configs = [
        { model: 'gemini-1.5-flash', version: 'v1beta' },
        { model: 'gemini-1.5-flash', version: 'v1' },
    ];

    for (const conf of configs) {
        // Remove key from URL
        const url = `https://generativelanguage.googleapis.com/${conf.version}/models/${conf.model}:generateContent`;
        console.log(`\nTesting ${conf.model} (${conf.version}) with HEADER...`);

        const data = {
            contents: [{
                parts: [{ text: "Hello" }]
            }]
        };

        const headers = {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.post(url, data, { headers });
            console.log(`✅ SUCCESS! ${conf.model} works on ${conf.version}`);
            process.exit(0);
        } catch (error) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error?.message}`);
        }
    }
}

testRestApi();
