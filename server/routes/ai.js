require('dotenv').config();
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect, authorizeTeacher } = require('../middleware/auth');

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper function for fallback template
const getFallbackTemplate = (topic) => ({
    title: `${topic || 'Project'} (Template)`,
    description: `## About the Project\nThis is a standard template for **${topic || 'Project Based Learning'}**.\n\n## Learning Objectives\n- Understand core concepts of ${topic}\n- Implement a working solution\n- Master debug practices\n\n## Prerequisites\n- Basic programming knowledge\n- Code editor setup`,
    drivingQuestion: `How can we build a ${topic}?`,
    suggestedTasks: [
        {
            title: "Step 1: Setup the Environment",
            phase: "Setup",
            description: "**Goal:** Prepare your workspace.\n\n**Instructions:**\n1. Install VS Code.\n2. Install Node.js or Python.\n3. Create a project folder."
        },
        {
            title: "Step 2: Create Project Structure",
            phase: "Setup",
            description: "**Goal:** Organize files.\n\n**Instructions:**\n- Create `index.html` or `main.py`.\n- Create `style.css` if web-based.\n- Create `README.md`."
        },
        {
            title: "Step 3: Write Initial Code",
            phase: "Implementation",
            description: "**Goal:** Get basic output.\n\n**Instructions:**\nWrite a simple 'Hello World' or basic function to verify setup."
        },
        {
            title: "Step 4: Add Core Logic",
            phase: "Implementation",
            description: "**Goal:** Implement main features.\n\n**Instructions:**\nAdd the specific logic required for your topic."
        },
        {
            title: "Step 5: Test the Project",
            phase: "Testing",
            description: "**Goal:** Verify correctness.\n\n**Instructions:**\nRun the project and check for errors."
        },
        {
            title: "Step 6: Improve & Extend",
            phase: "Extension",
            description: "**Goal:** Add polish.\n\n**Instructions:**\nRefactor code and add one extra feature."
        }
    ]
});

// @desc    Generate a project template using AI
// @route   POST /api/ai/generate-template
// @access  Private/Teacher
router.post('/generate-template', protect, authorizeTeacher, async (req, res) => {
    console.log("👉 AI Route Hit by user:", req.user?.email);

    const { topic, difficulty, gradeLevel } = req.body;

    // Initialize with fallback
    let template = getFallbackTemplate(topic);

    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not configured. Using fallback.");
            return res.json({ success: true, template });
        }

        const prompt = `You are an expert curriculum designer for Project Based Learning. 
        Create a detailed, step-by-step project template for the topic: "${topic}".
        Target Audience: Grade ${gradeLevel || 'Any'}, Difficulty: ${difficulty || 'Medium'}.
        
        STRICT REQUIREMENT: The output must be a SINGLE valid JSON object. Do not include any markdown formatting (no \`\`\`json block).
        
        The project structure must follow this exact flow:
        1. Project Name
        2. About the Project (Problem, Learning, Outcome)
        3. Learning Objectives (3 Skills)
        4. Prerequisites (Concepts)
        5. Tools & Technologies (Languages, Frameworks)
        6. Step-by-Step Implementation Flow (The core work)
        
        The JSON schema is:
        {
            "title": "Project Title",
            "description": "Combine the About, Objectives, Prerequisites, and Tools sections into a single comprehensive markdown string. Use ## headers.",
            "suggestedTasks": [
                { 
                    "title": "Step 1: Setup the Environment", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Instructions:** ... \\n\\n (Commands to install tools)" 
                },
                { 
                    "title": "Step 2: Create the Project Structure", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Instructions:** ... \\n\\n **Example Structure:** (File tree)" 
                },
                { 
                    "title": "Step 3: Write Initial Code", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Instructions:** ... \\n\\n **Sample Code:** (Code block) \\n\\n **Explanation:** ..." 
                },
                { 
                    "title": "Step 4: Add Core Logic", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Instructions:** ... \\n\\n **Sample Code:** (Code block)" 
                },
                { 
                    "title": "Step 5: Test the Project", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Instructions:** ... \\n\\n (Run commands and expected output)" 
                },
                { 
                    "title": "Step 6: Improve & Extend", 
                    "description": "Markdown string containing: **Goal:** ... \\n\\n **Optional Enhancements:** ..." 
                }
            ]
        }
        
        Return ONLY the JSON.`;

        console.log('Generating with prompt options:', { topic, difficulty, gradeLevel });

        const modelsToTry = ["gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro"];
        let result;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                console.log(`Success with model: ${modelName}`);
                break; // Exit loop on success
            } catch (err) {
                console.error(`Failed with model ${modelName}:`, err.message);
                // Continue to next model
            }
        }

        if (result) {
            const response = await result.response;
            let text = response.text();
            console.log('Raw AI Response:', text);
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                template = JSON.parse(text);
            } catch (parseError) {
                console.error("Failed to parse AI response JSON:", parseError);
                // template remains as fallback
            }
        } else {
            console.warn("⚠️ All AI models failed. Using FALLBACK template.");
            // template remains as fallback
        }

        res.json({ success: true, template });

    } catch (error) {
        console.error('Final Generation Error:', error);
        // Return fallback on any unexpected error
        res.json({ success: true, template });
    }
});

module.exports = router;
