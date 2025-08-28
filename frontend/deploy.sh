#!/bin/bash

# 🚀 LA Living Finance - Frontend Deployment Script
# This script prepares your frontend for Vercel deployment

echo "🚀 Preparing frontend for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# Lint
echo "🧹 Running linter..."
npm run lint

# Build
echo "🏗️ Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Your app is ready for deployment."
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Sign up/Login with GitHub"
    echo "3. Click 'New Project'"
    echo "4. Import your GitHub repository"
    echo "5. Set Root Directory to 'frontend'"
    echo "6. Add environment variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "7. Deploy!"
    echo ""
    echo "📚 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed. Please fix the errors above before deploying."
    exit 1
fi
