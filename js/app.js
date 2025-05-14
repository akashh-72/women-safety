// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.querySelector('.page-title');
const pages = document.querySelectorAll('.page');

// Store global data
let userData = {};
let locationData = {};
let safetyZoneData = {};
let emergencyData = [];

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    addMapMarkerStyles();
    addModalStyles();
    
    // Load data
    loadData();
});

// Load all data from Firebase
function loadData() {
    console.log("Loading data from Firebase...");
    
    // Reference to the database root
    const dbRef = firebase.database().ref();
    
    // Get all data at once for better performance
    dbRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            console.log("Data loaded:", data);
            
            if (data) {
                // Process Users data
                if (data.Users) {
                    userData = data.Users;
                    processUserData(userData);
                }
                
                // Process UserLocations data
                if (data.UserLocations) {
                    locationData = data.UserLocations;
                    processLocationData(locationData);
                }
                
                // Process nearby_devices data (for emergency)
                if (data.nearby_devices) {
                    processNearbyDevices(data.nearby_devices);
                }
                
                // Process safety_zones data
                if (data.safety_zones) {
                    safetyZoneData = data.safety_zones;
                    processSafetyZones(safetyZoneData);
                }
                
                // Process locations history data
                if (data.locations) {
                    processLocationHistory(data.locations);
                }
                
                // Dispatch event that all data is loaded
                dispatchDataLoadedEvent();
            } else {
                console.error("No data found in Firebase");
            }
        })
        .catch((error) => {
            console.error("Error loading data from Firebase:", error);
        });
}

// Process user data
function processUserData(usersData) {
    // Filter out non-user entries
    const validUsers = Object.entries(usersData)
        .filter(([key, value]) => 
            typeof value === 'object' && 
            value !== null && 
            value.fullName &&
            !['emergencyContact', 'fullName', 'phone', 'relatives'].includes(key)
        );
    
    const userCount = validUsers.length;
    
    // Update dashboard stats
    document.getElementById('totalUsers').textContent = userCount;
    document.getElementById('newUsers').textContent = Math.floor(userCount * 0.3); // Simulate 30% new users
    document.getElementById('activeUsers').textContent = Math.floor(userCount * 0.7); // Simulate 70% active users
    
    // Update safety score
    const safetyScore = 85 + Math.floor(Math.random() * 10);
    document.getElementById('safetyScore').textContent = safetyScore;
    
    // Load recent users for dashboard
    loadRecentUsers(validUsers);
    
    // Dispatch event that users are loaded
    document.dispatchEvent(new CustomEvent('usersLoaded', { 
        detail: userData 
    }));
}

// Process location data
function processLocationData(locationsData) {
    // Create emergency data from locations (for demo purposes)
    createMockEmergencyData(locationsData);
    
    // Update emergency counts
    const emergencyCount = emergencyData.length;
    document.getElementById('totalEmergencies').textContent = emergencyCount;
    document.getElementById('activeEmergencies').textContent = Math.ceil(emergencyCount * 0.6); // 60% active
    
    // Update emergency badge
    const badge = document.querySelector('.emergency-badge');
    if (badge && emergencyCount > 0) {
        badge.textContent = emergencyCount;
        badge.classList.remove('d-none');
    }
    
    // Dispatch event that locations are loaded
    document.dispatchEvent(new CustomEvent('locationsLoaded', { 
        detail: locationsData 
    }));
}

// Process nearby devices data (for emergency alerts)
function processNearbyDevices(devicesData) {
    // Add to emergency data
    Object.entries(devicesData).forEach(([userId, device]) => {
        // Find user info
        const user = findUserById(userId);
        
        if (user && device.latitude && device.longitude) {
            emergencyData.push({
                userId: userId,
                userName: user.fullName,
                userPhone: user.phone,
                timestamp: device.lastUpdated || new Date().getTime(),
                location: { 
                    latitude: device.latitude, 
                    longitude: device.longitude 
                },
                status: 'active',
                type: 'SOS'
            });
        }
    });
    
    // Update emergency counts
    const emergencyCount = emergencyData.length;
    document.getElementById('totalEmergencies').textContent = emergencyCount;
    document.getElementById('activeEmergencies').textContent = Math.ceil(emergencyCount * 0.6); // 60% active
    
    // Dispatch event that emergency data is updated
    document.dispatchEvent(new CustomEvent('emergencyDataUpdated', { 
        detail: emergencyData 
    }));
}

