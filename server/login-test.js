require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'teacher@example.com',
            password: 'password123',
        });
        console.log('Login response:', response.data);
    } catch (err) {
        if (err.response) {
            console.error('Login failed with status', err.response.status, 'data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testLogin();
