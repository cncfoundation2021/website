/**
 * Shared Sidebar Component for Admin Pages
 * Generates consistent navigation across all admin pages
 */

const ADMIN_MENU_ITEMS = [
    {
        id: 'overview',
        label: 'Overview',
        icon: 'fa-chart-line',
        href: '/admin/pages/overview.html',
        permission: 'view_overview',
        paths: ['/admin/pages/overview.html', '/admin/', '/admin/index.html', '/admin/pages/dashboard.html']
    },
    {
        id: 'requests',
        label: 'Service Requests',
        icon: 'fa-file-alt',
        href: '/admin/pages/requests.html',
        permission: 'view_requests',
        paths: ['/admin/pages/requests.html']
    },
    {
        id: 'feedback',
        label: 'Feedback',
        icon: 'fa-comments',
        href: '/admin/pages/feedback.html',
        permission: 'view_feedback',
        paths: ['/admin/pages/feedback.html']
    },
    {
        id: 'users',
        label: 'User Management',
        icon: 'fa-users',
        href: '/admin/pages/users.html',
        permission: 'view_users',
        paths: ['/admin/pages/users.html']
    },
    {
        id: 'audit',
        label: 'Audit Log',
        icon: 'fa-history',
        href: '/admin/pages/audit.html',
        permission: 'view_audit',
        paths: ['/admin/pages/audit.html']
    }
];

/**
 * Render sidebar HTML
 */
function renderSidebar() {
    const currentPath = window.location.pathname;
    const user = window.adminAuth.currentUser;
    
    if (!user) return '';
    
    const menuItems = ADMIN_MENU_ITEMS
        .filter(item => window.adminAuth.hasPermission(item.permission))
        .map(item => {
            // Check if current path matches any of the item's paths
            const isActive = item.paths && item.paths.some(path => currentPath.endsWith(path)) ? 'active' : '';
            return `
                <li>
                    <a href="${item.href}" class="${isActive}">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                </li>
            `;
        })
        .join('');
    
    return `
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>CNC Admin</h2>
                <p>Dashboard Panel</p>
            </div>
            
            <ul class="sidebar-menu">
                ${menuItems}
            </ul>
            
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="sidebar-user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="sidebar-user-info">
                        <div class="user-name" id="userDisplayName">${user.full_name || user.username}</div>
                        <div class="user-role" id="userDisplayRole">${(user.role || '').replace('_', ' ').toUpperCase()}</div>
                    </div>
                </div>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;
}

/**
 * Initialize sidebar on page load
 */
function initSidebar() {
    const sidebarContainer = document.getElementById('sidebarContainer');
    if (sidebarContainer && window.adminAuth.currentUser) {
        sidebarContainer.innerHTML = renderSidebar();
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.adminAuth.logout();
            });
        }
    }
}

// Auto-initialize after auth is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSidebar, 100); // Slight delay to ensure auth is initialized
    });
} else {
    setTimeout(initSidebar, 100);
}

// Export to global scope
window.initSidebar = initSidebar;
window.renderSidebar = renderSidebar;

