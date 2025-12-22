# Railway Deployment Guide for CIIS Backend

## Prerequisites

- Railway account (sign up at railway.app)
- Firebase project with service account credentials
- GitHub repository connected
- **Your `.env` file in the root directory** (we'll copy values from here)

## Important: Environment Variables Setup

🔴 **Your project has `.env` in the root directory**, but Railway won't access it automatically.

You need to **manually copy environment variables** from root `.env` to Railway dashboard.

Quick reference: Check `backend/railway.env.example` for the template.

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Add Railway config"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your CIIS repository
   - Railway will auto-detect the backend

3. **Configure Service**
   - Root Directory: `/backend`
   - Start Command: `npm start` (auto-detected)
   - Build Command: `npm install && npm run build` (auto-detected)

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize Railway project
railway init

# Link to existing project or create new
railway link

# Deploy
railway up
```

## Environment Variables

⚠️ **IMPORTANT**: Railway doesn't use `.env` files. You must set environment variables manually in the Railway dashboard.

Your project has `.env` in the root directory, but Railway won't access it. Follow these steps:

### Setting Environment Variables

1. **Open your `.env` file in the root directory**
2. **Copy all values**
3. **Go to Railway Dashboard → Your Service → Variables**
4. **Add each variable manually** or use bulk add:

```bash
# Click "RAW Editor" in Railway Variables tab and paste:

# Node Environment
NODE_ENV=production

# Firebase Admin SDK (copy from your root .env file)
FIREBASE_PROJECT_ID=ciis-2882b
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@ciis-2882b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-here\n-----END PRIVATE KEY-----"

# Or use service account JSON (alternative - copy from .env)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"ciis-2882b",...}

# Server Configuration
PORT=${{PORT}}  # Railway auto-assigns this
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Optional: Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Important Notes

- Railway provides `${{PORT}}` automatically - use it
- For `FIREBASE_PRIVATE_KEY`, replace `\n` with actual newlines or use the JSON method
- Add your Vercel frontend URL to `CORS_ORIGIN`

## Post-Deployment Setup

### 1. Check Deployment Logs

```bash
railway logs
```

### 2. Test Health Endpoint

```bash
curl https://your-app.railway.app/health
```

### 3. Get Your Backend URL

- Go to Railway Dashboard → Settings → Domains
- Copy the generated URL: `https://your-app.railway.app`
- Update your frontend `NEXT_PUBLIC_API_BASE_URL` with this URL

### 4. Update Frontend Environment

```bash
# In Vercel or your frontend deployment
NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
```

## Railway Configuration Files

### `railway.json` ✅

Defines build and deployment settings

### `nixpacks.toml` ✅

Specifies Node.js version and build phases

### `.railwayignore` ✅

Excludes unnecessary files from deployment

## Monitoring

### View Logs

```bash
railway logs
```

### View Metrics

- Go to Railway Dashboard → Metrics
- Monitor CPU, Memory, Network usage

### Set up Alerts

- Dashboard → Settings → Notifications
- Configure Discord/Slack webhooks

## Troubleshooting

### Build Fails

```bash
# Check logs
railway logs

# Common fixes:
# 1. Ensure package.json has correct scripts
# 2. Check Node version compatibility (uses Node 20)
# 3. Verify all dependencies are in package.json
```

### App Crashes on Start

```bash
# Check environment variables
railway variables

# Verify Firebase credentials
railway run node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

### CORS Errors

- Update `CORS_ORIGIN` to include your frontend URL
- Redeploy after changing variables

### Cold Starts (Free Tier)

Railway free tier sleeps after inactivity:

- First request may take 10-30 seconds
- Use a health check service like UptimeRobot to keep it warm
- Or upgrade to paid tier ($5/month)

## Cost Optimization

### Free Tier Limits

- $5 free credit per month
- ~500 hours of runtime
- Suitable for development/testing

### Stay Within Free Tier

```bash
# Use execution time efficiently
# Monitor usage: Railway Dashboard → Usage
```

### Upgrade When Needed

- Hobby Plan: $5/month per project
- No sleep
- Better performance
- Custom domains

## Deployment Checklist

- [ ] Firebase credentials configured
- [ ] CORS_ORIGIN set to frontend URL
- [ ] All environment variables added
- [ ] Health endpoint working
- [ ] Logs show successful start
- [ ] API endpoints responding
- [ ] Frontend connected and working
- [ ] WebSocket/SSE working (if using)

## Useful Commands

```bash
# Deploy changes
railway up

# View environment variables
railway variables

# Add environment variable
railway variables set KEY=VALUE

# Restart service
railway restart

# View service status
railway status

# Open in browser
railway open

# SSH into container (Pro plan)
railway run bash
```

## Next Steps

1. Deploy frontend to Vercel
2. Update frontend API URL
3. Test full application flow
4. Set up monitoring/alerts
5. Configure custom domain (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- CIIS Issues: https://github.com/deepaksoni47/CIIS/issues