// Process safety zones data
function processSafetyZones(zonesData) {
    document.dispatchEvent(new CustomEvent('safetyZonesLoaded', { 
        detail: zonesData 
    }));
}

// Process location history data
function processLocationHistory(historyData) {
    document.dispatchEvent(new CustomEvent('locationHistoryLoaded', { 
        detail: historyData 
    }));
}

// Create mock emergency data from user locations
function createMockEmergencyData(locationsData) {
    // Create emergency alerts for some users
    Object.entries(locationsData).forEach(([phone, locationInfo]) => {
        // Find user with this phone number
        const user = findUserByPhone(phone);
        
        if (user && locationInfo.latitude && locationInfo.longitude) {
            // Create emergency alert with 30% probability
            if (Math.random() < 0.3) {
                emergencyData.push({
                    userId: user.id,
                    userName: user.fullName,
                    userPhone: user.phone,
                    timestamp: new Date().getTime() - Math.floor(Math.random() * 60 * 60 * 1000), // Random time in last hour
                    location: { 
                        latitude: locationInfo.latitude, 
                        longitude: locationInfo.longitude 
                    },
                    status: 'active',
                    type: Math.random() < 0.7 ? 'SOS' : 'Fall Detection'
                });
            }
        }
    });
    
    // If no emergency data was created, add at least one
    if (emergencyData.length === 0) {
        // Get first user with location
        const firstLocationEntry = Object.entries(locationsData)[0];
        if (firstLocationEntry) {
            const [phone, locationInfo] = firstLocationEntry;
            const user = findUserByPhone(phone);
            
            if (user) {
                emergencyData.push({
                    userId: user.id,
                    userName: user.fullName,
                    userPhone: user.phone,
                    timestamp: new Date().getTime() - (5 * 60 * 1000), // 5 minutes ago
                    location: { 
                        latitude: locationInfo.latitude, 
                        longitude: locationInfo.longitude 
                    },
                    status: 'active',
                    type: 'SOS'
                });
            }
        }
    }
}

// Load recent users for dashboard
function loadRecentUsers(users) {
    const recentUsersList = document.getElementById('recentUsersList');
    if (!recentUsersList) return;
    
    // Clear current list
    recentUsersList.innerHTML = '';
    
    // Sort users by id (newer first) and take first 5
    const recentUsers = users
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5);
    
    // Add each user to list
    recentUsers.forEach(([id, user]) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item d-flex align-items-center p-2 border-bottom';
        
        userItem.innerHTML = `
            <div class="user-avatar me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="fas fa-user text-primary"></i>
            </div>
            <div class="user-info">
                <h6 class="mb-0">${user.fullName || 'N/A'}</h6>
                <small class="text-muted">${formatPhoneNumber(user.phone)}</small>
            </div>
            <div class="ms-auto">
                <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        recentUsersList.appendChild(userItem);
    });
    
    // Add "No users" message if no users
    if (recentUsersList.children.length === 0) {
        recentUsersList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> No users registered
            </div>
        `;
    }
}

