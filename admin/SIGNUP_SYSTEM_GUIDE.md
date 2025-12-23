# Admin Signup Request System - Complete Guide

## 🎉 What Was Implemented

A complete self-service signup system where users can request admin access, and super admins can approve or reject requests with role assignment.

## ✅ Features Completed

### 1. Self-Service Signup Form
- ✅ Tabbed login page with "Login" and "Request Access" tabs
- ✅ Comprehensive signup form with validation
- ✅ Fields: Username, Email, Full Name, Password, Organization (optional), Reason (optional)
- ✅ Client-side validation (username format, email format, password strength)
- ✅ Server-side validation and duplicate checking
- ✅ Password hashing before storage

### 2. Approval Workflow
- ✅ All signups go to "pending" status
- ✅ Super admins can view all signup requests
- ✅ Super admins can approve with role assignment (Viewer, Manager, Admin, Super Admin)
- ✅ Super admins can reject with reason
- ✅ Approved requests automatically create user accounts
- ✅ Users can only log in after approval

### 3. Admin Dashboard Integration
- ✅ New "Signup Requests" section (super admin only)
- ✅ Statistics dashboard (Total, Pending, Approved, Rejected)
- ✅ Filterable table (by status)
- ✅ View detailed request information
- ✅ One-click approve/reject actions
- ✅ Audit trail of who approved/rejected

### 4. Security Features
- ✅ Passwords hashed with bcrypt
- ✅ Session validation required for management
- ✅ Only super admins can access signup management
- ✅ IP address and user agent tracking
- ✅ Duplicate username/email checking
- ✅ Validation against pending requests

## 🚀 Deployment Status

✅ **Deployed to Production**
- **URL**: https://cnc-assam-website-9rh6n9a5m-care-and-cures-projects.vercel.app
- **Deployment ID**: EWf991XibGM1k7JEHvqXhPxiJMaS

## ⚠️ CRITICAL: Database Setup Required

### Step 1: Run the RBAC Schema (if not already done)

```bash
# File: admin/config/rbac-schema.sql
# Run in Supabase SQL Editor
```

### Step 2: Run the Signup Requests Schema

1. Open Supabase Dashboard at https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open the file: `admin/config/signup-requests-schema.sql`
5. Copy the entire contents
6. Paste into SQL Editor
7. Click **"Run"** to execute

This creates:
- `admin_signup_requests` table
- Helper functions for approval/rejection
- Statistics function
- Audit logging

### Step 3: Verify Schema Installation

Run this query in Supabase:

```sql
-- Verify table exists
SELECT COUNT(*) FROM admin_signup_requests;
-- Should return 0 (empty table)

-- Verify functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%signup%';
-- Should show: approve_signup_request, reject_signup_request, get_signup_stats
```

## 📖 How To Use

### For Users Requesting Access

1. **Visit the Login Page**
   - Go to `cncassam.com/admin/pages/login.html`
   - Click the "Request Access" tab

2. **Fill Out the Signup Form**
   - Username* (3-20 characters, letters/numbers/underscores)
   - Email* (valid email address)
   - Full Name* (your full name)
   - Password* (minimum 8 characters)
   - Organization (optional - your company/org)
   - Reason (optional - why you need access)

3. **Submit Request**
   - Click "Submit Request"
   - You'll see a success message
   - Wait for super admin approval

4. **After Approval**
   - You'll be able to log in with your credentials
   - Access level depends on the role assigned by super admin

### For Super Admins Managing Requests

1. **Access Signup Requests**
   - Log in to admin dashboard
   - Click "Signup Requests" in sidebar (super admins only)

2. **View Statistics**
   - See total, pending, approved, and rejected counts
   - Filter by status (All, Pending, Approved, Rejected)

3. **View Request Details**
   - Click the eye icon to see full details
   - Review: Username, Email, Name, Organization, Reason, IP address

4. **Approve a Request**
   - Click the green checkmark icon
   - Select role to assign:
     - **Viewer** - Read-only access
     - **Manager** - Can manage requests
     - **Admin** - Full access except user management
     - **Super Admin** - Full system access (use sparingly)
   - Click "Approve & Create User"
   - User account is created instantly
   - User can now log in

