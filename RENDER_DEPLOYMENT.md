# Render Deployment Guide

## Prerequisites
1. GitHub account
2. Render account (free): https://render.com/

## Step 1: Push Code to GitHub

If not already done:
```bash
cd d:\projects\trailhead
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trailhead-leaderboard.git
git push -u origin main
```

## Step 2: Deploy Backend on Render

### Option A: Via Dashboard (Recommended)

1. **Go to Render**: https://dashboard.render.com/
2. **New** → **Web Service**
3. **Connect GitHub Repository**: 
   - Click "Connect account" if needed
   - Find and select your `trailhead-leaderboard` repo
4. **Configure Service**:
   - **Name**: `trailhead-backend`
   - **Region**: Choose closest to you
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free` (or upgrade if needed)

5. **Environment Variables** (Click "Advanced"):
   - Add `PYTHON_VERSION` = `3.11.0`
   - Add `PLAYWRIGHT_BROWSERS_PATH` = `/opt/render/project/.cache/ms-playwright`

6. **Click "Create Web Service"**

### Option B: Via render.yaml (Automated)

1. Move `render.yaml` to project root:
   ```bash
   move backend\render.yaml .
   ```
2. Push to GitHub
3. Render will auto-detect and deploy

## Step 3: Wait for Deployment

- First deployment takes ~10-15 minutes (Playwright installation)
- Watch the logs in Render dashboard
- You'll get a URL like: `https://trailhead-backend-xxxx.onrender.com`

## Step 4: Update Vercel Frontend

1. Copy your Render backend URL
2. Update Vercel environment variable:
   ```bash
   cd frontend
   vercel env rm VITE_API_URL production
   vercel env add VITE_API_URL production
   # Paste: https://trailhead-backend-xxxx.onrender.com
   vercel --prod
   ```

## Step 5: Test!

Visit: https://dhanushtrailheadleaderboard.vercel.app

---

## Important Notes

### Free Tier Limitations:
- **Spins down after 15 min of inactivity**
- First request after spin-down takes ~30 seconds
- 750 hours/month free

### Upgrading:
- **$7/month**: No spin-down, better performance
- Recommended for production use

### MongoDB:
Your current MongoDB connection should work if it's:
- MongoDB Atlas (cloud)
- Publicly accessible

If using local MongoDB, you'll need MongoDB Atlas:
1. Create free cluster: https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Add to Render environment variables

---

## Troubleshooting

### Build Fails:
- Check Render logs
- Verify `build.sh` has execute permissions
- Ensure all dependencies in requirements.txt

### Playwright Errors:
- Render free tier may struggle with Playwright
- Consider upgrading to paid tier
- Monitor memory usage

### CORS Errors:
- Add Render URL to `main.py` origins list
- Redeploy backend

---

## Alternative: Railway

If Render doesn't work well:
1. Railway has better Playwright support
2. Similar free tier
3. Easier setup: https://railway.app
