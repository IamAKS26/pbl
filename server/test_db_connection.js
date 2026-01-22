require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

console.log('--- Database Connection Diagnostic ---');
console.log(`URI loaded: ${uri ? (uri.substring(0, 20) + '...') : 'UNDEFINED'}`);

if (!uri) {
    console.error('❌ MONGODB_URI is undefined in .env');
    process.exit(1);
}

const testConnection = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');

        // Use a shorter timeout to fail faster during test
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });

        console.log('✅ Connection Successful!');
        console.log(`Host: ${mongoose.connection.host}`);

        // Try a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✅ Database accessible. Found ${collections.length} collections.`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Connection Failed:');
        console.error(`Error Name: ${error.name}`);
        console.error(`Message: ${error.message}`);

        if (error.message.includes('bad auth')) {
            console.log('\n💡 Tip: Check your username and password in MONGODB_URI.');
        } else if (error.message.includes('buffering timed out') || error.message.includes('ETIMEDOUT')) {
            console.log('\n💡 Tip: This is a Network Timeout.');
            console.log('1. Check if your IP Address is whitelisted in MongoDB Atlas.');
            console.log('   (Go to Network Access -> Add IP Address -> Allow Access from Anywhere)');
            console.log('2. Check your internet connection.');
        }

        process.exit(1);
    }
};

testConnection();
