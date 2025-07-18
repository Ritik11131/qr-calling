const { sendPushNotification } = require('./services/notificationService');

async function testPushNotification() {
    console.log('=== Testing Push Notification ===');

    const fakeTokens = ['token_1', 'token_2']; // Mock device tokens
    const payload = {
        title: 'Test Notification',
        body: 'This is a test notification!',
        data: { key: 'value' }
    };

    try {
        const response = await sendPushNotification(fakeTokens, payload);
        console.log('Push Notification Response:', response);
    } catch (error) {
        console.error('Error in push notification test:', error);
    }
}

testPushNotification();
