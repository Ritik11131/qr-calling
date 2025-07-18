const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const QRCodeModel = require('../models/QRCode');
const auth = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Generate new QR code
router.post('/generate', auth, generalRateLimit, async (req, res) => {
    try {
        const { name, expiresIn } = req.body;
        const userId = req.user.userId;
        
        const qrId = uuidv4();
        const qrUrl = `${process.env.FRONTEND_URL}/call?qr=${qrId}`;
        
        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(qrUrl);
        
        // Save to database
        const qrCode = new QRCodeModel({
            qrId,
            ownerId: userId,
            name,
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
        });
        
        await qrCode.save();
        
        res.json({
            success: true,
            qrId,
            qrUrl,
            qrCodeImage,
            expiresAt: qrCode.expiresAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get QR code details
router.get('/:qrId', generalRateLimit, async (req, res) => {
    try {
        const { qrId } = req.params;
        
        const qrCode = await QRCodeModel.findOne({ qrId });
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }
        
        // Check if expired
        if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
            return res.status(410).json({ error: 'QR code expired' });
        }
        
        res.json({
            success: true,
            qrCode: {
                qrId: qrCode.qrId,
                name: qrCode.name,
                ownerId: qrCode.ownerId,
                isActive: qrCode.isActive,
                scanCount: qrCode.scanCount,
                createdAt: qrCode.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's QR codes
router.get('/user/codes', auth, generalRateLimit, async (req, res) => {
    try {
        const qrCodes = await QRCodeModel.find({ ownerId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json({
            success: true,
            qrCodes: qrCodes.map(qr => ({
                qrId: qr.qrId,
                name: qr.name,
                isActive: qr.isActive,
                scanCount: qr.scanCount,
                expiresAt: qr.expiresAt,
                lastScanned: qr.lastScanned,
                createdAt: qr.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle QR code active status
router.patch('/:qrId/toggle', auth, generalRateLimit, async (req, res) => {
    try {
        const { qrId } = req.params;
        const userId = req.user.userId;
        
        const qrCode = await QRCodeModel.findOne({ qrId, ownerId: userId });
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }
        
        qrCode.isActive = !qrCode.isActive;
        await qrCode.save();
        
        res.json({
            success: true,
            message: `QR code ${qrCode.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: qrCode.isActive
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete QR code
router.delete('/:qrId', auth, generalRateLimit, async (req, res) => {
    try {
        const { qrId } = req.params;
        const userId = req.user.userId;
        
        const qrCode = await QRCodeModel.findOneAndDelete({ qrId, ownerId: userId });
        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not found' });
        }
        
        res.json({
            success: true,
            message: 'QR code deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
