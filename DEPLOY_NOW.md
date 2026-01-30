# 🚀 Quick Deploy to Render - Step by Step

## ✅ Prerequisites Complete:
- ✓ Git initialized
- ✓ Code committed
- ✓ Deployment files created (`build.sh`, `render.yaml`, `requirements.txt`)

---

## 📋 **STEP 1: Create GitHub Repository**

### Option A: Via GitHub Website (Easiest)
1. Go to: https://github.com/new
2. **Repository name**: `trailhead-leaderboard`
3. **Visibility**: Public (or Private)
4. **DON'T** initialize with README, .gitignore, or license
5. Click **Create repository**
6. Copy the commands shown (skip if using Option B)

### Option B: Via Command Line
Run these commands:
```bash
# Set your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/trailhead-leaderboard.git
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` with your actual GitHub username!

---

## 📋 **STEP 2: Deploy Backend to Render**

### 2.1 Create Render Account
1. Go to: https://render.com/
2. Click **Get Started**
3. Sign up with **GitHub** (recommended)

### 2.2 Create New Web Service
1. Dashboard: https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Click **Connect account** (if first time)
4. Find and click **Connect** next to `trailhead-leaderboard`

### 2.3 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name**: `trailhead-backend`
- **Region**: Choose closest to you (e.g., Singapore, Oregon)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: 
  ```bash
  chmod +x build.sh && ./build.sh
  ```
- **Start Command**:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

**Instance Type:**
- Select: `Free` (or `Starter $7/month` for better performance)

### 2.4 Add Environment Variables
Click **Advanced** → **Add Environment Variable**

Add these:
1. **PYTHON_VERSION** = `3.11.0`
2. **PLAYWRIGHT_BROWSERS_PATH** = `/opt/render/project/.cache/ms-playwright`

### 2.5 Create Web Service
1. Click **Create Web Service**
2. **Wait 10-15 minutes** for first deployment
3. Watch the logs - you'll see Playwright installing

### 2.6 Get Your Backend URL
Once deployed, you'll see:
```
Your service is live 🎉
https://trailhead-backend-xxxx.onrender.com
```

**COPY THIS URL!**

---

## 📋 **STEP 3: Update Vercel Frontend**

### 3.1 Update Environment Variable
```bash
cd frontend
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# When prompted, paste: https://trailhead-backend-xxxx.onrender.com
```

### 3.2 Redeploy
```bash
vercel --prod
```

---

## 🎉 **STEP 4: Test Your App!**

Visit: **https://dhanushtrailheadleaderboard.vercel.app**

Everything should work now:
- ✅ Leaderboard loads
- ✅ Excel upload works
- ✅ Scraping works
- ✅ Excel download works
- ✅ No more tunneling needed!

---

## ⚠️ Important Notes

### Free Tier Limitations:
- Backend **spins down** after 15 min of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to $7/month to avoid this

### MongoDB:
If using **local MongoDB**, you need to migrate to **MongoDB Atlas**:
1. Create free cluster: https://mongodb.com/atlas
2. Get connection string
3. Update `database.py` with new connection string
4. Redeploy

### Monitoring:
- Render Dashboard: https://dashboard.render.com/
- View logs in real-time
- Set up health checks

---

## 🆘 Troubleshooting

### Build Fails:
- Check Render logs
- Verify all files committed to Git
- Ensure `build.sh` is in `backend/` folder

### Playwright Fails:
- Free tier may struggle with Playwright
- Consider upgrading to paid plan ($7/month)
- Alternative: Use Railway instead

### CORS Errors:
- Make sure Render URL is in `backend/main.py` origins
- Redeploy if you added it after first deploy

---

## 🔄 Future Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

Render will automatically redeploy! 🎉
