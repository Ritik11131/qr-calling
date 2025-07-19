// Railway configuration for QR Calling Backend
module.exports = {
  // Railway will automatically detect this as a Node.js app
  build: {
    command: "npm install",
  },
  start: {
    command: "npm start",
  },
  environment: {
    NODE_ENV: "production",
    PORT: "$PORT", // Railway provides this automatically
  },
}
