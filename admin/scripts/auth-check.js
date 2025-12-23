/**
 * Shared Authentication & Authorization Module for Admin Pages
 * Include this script on every admin page (except login.html)
 */

// Configuration
const AUTH_CONFIG = {
    LOGIN_URL: '/admin/pages/login.html',
    SESSION_KEY: 'admin_session',
    USER_KEY: 'admin_user',
    PERMISSIONS_KEY: 'admin_permissions'
};

// Global state
window.adminAuth = {
    currentUser: null,
    sessionToken: null,
    userPermissions: []
};

/**
 * Check if user is authenticated
 * Redirects to login if not
 */
async function checkAuthentication() {
    const sessionToken = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
    const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    
    if (!sessionToken || !storedUser) {
        console.log('❌ No session found - redirecting to login');
        redirectToLogin();
        return false;
    }
    
    try {
        const user = JSON.parse(storedUser);
        window.adminAuth.currentUser = user;
        window.adminAuth.sessionToken = sessionToken;
        
        console.log('✅ Session found for user:', user.username);
        return true;
    } catch (error) {
        console.error('Error parsing stored user:', error);
        redirectToLogin();
        return false;
    }
}

/**
 * Load user permissions from backend
 */
async function loadUserPermissions() {
    if (!window.adminAuth.sessionToken) {
        return [];
    }
    
    try {
        const response = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.adminAuth.sessionToken}`
            },
            body: JSON.stringify({ action: 'get_permissions' })
        });
        
        const result = await response.json();
        
        if (result.success && result.permissions) {
            window.adminAuth.userPermissions = result.permissions;
            localStorage.setItem(AUTH_CONFIG.PERMISSIONS_KEY, JSON.stringify(result.permissions));
            console.log('✅ User permissions loaded:', result.permissions.length);
            return result.permissions;
        } else {
            // Fallback to cached permissions
            const cached = localStorage.getItem(AUTH_CONFIG.PERMISSIONS_KEY);
            if (cached) {
                window.adminAuth.userPermissions = JSON.parse(cached);
                return window.adminAuth.userPermissions;
            }
        }
    } catch (error) {
        console.error('Error loading permissions:', error);
        // Fallback to cached permissions
        const cached = localStorage.getItem(AUTH_CONFIG.PERMISSIONS_KEY);
        if (cached) {
            window.adminAuth.userPermissions = JSON.parse(cached);
            return window.adminAuth.userPermissions;
        }
    }
    
    return [];
}

/**
 * Check if user has a specific permission
 */
function hasPermission(permissionName) {
    const user = window.adminAuth.currentUser;
    const permissions = window.adminAuth.userPermissions;
    
    // Super admin has all permissions
    if (user && user.role === 'super_admin') {
        return true;
    }
    
    // Check if permission exists in user's permissions
    return permissions.includes(permissionName);
}

/**
 * Check if user has any of the specified permissions
 */
function hasAnyPermission(...permissionNames) {
    return permissionNames.some(permission => hasPermission(permission));
}

/**
 * Check if user has all of the specified permissions
 */
function hasAllPermissions(...permissionNames) {
    return permissionNames.every(permission => hasPermission(permission));
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    // Clear session data
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem(AUTH_CONFIG.PERMISSIONS_KEY);
    
    // Redirect to login
    window.location.href = AUTH_CONFIG.LOGIN_URL;
}

/**
 * Logout current user
 */
async function logout() {
    const sessionToken = window.adminAuth.sessionToken;
    
    if (sessionToken) {
        try {
            // Call logout API
            await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ action: 'logout' })
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
    
    redirectToLogin();
}

/**
 * Initialize authentication for current page
 * Call this on page load
 */
async function initAuth() {
    console.log('🔐 Initializing authentication...');
    
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        return false;
    }
    
    await loadUserPermissions();
    
    // Setup logout button if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Update user display if element exists
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName && window.adminAuth.currentUser) {
        userDisplayName.textContent = window.adminAuth.currentUser.full_name || window.adminAuth.currentUser.username;
    }
    
    const userDisplayRole = document.getElementById('userDisplayRole');
    if (userDisplayRole && window.adminAuth.currentUser) {
        userDisplayRole.textContent = window.adminAuth.currentUser.role.replace('_', ' ').toUpperCase();
    }
    
    console.log('✅ Authentication initialized successfully');
    return true;
}

/**
 * Show/hide elements based on permission
 */
function applyPermissionBasedVisibility() {
    // Hide elements with data-permission attribute if user doesn't have permission
    document.querySelectorAll('[data-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        if (!hasPermission(requiredPermission)) {
            element.style.display = 'none';
        }
    });
    
    // Hide elements with data-require-any-permission if user doesn't have any of the permissions
    document.querySelectorAll('[data-require-any-permission]').forEach(element => {
        const permissions = element.getAttribute('data-require-any-permission').split(',');
        if (!hasAnyPermission(...permissions)) {
            element.style.display = 'none';
        }
    });
    
    // Hide elements with data-require-all-permissions if user doesn't have all permissions
    document.querySelectorAll('[data-require-all-permissions]').forEach(element => {
        const permissions = element.getAttribute('data-require-all-permissions').split(',');
        if (!hasAllPermissions(...permissions)) {
            element.style.display = 'none';
        }
    });
}

// Export functions to global scope
window.adminAuth = Object.assign(window.adminAuth, {
    init: initAuth,
    checkAuthentication,
    loadUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
    applyPermissionBasedVisibility
});

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    applyPermissionBasedVisibility();
});


