// Updated server.js with better CORS and Socket.IO configuration
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const socketIo = require("socket.io")
const http = require("http")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const qrRoutes = require("./routes/qr")
const callRoutes = require("./routes/calls")
const notificationRoutes = require("./routes/notifications")
const agoraRoutes = require("./routes/agora")
const { generalRateLimit } = require("./middleware/rateLimiter")

const app = express()
const server = http.createServer(app)

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5500",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

// Enhanced Socket.IO configuration
const io = socketIo(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  allowEIO3: true,
})

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)
app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(generalRateLimit)

// Database connection with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully")
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error)
    process.exit(1)
  })

// Enhanced Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id)

  socket.on("join-user", (userId) => {
    socket.join(userId)
    console.log(`🏠 User ${userId} joined room`)
    socket.emit("joined", { userId, socketId: socket.id })
  })

  socket.on("call-initiated", (data) => {
    console.log("📞 Call initiated:", data)
    socket.to(data.receiverId).emit("incoming-call", data)
  })

  socket.on("call-answered", (data) => {
    console.log("✅ Call answered:", data)
    socket.to(data.callerId).emit("call-accepted", data)
  })

  socket.on("call-rejected", (data) => {
    console.log("❌ Call rejected:", data)
    socket.to(data.callerId).emit("call-rejected", data)
  })

  socket.on("call-ended", (data) => {
    console.log("📴 Call ended:", data)
    socket.to(data.participantId).emit("call-ended", data)
  })

  socket.on("disconnect", (reason) => {
    console.log("👋 User disconnected:", socket.id, "Reason:", reason)
  })

  socket.on("error", (error) => {
    console.error("🔥 Socket error:", error)
  })
})

// Health check endpoint with more details
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    agora: {
      appId: process.env.AGORA_APP_ID ? "configured" : "missing",
      certificate: process.env.AGORA_APP_CERTIFICATE ? "configured" : "missing",
    },
  })
})

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "QR Calling API",
    version: "1.0.0",
    description: "Backend API for QR Code calling application",
    endpoints: {
      auth: "/api/auth",
      qr: "/api/qr",
      calls: "/api/calls",
      notifications: "/api/notifications",
      agora: "/api/agora",
    },
    status: "running",
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/qr", qrRoutes)
app.use("/api/calls", callRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/agora", agoraRoutes)

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌐 Health check: http://localhost:${PORT}/health`)
  console.log(`📡 API info: http://localhost:${PORT}/api`)
})

module.exports = { app, io }
