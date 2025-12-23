# CNC Request Form System - Setup Guide

## Overview

This guide will help you set up the complete request form system for the CNC Assam website, including:
- Supabase database configuration
- Google Sheets integration (optional backup)
- EmailJS email service
- Admin panel authentication

## Prerequisites

- Active Supabase account (free tier is sufficient)
- Google account for Sheets integration (optional)
- EmailJS account (free tier is sufficient)
- Vercel account for deployment

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `cnc-assam` (or your choice)
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 1.2 Create Database Tables

1. In your Supabase project, go to the **SQL Editor**
2. Copy the entire contents of `admin/config/supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the SQL
5. Verify tables are created by going to **Table Editor**

Expected tables:
- `service_requests` - Stores all service requests
- `admin_users` - Stores admin user accounts
- `admin_sessions` - Stores admin login sessions

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: `eyJhbGc...` (long string)
   - Service Role Key: `eyJhbGc...` (different long string)

### 1.4 Update Vercel Environment Variables

Add these to your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

---

## Step 2: Admin User Setup

### 2.1 Change Default Password

The SQL script creates a default admin user:
- Username: `admin`
- Password: `admin123`
- Role: `super_admin`

**IMPORTANT: Change this password immediately!**

To change the password:

1. Go to Supabase SQL Editor
2. Run this SQL (replace `YOUR_NEW_PASSWORD` with a strong password):

```sql
-- Hash your new password (this is a simple SHA-256 hash)
-- In production, use bcrypt. For now, you can use an online SHA-256 generator
UPDATE admin_users 
SET password_hash = 'YOUR_SHA256_HASHED_PASSWORD'
WHERE username = 'admin';
```

To generate SHA-256 hash of your password:
- Visit: https://emn178.github.io/online-tools/sha256.html
- Enter your password
- Copy the resulting hash
- Use it in the SQL above

### 2.2 Create Additional Admin Users

After logging in as super admin, you can create more users through the API or SQL:

```sql
INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
    'your_username',
    'your_email@example.com',
    'your_sha256_password_hash',
    'Your Full Name',
    'admin'
);
```

---

## Step 3: EmailJS Setup (For Email Notifications)

### 3.1 Create EmailJS Account

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Sign up for free account
3. Verify your email

### 3.2 Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Connect your Gmail account
   - **Outlook**: Connect your Outlook account
   - **Custom SMTP**: Use custom SMTP settings
4. Give it a Service ID (e.g., `service_cnc`)
5. Save the service

### 3.3 Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Set up template:

**Template Name**: `service_request_notification`

**Subject**:
```
New Service Request - {{offering_name}} - {{customer_name}}
```

**Content**:
```
New Service Request Received

Request ID: {{request_id}}
Date: {{submitted_at}}

Customer Information:
- Name: {{customer_name}}
- Email: {{customer_email}}
- Phone: {{customer_phone}}
- Address: {{customer_address}}

Service Details:
- Category: {{offering_category}}
- Offering: {{offering_name}}

Request Details:
{{request_details}}

View in Dashboard: https://your-domain.com/admin

---
This is an automated message from CNC Assam Website
```

4. Save the template and note the **Template ID**

### 3.4 Get Public Key

1. Go to **Account** > **General**
2. Copy your **Public Key** (starts with something like `user_...`)

### 3.5 Update Request Form Script

Edit `admin/scripts/request-form.js` and find the `sendEmail` function:

```javascript
// Replace these values:
await emailjs.send(
    'YOUR_SERVICE_ID',      // Replace with your Service ID
    'YOUR_TEMPLATE_ID',     // Replace with your Template ID
    templateParams,
    'YOUR_PUBLIC_KEY'       // Replace with your Public Key
);
```

### 3.6 Add EmailJS SDK

The EmailJS SDK is loaded from CDN. To add it to your offering pages, add this before the closing `</head>` tag:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```

---

## Step 4: Google Sheets Setup (Optional Backup Storage)

### 4.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "CNC Service Requests"
3. Create a sheet named "Service Requests"
4. Add headers in row 1:
   ```
   ID | Date | Category | Offering | Name | Email | Phone | Address | Details | Status | Priority | Page URL
   ```

### 4.2 Get Sheet ID

The Sheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

### 4.3 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Sheets API"
   - Click **Enable**
4. Create Service Account:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **Service Account**
   - Fill in details and click **Create**
   - Skip optional steps, click **Done**
