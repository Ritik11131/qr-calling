const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection test
async function testMongoConnection() {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI found in .env' : 'No URI found');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ MongoDB connected successfully!');
        
        // Test database operations
        const testSchema = new mongoose.Schema({
            name: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const TestModel = mongoose.model('Test', testSchema);
        
        // Create a test document
        const testDoc = new TestModel({ name: 'Connection Test' });
        await testDoc.save();
        console.log('✅ Test document created successfully!');
        
        // Read the test document
        const foundDoc = await TestModel.findOne({ name: 'Connection Test' });
        console.log('✅ Test document retrieved:', foundDoc);
        
        // Clean up - remove test document
        await TestModel.deleteOne({ name: 'Connection Test' });
        console.log('✅ Test document cleaned up!');
        
        // Show database info
        const admin = mongoose.connection.db.admin();
        const info = await admin.serverStatus();
        console.log('📊 Database Info:');
        console.log('- Host:', info.host);
        console.log('- Version:', info.version);
        console.log('- Uptime:', info.uptime, 'seconds');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed.');
    }
}

testMongoConnection();
