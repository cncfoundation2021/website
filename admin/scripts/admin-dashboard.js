/**
 * CNC Admin Dashboard
 * Handles admin panel functionality
 */

let currentUser = null;
let sessionToken = null;
let requestsData = [];
let userPermissions = [];

// Helper function to get current session token
function getSessionToken() {
    return window.adminAuth?.sessionToken || sessionToken;
}

// Initialize dashboard (only if old dashboard page)
document.addEventListener('DOMContentLoaded', async () => {
    // Only run full initialization if this is the old dashboard page
    const isOldDashboard = document.getElementById('overview') !== null;
    
    if (isOldDashboard) {
        await checkAuth();
        await loadUserPermissions();
        loadUserInfo();
        applyPermissionBasedUI();
        switchSection('overview');
        loadStats();
        loadRequests(true); // Silent on initial load
        
        // Auto-refresh every 30 seconds for real-time updates
        setInterval(() => {
            const serviceRequests = document.getElementById('serviceRequests');
            if (serviceRequests && serviceRequests.classList.contains('active')) {
                loadRequests(true); // Silent refresh
            }
        }, 30000);
    }
    // For new pages, initialization is handled by auth-check.js
});

// Check authentication
async function checkAuth() {
    sessionToken = localStorage.getItem('admin_session');
    
    if (!sessionToken) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch('/api/admin-auth?action=verify', {
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });

        const result = await response.json();

        if (!result.success) {
            redirectToLogin();
            return;
        }

        currentUser = result.user;
    } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/pages/login.html';
}

// Load user information
function loadUserInfo() {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        const userFullNameEl = document.getElementById('userFullName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userFullNameEl) {
            userFullNameEl.textContent = user.full_name || user.username;
        }
        
        if (userRoleEl) {
            const roleMap = {
                'super_admin': 'Super Admin',
                'admin': 'Admin',
                'manager': 'Manager',
                'viewer': 'Viewer'
            };
            userRoleEl.textContent = roleMap[user.role] || 'Admin';
        }
    }
}

// Load user permissions
async function loadUserPermissions() {
    if (!currentUser || !currentUser.id) return;

    try {
        const response = await fetch(`/api/admin-users?userId=${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });

        const result = await response.json();

        if (result.success && result.user.permissions) {
            userPermissions = result.user.permissions.map(p => p.permission_name);
            console.log('✅ User permissions loaded:', userPermissions);
        }
    } catch (error) {
        console.error('Error loading permissions:', error);
        // If we can't load permissions, assume super_admin has all
        if (currentUser.role === 'super_admin') {
            userPermissions = ['all'];
        }
    }
}

// Check if user has permission
function hasPermission(permission) {
    console.log(`🔍 Checking permission: ${permission}`);
    console.log(`👤 Current user:`, currentUser);
    console.log(`📋 User permissions:`, userPermissions);
    
    // Super admin has all permissions
    if (currentUser && currentUser.role === 'super_admin') {
        console.log(`✅ Super admin has all permissions`);
        return true;
    }
    // Check if user has the specific permission
    const hasPermission = userPermissions.includes(permission);
    console.log(`🔐 Has permission ${permission}: ${hasPermission}`);
    return hasPermission;
}

// Apply permission-based UI visibility
function applyPermissionBasedUI() {
    // Hide sidebar menu items based on permissions
    const         menuItems = {
            'overview': 'view_overview',
            'requests': 'view_requests',
            'feedback': 'view_feedback',
            'users': 'view_users',
            'audit': 'view_audit'
        };

    Object.entries(menuItems).forEach(([section, permission]) => {
        const menuLink = document.querySelector(`.sidebar-menu a[data-section="${section}"]`);
        const hasPermissionForSection = hasPermission(permission);
        
        console.log(`🔍 Permission check for ${section}: ${hasPermissionForSection} (${permission})`);
        
        if (menuLink && !hasPermissionForSection) {
            console.log(`🚫 Hiding ${section} menu item - no permission for ${permission}`);
            menuLink.parentElement.style.display = 'none';
        } else if (menuLink) {
            console.log(`✅ Showing ${section} menu item - has permission for ${permission}`);
            menuLink.parentElement.style.display = 'block';
        }
    });

    // Signup requests tab only visible to super admins
    if (currentUser && currentUser.role !== 'super_admin') {
        const signupTab = document.getElementById('signupTab');
        if (signupTab) {
            signupTab.style.display = 'none';
        }
    }

    // Hide "Add User" button if user can't create users
    if (!hasPermission('create_users')) {
        const addUserBtn = document.querySelector('button[onclick="showCreateUserModal()"]');
        if (addUserBtn) {
            addUserBtn.style.display = 'none';
        }
    }

    // Show appropriate message if user has no access to users section
    if (!hasPermission('view_users')) {
        const usersSection = document.getElementById('users');
        if (usersSection) {
            const container = usersSection.querySelector('.table-container');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-lock"></i>
                        <p>You do not have permission to view users</p>
                    </div>
                `;
            }
        }
    }
}

