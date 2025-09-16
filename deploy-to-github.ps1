# PowerShell script to deploy to GitHub Pages
# Run this script after setting up your GitHub repository

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUrl
)

Write-Host "🚀 Deploying CNC Assam Website to GitHub Pages..." -ForegroundColor Green

# Add GitHub remote
Write-Host "📡 Adding GitHub remote..." -ForegroundColor Yellow
git remote add origin $GitHubUrl

# Set main branch
Write-Host "🌿 Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Your website will be available at: https://YOUR_USERNAME.github.io/cnc-assam-website" -ForegroundColor Cyan
Write-Host "📝 Don't forget to enable GitHub Pages in your repository settings!" -ForegroundColor Yellow
