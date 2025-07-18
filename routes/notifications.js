const express = require('express');
const { sendPushNotification } = require('../services/notificationService');
const auth = require('../middleware/auth');

const router = express.Router();

// Send test notification
router.post('/test', auth, async (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    if (!req.user.deviceTokens || req.user.deviceTokens.length === 0) {
      return res.status(400).json({ error: 'No device tokens found for user' });
    }

    const payload = {
      title: title || 'Test Notification',
      body: body || 'This is a test notification',
      data: data || {}
    };

    await sendPushNotification(req.user.deviceTokens, payload);

    res.json({ 
      success: true, 
      message: 'Test notification sent successfully',
      sentTo: req.user.deviceTokens.length
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send notification to specific user
router.post('/send', auth, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    const User = require('../models/User');
    const targetUser = await User.findOne({ userId });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser.deviceTokens || targetUser.deviceTokens.length === 0) {
      return res.status(400).json({ error: 'No device tokens found for target user' });
    }

    const payload = {
      title,
      body,
      data: data || {}
    };

    await sendPushNotification(targetUser.deviceTokens, payload);

    res.json({ 
      success: true, 
      message: 'Notification sent successfully',
      sentTo: targetUser.deviceTokens.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get notification settings (placeholder for future implementation)
router.get('/settings', auth, async (req, res) => {
  try {
    // This would typically fetch user notification preferences from database
    const settings = {
      callNotifications: true,
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true
    };

    res.json({ 
      success: true, 
      settings 
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update notification settings (placeholder for future implementation)
router.put('/settings', auth, async (req, res) => {
  try {
    const { callNotifications, emailNotifications, pushNotifications, soundEnabled, vibrationEnabled } = req.body;

    // This would typically update user notification preferences in database
    const updatedSettings = {
      callNotifications: callNotifications !== undefined ? callNotifications : true,
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
      vibrationEnabled: vibrationEnabled !== undefined ? vibrationEnabled : true
    };

    res.json({ 
      success: true, 
      settings: updatedSettings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

module.exports = router;
