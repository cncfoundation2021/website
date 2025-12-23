/**
 * Signup Request Management Module
 * Handles viewing and approving/rejecting signup requests
 */

let allSignupRequests = [];
let signupStatistics = {};

// Load signup requests
async function loadSignupRequests() {
    try {
        const statusFilter = document.getElementById('filterSignupStatus')?.value || 'all';
        
        const response = await fetch(`/api/signup-request?status=${statusFilter}&limit=100`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            allSignupRequests = result.requests || [];
            signupStatistics = result.statistics || {};
            renderSignupRequestsTable(allSignupRequests);
            renderSignupStats(signupStatistics);
            
            // Update badge count
            updatePendingBadge(signupStatistics.pending_requests || 0);
        } else {
            showError('Failed to load signup requests: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading signup requests:', error);
        // Still try to update badge
        updatePendingBadge(0);
    }
}

// Update pending badge count
function updatePendingBadge(count) {
    const badge = document.getElementById('pendingBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Render signup statistics
function renderSignupStats(stats) {
    const container = document.getElementById('signupStatsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div class="stat-card" style="padding: 15px;">
                <div class="stat-icon total" style="width: 40px; height: 40px; font-size: 18px;">
                    <i class="fas fa-inbox"></i>
                </div>
                <div class="stat-info">
                    <h3 style="font-size: 24px;">${stats.total_requests || 0}</h3>
                    <p style="font-size: 12px;">Total Requests</p>
                </div>
            </div>
            <div class="stat-card" style="padding: 15px;">
                <div class="stat-icon pending" style="width: 40px; height: 40px; font-size: 18px;">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3 style="font-size: 24px;">${stats.pending_requests || 0}</h3>
                    <p style="font-size: 12px;">Pending</p>
                </div>
            </div>
            <div class="stat-card" style="padding: 15px;">
                <div class="stat-icon completed" style="width: 40px; height: 40px; font-size: 18px;">
                    <i class="fas fa-check"></i>
                </div>
                <div class="stat-info">
                    <h3 style="font-size: 24px;">${stats.approved_requests || 0}</h3>
                    <p style="font-size: 12px;">Approved</p>
                </div>
            </div>
            <div class="stat-card" style="padding: 15px;">
                <div class="stat-icon" style="width: 40px; height: 40px; font-size: 18px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                    <i class="fas fa-times"></i>
                </div>
                <div class="stat-info">
                    <h3 style="font-size: 24px;">${stats.rejected_requests || 0}</h3>
                    <p style="font-size: 12px;">Rejected</p>
                </div>
            </div>
        </div>
    `;
}

// Render signup requests table
function renderSignupRequestsTable(requests) {
    const container = document.getElementById('signupRequestsTable');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-clock"></i>
                <p>No signup requests found</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Requested</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr>
                        <td>${formatDate(request.requested_at)}</td>
                        <td><strong>${request.username}</strong></td>
                        <td>${request.full_name}</td>
                        <td><small>${request.email}</small></td>
                        <td>${request.organization || '-'}</td>
                        <td>
                            <span class="status-badge ${getSignupStatusClass(request.status)}">
                                ${formatStatus(request.status)}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon btn-view" onclick="viewSignupRequest('${request.id}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${request.status === 'pending' ? `
                                    <button class="btn-icon btn-permissions" onclick="approveSignupRequest('${request.id}')" title="Approve">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn-icon btn-delete" onclick="rejectSignupRequest('${request.id}')" title="Reject">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : `
                                    <small style="color: #999;">
                                        ${request.status === 'approved' ? 'Approved' : 'Rejected'}
                                        ${request.reviewed_at ? 'on ' + formatDate(request.reviewed_at) : ''}
                                    </small>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Get status class for badge
function getSignupStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-completed',
        'rejected': 'status-cancelled'
    };
    return classMap[status] || '';
}

// View signup request details
function viewSignupRequest(requestId) {
    const request = allSignupRequests.find(r => r.id === requestId);
    if (!request) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-group">
            <label>Request ID</label>
            <div class="value"><small>${request.id}</small></div>
        </div>
        <div class="detail-group">
            <label>Username</label>
            <div class="value"><strong>${request.username}</strong></div>
        </div>
        <div class="detail-group">
            <label>Full Name</label>
            <div class="value">${request.full_name}</div>
        </div>
        <div class="detail-group">
            <label>Email</label>
            <div class="value">${request.email}</div>
        </div>
        ${request.organization ? `
            <div class="detail-group">
                <label>Organization</label>
                <div class="value">${request.organization}</div>
            </div>
        ` : ''}
        ${request.reason ? `
            <div class="detail-group">
                <label>Reason for Access</label>
                <div class="value">${request.reason}</div>
            </div>
        ` : ''}
        <div class="detail-group">
            <label>Status</label>
            <div class="value">
                <span class="status-badge ${getSignupStatusClass(request.status)}">${formatStatus(request.status)}</span>
            </div>
        </div>
        <div class="detail-group">
            <label>Requested Date</label>
            <div class="value">${formatDateTime(request.requested_at)}</div>
        </div>
        ${request.reviewed_at ? `
            <div class="detail-group">
                <label>Reviewed Date</label>
                <div class="value">${formatDateTime(request.reviewed_at)}</div>
            </div>
        ` : ''}
        ${request.reviewed_by_user ? `
            <div class="detail-group">
                <label>Reviewed By</label>
                <div class="value">${request.reviewed_by_user.full_name || request.reviewed_by_user.username}</div>
            </div>
        ` : ''}
        ${request.approved_role ? `
            <div class="detail-group">
                <label>Approved Role</label>
                <div class="value">
                    <span class="role-badge role-${request.approved_role}">${formatRole(request.approved_role)}</span>
                </div>
            </div>
        ` : ''}
        ${request.rejection_reason ? `
            <div class="detail-group">
                <label>Rejection Reason</label>
                <div class="value">${request.rejection_reason}</div>
            </div>
        ` : ''}
        <div class="detail-group">
            <label>IP Address</label>
            <div class="value"><small>${request.ip_address || 'N/A'}</small></div>
        </div>
    `;

    document.getElementById('detailModal').classList.add('show');
}

// Approve signup request
async function approveSignupRequest(requestId) {
    const request = allSignupRequests.find(r => r.id === requestId);
    if (!request) return;

    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <div class="permissions-info">
            <p><strong>Approve Signup Request</strong></p>
            <p><strong>User:</strong> ${request.username} (${request.full_name})</p>
            <p><strong>Email:</strong> ${request.email}</p>
        </div>
        <form id="approveSignupForm" onsubmit="return false;">
            <div class="form-group">
                <label for="approveRole">Assign Role *</label>
                <select id="approveRole" required class="form-input">
                    <option value="">-- Select Role --</option>
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="manager">Manager - Can manage requests</option>
                    <option value="admin">Admin - Full access except user management</option>
                    ${currentUser.role === 'super_admin' ? '<option value="super_admin">Super Admin - Full system access</option>' : ''}
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="confirmApproveSignup('${requestId}')">Approve & Create User</button>
            </div>
        </form>
    `;

    document.getElementById('userModalTitle').textContent = 'Approve Signup Request';
    document.getElementById('userModal').classList.add('show');
}

// Confirm approval
async function confirmApproveSignup(requestId) {
    const role = document.getElementById('approveRole').value;

    if (!role) {
        alert('Please select a role');
        return;
    }

    if (!confirm('Are you sure you want to approve this signup request and create the user account?')) {
        return;
    }

    try {
        const response = await fetch('/api/signup-request', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                requestId,
                role
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Signup request approved! User account created successfully.');
            closeUserModal();
            loadSignupRequests();
            loadUsers(); // Reload users list
        } else {
            alert('Failed to approve signup: ' + result.message);
        }
    } catch (error) {
        console.error('Error approving signup:', error);
        alert('Failed to approve signup');
    }
}

// Reject signup request
async function rejectSignupRequest(requestId) {
    const request = allSignupRequests.find(r => r.id === requestId);
    if (!request) return;

    const reason = prompt(
        `Reject signup request for ${request.username}?\n\nPlease provide a reason for rejection:`,
        'Does not meet approval criteria'
    );

    if (reason === null) return; // Cancelled

    try {
        const response = await fetch('/api/signup-request', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                requestId,
                reason
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Signup request rejected.');
            loadSignupRequests();
        } else {
            alert('Failed to reject signup: ' + result.message);
        }
    } catch (error) {
        console.error('Error rejecting signup:', error);
        alert('Failed to reject signup');
    }
}

// Filter handler
document.getElementById('filterSignupStatus')?.addEventListener('change', loadSignupRequests);

