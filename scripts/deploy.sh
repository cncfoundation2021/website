#!/bin/bash

# Deploy script that syncs with GitHub before deploying to Vercel
set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Step 1: Check git status
echo "📋 Checking git status..."
git status

# Step 2: Stage all changes
echo "📦 Staging all changes..."
git add .

# Step 3: Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Step 4: Commit changes with timestamp
    echo "💾 Committing changes..."
    COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG" || echo "⚠️  No changes to commit or commit failed"
fi

# Step 5: Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main || echo "⚠️  Push failed or no changes to push"

# Step 6: Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"

