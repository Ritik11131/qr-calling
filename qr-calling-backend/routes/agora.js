const express = require('express');
const { generateAgoraToken } = require('../services/agoraService');
const auth = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Generate Agora token
router.post('/token', auth, generalRateLimit, async (req, res) => {
    try {
        const { channelName, uid, role } = req.body;
        
        const token = generateAgoraToken(channelName, uid, role);
        
        res.json({
            success: true,
            token,
            appId: process.env.AGORA_APP_ID
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;