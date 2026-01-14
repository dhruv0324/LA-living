# 🚨 Deployment Troubleshooting Guide

## API Not Sending Requests - Step by Step Fix

### Step 1: Check Browser Console
After the new deployment, open your Vercel app and check the browser console (F12). You should see:
- `🔗 API Base URL: [your-url]`
- `🌍 Environment: production`
- `📦 NEXT_PUBLIC_API_URL from env: [your-url]`

**If you see `localhost:8000` or `undefined`:**
- The environment variable is NOT set correctly in Vercel

### Step 2: Verify Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Check these variables exist:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-name.onrender.com` (NO trailing slash!)
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-key-here`

**CRITICAL:**
- Variable name must be EXACTLY: `NEXT_PUBLIC_API_URL` (case-sensitive)
- Value must start with `https://` (not `http://`)
- NO trailing slash at the end
- Must be set for **Production**, **Preview**, and **Development** environments

### Step 3: Redeploy After Setting Variables

**IMPORTANT:** After setting/changing environment variables:
1. Go to **Deployments** tab
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

**OR** trigger a new deployment by:
- Making a small commit and pushing to main
- Or clicking "Redeploy" in Vercel dashboard

### Step 4: Verify Backend is Running

1. Open your Render backend URL in a browser: `https://your-backend.onrender.com`
2. You should see: `{"message":"Expense Tracker API"}`
3. Check `/health` endpoint: `https://your-backend.onrender.com/health`
4. Should return: `{"status":"healthy"}`

**If backend is not responding:**
- Check Render dashboard for errors
- Free tier services spin down after 15 min inactivity (first request may be slow)

### Step 5: Check CORS Configuration

Your backend CORS is configured for:
- `http://localhost:3000` (development)
- `https://*.vercel.app` (all Vercel domains)

If your Vercel domain is different, you may need to update `backend/main.py` CORS settings.

### Step 6: Test API Directly

Open browser console on your Vercel app and run:
```javascript
fetch('https://your-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**If this fails:**
- Backend is down or URL is wrong
- CORS issue (check browser console for CORS error)

**If this works but app doesn't:**
- Environment variable issue
- Check console logs for API URL being used

### Step 7: Common Mistakes

❌ **Wrong:**
- `NEXT_PUBLIC_API_URL=https://backend.onrender.com/` (trailing slash)
- `NEXT_PUBLIC_API_URL=http://backend.onrender.com` (http instead of https)
- `NEXT_PUBLIC_API_URL=backend.onrender.com` (missing https://)
- Variable name: `NEXT_PUBLIC_API_BASE_URL` (wrong name)

✅ **Correct:**
- `NEXT_PUBLIC_API_URL=https://backend.onrender.com` (no trailing slash)

### Step 8: Verify in Network Tab

1. Open browser DevTools → Network tab
2. Try to use the app (login, load data, etc.)
3. Look for requests to your backend
4. Check:
   - **Request URL**: Should be `https://your-backend.onrender.com/api/...`
   - **Status**: Should be 200, 201, etc. (not CORS errors)
   - **Request Headers**: Should include `Content-Type: application/json`

### Step 9: Check Render Backend Logs

1. Go to Render dashboard
2. Click on your backend service
3. Go to **Logs** tab
4. Look for:
   - Incoming requests (should see requests from Vercel)
   - CORS errors
   - Application errors

**If you see no requests:**
- Frontend is not sending requests (environment variable issue)

**If you see CORS errors:**
- Update CORS in `backend/main.py` to include your Vercel domain

### Step 10: Nuclear Option - Full Reset

If nothing works:

1. **Delete all environment variables in Vercel**
2. **Re-add them one by one:**
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-key`
3. **Redeploy** (don't just save - actually redeploy!)
4. **Wait 2-3 minutes** for deployment
5. **Hard refresh** browser (Ctrl+Shift+R or Cmd+Shift+R)
6. **Check console** for the debug logs

## Quick Checklist

- [ ] Environment variables set in Vercel
- [ ] Variable names are EXACT (case-sensitive)
- [ ] API URL has `https://` and NO trailing slash
- [ ] Redeployed after setting variables
- [ ] Backend is running and accessible
- [ ] Browser console shows correct API URL
- [ ] Network tab shows requests being sent
- [ ] No CORS errors in console

## Still Not Working?

Check the browser console for the new debug logs. They will tell you:
- What API URL is being used
- If environment variable is set
- What errors are occurring
- Full request/response details

Share the console output and we can debug further!

