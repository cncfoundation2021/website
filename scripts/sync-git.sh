#!/bin/bash

# Git sync script - Syncs local changes to GitHub
# Use this after testing locally and before deploying
set -e  # Exit on error

echo "🔄 Starting Git sync process..."

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
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG" || echo "⚠️  Commit failed"
fi

# Step 5: Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main || echo "⚠️  Push failed or no changes to push"

echo "✅ Git sync complete!"

