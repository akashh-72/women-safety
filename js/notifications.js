// DOM Elements
const notificationsList = document.getElementById('notificationsList');
const notificationsBadge = document.getElementById('notificationsBadge');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const notificationsEmpty = document.getElementById('notificationsEmpty');
const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
const toastContainer = document.getElementById('toastContainer');

// Global variables
let notifications = [];
const MAX_NOTIFICATIONS = 50;

// Event listeners
document.addEventListener('DOMContentLoaded', initNotifications);
document.addEventListener('emergencyAlertReceived', handleEmergencyAlert);
document.addEventListener('userStatusChanged', handleUserStatusChange);
document.addEventListener('systemAlert', handleSystemAlert);

// Initialize notifications
function initNotifications() {
    console.log('Initializing notifications system...');
    
    // Setup event listeners
    setupNotificationEventListeners();
    
    // Load saved notifications from localStorage
    loadSavedNotifications();
    
    // Listen for real-time notifications from Firebase
    listenForRealTimeNotifications();
}

// Setup notification event listeners
function setupNotificationEventListeners() {
    // Clear notifications button
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Mark notifications as read when dropdown is opened
    if (notificationsDropdown) {
        notificationsDropdown.addEventListener('shown.bs.dropdown', markAllNotificationsAsRead);
    }
}

// Load saved notifications from localStorage
function loadSavedNotifications() {
    try {
        const savedNotifications = localStorage.getItem('womenSafetyNotifications');
        if (savedNotifications) {
            notifications = JSON.parse(savedNotifications);
            updateNotificationsUI();
        }
    } catch (error) {
        console.error('Error loading saved notifications:', error);
    }
}

