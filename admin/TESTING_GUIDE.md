# Local Testing Guide

## Prerequisites

Before testing locally, ensure you have:
- [ ] Supabase project created with tables set up
- [ ] Environment variables configured in `.env` (for local testing)
- [ ] Node.js installed (v14+)

## Create Local Environment File

Create a `.env` file in the project root:

```bash
# .env (DO NOT COMMIT TO GIT)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Optional: Google Sheets
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key"
```

## Test 1: Serve the Website Locally

### Option A: Using Python (Simplest)

```bash
# Navigate to project directory
cd "C:\Users\wasim\Desktop\CNC Assam Website"

# Start server
python -m http.server 8000

# Open browser to:
http://localhost:8000
```

### Option B: Using Node.js http-server

```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to project directory
cd "C:\Users\wasim\Desktop\CNC Assam Website"

# Start server
http-server -p 8000

# Open browser to:
http://localhost:8000
```

### Option C: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Note:** API endpoints won't work locally without a proper backend server. You'll need to deploy to Vercel to test full functionality, or use Vercel CLI locally.

## Test 2: Run with Vercel CLI (Recommended for Full Testing)

```bash
# Install Vercel CLI (one time)
npm install -g vercel

# Navigate to project directory
cd "C:\Users\wasim\Desktop\CNC Assam Website"

# Link to your Vercel project (one time)
vercel link

# Run development server
vercel dev

# Open browser to:
http://localhost:3000
```

This will run serverless functions locally, allowing you to test the full functionality.

## Test 3: Request Form Functionality

### Steps to Test:

1. **Navigate to a test page:**
   ```
   http://localhost:3000/offerings/manufacturing-of-products/namkeen.html
   ```

2. **Click "Raise Request" button**
   - Button should appear in the hero section
   - Modal should open with smooth animation

3. **Verify form fields:**
   - [ ] Personal information section appears
   - [ ] Offering fields are pre-filled and read-only
   - [ ] Category-specific fields appear
   - [ ] Additional requirements field appears

4. **Test validation:**
   - [ ] Try submitting with empty required fields (should show errors)
   - [ ] Enter invalid email (should show error)
   - [ ] Enter invalid phone (should show error)
   - [ ] Fill all fields correctly (errors should clear)

5. **Submit form:**
   - [ ] Click "Submit Request"
   - [ ] Loading state should show
   - [ ] Success message should appear
   - [ ] WhatsApp should open in new tab (if not blocked)

6. **Verify data saved:**
   - Check Supabase table for new entry
   - Check Google Sheets for new row (if configured)
   - Check email inbox (if EmailJS configured)

## Test 4: Admin Panel

### Test Login:

1. **Navigate to admin:**
   ```
   http://localhost:3000/admin
   ```

2. **Should redirect to:**
   ```
   http://localhost:3000/admin/pages/login.html
   ```

3. **Test login form:**
   - [ ] Enter wrong username (should show error)
   - [ ] Enter wrong password (should show error)
   - [ ] Enter correct credentials (default: admin/admin123)
   - [ ] Should redirect to dashboard

### Test Dashboard:

1. **Overview section:**
   - [ ] Statistics cards display correct numbers
   - [ ] Recent requests table shows data
   - [ ] All data loads without errors

2. **Service Requests section:**
   - [ ] Click "Service Requests" in sidebar
   - [ ] All requests display in table
   - [ ] Filter by status (select different statuses)
   - [ ] Filter by category (select different categories)
   - [ ] Search by customer name/email/phone
   - [ ] Pagination works (if > 50 requests)

3. **Request details:**
   - [ ] Click "View" (eye icon) on a request
   - [ ] Modal opens with full details
   - [ ] All information displays correctly
   - [ ] Close modal works

4. **Update status:**
   - [ ] Click "Edit" (pencil icon) on a request
   - [ ] Enter new status in prompt
   - [ ] Verify status updates in table
   - [ ] Verify change persists after refresh

5. **Logout:**
   - [ ] Click "Logout" button
   - [ ] Redirects to login page
   - [ ] Session is cleared
   - [ ] Cannot access dashboard without login

## Test 5: Mobile Responsiveness

### Using Browser DevTools:

1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Test different device sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)

### Check:
- [ ] Request form modal is readable
- [ ] Form fields are easily tappable
- [ ] Admin sidebar collapses to hamburger menu
- [ ] Admin tables scroll horizontally
- [ ] All buttons are accessible
- [ ] Text is readable without zooming

## Test 6: Cross-Browser Testing

Test in multiple browsers:

- [ ] **Chrome/Edge** (Chromium-based)
  - Full functionality
  
