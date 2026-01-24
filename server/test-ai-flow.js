const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TEST_USER = {
    name: 'AI Test Teacher',
    email: `ai-test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Teacher'
};

async function testAiFlow() {
    try {
        console.log('1. Registering new teacher...');
        let authHeader;
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, TEST_USER);
            console.log('   Registered:', regRes.data.user.email);
            authHeader = { Authorization: `Bearer ${regRes.data.token}` };
        } catch (e) {
            console.log('   Registration failed, trying login (just in case)...');
            // In real test, we expect register to work for unique email. 
            // If creating fails, maybe server isn't running or db issue.
            if (e.response) {
                console.error('   Error data:', e.response.data);
            }
            throw e;
        }

        console.log('2. Generating AI Template...');
        // Request for a simple topic
        const aiRes = await axios.post(`${API_URL}/ai/generate-template`, {
            topic: 'Simple Calculator',
            difficulty: 'Easy',
            gradeLevel: '5th'
        }, { headers: authHeader });

        const template = aiRes.data.template;
        console.log('   AI generation result (Status: ' + aiRes.status + ')');
        console.log('   Title:', template.title);
        console.log('   Tasks count:', template.suggestedTasks ? template.suggestedTasks.length : 0);

        if (!template.suggestedTasks || template.suggestedTasks.length === 0) {
            console.warn("⚠️ Warning: No tasks generated in template. This might be a fallback or AI failure issue if fallback should have tasks.");
            // Fallback usually has tasks, so this is suspicious if empty.
            if (template.description.includes("AI generation encountered an issue")) {
                console.log("   Detected strict fallback (Review Needed).");
            }
        }

        console.log('3. Creating Project with Template...');
        const projectData = {
            title: template.title,
            description: template.description || "No description",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            tasks: template.suggestedTasks
        };

        const projRes = await axios.post(`${API_URL}/projects`, projectData, { headers: authHeader });

        console.log('   Project created successfully!');
        if (projRes.data.project) {
            console.log('   Project ID:', projRes.data.project._id);
        } else {
            console.log('   Response:', projRes.data);
        }

        console.log('✅ TEST PASSED: AI Template Generation -> Project Creation flow works.');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.response ? error.response.data : error.message);
        if (error.response && error.response.data && error.response.data.message) {
            console.error('   Server Message:', error.response.data.message);
        }
    }
}

testAiFlow();