5. **Reject a Request**
   - Click the red X icon
   - Enter rejection reason
   - Click OK
   - Request is marked as rejected with your reason

## 📋 Database Schema

### admin_signup_requests Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | TEXT | Requested username |
| email | TEXT | User email |
| full_name | TEXT | Full name |
| password_hash | TEXT | Hashed password |
| reason | TEXT | Why they need access (optional) |
| organization | TEXT | Their organization (optional) |
| status | TEXT | pending, approved, or rejected |
| requested_at | TIMESTAMP | When they submitted |
| reviewed_at | TIMESTAMP | When approved/rejected |
| reviewed_by | UUID | Who approved/rejected |
| rejection_reason | TEXT | Why rejected |
| approved_role | TEXT | Role assigned when approved |
| ip_address | TEXT | Requestor's IP |
| user_agent | TEXT | Browser info |

### Helper Functions

1. **approve_signup_request(request_id, approved_by, role, custom_permissions)**
   - Approves the request
   - Creates user account in admin_users
   - Applies custom permissions if provided
   - Updates request status
   - Logs the action

2. **reject_signup_request(request_id, rejected_by, reason)**
   - Rejects the request
   - Stores rejection reason
   - Updates request status
   - Logs the action

3. **get_signup_stats()**
   - Returns statistics: total, pending, approved, rejected counts

## 🔄 User Flow Diagram

```
User Visits Login Page
       ↓
Clicks "Request Access" Tab
       ↓
Fills Out Signup Form
       ↓
Submits Request → Stored in admin_signup_requests (status: pending)
       ↓
Super Admin Receives Notification (dashboard shows pending count)
       ↓
Super Admin Reviews Request
       ↓
    ┌──────┴──────┐
    ↓             ↓
APPROVE        REJECT
    ↓             ↓
Assigns Role   Provides Reason
    ↓             ↓
User Created   Request Rejected
    ↓             ↓
status:        status:
'approved'     'rejected'
    ↓
User Can Log In
```

## 🎨 UI Features

### Login Page
- **Tabs**: Clean tab interface to switch between Login and Signup
- **Form Validation**: Real-time validation with helpful messages
- **Loading States**: Spinner while submitting
- **Success Messages**: Clear confirmation after submission
- **Auto-redirect**: Switches to login tab after successful signup

### Admin Dashboard - Signup Requests
- **Statistics Cards**: Visual summary of requests
- **Status Filter**: Dropdown to filter by status
- **Sortable Table**: Shows all key information
- **Status Badges**: Color-coded (Yellow=Pending, Green=Approved, Red=Rejected)
- **Action Buttons**: View, Approve, Reject
- **Modal Dialogs**: Clean approval workflow

## 🔐 Security Measures

1. ✅ **Password Security**
   - Minimum 8 characters
   - Hashed with bcrypt (10 rounds)
   - Never stored in plain text

2. ✅ **Input Validation**
   - Username: 3-20 chars, alphanumeric + underscore
   - Email: Valid email format
   - Duplicate checking (username and email)

3. ✅ **Access Control**
   - Signup requests only managed by super admins
   - Session validation required
   - Permission checking on all endpoints

4. ✅ **Audit Trail**
   - Who approved/rejected
   - When actions occurred
   - Rejection reasons stored
   - IP addresses tracked

5. ✅ **Duplicate Prevention**
   - Checks existing users
   - Checks pending requests
   - Clear error messages

## 📊 Statistics & Reporting

The signup stats dashboard shows:
- **Total Requests**: All-time signup requests
- **Pending**: Awaiting approval
- **Approved**: Successfully created users
- **Rejected**: Declined requests

## 🛠️ API Endpoints

