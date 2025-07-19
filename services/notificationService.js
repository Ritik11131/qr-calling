const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (deviceTokens, payload) => {
    try {
        const message = {
            notification: {
                title: payload.title,
                body: payload.body
            },
            data: payload.data || {},
            tokens: deviceTokens.filter(token => token) // Remove empty tokens
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log('Push notification sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};

module.exports = {
    sendPushNotification
};