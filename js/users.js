// DOM Elements
const usersPage = document.getElementById('users-page');
const usersTableBody = document.getElementById('usersTableBody');
const userCountElement = document.getElementById('userCount');
const userSearchInput = document.getElementById('userSearch');
const userModal = document.getElementById('userModal');
const userModalContent = document.querySelector('#userModal .modal-body');
const btnExportUsers = document.getElementById('btnExportUsers');

// User data array
let usersData = [];
let filteredUsers = [];

// Initialize users page
document.addEventListener('usersPageActive', initUsersPage);
document.addEventListener('dataLoaded', handleDataLoaded);

// Initialize users page
function initUsersPage() {
    // Only initialize if users page is active
    if (!usersPage.classList.contains('active')) return;
    
    console.log("Initializing users page...");
    
    // Setup event listeners
    setupUserPageEventListeners();
    
    // Request latest user data
    const event = new CustomEvent('requestData');
    document.dispatchEvent(event);
}

// Handle data loaded
function handleDataLoaded(event) {
    const data = event.detail;
    console.log("Users page received data:", data);
    
    if (data.users) {
        // Load users data
        loadUsersData(data.users);
    }
}

// Setup users page event listeners
function setupUserPageEventListeners() {
    // Set up search functionality
    if (userSearchInput) {
        userSearchInput.addEventListener('input', performUserSearch);
    }
    
    // Set up export button
    if (btnExportUsers) {
        btnExportUsers.addEventListener('click', exportUsersData);
    }
}

// Load users from Firebase
function loadUsersData(userData) {
    console.log("Loading users data:", userData);
    
    if (!usersTableBody) return;
    
    // Convert to array
    usersData = Object.entries(userData)
        .filter(([key, user]) => typeof user === 'object' && user !== null)
        .map(([id, user]) => ({
            id,
            fullName: user.fullName || 'Unknown',
            phone: id, // Phone number is the key
            email: user.email || 'N/A',
            emergencyContacts: user.emergencyContacts || [],
            status: user.lastActive ? 'Active' : 'Inactive',
            registrationDate: user.registrationDate || 'Unknown',
            lastActive: user.lastActive || 'Never',
            profilePic: user.profilePic || '',
            address: user.address || '',
            settings: user.settings || {},
            verificationStatus: user.verified ? 'Verified' : 'Unverified'
        }))
        .sort((a, b) => {
            // Sort by registration date if available, otherwise by ID
            if (a.registrationDate && a.registrationDate !== 'Unknown' && 
                b.registrationDate && b.registrationDate !== 'Unknown') {
                return new Date(b.registrationDate) - new Date(a.registrationDate);
            }
            return b.id.localeCompare(a.id);
        });
    
    // Update filtered users
    filteredUsers = [...usersData];
    
    // Update user count
    if (userCountElement) {
        userCountElement.textContent = usersData.length;
    }
    
    // Display users in table
    displayUsers(filteredUsers);
}