// Logout
async function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }

    try {
        await fetch('/api/admin-auth?action=logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    redirectToLogin();
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// Switch section
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Update sidebar menu
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionName) {
            link.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        'overview': 'Dashboard Overview',
        'requests': 'Service Requests',
        'feedback': 'Feedback',
        'users': 'User Management',
        'audit': 'Audit Log'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    // Hide mobile sidebar
    document.getElementById('sidebar').classList.remove('show');

    // Load data for section
    if (sectionName === 'requests') {
        loadRequests();
    } else if (sectionName === 'feedback') {
        loadFeedback();
    } else if (sectionName === 'users') {
        loadUsers();
        loadSignupRequests(); // Also load signup requests for the badge
    } else if (sectionName === 'audit') {
        loadAuditLog();
    }
}

// Switch between user tabs
function switchUserTab(tabName) {
    // Hide all user tabs
    document.querySelectorAll('.user-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('#users .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'existing') {
        document.getElementById('existingUsersTab').classList.add('active');
        event.target.classList.add('active');
        loadUsers();
    } else if (tabName === 'signups') {
        document.getElementById('signupRequestsTab').classList.add('active');
        event.target.classList.add('active');
        loadSignupRequests();
    }
}

// Sidebar menu click handlers
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
            switchSection(section);
        }
    });
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/service-requests', {
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });

        const result = await response.json();

        if (result.success && result.statistics) {
            const stats = result.statistics;
            document.getElementById('statTotal').textContent = stats.total || 0;
            document.getElementById('statPending').textContent = stats.pending || 0;
            document.getElementById('statProgress').textContent = stats.inProgress || 0;
            document.getElementById('statCompleted').textContent = stats.completed || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load service requests
async function loadRequests(silent = false) {
    try {
        const statusFilter = document.getElementById('filterStatus')?.value || 'all';
        const categoryFilter = document.getElementById('filterCategory')?.value || 'all';
        const search = document.getElementById('searchRequests')?.value || '';

        const params = new URLSearchParams({
            status: statusFilter,
            category: categoryFilter,
            search: search,
            limit: 100
        });

        const response = await fetch(`/api/service-requests?${params}`, {
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });

        const result = await response.json();

        if (result.success) {
            requestsData = result.data || [];
            renderRequestsTable(requestsData);
            renderRecentRequests(requestsData.slice(0, 5));
            
            // Update category filter options
            updateCategoryFilter(requestsData);
            
            if (!silent) {
                console.log(`✅ Loaded ${requestsData.length} requests`);
            }
        } else {
            console.error('Failed to load requests:', result.message || 'Unknown error');
            // Show empty state with error message
            showEmptyRequestsState();
            if (!silent) {
                showError('Failed to load requests');
            }
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        // Show empty state with error message
        showEmptyRequestsState();
        if (!silent) {
            showError('Failed to load requests');
        }
    }
}

// Show empty state for requests
function showEmptyRequestsState() {
    const requestsTable = document.getElementById('requestsTable');
    const recentRequestsTable = document.getElementById('recentRequestsTable');
    
    const emptyHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No requests found</p>
        </div>
    `;
    
    if (requestsTable) {
        requestsTable.innerHTML = emptyHTML;
    }
    if (recentRequestsTable) {
        recentRequestsTable.innerHTML = emptyHTML;
    }
}

// Load audit log
async function loadAuditLog() {
    const container = document.getElementById('auditLogTable');
    const filter = document.getElementById('filterAuditAction')?.value || 'all';
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading audit log...</p>';
        
        const params = new URLSearchParams();
        if (filter !== 'all') {
            params.append('action', filter);
        }
        params.append('limit', '100');
        
        const response = await fetch(`/api/admin-users?audit=true&${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        const auditLogs = result.auditLogs || [];
        
        if (auditLogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No audit log entries found</p>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Admin User</th>
                        <th>Action</th>
                        <th>Target User</th>
                        <th>IP Address</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditLogs.map(log => `
                        <tr>
                            <td>
                                <span class="timestamp">${new Date(log.created_at).toLocaleString()}</span>
                            </td>
                            <td>
                                <div class="user-info">
                                    <strong>${log.admin_user?.username || 'Unknown'}</strong>
                                    <small>${log.admin_user?.full_name || ''}</small>
                                </div>
                            </td>
                            <td>
                                <span class="action-badge action-${log.action.replace('_', '-')}">
                                    ${getActionDisplayName(log.action)}
                                </span>
                            </td>
                            <td>
                                ${log.target_user ? `
                                    <div class="user-info">
                                        <strong>${log.target_user.username}</strong>
                                        <small>${log.target_user.full_name || ''}</small>
                                    </div>
                                ` : '-'}
                            </td>
                            <td>
                                <code>${log.ip_address || 'Unknown'}</code>
                            </td>
                            <td>
                                ${log.details ? `
                                    <button class="btn btn-sm btn-outline" onclick="showAuditDetails('${log.id}')">
                                        <i class="fas fa-info-circle"></i> Details
                                    </button>
                                ` : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading audit log:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load audit log</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Get display name for action
function getActionDisplayName(action) {
    const actionNames = {
        'login': 'Login',
        'logout': 'Logout',
        'create_user': 'Create User',
        'update_user': 'Update User',
        'update_permissions': 'Update Permissions',
        'delete_user': 'Delete User',
        'approve_signup': 'Approve Signup',
        'reject_signup': 'Reject Signup'
    };
    return actionNames[action] || action;
}

// Show audit details modal
function showAuditDetails(logId) {
    // This would open a modal with detailed audit information
    console.log('Show audit details for:', logId);
}

// Manual refresh function
async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const icon = refreshBtn.querySelector('i');
    
    // Show loading state
    refreshBtn.classList.add('loading');
    icon.className = 'fas fa-sync-alt';
    
    try {
        // Refresh stats and requests
        await Promise.all([
            loadStats(true),
            loadRequests(true)
        ]);
        
        // Show success state briefly
        icon.className = 'fas fa-check';
        setTimeout(() => {
            icon.className = 'fas fa-sync-alt';
            refreshBtn.classList.remove('loading');
        }, 1000);
        
    } catch (error) {
        console.error('Refresh error:', error);
        icon.className = 'fas fa-exclamation-triangle';
        setTimeout(() => {
            icon.className = 'fas fa-sync-alt';
            refreshBtn.classList.remove('loading');
        }, 2000);
    }
}

// Update category filter options
function updateCategoryFilter(requests) {
    const categorySelect = document.getElementById('filterCategory');
    if (!categorySelect) return;

    const categories = [...new Set(requests.map(r => r.offering_category))];
    const currentValue = categorySelect.value;

    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = formatCategoryName(category);
        categorySelect.appendChild(option);
    });

    categorySelect.value = currentValue;
}

// Render requests table
function renderRequestsTable(requests) {
    const container = document.getElementById('requestsTable');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No requests found</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Offering</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr class="request-row" data-request-id="${request.id}">
                        <td><small>${request.id.substring(0, 8)}</small></td>
                        <td>${formatDate(request.created_at)}</td>
                        <td>
                            <strong>${request.customer_name}</strong><br>
                            <small>${request.customer_phone}</small>
                        </td>
                        <td>
                            <strong>${formatCategoryName(request.offering_name)}</strong><br>
                            <small>${formatCategoryName(request.offering_category)}</small>
                        </td>
                        <td>
                            ${hasPermission('update_requests') ? `
                            <select class="status-dropdown" data-request-id="${request.id}" onchange="updateRequestStatus('${request.id}', this.value)">
                                <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="in-progress" ${request.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${request.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                            ` : `
                                <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
                            `}
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon btn-view" onclick="viewRequest('${request.id}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${hasPermission('add_comments') ? `
                                <button class="btn-icon btn-comments" onclick="toggleComments('${request.id}')" title="Comments (${(request.comments || []).length})">
                                    <i class="fas fa-comments"></i>
                                    ${(request.comments || []).length > 0 ? `<span class="comment-count">${request.comments.length}</span>` : ''}
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                    <tr class="comments-row" data-request-id="${request.id}" style="display: none;">
                        <td colspan="6">
                            <div class="comments-container">
                                <div class="comments-header">
                                    <h4>Comments & Notes</h4>
                                    <button class="btn-close-comments" onclick="toggleComments('${request.id}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="comments-content">
                                    <div class="add-comment-section">
                                        <textarea id="comment-${request.id}" placeholder="Add a comment or note..." rows="2"></textarea>
                                        <button class="btn-add-comment" onclick="addCommentInline('${request.id}')">
                                            <i class="fas fa-plus"></i> Add Comment
                                        </button>
                                    </div>
                                    <div class="comments-list" id="comments-list-${request.id}">
                                        ${renderCommentsInline(request.comments || [])}
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Render recent requests (for overview)
function renderRecentRequests(requests) {
    const container = document.getElementById('recentRequestsTable');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No recent requests</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Offering</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr style="cursor: pointer;" onclick="viewRequest('${request.id}')">
                        <td>${formatDate(request.created_at)}</td>
                        <td>
                            <strong>${request.customer_name}</strong><br>
                            <small>${request.customer_email}</small>
                        </td>
                        <td>
                            <strong>${formatCategoryName(request.offering_name)}</strong><br>
                            <small>${formatCategoryName(request.offering_category)}</small>
                        </td>
                        <td>
                            <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// View request details
function viewRequest(requestId) {
    const request = requestsData.find(r => r.id === requestId);
    if (!request) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-group">
            <label>Request ID</label>
            <div class="value">${request.id}</div>
        </div>
        <div class="detail-group">
            <label>Date Submitted</label>
            <div class="value">${formatDateTime(request.created_at)}</div>
        </div>
        <div class="detail-group">
            <label>Status</label>
            <div class="value">
                <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
            </div>
        </div>
        <div class="detail-group">
            <label>Customer Name</label>
            <div class="value">${request.customer_name}</div>
        </div>
        <div class="detail-group">
            <label>Email</label>
            <div class="value">${request.customer_email}</div>
        </div>
        <div class="detail-group">
            <label>Phone</label>
            <div class="value">${request.customer_phone}</div>
        </div>
        <div class="detail-group">
            <label>Address</label>
            <div class="value">${request.customer_address}</div>
        </div>
        <div class="detail-group">
            <label>Offering Category</label>
            <div class="value">${formatCategoryName(request.offering_category)}</div>
        </div>
        <div class="detail-group">
            <label>Offering Name</label>
            <div class="value">${formatCategoryName(request.offering_name)}</div>
        </div>
        ${renderRequestDetails(request.request_details)}
        ${request.notes ? `
            <div class="detail-group">
                <label>Admin Notes</label>
                <div class="value">${request.notes}</div>
            </div>
        ` : ''}
    `;

    document.getElementById('detailModal').classList.add('show');
}

// Render request details
function renderRequestDetails(details) {
    if (!details || Object.keys(details).length === 0) {
        return '';
    }

    let html = '<div class="detail-group"><label>Request Details</label>';
    
    for (const [key, value] of Object.entries(details)) {
        if (key !== 'page_url') {
            html += `
                <div class="value" style="margin-top: 8px;">
                    <strong>${formatFieldName(key)}:</strong> ${value}
                </div>
            `;
        }
    }
    
    html += '</div>';
    return html;
}

// Update request status
async function updateStatus(requestId) {
    const request = requestsData.find(r => r.id === requestId);
    if (!request) return;

    const newStatus = prompt(
        `Update status for ${request.customer_name}:\n\nCurrent: ${formatStatus(request.status)}\n\nEnter new status (pending/in-progress/completed/cancelled):`,
        request.status
    );

    if (!newStatus) return;

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
        alert('Invalid status! Use: pending, in-progress, completed, or cancelled');
        return;
    }

    try {
        const response = await fetch('/api/service-requests', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSessionToken()}`
            },
            body: JSON.stringify({
                id: requestId,
                status: newStatus.toLowerCase()
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Status updated successfully!');
            loadRequests();
            loadStats();
        } else {
            alert('Failed to update status: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

// Close modal
function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

// Close modal on overlay click
const detailModal = document.getElementById('detailModal');
if (detailModal) {
    detailModal.addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            closeModal();
        }
    });
}

// Close user modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const userModal = document.getElementById('userModal');
    if (userModal) {
        userModal.addEventListener('click', (e) => {
            if (e.target.id === 'userModal') {
                closeUserModal();
            }
        });
    }
});

// Load feedback
async function loadFeedback() {
    // Use global auth token if available, fallback to local sessionToken
    const token = window.adminAuth?.sessionToken || sessionToken;
    
    console.log('Loading feedback...');
    console.log('🔑 Session token:', token ? 'Present (length: ' + token.length + ')' : 'Missing');
    
    try {
        const response = await fetch('/api/feedback-supabase', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Feedback loaded:', result.analytics);
            renderFeedbackAnalytics(result.analytics);
            renderFeedbackTable(result.analytics.recentFeedback);
        } else {
            console.error('Failed to load feedback:', result.message);
            if (result.message.includes('permission')) {
                showFeedbackError('You do not have permission to view feedback');
            } else {
            showFeedbackError('Failed to load feedback');
            }
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        showFeedbackError('Error connecting to feedback system');
    }
}

// Render feedback analytics
function renderFeedbackAnalytics(analytics) {
    const container = document.getElementById('feedbackAnalytics');
    
    const starsHTML = '★'.repeat(Math.round(analytics.averageRating)) + '☆'.repeat(5 - Math.round(analytics.averageRating));
    
    container.innerHTML = `
        <div class="feedback-stat-card count">
            <span class="feedback-stat-number">${analytics.totalFeedback}</span>
            <span class="feedback-stat-label">Total Feedback</span>
        </div>
        <div class="feedback-stat-card rating">
            <span class="feedback-stat-number">${analytics.averageRating.toFixed(1)}</span>
            <span class="feedback-stat-label">Average Rating</span>
            <div class="feedback-stars">${starsHTML}</div>
        </div>
        <div class="feedback-stat-card">
            <span class="feedback-stat-number">${analytics.totalRatings}</span>
            <span class="feedback-stat-label">With Ratings</span>
        </div>
    `;
}

// Render feedback table
function renderFeedbackTable(feedbackList) {
    const container = document.getElementById('feedbackTableContainer');
    
    if (!feedbackList || feedbackList.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; padding: 60px; color: #999;">
                <i class="fas fa-comments" style="font-size: 48px; opacity: 0.3; display: block; margin-bottom: 15px;"></i>
                No feedback received yet.
            </p>
        `;
        return;
    }

    const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Page</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                    <th>User Info</th>
                </tr>
            </thead>
            <tbody>
                ${feedbackList.map(feedback => `
                    <tr>
                        <td>${formatDate(feedback.created_at)}</td>
                        <td><small>${feedback.page || '/'}</small></td>
                        <td>
                            <div class="rating-display">
                                ${'★'.repeat(feedback.rating || 0)}${'☆'.repeat(5 - (feedback.rating || 0))}
                            </div>
                        </td>
                        <td>${feedback.feedback ? `<div style="max-width: 400px; white-space: normal;">${feedback.feedback}</div>` : '<em style="color: #999;">No comment</em>'}</td>
                        <td><small>${feedback.ip_address || 'N/A'}</small></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Show feedback error
function showFeedbackError(message) {
    const container = document.getElementById('feedbackTableContainer');
    container.innerHTML = `
        <p style="text-align: center; padding: 60px; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; opacity: 0.3; display: block; margin-bottom: 15px;"></i>
            ${message}
        </p>
    `;
}

// Show create user modal
function showCreateUserModal() {
    alert('User creation functionality coming soon!');
}

// Filter handlers
document.getElementById('filterStatus')?.addEventListener('change', loadRequests);
document.getElementById('filterCategory')?.addEventListener('change', loadRequests);

// Search handler with debounce
let searchTimeout;
document.getElementById('searchRequests')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadRequests();
    }, 500);
});

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function formatCategoryName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatFieldName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function showError(message) {
    alert('Error: ' + message);
}

// Update request status
async function updateRequestStatus(requestId, newStatus) {
    try {
        const response = await fetch('/api/service-requests', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSessionToken()}`
            },
            body: JSON.stringify({
                id: requestId,
                status: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Status updated to ${newStatus}`);
            // Refresh the table to show updated status
            loadRequests(true);
        } else {
            console.error('Failed to update status:', result.message);
            showError('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Failed to update status');
    }
}

// Toggle comments row visibility
function toggleComments(requestId) {
    const commentsRow = document.querySelector(`tr.comments-row[data-request-id="${requestId}"]`);
    if (!commentsRow) return;

    const isVisible = commentsRow.style.display !== 'none';
    
    // Close all other comment rows first
    document.querySelectorAll('.comments-row').forEach(row => {
        if (row.dataset.requestId !== requestId) {
            row.style.display = 'none';
        }
    });

    // Toggle current row
    commentsRow.style.display = isVisible ? 'none' : 'table-row';
    
    // Focus on textarea when opening
    if (!isVisible) {
        setTimeout(() => {
            const textarea = document.getElementById(`comment-${requestId}`);
            if (textarea) textarea.focus();
        }, 100);
    }
}

// Render comments inline
function renderCommentsInline(comments) {
    if (!comments || comments.length === 0) {
        return '<div class="no-comments">No comments yet. Add the first comment above!</div>';
    }

    return comments.map((comment, index) => `
        <div class="comment-item-inline">
            <div class="comment-header-inline">
                <span class="comment-author-inline">${comment.author || 'Admin'}</span>
                <span class="comment-time-inline">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-content-inline">
                ${comment.content}
            </div>
        </div>
    `).join('');
}

// Add comment inline
async function addCommentInline(requestId) {
    const textarea = document.getElementById(`comment-${requestId}`);
    const commentText = textarea.value.trim();
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    try {
        const response = await fetch('/api/service-requests', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSessionToken()}`
            },
            body: JSON.stringify({
                id: requestId,
                comment: {
                    content: commentText,
                    author: currentUser?.name || 'Admin',
                    timestamp: new Date().toISOString()
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Comment added');
            
            // Clear the textarea
            textarea.value = '';
            
            // Update local data
            const request = requestsData.find(r => r.id === requestId);
            if (request) {
                if (!request.comments) request.comments = [];
                request.comments.push({
                    content: commentText,
                    author: currentUser?.name || 'Admin',
                    timestamp: new Date().toISOString()
                });
                
                // Update comments list
                const commentsList = document.getElementById(`comments-list-${requestId}`);
                if (commentsList) {
                    commentsList.innerHTML = renderCommentsInline(request.comments);
                }
                
                // Update comment count in button
                const commentBtn = document.querySelector(`button[onclick="toggleComments('${requestId}')"]`);
                if (commentBtn) {
                    const countSpan = commentBtn.querySelector('.comment-count');
                    if (countSpan) {
                        countSpan.textContent = request.comments.length;
                    } else if (request.comments.length > 0) {
                        commentBtn.innerHTML = `
                            <i class="fas fa-comments"></i>
                            <span class="comment-count">${request.comments.length}</span>
                        `;
                    }
                }
            }
        } else {
            console.error('Failed to add comment:', result.message);
            showError('Failed to add comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showError('Failed to add comment');
    }
}


