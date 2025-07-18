const path = require('path');
const fs = require('fs');

let admin = null;
let firebaseInitialized = false;

// Try to initialize Firebase Admin if config exists
function initializeFirebase() {
    try {
        const configPath = path.join(__dirname, '..', 'config', 'firebase-service-account.json');
        
        if (fs.existsSync(configPath)) {
            admin = require('firebase-admin');
            const serviceAccount = require(configPath);
            
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
            
            firebaseInitialized = true;
            console.log('✅ Firebase Admin initialized successfully');
        } else {
            console.log('⚠️  Firebase config not found, using mock notification service');
        }
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        firebaseInitialized = false;
    }
}

// Mock notification service for testing
const mockSendNotification = async (deviceTokens, payload) => {
    console.log('📱 Mock Push Notification Sent:');
    console.log('   Recipients:', deviceTokens.length, 'devices');
    console.log('   Title:', payload.title);
    console.log('   Body:', payload.body);
    console.log('   Data:', payload.data);
    
    // Simulate success response
    return {
        responses: deviceTokens.map(token => ({
            messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            success: true
        })),
        successCount: deviceTokens.length,
        failureCount: 0
    };
};

// Real Firebase notification service
const realSendNotification = async (deviceTokens, payload) => {
    const message = {
        notification: {
            title: payload.title,
            body: payload.body
        },
        data: payload.data || {},
        tokens: deviceTokens.filter(token => token && token.trim()) // Remove empty/invalid tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('📱 Real Push Notification Sent:', response);
    return response;
};

const sendPushNotification = async (deviceTokens, payload) => {
    try {
        // Ensure deviceTokens is an array
        const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
        
        if (tokens.length === 0) {
            console.log('⚠️  No device tokens provided for push notification');
            return { successCount: 0, failureCount: 0, responses: [] };
        }

        let response;
        if (firebaseInitialized && admin) {
            response = await realSendNotification(tokens, payload);
        } else {
            response = await mockSendNotification(tokens, payload);
        }

        console.log(`✅ Push notification sent to ${response.successCount} devices`);
        return response;
        
    } catch (error) {
        console.error('❌ Error sending push notification:', error.message);
        
        // Return a fallback response
        return {
            successCount: 0,
            failureCount: Array.isArray(deviceTokens) ? deviceTokens.length : 1,
            responses: [],
            error: error.message
        };
    }
};

// Test function to verify notification service
const testNotificationService = async () => {
    console.log('\n=== Testing Notification Service ===');
    
    const testTokens = ['test_token_1', 'test_token_2'];
    const testPayload = {
        title: 'Test Notification',
        body: 'This is a test from the notification service',
        data: {
            type: 'test',
            timestamp: new Date().toISOString()
        }
    };
    
    const result = await sendPushNotification(testTokens, testPayload);
    console.log('Test Result:', result);
    
    return result;
};

// Initialize Firebase on module load
initializeFirebase();

module.exports = {
    sendPushNotification,
    testNotificationService,
    isFirebaseInitialized: () => firebaseInitialized
};
