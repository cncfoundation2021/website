#!/bin/bash

# Deploy script for Vercel production deployment
# IMPORTANT: Test locally first using 'npm run dev' before deploying
# Sync to GitHub separately using 'npm run sync:git' if needed
set -e  # Exit on error

echo "🚀 Starting Vercel deployment..."
echo "⚠️  Make sure you have tested locally first!"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  WARNING: You have uncommitted changes."
    echo "   Consider testing locally and committing before deploying."
    read -p "   Continue with deployment anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Test locally and commit changes first."
        exit 1
    fi
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel production..."
vercel --prod

echo "✅ Deployment complete!"

