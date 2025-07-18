const express = require("express")
const { v4: uuidv4 } = require("uuid")
const Call = require("../models/Call")
const User = require("../models/User")
const QRCode = require("../models/QRCode")
const { sendPushNotification } = require("../services/notificationService")
const { generateAgoraToken } = require("../services/agoraService")
const auth = require("../middleware/auth")
const { callRateLimit, generalRateLimit } = require("../middleware/rateLimiter")

const router = express.Router()

// Initiate call from QR scan (NO AUTH REQUIRED - Anonymous caller)
router.post("/initiate", callRateLimit, async (req, res) => {
  try {
    const { qrId, callType = "video", callerInfo } = req.body

    // callerInfo can contain: { name: 'Driver', phone: '+1234567890', location: 'Gate A' }
    // This is optional info that anonymous caller can provide

    // Find QR code and owner
    const qrCode = await QRCode.findOne({ qrId, isActive: true })
    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found or inactive" })
    }

    const receiver = await User.findOne({ userId: qrCode.ownerId })
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" })
    }

    // Check if receiver is available/online (optional)
    // if (!receiver.isOnline) {
    //   return res.status(400).json({ error: 'User is currently offline' });
    // }

    // Generate unique call ID and channel name
    const callId = uuidv4()
    const channelName = `call_${callId}`

    console.log(callId, qrCode, qrId, channelName, callType)

    // Create call record for anonymous caller
    const call = new Call({
      callId,
      callerId: "", // Anonymous caller - no user ID
      receiverId: qrCode.ownerId,
      qrCodeId: qrId,
      channelName,
      callType,
      status: "initiated",
      callerInfo: callerInfo || {
        name: "Anonymous Caller",
        type: "qr_scan",
      },
      anonymousCall: true,
    })

    await call.save()

    // Update QR code scan count
    qrCode.scanCount += 1
    qrCode.lastScanned = new Date()
    await qrCode.save()

    // Generate Agora tokens with unique UIDs for this call
    const callerUID = `anonymous_${callId.substring(0, 8)}`
    // const callerUID = 'user_001'
    const receiverUID = `user_${qrCode.ownerId}`
    const callerToken = generateAgoraToken(channelName, callerUID)
    const receiverToken = generateAgoraToken(channelName, receiverUID)

    // Send push notification to receiver
    const notificationData = {
      title: "Incoming Call",
      body: `${callerInfo?.name || "Someone"} is calling you via QR code`,
      data: {
        callId,
        callerUID,
        channelName,
        callType,
        token: receiverToken,
        callerInfo: callerInfo || { name: "Anonymous Caller" },
        qrCodeName: qrCode.name || "QR Code",
      },
    }

    // Send push notification
    if (receiver.deviceTokens && receiver.deviceTokens.length > 0) {
      // await sendPushNotification(receiver.deviceTokens, notificationData);
    }

    // Return response to anonymous caller
    res.json({
      success: true,
      callId,
      callerUID,
      channelName,
      token: callerToken,
      appId: process.env.AGORA_APP_ID,
      receiver: {
        userId: receiver.userId, // ADD THIS LINE
        name: receiver.name,
        avatar: receiver.avatar,
      },
      message: "Call initiated successfully. Please wait for the user to answer.",
    })
  } catch (error) {
    console.error("Error initiating call:", error)
    res.status(500).json({ error: error.message })
  }
})

// Answer call (AUTH REQUIRED - Only the QR owner can answer)
router.post("/:callId/answer", auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params
    const userId = req.user.userId

    const call = await Call.findOne({ callId, receiverId: userId })
    if (!call) {
      return res.status(404).json({ error: "Call not found or you are not authorized to answer this call" })
    }

    if (call.status !== "initiated") {
      return res.status(400).json({ error: "Call is not in initiated state" })
    }

    call.status = "answered"
    call.answeredAt = new Date()
    await call.save()

    // Generate fresh token for the receiver
    const receiverUID = `user_${userId}`
    const receiverToken = generateAgoraToken(call.channelName, receiverUID)

    res.json({
      success: true,
      channelName: call.channelName,
      token: receiverToken,
      appId: process.env.AGORA_APP_ID,
      callerInfo: call.callerInfo,
    })
  } catch (error) {
    console.error("Error answering call:", error)
    res.status(500).json({ error: error.message })
  }
})

