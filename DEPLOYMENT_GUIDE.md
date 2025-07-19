# 🚀 QR Calling Backend Deployment Guide

## Option 1: Railway (Recommended)

### Step 1: Prepare Your Code
1. Make sure your `package.json` has the correct start script
2. Create `.env.example` with all required variables
3. Ensure your server listens on `process.env.PORT`

### Step 2: Deploy to Railway
\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
\`\`\`

### Step 3: Set Environment Variables
In Railway dashboard, add:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret key
- `AGORA_APP_ID` - Your Agora App ID
- `AGORA_APP_CERTIFICATE` - Your Agora Certificate
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - Your Vercel app URL

### Step 4: Update Frontend
Update your Vercel app to use the new backend URL:
\`\`\`javascript
// Replace localhost:5000 with your Railway URL
const API_BASE = 'https://your-app.railway.app'
\`\`\`

## Option 2: Render

### Step 1: Connect GitHub
1. Push your backend code to GitHub
2. Go to render.com
3. Connect your repository

### Step 2: Configure Build
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node

### Step 3: Set Environment Variables
Add the same variables as Railway

## Option 3: Heroku

### Step 1: Install Heroku CLI
\`\`\`bash
npm install -g heroku
\`\`\`

### Step 2: Deploy
\`\`\`bash
heroku create your-app-name
git push heroku main
\`\`\`

### Step 3: Set Config Vars
\`\`\`bash
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
# ... add all other variables
\`\`\`

## 🔧 Post-Deployment Checklist

### 1. Update CORS Settings
Make sure your backend allows requests from your Vercel domain:
\`\`\`javascript
const corsOptions = {
  origin: [
    "https://your-vercel-app.vercel.app",
    "http://localhost:3000" // for local development
  ]
}
\`\`\`

### 2. Update Frontend URLs
In your Vercel app, replace all `localhost:5000` with your deployed backend URL.

### 3. Test the Connection
1. Visit your deployed backend health endpoint: `https://your-backend.railway.app/health`
2. Should return: `{"status": "OK", ...}`

### 4. Test Full Flow
1. Open receiver page on Vercel
2. Login with test credentials
3. Open caller page on different device
4. Test voice calling

## 🚨 Troubleshooting

### Backend Not Starting
- Check logs in your deployment platform
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### CORS Errors
- Add your Vercel domain to CORS origins
- Check that HTTPS is used (not HTTP)

### Socket.IO Issues
- Verify WebSocket support on your platform
- Check that Socket.IO transports are configured correctly

### Agora Connection Problems
- Verify Agora credentials are correct
- Check token generation in logs

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| Railway | Yes (limited) | $5/month | Development & Production |
| Render | Yes (limited) | $7/month | Simple deployment |
| Heroku | No | $7/month | Enterprise features |
| DigitalOcean | No | $5/month | Performance |

## 🎯 Recommendation

**For your QR calling app, use Railway because:**
- ✅ Great WebSocket/Socket.IO support
- ✅ Easy MongoDB integration
- ✅ Simple deployment process
- ✅ Good free tier for testing
- ✅ Affordable scaling

## 📞 Final Setup

Once deployed:
1. **Backend URL:** `https://your-app.railway.app`
2. **Frontend URL:** `https://your-app.vercel.app`
3. **Test endpoints:**
   - Health: `/health`
   - API Info: `/api`
   - Auth: `/api/auth/login`

Your QR calling system will be fully cloud-hosted and accessible worldwide! 🌍
