@echo off
echo 🚀 Deploying CNC Assam Website to GitHub Pages...
echo.
echo Please provide your GitHub repository URL:
echo (Example: https://github.com/yourusername/cnc-assam-website.git)
echo.
set /p GITHUB_URL="GitHub URL: "

echo.
echo 📡 Adding GitHub remote...
git remote add origin %GITHUB_URL%

echo 🌿 Setting main branch...
git branch -M main

echo ⬆️ Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Deployment complete!
echo 🔗 Your website will be available at: https://YOUR_USERNAME.github.io/cnc-assam-website
echo 📝 Don't forget to enable GitHub Pages in your repository settings!
echo.
pause