5. Generate Key:
   - Click on the service account you just created
   - Go to **Keys** tab
   - Click **Add Key** > **Create New Key**
   - Choose **JSON** format
   - Download the key file

### 4.4 Share Sheet with Service Account

1. Open the JSON key file
2. Find the `client_email` field (looks like `xxxxx@xxxxx.iam.gserviceaccount.com`)
3. In Google Sheets, click **Share** button
4. Add the service account email with **Editor** permissions

### 4.5 Add to Vercel Environment Variables

From your JSON key file, add these to Vercel:

```
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Note**: The private key must include the actual newline characters `\n`

---

## Step 5: Deploy to Vercel

### 5.1 Verify Environment Variables

Make sure all environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_SHEETS_ID` (if using Google Sheets)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` (if using Google Sheets)
- `GOOGLE_PRIVATE_KEY` (if using Google Sheets)

### 5.2 Deploy

```bash
# If not already deployed
vercel --prod

# If already deployed, redeploy
vercel --prod
```

---

## Step 6: Testing

### 6.1 Test Admin Login

1. Go to `https://your-domain.com/admin`
2. Login with username `admin` and your password
3. Verify dashboard loads correctly

### 6.2 Test Request Form

1. Go to any offering page (e.g., `/offerings/manufacturing-of-products/namkeen.html`)
2. Click "Raise Request" button
3. Fill in the form
4. Submit and verify:
   - Success message appears
   - WhatsApp opens with message
   - Email is sent (check inbox)
   - Request appears in admin dashboard
   - Request is saved to Google Sheets (if configured)

### 6.3 Test Status Update

1. In admin dashboard, go to Service Requests
2. Click edit icon on a request
3. Change status (e.g., from "pending" to "in-progress")
4. Verify the status updates

---

## Step 7: Add Request Button to All Offering Pages

The request button is currently only on `namkeen.html`. To add it to all offering pages:

### 7.1 Add CSS Link

In the `<head>` section of each offering page, add:

```html
<link rel="stylesheet" href="../../admin/styles/request-form.css">
```

### 7.2 Add Script

Before the closing `</body>` tag, add:

```html
<script src="../../admin/scripts/request-form.js"></script>
```

### 7.3 Add Button

In the hero section of each page, add:

```html
<button class="raise-request-btn" onclick="requestForm.openModal()">
    <i class="fas fa-file-alt"></i> Raise Request
</button>
```

### 7.4 Automated Script (Optional)

You can use this Node.js script to automatically add the button to all offering pages:

```javascript
// Coming soon: automated script to update all pages
```

---

## Security Considerations

### Important Security Notes:

1. **Change Default Password**: The default admin password MUST be changed
2. **Use HTTPS**: Always use HTTPS in production
3. **Secure Environment Variables**: Never commit `.env` files to git
4. **Session Timeout**: Admin sessions expire after 8 hours
5. **Password Hashing**: Current implementation uses SHA-256; consider upgrading to bcrypt

### Recommended Improvements:

1. Implement bcrypt for password hashing
2. Add 2FA for admin login
3. Add rate limiting to API endpoints
4. Add CAPTCHA to request form
5. Implement email verification for requests

---

## Troubleshooting

### Request Form Not Appearing

- Check browser console for errors
- Verify CSS and JS files are loading
- Check file paths are correct relative to the page

### Admin Login Fails

- Verify Supabase credentials are correct
- Check if admin_users table exists
- Verify password hash matches

### Email Not Sending

- Verify EmailJS credentials
- Check EmailJS monthly limit (200 emails/month on free tier)
- Check browser console for errors
- Verify template ID matches

### Google Sheets Not Updating

- Verify service account has editor access
- Check environment variables are set correctly
- Verify Sheet ID is correct
- Check API logs in Vercel

### WhatsApp Not Opening

- Verify phone number format: +916002610858
- Check if pop-ups are blocked in browser
- Test WhatsApp link directly

---

## Deployment Exclusion (Optional)

If you want to test locally without deploying admin features:

### Create `.vercelignore`

```
# Exclude admin features from deployment
admin/
```

To deploy admin features later, remove or comment out the `admin/` line.

---

## Support

For issues or questions:
- Email: cncfoundation2021@gmail.com
- Phone: +916002610858

---

## License

© 2024 Care & Cure Foundation (CnC), Assam. All rights reserved.

