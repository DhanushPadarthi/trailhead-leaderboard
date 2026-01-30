# 🔐 MongoDB Atlas Setup Guide

## Step 1: Get Your MongoDB Password

You need your MongoDB Atlas password for user `padarthidhanush_db_user`.

If you don't remember it:
1. Go to: https://cloud.mongodb.com/
2. Navigate to: **Database Access**
3. Find user: `padarthidhanush_db_user`
4. Click **Edit** → **Edit Password** → Set a new password
5. **Copy the password!**

---

## Step 2: Update Local .env File

Open: `backend/.env` and replace `YOUR_ACTUAL_PASSWORD_HERE` with your actual password:

```env
MONGODB_USERNAME=padarthidhanush_db_user
MONGODB_PASSWORD=your_actual_password_here
MONGODB_CLUSTER=trailhead.ghxkwl0.mongodb.net
MONGODB_DATABASE=trailhead_leaderboard
```

**Important**: 
- Don't use quotes around the password
- Special characters are OK - they will be URL-encoded automatically

---

## Step 3: Add to Render Environment Variables

1. Go to Render dashboard: https://dashboard.render.com/
2. Click on your `trailhead-leaderboard` service
3. Go to **Environment** tab
4. Add these variables:
   - `MONGODB_USERNAME` = `padarthidhanush_db_user`
   - `MONGODB_PASSWORD` = `your_actual_password`
   - `MONGODB_CLUSTER` = `trailhead.ghxkwl0.mongodb.net`
   - `MONGODB_DATABASE` = `trailhead_leaderboard`
5. Click **Save Changes**
6. Render will automatically redeploy

---

## Step 4: Test Locally

```bash
cd backend
python main.py
```

If it connects successfully, you'll see:
```
Starting up: Initializing browser...
```

If there's a connection error, check your MongoDB Atlas:
- IP Whitelist: Add `0.0.0.0/0` (allow from anywhere)
- Database user exists with correct password

---

## Step 5: Push Changes to GitHub

```bash
git add .
git commit -m "Add MongoDB Atlas support"
git push
```

Render will auto-deploy with the new configuration!

---

## ⚠️ Security Notes

- `.env` file is in `.gitignore` - it won't be committed
- Never commit passwords to Git
- Use environment variables in production (Render)
- The password is URL-encoded automatically to handle special characters