// Dispatch event that all data is loaded
function dispatchDataLoadedEvent() {
    document.dispatchEvent(new CustomEvent('dataLoaded', {
        detail: {
            users: userData,
            locations: locationData,
            safetyZones: safetyZoneData,
            emergencies: emergencyData
        }
    }));
    
    // Also trigger dashboard loaded
    document.dispatchEvent(new CustomEvent('dashboardLoaded'));
    
    // Initialize the current page
    const activePage = document.querySelector('.nav-item.active');
    if (activePage) {
        const pageId = activePage.getAttribute('data-page');
        document.dispatchEvent(new CustomEvent(`${pageId}PageActive`));
    } else {
        // Default to dashboard if no active page
        document.dispatchEvent(new CustomEvent('dashboardPageActive'));
    }
}

// Find user by ID
function findUserById(userId) {
    if (!userData[userId]) {
        return null;
    }
    
    return {
        id: userId,
        ...userData[userId]
    };
}

// Find user by phone number
function findUserByPhone(phone) {
    // Clean phone number for comparison
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Find user with matching phone
    const user = Object.entries(userData).find(([id, data]) => {
        if (!data || !data.phone) return false;
        return data.phone.replace(/\D/g, '') === cleanPhone;
    });
    
    if (!user) return null;
    
    return {
        id: user[0],
        ...user[1]
    };
}

// Setup Navigation
function setupNavigation() {
    // Toggle sidebar
    sidebarCollapse.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Page navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            
            // Update active class
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // Update page title
            pageTitle.textContent = this.querySelector('a').textContent.trim();
            
            // Show selected page
            pages.forEach(page => {
                if (page.id === pageId + '-page') {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            
            // Trigger page-specific initialization
            document.dispatchEvent(new CustomEvent(`${pageId}PageActive`));
        });
    });
    
    // Handle "View All" buttons
    const viewAllEmergencies = document.getElementById('viewAllEmergencies');
    if (viewAllEmergencies) {
        viewAllEmergencies.addEventListener('click', function(e) {
            e.preventDefault();
            // Navigate to emergency page
            document.querySelector('.nav-item[data-page="emergency"]').click();
        });
    }
}

