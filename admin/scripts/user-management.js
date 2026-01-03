/**
 * User Management Module
 * Handles admin user CRUD operations and permission management
 */

let allUsers = [];
let allPermissions = [];
let rolePermissions = [];

// Load users
async function loadUsers() {
    try {
        // Get session token from global auth or fallback
        const token = window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session');
        
        if (!token) {
            showError('No session token found. Please log in again.');
            return;
        }
        
        const response = await fetch('/api/admin-users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            allUsers = result.users || [];
            allPermissions = result.permissions || [];
            rolePermissions = result.rolePermissions || [];
            renderUsersTable(allUsers);
        } else {
            // Check for session expiration
            if (result.error === 'SESSION_EXPIRED' || !response.ok) {
                if (window.adminAuth?.handleSessionExpired) {
                    window.adminAuth.handleSessionExpired();
                } else {
                    alert('Your session has expired. Please sign in again.');
                    window.location.href = '/admin/pages/login.html';
                }
                return;
            }
            showError('Failed to load users: ' + (result.message || result.error));
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Render users table
function renderUsersTable(users) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-cog"></i>
                <p>No users found</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.full_name || '-'}</td>
                        <td><small>${user.email}</small></td>
                        <td>
                            <span class="role-badge role-${user.role}">
                                ${formatRole(user.role)}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.is_active ? 'status-completed' : 'status-cancelled'}">
                                ${user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>${user.last_login ? formatDateTime(user.last_login) : 'Never'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Edit User">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon btn-permissions" onclick="managePermissions('${user.id}')" title="Manage Permissions">
                                    <i class="fas fa-key"></i>
                                </button>
                                ${user.id !== (window.adminAuth?.currentUser?.id || currentUser?.id) ? `
                                    <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" title="Delete User">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Show create user modal
function showCreateUserModal() {
    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <form id="createUserForm" onsubmit="return false;">
            <div class="form-group">
                <label for="newUsername">Username *</label>
                <input type="text" id="newUsername" required class="form-input">
            </div>
            <div class="form-group">
                <label for="newEmail">Email *</label>
                <input type="email" id="newEmail" required class="form-input">
            </div>
            <div class="form-group">
                <label for="newFullName">Full Name</label>
                <input type="text" id="newFullName" class="form-input">
            </div>
            <div class="form-group">
                <label for="newRole">Role *</label>
                <select id="newRole" required class="form-input">
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="manager">Manager - Can manage requests</option>
                    <option value="admin" selected>Admin - Full access except user management</option>
                    ${(window.adminAuth?.currentUser?.role || currentUser?.role) === 'super_admin' ? '<option value="super_admin">Super Admin - Full system access</option>' : ''}
                </select>
            </div>
            <div class="form-group">
                <label for="newPassword">Password *</label>
                <input type="password" id="newPassword" required class="form-input" minlength="6">
                <small>Minimum 6 characters</small>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password *</label>
                <input type="password" id="confirmPassword" required class="form-input" minlength="6">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="createUser()">Create User</button>
            </div>
        </form>
    `;

    document.getElementById('userModalTitle').textContent = 'Create New User';
    document.getElementById('userModal').classList.add('show');
}

// Create user
async function createUser() {
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const full_name = document.getElementById('newFullName').value.trim();
    const role = document.getElementById('newRole').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const response = await fetch('/api/admin-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session')}`
            },
            body: JSON.stringify({
                username,
                email,
                full_name,
                role,
                password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('User created successfully!');
            closeUserModal();
            loadUsers();
        } else {
            alert('Failed to create user: ' + result.message);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user');
    }
}

// Edit user
async function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <form id="editUserForm" onsubmit="return false;">
            <div class="form-group">
                <label for="editUsername">Username *</label>
                <input type="text" id="editUsername" value="${user.username}" required class="form-input">
            </div>
            <div class="form-group">
                <label for="editEmail">Email *</label>
                <input type="email" id="editEmail" value="${user.email}" required class="form-input">
            </div>
            <div class="form-group">
                <label for="editFullName">Full Name</label>
                <input type="text" id="editFullName" value="${user.full_name || ''}" class="form-input">
            </div>
            <div class="form-group">
                <label for="editRole">Role *</label>
                <select id="editRole" required class="form-input">
                    <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer - Read-only access</option>
                    <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager - Can manage requests</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin - Full access except user management</option>
                    ${(window.adminAuth?.currentUser?.role || currentUser?.role) === 'super_admin' ? `<option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin - Full system access</option>` : ''}
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''}>
                    Active
                </label>
            </div>
            <div class="form-group">
                <label for="editPassword">New Password</label>
                <input type="password" id="editPassword" class="form-input" minlength="6">
                <small>Leave blank to keep current password</small>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="updateUser('${userId}')">Update User</button>
            </div>
        </form>
    `;

    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userModal').classList.add('show');
}

// Update user
async function updateUser(userId) {
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const full_name = document.getElementById('editFullName').value.trim();
    const role = document.getElementById('editRole').value;
    const is_active = document.getElementById('editIsActive').checked;
    const password = document.getElementById('editPassword').value;

    if (!username || !email) {
        alert('Please fill in all required fields');
        return;
    }

    const updateData = {
        userId,
        username,
        email,
        full_name,
        role,
        is_active
    };

    if (password) {
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        updateData.password = password;
    }

    try {
        const response = await fetch('/api/admin-users', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session')}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert('User updated successfully!');
            closeUserModal();
            loadUsers();
        } else {
            alert('Failed to update user: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user');
    }
}

// Delete user
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin-users?userId=${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('User deleted successfully!');
            loadUsers();
        } else {
            alert('Failed to delete user: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

// Manage permissions
async function managePermissions(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Get user's current permissions
    try {
        const response = await fetch(`/api/admin-users?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session')}`
            }
        });

        const result = await response.json();

        if (!result.success) {
            alert('Failed to load user permissions');
            return;
        }

        const userPermissions = result.user.permissions || [];
        const userPermissionNames = userPermissions.map(p => p.permission_name);

        // Get role's default permissions
        const roleDefaultPermissions = rolePermissions
            .filter(rp => rp.role === user.role)
            .map(rp => rp.permissions.name);

        // Group permissions by category
        const permissionsByCategory = {};
        allPermissions.forEach(perm => {
            if (!permissionsByCategory[perm.category]) {
                permissionsByCategory[perm.category] = [];
            }
            permissionsByCategory[perm.category].push(perm);
        });

        const modalBody = document.getElementById('userModalBody');
        let permissionsHTML = `
            <div class="permissions-info">
                <p><strong>User:</strong> ${user.username} (${formatRole(user.role)})</p>
                <p><small>Checked permissions are granted. Unchecked permissions are denied. 
                Items with * are granted by the user's role.</small></p>
            </div>
            <form id="permissionsForm" onsubmit="return false;">
        `;

        Object.keys(permissionsByCategory).forEach(category => {
            permissionsHTML += `
                <div class="permission-category">
                    <h4>${formatCategoryName(category)}</h4>
                    ${permissionsByCategory[category].map(perm => {
                        const isGranted = userPermissionNames.includes(perm.name);
                        const isRoleDefault = roleDefaultPermissions.includes(perm.name);
                        return `
                            <div class="permission-item">
                                <label>
                                    <input type="checkbox" 
                                        name="permission" 
                                        value="${perm.id}" 
                                        ${isGranted ? 'checked' : ''}
                                        ${isRoleDefault ? 'data-role-default="true"' : ''}>
                                    ${formatPermissionName(perm.name)} ${isRoleDefault ? '*' : ''}
                                    <small>${perm.description}</small>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        permissionsHTML += `
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="savePermissions('${userId}')">Save Permissions</button>
                </div>
            </form>
        `;

        modalBody.innerHTML = permissionsHTML;
        document.getElementById('userModalTitle').textContent = 'Manage Permissions';
        document.getElementById('userModal').classList.add('show');

    } catch (error) {
        console.error('Error loading permissions:', error);
        alert('Failed to load permissions');
    }
}

// Save permissions
async function savePermissions(userId) {
    const checkboxes = document.querySelectorAll('#permissionsForm input[type="checkbox"]');
    const permissions = [];

    checkboxes.forEach(checkbox => {
        const isRoleDefault = checkbox.dataset.roleDefault === 'true';
        const isChecked = checkbox.checked;

        // Only save custom permissions (overrides)
        if (!isRoleDefault || !isChecked) {
            permissions.push({
                permission_id: checkbox.value,
                granted: isChecked
            });
        }
    });

    try {
        const response = await fetch('/api/admin-users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.adminAuth?.sessionToken || sessionToken || localStorage.getItem('admin_session')}`
            },
            body: JSON.stringify({
                userId,
                permissions
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Permissions updated successfully!');
            closeUserModal();
        } else {
            alert('Failed to update permissions: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving permissions:', error);
        alert('Failed to save permissions');
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

// Helper functions
function formatRole(role) {
    const roleMap = {
        'super_admin': 'Super Admin',
        'admin': 'Admin',
        'manager': 'Manager',
        'viewer': 'Viewer'
    };
    return roleMap[role] || role;
}

function formatPermissionName(name) {
    return name
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

