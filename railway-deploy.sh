#!/bin/bash

# Railway Deployment Script for QR Calling Backend

echo "🚀 Deploying QR Calling Backend to Railway..."

# 1. Install Railway CLI (if not installed)
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# 2. Login to Railway
echo "🔐 Login to Railway..."
railway login

# 3. Initialize Railway project
echo "🎯 Initializing Railway project..."
railway init

# 4. Set environment variables
echo "⚙️ Setting up environment variables..."
echo "Please set these environment variables in Railway dashboard:"
echo "- MONGODB_URI"
echo "- JWT_SECRET"
echo "- AGORA_APP_ID"
echo "- AGORA_APP_CERTIFICATE"
echo "- NODE_ENV=production"

# 5. Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your backend will be available at: https://your-app.railway.app"
echo "📝 Don't forget to update your frontend URLs!"