- [ ] **Firefox**
  - Request form works
  - Admin panel works
  
- [ ] **Safari** (if available)
  - Request form works
  - Admin panel works

## Test 7: Error Scenarios

### Test Error Handling:

1. **Network error simulation:**
   - Open DevTools > Network tab
   - Set throttling to "Offline"
   - Try submitting form
   - Should show error message

2. **Invalid data:**
   - Try submitting form with very long text (>1000 chars)
   - Try special characters in fields
   - Try SQL injection attempts (should be sanitized)

3. **Session expiry:**
   - Login to admin panel
   - Wait 8+ hours (or manually delete session in Supabase)
   - Try to access dashboard
   - Should redirect to login

## Common Issues & Solutions

### Issue: "Request form not appearing"
**Solution:** 
- Check browser console for errors
- Verify CSS and JS files are loading (Network tab)
- Check file paths are correct

### Issue: "API calls failing with CORS error"
**Solution:**
- Use Vercel CLI (`vercel dev`) instead of simple HTTP server
- Or deploy to Vercel staging environment

### Issue: "Admin login not working"
**Solution:**
- Verify Supabase credentials are correct
- Check if admin_users table exists
- Verify password hash matches
- Check browser console for errors

### Issue: "Email not sending"
**Solution:**
- Verify EmailJS credentials in code
- Check EmailJS monthly limit
- Check browser console for errors
- Test EmailJS directly at emailjs.com

### Issue: "WhatsApp not opening"
**Solution:**
- Check if pop-ups are blocked
- Try clicking the WhatsApp link manually
- Verify phone number format in code

### Issue: "Data not saving to Supabase"
**Solution:**
- Check Supabase logs for errors
- Verify RLS (Row Level Security) policies
- Check environment variables
- Test API endpoint directly with Postman

## Testing Checklist Summary

Use this quick checklist before deploying:

### Pre-Deployment Checklist:

- [ ] Request form appears on all offering pages
- [ ] Form fields are correct for each category
- [ ] Form validation works
- [ ] Form submission succeeds
- [ ] Data appears in Supabase
- [ ] WhatsApp link works
- [ ] Email sends (if configured)
- [ ] Admin login works
- [ ] Dashboard displays correctly
- [ ] Statistics are accurate
- [ ] Filters and search work
- [ ] Status updates work
- [ ] Mobile layout is good
- [ ] Works in all browsers
- [ ] No console errors
- [ ] Changed default admin password

### Post-Deployment Checklist:

- [ ] Test request form on production URL
- [ ] Test admin panel on production URL
- [ ] Verify SSL/HTTPS is working
- [ ] Check API response times
- [ ] Monitor for errors in Vercel logs
- [ ] Verify email delivery
- [ ] Test WhatsApp integration
- [ ] Confirm data is saving correctly

## Performance Testing

### Load Testing:

If you expect high traffic, test with:

1. **Multiple simultaneous form submissions**
   - Use browser automation or tools like Postman
   - Submit 10-20 requests simultaneously
   - Verify all save correctly

2. **Large dataset in dashboard**
   - Create 100+ test requests
   - Check dashboard load time
   - Verify filters/search performance

3. **Mobile performance**
   - Use Chrome DevTools Lighthouse
   - Aim for score > 90
   - Check page load times

## Automated Testing (Future)

Consider adding automated tests:

```bash
# Example: Using Playwright for E2E testing
# (Not implemented yet)

npm install -D @playwright/test
npx playwright test
```

## Security Testing

### Basic Security Checks:

1. **SQL Injection:**
   - Try entering: `'; DROP TABLE service_requests; --`
   - Should be sanitized by Supabase

2. **XSS (Cross-Site Scripting):**
   - Try entering: `<script>alert('XSS')</script>`
   - Should be sanitized before display

3. **CSRF (Cross-Site Request Forgery):**
   - API endpoints require authentication
   - Session tokens prevent CSRF

4. **Session Security:**
   - Verify session token is not exposed in URL
   - Check session expires after 8 hours
   - Verify logout clears session

## Monitoring After Deployment

Keep an eye on:

1. **Vercel Logs:**
   - Check for API errors
   - Monitor response times

2. **Supabase Dashboard:**
   - Check database size
   - Monitor API usage
   - Review query performance

3. **EmailJS Dashboard:**
   - Track email delivery rate
   - Monitor monthly usage

4. **Google Sheets:**
   - Verify data is syncing
   - Check for errors

## Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check Vercel function logs
3. Check Supabase logs
4. Review documentation
5. Contact support: cncfoundation2021@gmail.com

---

**Happy Testing! 🎉**

Remember: Test thoroughly before going live!

