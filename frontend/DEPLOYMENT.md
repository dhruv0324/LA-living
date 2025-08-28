# 🚀 Vercel Deployment Guide

## Prerequisites

- ✅ GitHub repository with your code
- ✅ Supabase project set up
- ✅ Vercel account (free)

## Step 1: Create Vercel Account

1. **Visit [vercel.com](https://vercel.com)**
2. **Click "Sign Up"**
3. **Choose "Continue with GitHub"** (recommended)
4. **Authorize Vercel** to access your GitHub account

## Step 2: Deploy Your Project

### Option A: Import from GitHub (Recommended)

1. **In Vercel Dashboard, click "New Project"**
2. **Select "Import Git Repository"**
3. **Choose your GitHub repository**
4. **Configure project settings:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` (since your repo has frontend/backend structure)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts
```

## Step 3: Configure Environment Variables

**In Vercel Dashboard → Your Project → Settings → Environment Variables:**

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables (for backend integration):
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## Step 4: Get Supabase Credentials

1. **Go to [supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Select your project**
3. **Go to Settings → API**
4. **Copy:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Deploy and Test

1. **Click "Deploy" in Vercel**
2. **Wait for build to complete** (usually 2-5 minutes)
3. **Test your deployed app:**
   - ✅ Homepage loads
   - ✅ Authentication works
   - ✅ Navigation works
   - ✅ No console errors

## Step 6: Custom Domain (Optional)

1. **In Vercel Dashboard → Domains**
2. **Add your custom domain**
3. **Update DNS records** as instructed
4. **Wait for DNS propagation** (up to 48 hours)

## Troubleshooting

### Build Errors

**Common Issues:**
- **Missing dependencies**: Check `package.json`
- **TypeScript errors**: Fix type issues locally first
- **Environment variables**: Ensure all required vars are set

**Solutions:**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

### Runtime Errors

**Common Issues:**
- **CORS errors**: Backend not deployed yet
- **Authentication issues**: Check Supabase credentials
- **API calls failing**: Backend URL not configured

**Solutions:**
- Verify environment variables in Vercel
- Check browser console for errors
- Test API endpoints individually

### Performance Issues

**Optimizations:**
- ✅ Images are optimized
- ✅ Code splitting enabled
- ✅ Compression enabled
- ✅ CDN distribution

## Post-Deployment Checklist

- [ ] ✅ App loads without errors
- [ ] ✅ Authentication works
- [ ] ✅ All pages accessible
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive
- [ ] ✅ Performance is good
- [ ] ✅ Environment variables set
- [ ] ✅ Custom domain configured (if desired)

## Next Steps

After successful frontend deployment:

1. **Deploy backend to Railway** (see backend deployment guide)
2. **Update frontend API URL** to point to deployed backend
3. **Test full-stack functionality**
4. **Monitor performance** in Vercel Analytics

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**🎉 Congratulations! Your app is now live on Vercel!**
