# Connecting Vercel Frontend to Local Backend

## The Problem
Your Vercel-hosted frontend cannot access `http://localhost:8000` because browsers block websites from accessing localhost addresses (security feature called "Private Network Access").

## Solution: Use ngrok

ngrok creates a secure public URL that forwards to your local backend.

### Step 1: Install ngrok
Already done! ✅

### Step 2: Start ngrok
Open a new terminal and run:
```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8000
```

Copy that HTTPS URL!

### Step 3: Update Vercel Environment Variable

#### Option A: Via Vercel Dashboard
1. Go to: https://vercel.com/dhanushs-projects-7786e9e3/dhanush_trailhead_leaderboard/settings
2. Click "Environment Variables"
3. Add new variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-ngrok-url.ngrok-free.app` (paste your ngrok URL)
   - Environment: Production
4. Click "Save"

#### Option B: Via Command Line
```bash
cd frontend
vercel env add VITE_API_URL production
# When prompted, paste: https://your-ngrok-url.ngrok-free.app
```

### Step 4: Redeploy Frontend
```bash
cd frontend
vercel --prod
```

### Step 5: Test!
Visit: https://dhanushtrailheadleaderboard.vercel.app

Your frontend will now communicate with your local backend through ngrok!

---

## Important Notes:

1. **Keep ngrok running**: Don't close the ngrok terminal
2. **Free ngrok URLs change**: Every time you restart ngrok, you get a new URL (need to update Vercel env var)
3. **Upgrade ngrok**: For permanent URLs, use ngrok paid plan
4. **Security**: ngrok URLs are public - anyone can access your backend

---

## Alternative: Deploy Backend

For production, deploy backend to:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean**: https://www.digitalocean.com

This eliminates the need for ngrok!
