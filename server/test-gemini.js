require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    console.log("Checking API Key...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        process.exit(1);
    }
    console.log("✅ API Key found (starts with: " + process.env.GEMINI_API_KEY.substring(0, 4) + "...)");

    console.log("Initializing Gemini...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTry = ["gemini-pro"]; // Use a stable model

    for (const modelName of modelsToTry) {
        console.log(`\n--- Testing Model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Say hello in English.";
            console.log("Sending prompt...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`✅ Success with ${modelName}! Response:`, response.text());
            break; // Stop if one works
        } catch (error) {
            console.error(`❌ Failed with ${modelName}.`);
            console.error("Error Message:", error.message);
            // console.error("Full Error:", error);
        }
    }
}

testGemini();
