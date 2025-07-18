const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Call = require('../models/Call');
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const { sendPushNotification } = require('../services/notificationService');
const { generateAgoraToken } = require('../services/agoraService');
const auth = require('../middleware/auth');
const { callRateLimit, generalRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Initiate call from QR scan
router.post('/initiate',auth, callRateLimit, async (req, res) => {
  try {
    const { qrId, callType = 'video' } = req.body;
    const callerId = req.user.userId;

    // Find QR code and owner
    const qrCode = await QRCode.findOne({ qrId, isActive: true });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found or inactive' });
    }

    const receiver = await User.findOne({ userId: qrCode.ownerId });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Generate unique call ID and channel name
    const callId = uuidv4();
    const channelName = `call_${callId}`;

    // Create call record
    const call = new Call({
      callId,
      callerId,
      receiverId: qrCode.ownerId,
      qrCodeId: qrId,
      channelName,
      callType,
      status: 'initiated'
    });

    await call.save();

    // Update QR code scan count
    qrCode.scanCount += 1;
    qrCode.lastScanned = new Date();
    await qrCode.save();

    // Generate Agora tokens using consistent UIDs
    const callerUID = 'user_001'; // Use consistent UID for caller
    const receiverUID = 'user_002'; // Use consistent UID for receiver
    const callerToken = generateAgoraToken(channelName, callerUID);
    const receiverToken = generateAgoraToken(channelName, receiverUID);

    // Send push notification to receiver
    const caller = await User.findOne({ userId: callerId });
    const notificationPayload = {
      title: 'Incoming Call',
      body: `${caller?.name || 'Someone'} is calling you`,
      data: {
        callId,
        callerId,
        channelName,
        callType,
        token: receiverToken
      }
    };
    
    // Send notification with mock device tokens if receiver doesn't have any
    const deviceTokens = receiver.deviceTokens || ['mock_device_token'];
    const notificationResult = await sendPushNotification(deviceTokens, notificationPayload);

    res.json({
      success: true,
      callId,
      channelName,
      token: callerToken,
      appId: process.env.AGORA_APP_ID,
      receiver: {
        name: receiver.name,
        avatar: receiver.avatar
      },
      notification: {
        sent: notificationResult.successCount > 0,
        successCount: notificationResult.successCount,
        failureCount: notificationResult.failureCount,
        error: notificationResult.error || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Answer call
router.post('/:callId/answer', auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId, receiverId: userId });
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'answered';
    await call.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End call
router.post('/:callId/end', auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const { duration } = req.body;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'ended';
    call.endTime = new Date();
    call.duration = duration || 0;
    await call.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject call
router.post('/:callId/reject', auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ callId, receiverId: userId });
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'rejected';
    call.endTime = new Date();
    await call.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get call history
router.get('/history', auth, generalRateLimit, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Populate user details for each call
    const populatedCalls = await Promise.all(calls.map(async (call) => {
      const caller = await User.findOne({ userId: call.callerId }, 'name avatar');
      const receiver = await User.findOne({ userId: call.receiverId }, 'name avatar');
      
      return {
        ...call,
        caller: caller || { name: 'Unknown', avatar: '' },
        receiver: receiver || { name: 'Unknown', avatar: '' }
      };
    }));

    res.json({
      success: true,
      calls: populatedCalls,
      currentPage: parseInt(page),
      totalPages: Math.ceil(await Call.countDocuments({
        $or: [{ callerId: userId }, { receiverId: userId }]
      }) / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get call details
router.get('/:callId', auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.userId;

    const call = await Call.findOne({ 
      callId,
      $or: [{ callerId: userId }, { receiverId: userId }]
    });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Populate user details
    const caller = await User.findOne({ userId: call.callerId }, 'name avatar');
    const receiver = await User.findOne({ userId: call.receiverId }, 'name avatar');

    res.json({
      success: true,
      call: {
        ...call.toObject(),
        caller: caller || { name: 'Unknown', avatar: '' },
        receiver: receiver || { name: 'Unknown', avatar: '' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
