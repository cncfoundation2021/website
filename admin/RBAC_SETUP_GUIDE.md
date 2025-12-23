# RBAC (Role-Based Access Control) Setup Guide

This guide explains how to set up and use the Role-Based Access Control system for the CNC Admin Dashboard.

## Features

✅ **User Management**: Create, update, and delete admin users
✅ **Role-Based Permissions**: Super Admin, Admin, Manager, and Viewer roles
✅ **Custom Permissions**: Override role permissions for specific users
✅ **Permission Categories**: Overview, Requests, Feedback, and Users
✅ **Audit Logging**: Track all user management actions
✅ **Secure API**: Protected endpoints with session validation

## Installation Steps

### 1. Run the RBAC Schema Script

Execute the RBAC schema SQL in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste the contents of: admin/config/rbac-schema.sql
# Click "Run" to execute
```

This will create:
- `permissions` table - Defines all available permissions
- `role_permissions` table - Maps permissions to roles
- `user_permissions` table - User-specific permission overrides
- `admin_audit_log` table - Logs all user management actions
- Helper functions for permission checking

### 2. Verify Database Setup

Check that all tables were created:

```sql
-- Run this query to verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'admin_audit_log');
```

### 3. Verify Default Permissions

Check that default permissions were inserted:

```sql
-- Run this query to see all permissions
SELECT * FROM permissions ORDER BY category, name;

-- Run this query to see role permissions
SELECT rp.role, p.name, p.category
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.category, p.name;
```

## User Roles

### Super Admin
- **Full system access**
- Can create/update/delete any users including other super admins
- Can manage all permissions
- Can access all features

### Admin
- **Full access except user management**
- Can view/create/update requests
- Can add comments to requests
- Can view feedback
- Can view users list (read-only)

### Manager
- **Can manage service requests**
- Can view and update request status
- Can add comments
- Can view feedback
- Read-only access to overview

### Viewer
- **Read-only access**
- Can view overview statistics
- Can view service requests
- Can view feedback
- Cannot modify anything

## Available Permissions

### Overview Category
- `view_overview` - View dashboard overview and statistics

### Requests Category
- `view_requests` - View service requests
- `create_requests` - Create new service requests
- `update_requests` - Update service request status and details
- `delete_requests` - Delete service requests
- `add_comments` - Add comments to service requests

### Feedback Category
- `view_feedback` - View website feedback
- `delete_feedback` - Delete feedback entries

### Users Category
- `view_users` - View admin users list
- `create_users` - Create new admin users
- `update_users` - Update admin user details and permissions
- `delete_users` - Delete admin users
- `manage_permissions` - Manage user roles and permissions

## Using the User Management Interface

### Creating a New User

1. Log in to the admin dashboard
2. Navigate to "Manage Users" section
3. Click "Add User" button
4. Fill in the form:
   - Username (required, unique)
   - Email (required, unique)
   - Full Name (optional)
   - Role (required)
   - Password (required, minimum 6 characters)
5. Click "Create User"

### Editing a User

1. Navigate to "Manage Users" section
2. Click the edit icon (pencil) for the user
3. Modify the user details
4. Optionally change the password
5. Toggle active/inactive status
6. Click "Update User"

### Managing Permissions

1. Navigate to "Manage Users" section
2. Click the permissions icon (key) for the user
3. Check/uncheck permissions as needed
   - Permissions marked with * are granted by the user's role
   - Custom permissions override role defaults
4. Click "Save Permissions"

### Deleting a User

1. Navigate to "Manage Users" section
2. Click the delete icon (trash) for the user
3. Confirm the deletion
4. User and all their sessions will be deleted

**Note**: You cannot delete your own account

## Permission Checking in Code

### Backend (API)

```javascript
// Check if user has specific permission
const hasPermission = await checkPermission(userId, 'create_users');
if (!hasPermission) {
    return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission' 
    });
}
```

### Frontend (Dashboard)

```javascript
// Get current user permissions
const permissions = await getUserPermissions(currentUser.id);

// Check if user has permission
if (permissions.some(p => p.permission_name === 'create_users')) {
    // Show create user button
}
```

## Security Best Practices

1. **Change Default Password**: Immediately change the default super admin password after setup
2. **Limit Super Admins**: Only create super admin accounts for trusted administrators
3. **Use Strong Passwords**: Enforce minimum 8 character passwords with complexity
4. **Regular Audits**: Review the audit log regularly for suspicious activity
5. **Principle of Least Privilege**: Grant users only the permissions they need

## Audit Logging

All user management actions are logged in the `admin_audit_log` table:

```sql
-- View recent audit logs
SELECT 
    al.action,
    au.username as performed_by,
    tu.username as target_user,
    al.details,
    al.created_at
FROM admin_audit_log al
LEFT JOIN admin_users au ON al.admin_user_id = au.id
LEFT JOIN admin_users tu ON al.target_user_id = tu.id
ORDER BY al.created_at DESC
LIMIT 50;
```

Logged actions include:
- `create_user` - New user created
- `update_user` - User details updated
- `delete_user` - User deleted
- `update_permissions` - User permissions modified

## Troubleshooting

### Users Can't Log In
- Verify user is marked as `is_active = true`
- Check if password was set correctly
- Verify user exists in `admin_users` table

### Permission Denied Errors
- Check user's role in `admin_users` table
- Verify role permissions in `role_permissions` table
- Check for custom permissions in `user_permissions` table
- Use the `user_has_permission()` function to debug

### Missing Permissions
- Run the RBAC schema again to add default permissions
- Check the `permissions` table for all available permissions

## API Endpoints

### GET /api/admin-users
List all users or get specific user details

**Query Parameters:**
- `userId` (optional) - Get specific user with permissions

**Response:**
```json
{
  "success": true,
  "users": [...],
  "permissions": [...],
  "rolePermissions": [...]
}
```

### POST /api/admin-users
Create a new user

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "role": "admin"
}
```

### PUT /api/admin-users
Update a user

**Body:**
```json
{
  "userId": "uuid",
  "username": "new_username",
  "email": "new@example.com",
  "full_name": "New Name",
  "role": "manager",
  "is_active": true,
  "password": "newPassword123" // optional
}
```

### PATCH /api/admin-users
Update user permissions

**Body:**
```json
{
  "userId": "uuid",
  "permissions": [
    {
      "permission_id": "uuid",
      "granted": true
    }
  ]
}
```

### DELETE /api/admin-users
Delete a user

**Query Parameters:**
- `userId` (required) - User ID to delete

## Next Steps

1. ✅ Run the RBAC schema in Supabase
2. ✅ Verify database setup
3. ✅ Deploy the updated admin dashboard
4. ✅ Log in and test user management
5. ✅ Create additional admin users as needed
6. ✅ Configure custom permissions if needed
7. ✅ Review and monitor audit logs

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Check Vercel logs for API errors
4. Review the audit log for user actions