// End call (Can be called by anyone in the call)
router.post("/:callId/end", generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params
    const { duration, endedBy } = req.body // endedBy can be 'caller' or 'receiver'

    const call = await Call.findOne({ callId })
    if (!call) {
      return res.status(404).json({ error: "Call not found" })
    }

    if (call.status === "ended") {
      return res.status(400).json({ error: "Call already ended" })
    }

    call.status = "ended"
    call.endTime = new Date()
    call.duration = duration || 0
    call.endedBy = endedBy || "unknown"
    await call.save()

    res.json({ success: true })
  } catch (error) {
    console.error("Error ending call:", error)
    res.status(500).json({ error: error.message })
  }
})

// Reject call (AUTH REQUIRED - Only the QR owner can reject)
router.post("/:callId/reject", auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params
    const userId = req.user.userId

    const call = await Call.findOne({ callId, receiverId: userId })
    if (!call) {
      return res.status(404).json({ error: "Call not found or you are not authorized to reject this call" })
    }

    if (call.status !== "initiated") {
      return res.status(400).json({ error: "Call is not in initiated state" })
    }

    call.status = "rejected"
    call.endTime = new Date()
    await call.save()

    res.json({ success: true })
  } catch (error) {
    console.error("Error rejecting call:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get call status (No auth required - anonymous caller can check status)
router.get("/:callId/status", generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params

    const call = await Call.findOne({ callId })
    if (!call) {
      return res.status(404).json({ error: "Call not found" })
    }

    res.json({
      success: true,
      status: call.status,
      callId: call.callId,
      duration: call.duration,
      answeredAt: call.answeredAt,
      endTime: call.endTime,
    })
  } catch (error) {
    console.error("Error getting call status:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get call history (AUTH REQUIRED - Only for logged-in users)
router.get("/history", auth, generalRateLimit, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const userId = req.user.userId

    const calls = await Call.find({
      $or: [
        { callerId: userId }, // Regular calls where user was caller
        { receiverId: userId }, // Calls where user was receiver (including anonymous calls)
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    // Populate user details for each call
    const populatedCalls = await Promise.all(
      calls.map(async (call) => {
        let caller = null
        if (call.callerId) {
          caller = await User.findOne({ userId: call.callerId }, "name avatar")
        }

        const receiver = await User.findOne({ userId: call.receiverId }, "name avatar")

        return {
          ...call,
          caller: caller || {
            name: call.callerInfo?.name || "Anonymous Caller",
            avatar: "",
            isAnonymous: true,
          },
          receiver: receiver || { name: "Unknown", avatar: "" },
        }
      }),
    )

    res.json({
      success: true,
      calls: populatedCalls,
      currentPage: Number.parseInt(page),
      totalPages: Math.ceil(
        (await Call.countDocuments({
          $or: [{ callerId: userId }, { receiverId: userId }],
        })) / limit,
      ),
    })
  } catch (error) {
    console.error("Error getting call history:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get call details (AUTH REQUIRED - Only for logged-in users)
router.get("/:callId", auth, generalRateLimit, async (req, res) => {
  try {
    const { callId } = req.params
    const userId = req.user.userId

    const call = await Call.findOne({
      callId,
      $or: [{ callerId: userId }, { receiverId: userId }],
    })

    if (!call) {
      return res.status(404).json({ error: "Call not found" })
    }

    // Populate user details
    let caller = null
    if (call.callerId) {
      caller = await User.findOne({ userId: call.callerId }, "name avatar")
    }

    const receiver = await User.findOne({ userId: call.receiverId }, "name avatar")

    res.json({
      success: true,
      call: {
        ...call.toObject(),
        caller: caller || {
          name: call.callerInfo?.name || "Anonymous Caller",
          avatar: "",
          isAnonymous: true,
        },
        receiver: receiver || { name: "Unknown", avatar: "" },
      },
    })
  } catch (error) {
    console.error("Error getting call details:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