// Display users in table
function displayUsers(users) {
    // Clear current table
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="7" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No users found</h5>
                    <p class="small text-muted">Try adjusting your search or filter criteria</p>
                </div>
            </td>
        `;
        usersTableBody.appendChild(noDataRow);
        return;
    }
    
    // Add each user to table
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        
        // Format dates
        const formattedRegistrationDate = user.registrationDate !== 'Unknown' ? 
            formatDate(user.registrationDate) : 'Unknown';
        
        const formattedLastActive = user.lastActive !== 'Never' ? 
            formatTimeAgo(user.lastActive) : 'Never';
        
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="user-avatar me-2 ${user.profilePic ? '' : 'default-avatar'}">
                        ${user.profilePic ? 
                            `<img src="${user.profilePic}" alt="${user.fullName}" class="rounded-circle" width="40" height="40">` : 
                            `<div class="default-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; background-color: #e9ecef;">
                                <i class="fas fa-user text-primary"></i>
                            </div>`
                        }
                    </div>
                    <div>
                        <h6 class="mb-0">${user.fullName}</h6>
                        <small class="text-muted">${formatPhoneNumber(user.phone)}</small>
                    </div>
                </div>
            </td>
            <td class="d-none d-md-table-cell">${user.email}</td>
            <td class="d-none d-md-table-cell">${user.emergencyContacts ? user.emergencyContacts.length : 0}</td>
            <td class="d-none d-md-table-cell">
                <span class="badge bg-${user.status === 'Active' ? 'success' : 'secondary'}">${user.status}</span>
            </td>
            <td class="d-none d-lg-table-cell">
                <div class="d-flex flex-column">
                    <small><i class="fas fa-calendar-alt me-1"></i> ${formattedRegistrationDate}</small>
                    <small class="text-muted"><i class="fas fa-clock me-1"></i> ${formattedLastActive}</small>
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmUserAction('${user.id}', 'delete')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
}

// Search users
function performUserSearch() {
    const searchTerm = userSearchInput.value.toLowerCase();
    
    if (!searchTerm) {
        // If search is empty, show all users
        filteredUsers = [...usersData];
    } else {
        // Filter users based on search term
        filteredUsers = usersData.filter(user => 
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.phone.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Update displayed users
    displayUsers(filteredUsers);
}

// View user details
window.viewUserDetails = function(userId) {
    // Find user in the data
    const user = usersData.find(u => u.id === userId);
    
    if (!user) {
        console.error('User not found:', userId);
        return;
    }
    
    // Populate modal with user details
    userModalContent.innerHTML = `
        <div class="user-profile-header mb-4">
            <div class="d-flex align-items-center mb-3">
                <div class="user-avatar me-3 ${user.profilePic ? '' : 'default-avatar'}">
                    ${user.profilePic ? 
                        `<img src="${user.profilePic}" alt="${user.fullName}" class="rounded-circle" width="80" height="80">` : 
                        `<div class="default-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center" style="width: 80px; height: 80px; background-color: #e9ecef;">
                            <i class="fas fa-user fa-2x text-primary"></i>
                        </div>`
                    }
                </div>
                <div>
                    <h4 class="mb-0">${user.fullName}</h4>
                    <p class="text-muted mb-0">${formatPhoneNumber(user.phone)}</p>
                    <span class="badge bg-${user.verificationStatus === 'Verified' ? 'success' : 'warning'} mt-1">
                        ${user.verificationStatus}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-header bg-light">
                        <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i> Basic Information</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-muted">User ID</span>
                                <span class="fw-medium">${user.id}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-muted">Email</span>
                                <span class="fw-medium">${user.email}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-muted">Status</span>
                                <span class="fw-medium">${user.status}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-muted">Registration Date</span>
                                <span class="fw-medium">${user.registrationDate !== 'Unknown' ? formatDate(user.registrationDate) : 'Unknown'}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between px-0">
                                <span class="text-muted">Last Active</span>
                                <span class="fw-medium">${user.lastActive !== 'Never' ? formatTimeAgo(user.lastActive) : 'Never'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-header bg-light">
                        <h5 class="mb-0"><i class="fas fa-phone-alt me-2"></i> Emergency Contacts</h5>
                    </div>
                    <div class="card-body">
                        ${user.emergencyContacts && user.emergencyContacts.length > 0 ? 
                            `<ul class="list-group list-group-flush">
                                ${user.emergencyContacts.map((contact, index) => `
                                    <li class="list-group-item px-0">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div class="fw-medium">${contact.name || 'Contact ' + (index + 1)}</div>
                                                <div class="text-muted small">${formatPhoneNumber(contact.phone)}</div>
                                            </div>
                                            <span class="badge bg-primary">${contact.relationship || 'N/A'}</span>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>` : 
                            `<div class="text-center py-4">
                                <i class="fas fa-address-book fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No emergency contacts added</p>
                            </div>`
                        }
                    </div>
                </div>
                
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="mb-0"><i class="fas fa-map-marker-alt me-2"></i> Address</h5>
                    </div>
                    <div class="card-body">
                        ${user.address ? 
                            `<p class="mb-0">${user.address}</p>` : 
                            `<div class="text-center py-4">
                                <i class="fas fa-home fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No address provided</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-light">
                        <h5 class="mb-0"><i class="fas fa-cog me-2"></i> App Settings</h5>
                    </div>
                    <div class="card-body">
                        ${user.settings ? 
                            `<ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between px-0">
                                    <span class="text-muted">Location Tracking</span>
                                    <span class="fw-medium">${user.settings.locationTrackingEnabled ? 'Enabled' : 'Disabled'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between px-0">
                                    <span class="text-muted">Emergency Alerts</span>
                                    <span class="fw-medium">${user.settings.emergencyAlertsEnabled ? 'Enabled' : 'Disabled'}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between px-0">
                                    <span class="text-muted">Notifications</span>
                                    <span class="fw-medium">${user.settings.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                                </li>
                            </ul>` : 
                            `<div class="text-center py-4">
                                <i class="fas fa-cog fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No settings information available</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Get modal from Bootstrap
    const modal = new bootstrap.Modal(userModal);
    modal.show();
};

// Confirm user action (delete, suspend, etc.)
window.confirmUserAction = function(userId, action) {
    // Find user in the data
    const user = usersData.find(u => u.id === userId);
    
    if (!user) {
        console.error('User not found:', userId);
        return;
    }
    
    // Show confirmation based on action
    let message = '';
    let title = '';
    
    switch (action) {
        case 'delete':
            title = 'Confirm User Deletion';
            message = `Are you sure you want to delete user ${user.fullName}? This action cannot be undone.`;
            break;
        case 'suspend':
            title = 'Confirm User Suspension';
            message = `Are you sure you want to suspend user ${user.fullName}?`;
            break;
        default:
            title = 'Confirm Action';
            message = `Are you sure you want to perform this action on user ${user.fullName}?`;
    }
    
    // For demo purposes, just show an alert
    const confirm = window.confirm(message);
    
    if (confirm) {
        // In a real app, you would call your API to perform the action
        // For demo, show toast notification
        notificationHandler.showToast(`Action ${action} performed on user ${user.fullName}`, 'info');
    }
};

// Export users data
function exportUsersData() {
    // Simulate export action
    notificationHandler.showToast('Users data export started. You will receive an email when ready.', 'info');
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

// Format phone number
function formatPhoneNumber(phone) {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

// Format timestamp to relative time
function formatTimeAgo(timestamp) {
    if (!timestamp || timestamp === 'Never') return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Check if user is recently active (within 1 hour)
function isRecentlyActive(timestamp) {
    if (!timestamp || timestamp === 'Never') return false;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    
    return diffHour <= 1;
}

// Make highlightUser function available globally (for calls from other scripts)
window.highlightUser = highlightUser; 