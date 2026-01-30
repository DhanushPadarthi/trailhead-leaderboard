# Vercel Deployment Guide

## Step 1: Install Vercel CLI (Already Done!)
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```
This will open a browser for authentication.

## Step 3: Deploy
Navigate to frontend folder and run:
```bash
cd frontend
vercel
```

Follow the prompts:
1. Set up and deploy? → **Yes**
2. Which scope? → Choose your account
3. Link to existing project? → **No**
4. Project name? → **trailhead-leaderboard** (or your choice)
5. In which directory is your code? → **./** (current directory)
6. Want to override settings? → **No**

## Step 4: After Deployment

You'll get a URL like: `https://trailhead-leaderboard-xxx.vercel.app`

### Important: Expose Your Local Backend

Your frontend on Vercel needs to talk to your local backend. Use **ngrok**:

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 8000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update frontend environment variable:
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-ngrok-url`
5. Redeploy: `vercel --prod`

## Alternative: Keep Backend Local (For Testing Only)

The Vercel deployment will work but will show empty data unless you:
- Use ngrok to expose your local backend, OR
- Deploy backend to Railway/Render

---

## Quick Deploy Command

For production deployment:
```bash
vercel --prod
```

This skips preview and deploys directly to production.
