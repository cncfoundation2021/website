# 🧪 Local Testing Guide - CNC Admin Dashboard

**Status:** Ready to Test  
**Date:** October 16, 2025

---

## ✅ Pre-Test Checklist

- ✅ Admin password changed to `cncassam2021`
- ✅ Request buttons added to 50 offering pages
- ✅ EmailJS credentials configured
- ✅ Vercel dev server running on http://localhost:3000

---

## 🔐 Test 1: Admin Login

### Steps:
1. Open your browser
2. Navigate to: **http://localhost:3000/admin/pages/login.html**
3. Enter credentials:
   - **Username:** `admin`
   - **Password:** `cncassam2021`
4. Click "Login"

### Expected Results:
- ✅ Form validates
- ✅ Login button shows loading state
- ✅ Redirects to dashboard
- ✅ Dashboard shows your name/email
- ✅ Statistics cards display (all showing 0)

### If Login Fails:
- Check browser console (F12) for errors
- Verify Vercel dev server is running
- Check if environment variables are loaded

---

## 📝 Test 2: Request Form Submission

### Steps:
1. Navigate to: **http://localhost:3000/offerings/manufacturing-of-products/namkeen.html**
2. Click the **"Raise Request"** button
3. Fill in the form:
   - **Name:** Test Customer
   - **Email:** test@example.com
   - **Phone:** 9876543210
   - **Address:** Test Address, Guwahati
   - **Quantity:** 100
   - **Delivery Date:** [Select a date]
   - **Additional Requirements:** Test request from local
4. Click "Submit Request"

### Expected Results:
- ✅ Form validates all fields
- ✅ Submit button shows loading state
- ✅ Success message appears
- ✅ WhatsApp opens in new tab with pre-filled message
- ✅ Email is sent (check cncfoundation2021@gmail.com)
- ✅ Modal closes or shows success

### If Submission Fails:
- Check browser console for errors
- Verify API is responding at: http://localhost:3000/api/service-requests
- Check network tab in browser dev tools

---

## 📊 Test 3: View Request in Dashboard

### Steps:
1. Go back to admin dashboard: **http://localhost:3000/admin/pages/dashboard.html**
2. Click on "Service Requests" in the sidebar (if not already there)
3. Look for your test request in the table

### Expected Results:
- ✅ Statistics updated (1 pending request)
- ✅ Request appears in the table
- ✅ Shows: Test Customer, test@example.com, pending status
- ✅ Click "View" icon to see details modal
- ✅ All form data displays correctly

---

## ✏️ Test 4: Update Request Status

### Steps:
1. In the dashboard, find your test request
2. Click the "Edit" icon (pencil)
3. In the modal, change status to "in-progress"
4. Optionally add notes: "Test status update"
5. Click "Update"

### Expected Results:
- ✅ Modal closes
- ✅ Table updates immediately
- ✅ Status badge changes color to yellow/orange
- ✅ Statistics update (0 pending, 1 in-progress)
- ✅ "Updated" timestamp changes

---

## 🔍 Test 5: Filter and Search

### Test Filters:
1. Create 2-3 more test requests with different statuses
2. Use the **Status Filter** dropdown:
   - Select "Pending" - should show only pending requests
   - Select "In Progress" - should show only in-progress requests
   - Select "All" - should show everything

3. Use the **Category Filter** dropdown:
   - Select "Manufacturing & Reselling"
   - Verify only relevant requests show

### Test Search:
1. In the search box, type: "Test"
2. Should filter to show only matching names/emails
3. Clear search - all requests should reappear

### Expected Results:
- ✅ Filters work independently
- ✅ Search works in real-time
- ✅ Table updates without page reload
- ✅ Statistics remain accurate

---

## 📧 Test 6: Verify Email Notification

### Steps:
1. Check the email inbox: **cncfoundation2021@gmail.com**
2. Look for email with subject: "New Service Request - namkeen - Test Customer"

### Expected Email Content:
```
New Service Request Received

Request ID: [UUID]
Date: [Timestamp]

Customer Information:
- Name: Test Customer
- Email: test@example.com
- Phone: 9876543210
- Address: Test Address, Guwahati

Service Details:
- Category: manufacturing-of-products
- Offering: namkeen

Request Details:
{JSON data}
```

### If Email Not Received:
- Check spam folder
- Verify EmailJS credentials
- Check EmailJS dashboard for send status
- Review browser console for email errors

---

## 💬 Test 7: WhatsApp Integration

### Steps:
1. When you submitted the request, WhatsApp should have opened
2. Verify the message is pre-filled with request details
3. Check the format and completeness