// Save notifications to localStorage
function saveNotifications() {
    try {
        localStorage.setItem('womenSafetyNotifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

// Listen for real-time notifications from Firebase
function listenForRealTimeNotifications() {
    // In a real implementation, you would use Firebase Realtime Database or Firestore
    // For demo, we'll just simulate some notifications
    console.log('Listening for real-time notifications...');
    
    // For demo purposes, let's simulate some notifications
    simulateNotifications();
}

// Add a notification
function addNotification(notification) {
    // Add timestamp if not provided
    if (!notification.timestamp) {
        notification.timestamp = Date.now();
    }
    
    // Add read status if not provided
    if (notification.read === undefined) {
        notification.read = false;
    }
    
    // Add notification to the beginning of the array
    notifications.unshift(notification);
    
    // Limit the number of notifications
    if (notifications.length > MAX_NOTIFICATIONS) {
        notifications = notifications.slice(0, MAX_NOTIFICATIONS);
    }
    
    // Save notifications
    saveNotifications();
    
    // Update UI
    updateNotificationsUI();
    
    // Show toast notification if specified
    if (notification.showToast !== false) {
        showToastNotification(notification);
    }
    
    // Return the notification ID
    return notification.id;
}

// Update notifications UI
function updateNotificationsUI() {
    // Update badge count
    const unreadCount = notifications.filter(n => !n.read).length;
    if (notificationsBadge) {
        notificationsBadge.textContent = unreadCount;
        notificationsBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    
    // Update notifications list
    if (notificationsList) {
        notificationsList.innerHTML = '';
        
        if (notifications.length === 0) {
            if (notificationsEmpty) {
                notificationsEmpty.style.display = 'block';
            }
        } else {
            if (notificationsEmpty) {
                notificationsEmpty.style.display = 'none';
            }
            
            // Add each notification to the list
            notifications.forEach(notification => {
                const notificationItem = createNotificationItem(notification);
                notificationsList.appendChild(notificationItem);
            });
        }
    }
}

// Create notification item element
function createNotificationItem(notification) {
    const li = document.createElement('li');
    li.className = 'dropdown-item notification-item' + (notification.read ? ' read' : '');
    li.dataset.id = notification.id;
    
    // Format timestamp
    const formattedTime = formatTimeAgo(notification.timestamp);
    
    // Determine icon class based on notification type
    let iconClass = 'fas fa-bell';
    let bgColorClass = 'bg-primary';
    
    switch (notification.type) {
        case 'emergency':
            iconClass = 'fas fa-exclamation-triangle';
            bgColorClass = 'bg-danger';
            break;
        case 'user':
            iconClass = 'fas fa-user';
            bgColorClass = 'bg-info';
            break;
        case 'system':
            iconClass = 'fas fa-cog';
            bgColorClass = 'bg-secondary';
            break;
        case 'success':
            iconClass = 'fas fa-check-circle';
            bgColorClass = 'bg-success';
            break;
    }
    
    li.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="notification-icon ${bgColorClass} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;">
                <i class="${iconClass}"></i>
            </div>
            <div class="ms-3" style="width: calc(100% - 40px);">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1 fw-medium">${notification.title}</h6>
                    <small class="text-muted">${formattedTime}</small>
                </div>
                <p class="mb-1 small text-truncate">${notification.message}</p>
                ${notification.actionText ? 
                    `<button class="btn btn-sm btn-link p-0 notification-action" data-action="${notification.action}" data-params='${JSON.stringify(notification.actionParams || {})}'>
                        ${notification.actionText}
                    </button>` : 
                    ''
                }
            </div>
        </div>
    `;
    
    // Add click event to mark as read
    li.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
        
        // Handle notification action if clicked on notification body
        if (notification.action && !event.target.closest('.notification-action')) {
            handleNotificationAction(notification.action, notification.actionParams || {});
        }
    });
    
    // Add click event for action button
    const actionButton = li.querySelector('.notification-action');
    if (actionButton) {
        actionButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the li click event
            const action = actionButton.dataset.action;
            const params = JSON.parse(actionButton.dataset.params);
            handleNotificationAction(action, params);
        });
    }
    
    return li;
}

// Handle notification action
function handleNotificationAction(action, params) {
    console.log('Handling notification action:', action, params);
    
    switch (action) {
        case 'viewEmergency':
            // Navigate to emergency page and focus on specific emergency
            navigateToPage('emergency');
            
            // Wait for page to load and then focus on the emergency
            setTimeout(() => {
                if (params.emergencyId) {
                    const event = new CustomEvent('focusEmergency', { 
                        detail: { id: params.emergencyId } 
                    });
                    document.dispatchEvent(event);
                }
            }, 500);
            break;
            
        case 'viewUser':
            // Navigate to users page and view user details
            navigateToPage('users');
            
            // Wait for page to load and then open user details
            setTimeout(() => {
                if (params.userId) {
                    viewUserDetails(params.userId);
                }
            }, 500);
            break;
            
        case 'viewLocation':
            // Navigate to location page and focus on specific user
            navigateToPage('location');
            
            // Wait for page to load and then focus on the user
            setTimeout(() => {
                if (params.userId) {
                    const event = new CustomEvent('focusUserOnMap', { 
                        detail: params.userId 
                    });
                    document.dispatchEvent(event);
                }
            }, 500);
            break;
            
        default:
            console.log('Unknown action:', action);
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notifications[index].read = true;
        saveNotifications();
        updateNotificationsUI();
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    saveNotifications();
    updateNotificationsUI();
}

// Clear all notifications
function clearAllNotifications() {
    notifications = [];
    saveNotifications();
    updateNotificationsUI();
    
    // Show toast notification
    showToast('All notifications cleared', 'info');
}

// Show toast notification
function showToastNotification(notification) {
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Determine background color class based on notification type
    let bgColorClass = 'bg-primary';
    let iconClass = 'fas fa-bell';
    
    switch (notification.type) {
        case 'emergency':
            bgColorClass = 'bg-danger';
            iconClass = 'fas fa-exclamation-triangle';
            break;
        case 'user':
            bgColorClass = 'bg-info';
            iconClass = 'fas fa-user';
            break;
        case 'system':
            bgColorClass = 'bg-secondary';
            iconClass = 'fas fa-cog';
            break;
        case 'success':
            bgColorClass = 'bg-success';
            iconClass = 'fas fa-check-circle';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-header ${bgColorClass} text-white">
            <i class="${iconClass} me-2"></i>
            <strong class="me-auto">${notification.title}</strong>
            <small>${formatTimeAgo(notification.timestamp)}</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${notification.message}
            ${notification.actionText ? 
                `<div class="mt-2 pt-2 border-top">
                    <button type="button" class="btn btn-sm btn-primary toast-action" 
                            data-action="${notification.action}" 
                            data-params='${JSON.stringify(notification.actionParams || {})}'>
                        ${notification.actionText}
                    </button>
                </div>` : 
                ''
            }
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap toast
    const bsToast = new bootstrap.Toast(toast, { 
        delay: 5000,
        autohide: true
    });
    
    // Show toast
    bsToast.show();
    
    // Add click event for action button
    const actionButton = toast.querySelector('.toast-action');
    if (actionButton) {
        actionButton.addEventListener('click', () => {
            const action = actionButton.dataset.action;
            const params = JSON.parse(actionButton.dataset.params);
            handleNotificationAction(action, params);
            bsToast.hide();
        });
    }
    
    // Remove toast from DOM when hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toast);
    });
}

// Show a simple toast notification
function showToast(message, type = 'info') {
    // Map type to notification type
    let notificationType;
    let title;
    
    switch (type) {
        case 'success':
            notificationType = 'success';
            title = 'Success';
            break;
        case 'error':
            notificationType = 'emergency';
            title = 'Error';
            break;
        case 'warning':
            notificationType = 'system';
            title = 'Warning';
            break;
        case 'info':
        default:
            notificationType = 'user';
            title = 'Information';
    }
    
    // Show notification
    showToastNotification({
        id: 'toast-' + Date.now(),
        type: notificationType,
        title: title,
        message: message,
        timestamp: Date.now(),
        read: true
    });
}

// Handle emergency alert
function handleEmergencyAlert(event) {
    const emergency = event.detail;
    
    // Create notification
    const notification = {
        id: 'emergency-' + emergency.id,
        type: 'emergency',
        title: 'Emergency Alert!',
        message: `${emergency.userName || 'A user'} has triggered an emergency alert.`,
        timestamp: emergency.timestamp || Date.now(),
        action: 'viewEmergency',
        actionText: 'View Emergency',
        actionParams: {
            emergencyId: emergency.id
        }
    };
    
    // Add notification
    addNotification(notification);
}

// Handle user status change
function handleUserStatusChange(event) {
    const userData = event.detail;
    
    // Create notification
    const notification = {
        id: 'user-' + userData.userId + '-' + Date.now(),
        type: 'user',
        title: 'User Status Update',
        message: `${userData.userName || 'A user'} is now ${userData.status}.`,
        timestamp: Date.now(),
        action: 'viewUser',
        actionText: 'View User',
        actionParams: {
            userId: userData.userId
        }
    };
    
    // Add notification
    addNotification(notification);
}

// Handle system alert
function handleSystemAlert(event) {
    const alert = event.detail;
    
    // Create notification
    const notification = {
        id: 'system-' + Date.now(),
        type: 'system',
        title: alert.title || 'System Alert',
        message: alert.message,
        timestamp: Date.now()
    };
    
    // Add action if provided
    if (alert.action) {
        notification.action = alert.action;
        notification.actionText = alert.actionText || 'View';
        notification.actionParams = alert.actionParams || {};
    }
    
    // Add notification
    addNotification(notification);
}

// Simulate notifications for demo
function simulateNotifications() {
    // Add initial notifications
    addNotification({
        id: 'welcome-' + Date.now(),
        type: 'system',
        title: 'Welcome to Admin Panel',
        message: 'Welcome to the Women Safety App Admin Panel. You will receive real-time notifications here.',
        timestamp: Date.now(),
        read: false
    });
    
    // Simulate emergency alert after 15 seconds
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('emergencyAlertReceived', {
            detail: {
                id: 'sim-emergency-1',
                userName: 'Priya Sharma',
                timestamp: Date.now(),
                location: {
                    latitude: 28.6139,
                    longitude: 77.2090
                }
            }
        }));
    }, 15000);
    
    // Simulate user status change after 30 seconds
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('userStatusChanged', {
            detail: {
                userId: 'user123',
                userName: 'Anjali Patel',
                status: 'active'
            }
        }));
    }, 30000);
    
    // Simulate system alert after 45 seconds
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('systemAlert', {
            detail: {
                title: 'System Update',
                message: 'The system has been updated to version 1.2.0',
                action: 'viewSettings',
                actionText: 'View Settings'
            }
        }));
    }, 45000);
}

// Helper function to navigate to a page
function navigateToPage(pageName) {
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) {
        navItem.click();
    }
}

// Export notificationHandler for global use
window.notificationHandler = {
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    showToast
}; 