const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Test Data
const testTeacher = {
    name: 'Test Teacher',
    email: 'testteacher@pbl.com',
    password: 'password123',
    role: 'Teacher'
};

async function runVerification() {
    try {
        console.log('--- Starting API Verification ---');

        // 1. Login or Register Teacher
        let token;
        try {
            console.log('Attempting Login...');
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: testTeacher.email,
                password: testTeacher.password
            });
            token = loginRes.data.token;
            console.log('✅ Login Successful');
        } catch (error) {
            console.log('Login failed, attempting Registration...');
            const registerRes = await axios.post(`${API_URL}/auth/register`, testTeacher);
            token = registerRes.data.token;
            console.log('✅ Registration Successful');
        }

        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Fetch Students
        console.log('\nFetching Students...');
        const studentsRes = await axios.get(`${API_URL}/students`, authHeaders);
        const students = studentsRes.data.students;
        console.log(`✅ Fetched ${students.length} students`);

        if (students.length === 0) {
            console.warn('⚠️ No students found. Did you run the seeder?');
        }

        // 3. Create a Group
        console.log('\nCreating a Group...');
        const members = students.slice(0, 3).map(s => s._id);
        const groupData = {
            name: 'Verification Group',
            members: members,
            averageMastery: 85
        };

        const createGroupRes = await axios.post(`${API_URL}/groups`, authHeaders);
        const newGroup = createGroupRes.data.group;
        console.log(`✅ Group Created: ${newGroup.name} (ID: ${newGroup._id})`);

        // 4. Fetch Groups
        console.log('\nFetching Groups...');
        const groupsRes = await axios.get(`${API_URL}/groups`, authHeaders);
        const myGroups = groupsRes.data.groups;
        const found = myGroups.find(g => g._id === newGroup._id);
        if (found) {
            console.log('✅ Created group found in list');
        } else {
            console.error('❌ Created group NOT found in list');
        }

        // 5. Clean up (Delete Group)
        console.log('\nDeleting Group...');
        await axios.delete(`${API_URL}/groups/${newGroup._id}`, authHeaders);
        console.log('✅ Group Deleted');

        console.log('\n--- Verification Passed Successfully ---');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
}

runVerification();
