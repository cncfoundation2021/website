# GitHub Pages Setup Guide

## Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `cnc-assam-website`
3. Description: "CNC Assam Website - Government-style bilingual website"
4. Make it **Public** (required for free GitHub Pages)
5. Don't initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Connect Local Repository to GitHub
After creating the repository, run these commands in your terminal:

```bash
# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cnc-assam-website.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click "Save"

## Step 4: Access Your Website
Your website will be available at:
`https://YOUR_USERNAME.github.io/cnc-assam-website`

## Step 5: Custom Domain (Optional)
If you have a custom domain:
1. In the Pages settings, add your custom domain
2. Update your domain's DNS settings to point to GitHub Pages
3. Add a CNAME file to your repository root

## Notes
- It may take a few minutes for the site to be available after enabling Pages
- GitHub Pages supports static HTML, CSS, and JavaScript
- Your site will automatically update when you push changes to the main branch