// Add map marker styles
function addMapMarkerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .map-marker {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #3498db;
            border: 2px solid #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            position: relative;
        }
        
        .map-marker.emergency {
            background-color: #e74c3c;
            animation: pulse 1.5s infinite;
        }
        
        .map-marker.resolved {
            background-color: #2ecc71;
        }
        
        .map-marker.active {
            background-color: #3498db;
        }
        
        .map-marker.inactive {
            background-color: #95a5a6;
        }
        
        .map-marker.normal {
            background-color: #f39c12;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
            }
            50% {
                transform: scale(1.1);
                box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Add modal styles
function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-header h5 {
            font-weight: 600;
        }
        
        .user-profile {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .user-profile img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }
        
        .user-profile-info h5 {
            margin-bottom: 5px;
        }
        
        .user-profile-info p {
            margin-bottom: 0;
            color: #6c757d;
        }
        
        .action-row {
            display: flex;
            margin-top: 15px;
        }
        
        .action-row .btn {
            margin-right: 10px;
        }
    `;
    document.head.appendChild(style);
}

// Format phone number
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    phone = phone.toString().replace(/\D/g, '');
    
    // For 10-digit numbers
    if (phone.length === 10) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    // For numbers with country code (e.g. +91)
    if (phone.length > 10) {
        // If it starts with country code 91 (India)
        if (phone.startsWith('91') && phone.length === 12) {
            return '+' + phone.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
        }
        return phone; // Return as is for other formats
    }
    
    return phone;
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth < 768;
}

// Listen for window resize
window.addEventListener('resize', function() {
    if (isMobile()) {
        sidebar.classList.add('active');
    }
});

// Format time ago
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    // Convert string timestamp to number if needed
    if (typeof timestamp === 'string') {
        // Check if timestamp is a date string (e.g. "2025-04-22 08:58:19")
        if (timestamp.includes('-')) {
            timestamp = new Date(timestamp).getTime();
        } else {
            timestamp = parseInt(timestamp);
        }
    }
    
    const now = new Date().getTime();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
        return 'Just now';
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    
    if (days < 30) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Convert to months
    const months = Math.floor(days / 30);
    
    if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    // Convert to years
    const years = Math.floor(months / 12);
    
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Global notification handler
const notificationHandler = {
    notifications: [],
    
    updateBadge: function() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;
        
        badge.textContent = this.notifications.length;
        
        if (this.notifications.length > 0) {
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    },
    
    addNotification: function(notification) {
        this.notifications.push(notification);
        this.updateBadge();
        this.showToast(notification);
    },
    
    clearNotifications: function() {
        this.notifications = [];
        this.updateBadge();
    },
    
    showToast: function(notification) {
        const toast = document.getElementById('notificationToast');
        if (!toast) return;
        
        const toastBody = toast.querySelector('.toast-body');
        const toastTime = toast.querySelector('.toast-time');
        
        toastBody.textContent = notification.message;
        toastTime.textContent = 'just now';
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
};

// Add mock notifications after a delay to simulate real-time emergencies
setTimeout(() => {
    if (emergencyData.length > 0) {
        const emergency = emergencyData[0];
        notificationHandler.addNotification({
            type: 'emergency',
            message: `Emergency alert from ${emergency.userName}`,
            timestamp: new Date()
        });
    } else {
        notificationHandler.addNotification({
            type: 'emergency',
            message: 'Emergency alert from Tanvi Kodoli',
            timestamp: new Date()
        });
    }
    
    setTimeout(() => {
        notificationHandler.addNotification({
            type: 'emergency',
            message: 'Emergency alert from Khushi Amle',
            timestamp: new Date()
        });
    }, 30000); // 30 seconds later
}, 10000); // 10 seconds after page load

// Make functions available globally for onclick handlers
window.viewUserDetails = function(userId) {
    document.querySelector('.nav-item[data-page="users"]').click();
    document.dispatchEvent(new CustomEvent('viewUserDetails', { detail: userId }));
};

window.focusEmergencyOnMap = function(userId) {
    document.dispatchEvent(new CustomEvent('focusEmergencyOnMap', { detail: userId }));
};

window.resolveEmergency = function(userId) {
    // Mark emergency as resolved
    emergencyData.forEach(emergency => {
        if (emergency.userId === userId) {
            emergency.status = 'resolved';
        }
    });
    
    // Update UI and dispatch event
    document.dispatchEvent(new CustomEvent('emergencyUpdated', { detail: emergencyData }));
    
    // Show confirmation
    alert(`Emergency for user ${userId} has been resolved.`);
};

window.contactUser = function(phone) {
    alert(`Contacting user at ${formatPhoneNumber(phone)}`);
};

window.trackUser = function(userId) {
    document.querySelector('.nav-item[data-page="location"]').click();
    document.dispatchEvent(new CustomEvent('focusUserOnMap', { detail: userId }));
};

window.viewUserRelatives = function(userId) {
    const user = findUserById(userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Get relatives
    const relatives = user.relatives || {};
    const relativesList = Object.entries(relatives)
        .map(([id, relative]) => ({ id, ...relative }));
    
    // Create relatives table
    let relativesHTML = '';
    
    if (relativesList.length === 0) {
        relativesHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> No relatives found for this user
            </div>
        `;
    } else {
        relativesHTML = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Relationship</th>
                    </tr>
                </thead>
                <tbody>
                    ${relativesList.map(relative => `
                        <tr>
                            <td>${relative.name || 'N/A'}</td>
                            <td>${formatPhoneNumber(relative.phone) || 'N/A'}</td>
                            <td>${relative.relationship || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Create modal for relatives
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">User Relatives</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="user-profile mb-4">
                        <div class="user-avatar bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                            <i class="fas fa-user text-primary" style="font-size: 24px;"></i>
                        </div>
                        <div class="user-profile-info ms-3">
                            <h5>${user.fullName || 'N/A'}</h5>
                            <p>${formatPhoneNumber(user.phone) || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="relatives-list">
                        ${relativesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}; 