### Expected WhatsApp Message:
```
*New Service Request - CNC Assam*

*Request ID:* [UUID]

*Customer Details:*
Name: Test Customer
Email: test@example.com
Phone: 9876543210
Address: Test Address, Guwahati

*Request For:*
Category: Manufacturing Of Products
Service/Product: Namkeen

*Details:*
Quantity: 100
Delivery Date: [Date]
Additional Requirements: Test request from local

*Submitted at:* [Timestamp]
```

---

## 🗄️ Test 8: Verify Data in Supabase

### Steps:
1. Open: **https://supabase.com/dashboard/project/gspmcwidwbvtiojadzab/editor**
2. Click on **service_requests** table
3. Look for your test request

### Expected Results:
- ✅ Request exists in database
- ✅ All fields populated correctly
- ✅ request_details JSON contains custom fields
- ✅ status is correct (pending or in-progress)
- ✅ Timestamps are accurate

---

## 🧹 Test 9: Admin Logout

### Steps:
1. In the dashboard, click the "Logout" button
2. Confirm logout if prompted

### Expected Results:
- ✅ Session ends
- ✅ Redirects to login page
- ✅ Cannot access dashboard without logging in again
- ✅ Browser local storage cleared

---

## 🔄 Test 10: Test Multiple Offering Pages

### Test Different Categories:
1. **Services:** http://localhost:3000/offerings/services/catering-services.html
2. **Donation:** http://localhost:3000/offerings/donation/charity-fund.html
3. **Construction:** http://localhost:3000/offerings/construction-repairing/civil.html
4. **Authorized Reseller:** http://localhost:3000/offerings/authorized-reseller/lg.html

### For Each Page:
- ✅ "Raise Request" button is visible
- ✅ Click opens modal
- ✅ Form shows category-specific fields
- ✅ Different questions based on offering type
- ✅ Submission works correctly

---

## ✅ Test Completion Checklist

Mark these as you complete each test:

- [ ] Test 1: Admin Login - PASS/FAIL
- [ ] Test 2: Request Form Submission - PASS/FAIL
- [ ] Test 3: View Request in Dashboard - PASS/FAIL
- [ ] Test 4: Update Request Status - PASS/FAIL
- [ ] Test 5: Filter and Search - PASS/FAIL
- [ ] Test 6: Email Notification - PASS/FAIL
- [ ] Test 7: WhatsApp Integration - PASS/FAIL
- [ ] Test 8: Verify in Supabase - PASS/FAIL
- [ ] Test 9: Admin Logout - PASS/FAIL
- [ ] Test 10: Multiple Offering Pages - PASS/FAIL

---

## 🐛 Common Issues & Solutions

### Issue: APIs not responding
**Solution:** Ensure Vercel dev is running. Check terminal for errors.

### Issue: Environment variables not found
**Solution:** Run `vercel env pull` to download env vars locally.

### Issue: Login fails
**Solution:** Verify password is correct. Check Supabase connection.

### Issue: WhatsApp doesn't open
**Solution:** Check browser popup blocker. Verify phone number format.

### Issue: Email not sending
**Solution:** Check EmailJS credentials. Verify EmailJS dashboard shows the send.

---

## 📝 Test Results Template

```
Date: [Date]
Tester: [Name]

Test Results:
1. Admin Login: ✅ PASS / ❌ FAIL
   Notes: 

2. Request Form: ✅ PASS / ❌ FAIL
   Notes:

3. Dashboard View: ✅ PASS / ❌ FAIL
   Notes:

4. Status Update: ✅ PASS / ❌ FAIL
   Notes:

5. Filters/Search: ✅ PASS / ❌ FAIL
   Notes:

6. Email: ✅ PASS / ❌ FAIL
   Notes:

7. WhatsApp: ✅ PASS / ❌ FAIL
   Notes:

8. Supabase Data: ✅ PASS / ❌ FAIL
   Notes:

9. Logout: ✅ PASS / ❌ FAIL
   Notes:

10. Multiple Pages: ✅ PASS / ❌ FAIL
    Notes:

Overall Status: ✅ ALL PASS / ⚠️ ISSUES FOUND
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Clean up test data from Supabase
2. ✅ Review and document any observations
3. ✅ Deploy to production: `vercel --prod`
4. ✅ Test production deployment
5. ✅ Monitor first real submissions

If tests fail:
1. Document the issue
2. Check browser console and network tab
3. Review API logs in terminal
4. Fix the issue
5. Re-test

---

## 📞 Getting Started

**To begin testing:**

1. Make sure Vercel dev is running
2. Open: http://localhost:3000/admin/pages/login.html
3. Login with: `admin` / `cncassam2021`
4. Follow the test steps above

**Happy Testing! 🎉**


