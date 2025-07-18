const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  callerId: {
    type: String,
    required: false, // Changed to false to allow anonymous calls
    default: null
  },
  receiverId: {
    type: String,
    required: true
  },
  qrCodeId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  // New fields for anonymous caller support
  callerInfo: {
    name: {
      type: String,
      default: 'Anonymous Caller'
    },
    phone: {
      type: String,
      default: null
    },
    location: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ['qr_scan', 'registered_user', 'guest'],
      default: 'qr_scan'
    },
    additionalInfo: {
      type: String,
      default: null
    }
  },
  anonymousCall: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date,
    default: null
  },
  endedBy: {
  type: String,
  enum: ['caller', 'receiver', 'system', 'timeout', null], // Add `null` as a valid enum value
  default: null
},
}, {
  timestamps: true
});

// Index for better query performance
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });
callSchema.index({ qrCodeId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);