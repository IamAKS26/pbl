require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Fetching models from:", url.replace(apiKey, 'HIDDEN'));

    try {
        const response = await axios.get(url);
        console.log("✅ Available Models:");
        response.data.models.forEach(model => {
            console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error("❌ Failed to list models:", error.response?.status);
        console.error("Details:", JSON.stringify(error.response?.data, null, 2));
    }
}

listModels();
