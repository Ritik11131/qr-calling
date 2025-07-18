const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  scanCount: {
    type: Number,
    default: 0
  },
  lastScanned: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QRCode', qrCodeSchema);