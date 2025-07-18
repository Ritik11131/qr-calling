const express = require('express');
const { sendPushNotification, testNotificationService } = require('../services/notificationService');
const auth = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Test notification endpoint
router.post('/test', auth, generalRateLimit, async (req, res) => {
    try {
        const { deviceTokens, title, body, data } = req.body;
        
        // Default values if not provided
        const tokens = deviceTokens || ['test_device_token_1', 'test_device_token_2'];
        const payload = {
            title: title || 'Test Notification',
            body: body || 'This is a test notification from the QR Calling app',
            data: data || {
                type: 'test',
                timestamp: new Date().toISOString(),
                testId: Math.random().toString(36).substr(2, 9)
            }
        };
        
        const result = await sendPushNotification(tokens, payload);
        
        res.json({
            success: true,
            message: 'Test notification sent',
            result: result
        });
        
    } catch (error) {
        console.error('Error in test notification endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Built-in notification service test
router.get('/test/service', auth, generalRateLimit, async (req, res) => {
    try {
        const result = await testNotificationService();
        
        res.json({
            success: true,
            message: 'Notification service test completed',
            result: result
        });
        
    } catch (error) {
        console.error('Error in notification service test:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get notification service status
router.get('/status', auth, generalRateLimit, async (req, res) => {
    try {
        const { isFirebaseInitialized } = require('../services/notificationService');
        
        res.json({
            success: true,
            firebaseInitialized: isFirebaseInitialized(),
            mode: isFirebaseInitialized() ? 'production' : 'mock',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting notification status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