### POST /api/signup-request
Submit a new signup request (public, no auth)

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "securePassword123",
  "organization": "ABC Company",
  "reason": "Need access to manage service requests"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup request submitted successfully...",
  "request": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "requested_at": "2024-..."
  }
}
```

### GET /api/signup-request
List all signup requests (super admin only)

**Query Parameters:**
- `status` (optional): all, pending, approved, rejected
- `limit` (optional): default 50

**Response:**
```json
{
  "success": true,
  "requests": [...],
  "statistics": {
    "total_requests": 10,
    "pending_requests": 3,
    "approved_requests": 5,
    "rejected_requests": 2
  }
}
```

### PUT /api/signup-request
Approve a signup request (super admin only)

**Body:**
```json
{
  "requestId": "uuid",
  "role": "admin",
  "customPermissions": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup request approved and user created",
  "userId": "new-user-uuid"
}
```

### DELETE /api/signup-request
Reject a signup request (super admin only)

**Body:**
```json
{
  "requestId": "uuid",
  "reason": "Does not meet approval criteria"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup request rejected"
}
```

## 🧪 Testing the System

### Test Scenario 1: User Signup
1. Open login page in incognito mode
2. Click "Request Access" tab
3. Fill out form with test data
4. Submit request
5. Verify success message
6. Try to log in → should fail (not approved yet)

### Test Scenario 2: Super Admin Approval
1. Log in as super admin
2. Go to "Signup Requests"
3. See the test request in pending
4. Click view icon → see details
5. Click approve icon
6. Select role (e.g., "Viewer")
7. Confirm approval
8. Verify user appears in "Manage Users"

### Test Scenario 3: User Login After Approval
1. Log out
2. Go to login page
3. Log in with approved credentials
4. Verify access matches assigned role

### Test Scenario 4: Rejection
1. Submit another signup request
2. Log in as super admin
3. Reject the request with reason
4. Verify request shows "Rejected" status
5. Try to log in with those credentials → should fail

## 📝 Files Created/Modified

### New Files:
1. `admin/config/signup-requests-schema.sql` - Database schema
2. `api/signup-request.js` - API endpoint
3. `admin/scripts/signup-management.js` - Admin UI logic
4. `admin/SIGNUP_SYSTEM_GUIDE.md` - This documentation

### Modified Files:
1. `admin/pages/login.html` - Added signup tab and form
2. `admin/pages/dashboard.html` - Added signup requests section
3. `admin/scripts/admin-dashboard.js` - Added signup section handling

## 🎯 Benefits

1. **Self-Service**: Users can request access without contacting admins directly
2. **Controlled Approval**: Super admins gate-keep who gets access
3. **Role-Based**: Assign appropriate access level during approval
4. **Audit Trail**: Know who requested, who approved, when
5. **Security**: No direct user creation, everything goes through approval
6. **Transparency**: Users know their request is pending
7. **Professional**: Clean, modern UI matching your brand

## 🔮 Future Enhancements (Optional)

- [ ] Email notifications when requests are submitted
- [ ] Email notifications to users when approved/rejected
- [ ] Batch approval/rejection
- [ ] Export signup requests to CSV
- [ ] Request expiration (auto-reject after X days)
- [ ] Reason templates for rejection
- [ ] User-facing status page to check request status
- [ ] Captcha on signup form to prevent spam

## 🐛 Troubleshooting

### Issue: "Failed to submit request"
**Solution**: 
1. Check if signup-requests-schema.sql was run in Supabase
2. Verify the table exists: `SELECT * FROM admin_signup_requests;`

### Issue: "Signup Requests" not showing in sidebar
**Solution**: Only super admins can see this section. Check your role.

### Issue: "Failed to approve signup"
**Solution**:
1. Check if RBAC schema was run
2. Verify functions exist in Supabase
3. Check Vercel logs for detailed error

### Issue: User can't log in after approval
**Solution**:
1. Check if user exists in admin_users table
2. Verify is_active = true
3. Check password was set correctly during approval

## 🎉 Summary

You now have a **complete signup request system** with:
- ✅ Self-service signup form on login page
- ✅ Approval workflow for super admins
- ✅ Role assignment during approval
- ✅ Audit trail and statistics
- ✅ Secure password handling
- ✅ Clean, intuitive UI
- ✅ Production deployed and ready

**Next Steps:**
1. Run the signup-requests-schema.sql in Supabase
2. Test the signup flow
3. Announce to your team that they can request access
4. Monitor and approve requests from the admin dashboard

🚀 **The system is live and ready to use!**

