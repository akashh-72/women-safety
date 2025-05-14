// DOM Elements
const locationMap = document.getElementById('location-map');
const locationUsers = document.getElementById('location-users');
const locationDetails = document.getElementById('location-details');

// Global Variables
let locationMapInstance = null;
let userMarkers = {};
let userPaths = {};
let selectedUserId = null;

// Initialize location page on auth state change
auth.onAuthStateChanged(user => {
    if (user) {
        // Only load location data when the location page is active
        document.querySelector('[data-page="location"]').addEventListener('click', () => {
            initLocationPage();
        });
    }
});

// Initialize location page
function initLocationPage() {
    // Initialize map
    initLocationMap();
    
    // Load users list
    loadLocationUsers();
    
    // Setup event listeners
    setupLocationEventListeners();
}

// Initialize the location map
function initLocationMap() {
    // Create a map in the location-map div
    locationMapInstance = L.map(locationMap).setView([20.5937, 78.9629], 5); // Default to India center
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(locationMapInstance);
}

// Load users with location data
function loadLocationUsers() {
    // Clear users container and show loading
    locationUsers.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading users...</p>
        </div>
    `;
    
    // Reset user markers and paths
    Object.values(userMarkers).forEach(marker => locationMapInstance.removeLayer(marker));
    userMarkers = {};
    
    Object.values(userPaths).forEach(path => locationMapInstance.removeLayer(path));
    userPaths = {};
    
    // Get all user locations
    database.ref('UserLocations').once('value')
        .then((snapshot) => {
            const userLocations = snapshot.val();
            
            if (!userLocations) {
                locationUsers.innerHTML = '<p class="no-data">No user locations found</p>';
                return;
            }
            
            // Get user details for each location
            const userPromises = Object.keys(userLocations).map(userId => {
                return database.ref('users').orderByChild('phone').once('value')
                    .then((usersSnapshot) => {
                        let userData = null;
                        
                        // Find user with matching phone number
                        usersSnapshot.forEach(userSnapshot => {
                            const user = userSnapshot.val();
                            if (user.phone && user.phone.replace(/[^\d]/g, '') === userId) {
                                userData = {
                                    id: userSnapshot.key,
                                    ...user
                                };
                                return true; // Break the forEach loop
                            }
                        });
                        
                        return {
                            userId,
                            userData,
                            locationData: userLocations[userId]
                        };
                    });
            });
            
            return Promise.all(userPromises);
        })
        .then((userDataArray) => {
            // Sort by last activity (most recent first)
            userDataArray.sort((a, b) => {
                const timeA = a.locationData?.timestamp ? new Date(a.locationData.timestamp) : new Date(0);
                const timeB = b.locationData?.timestamp ? new Date(b.locationData.timestamp) : new Date(0);
                return timeB - timeA;
            });
            
            // Generate HTML for users list
            let usersHTML = '';
            
            userDataArray.forEach(({ userId, userData, locationData }) => {
                const userName = userData?.fullName || 'Unknown User';
                const userPhone = formatPhoneNumber(userId);
                const lastActive = formatTimestamp(locationData?.timestamp || 'Never');
                const isRecent = isRecentLocation(locationData?.timestamp);
                
                // Add user to the list
                usersHTML += `
                    <div class="user-card ${isRecent ? 'active' : ''}" data-user-id="${userId}">
                        <div class="user-info">
                            <div class="user-avatar">
                                <span class="material-icons">person</span>
                            </div>
                            <div class="user-info-details">
                                <h4>${userName}</h4>
                                <p>${userPhone}</p>
                                <p class="user-last-active ${isRecent ? 'recent' : ''}">
                                    <span class="material-icons">${isRecent ? 'access_time' : 'history'}</span>
                                    ${lastActive}
                                </p>
                            </div>
                        </div>
                        <div class="user-actions">
                            <button class="action-btn" title="Track Location">
                                <span class="material-icons">location_searching</span>
                            </button>
                            <button class="action-btn" title="View Details">
                                <span class="material-icons">info</span>
                            </button>
                        </div>
                    </div>
                `;
                
                // Add marker to map
                if (locationData?.latitude && locationData?.longitude) {
                    addUserMarker(userId, userName, locationData);
                }
            });
            
            // Update container with user cards
            if (usersHTML) {
                locationUsers.innerHTML = usersHTML;
            } else {
                locationUsers.innerHTML = '<p class="no-data">No user locations found</p>';
            }
            
            // Add event listeners to user cards
            document.querySelectorAll('.user-card').forEach(card => {
                card.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    selectUser(userId);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading user locations:', error);
            locationUsers.innerHTML = `<p class="error-message">Error loading user locations: ${error.message}</p>`;
        });
}

// Add a user marker to the map
function addUserMarker(userId, userName, locationData) {
    const { latitude, longitude, timestamp } = locationData;
    
    // Create custom icon
    const isRecent = isRecentLocation(timestamp);
    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-icon ${isRecent ? 'active' : 'inactive'}">
                  <span class="material-icons">person_pin</span>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    // Add marker to map
    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(locationMapInstance);
    
    // Add popup with user info
    marker.bindPopup(`
        <div class="map-popup">
            <h3>${userName || 'User'}</h3>
            <p><strong>Phone:</strong> ${formatPhoneNumber(userId)}</p>
            <p><strong>Last Update:</strong> ${formatTimestamp(timestamp)}</p>
            <p><strong>Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
            <button class="popup-btn" onclick="selectUserFromMap('${userId}')">View Details</button>
        </div>
    `);
    
    // Store marker for later reference
    userMarkers[userId] = marker;
}

// Select a user from the map (called from popup)
window.selectUserFromMap = function(userId) {
    selectUser(userId);
};

// Select a user
function selectUser(userId) {
    // Update selected state in UI
    document.querySelectorAll('.user-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-user-id') === userId) {
            card.classList.add('active');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    // Store selected user
    selectedUserId = userId;
    
    // Center map on user marker
    if (userMarkers[userId]) {
        locationMapInstance.setView(userMarkers[userId].getLatLng(), 15);
        userMarkers[userId].openPopup();
    }
    
    // Load user location history
    loadUserLocationHistory(userId);
    
    // Load user details
    loadUserDetails(userId);
}

// Load user location history
function loadUserLocationHistory(userId) {
    // Clear existing path
    if (userPaths[userId]) {
        locationMapInstance.removeLayer(userPaths[userId]);
        delete userPaths[userId];
    }
    
    // In a real app, we would fetch location history from a separate database node
    // For this demo, we'll create some mock history around the current location
    if (userMarkers[userId]) {
        const currentLocation = userMarkers[userId].getLatLng();
        
        // Create mock history points (in a real app, these would come from the database)
        const historyPoints = [
            [currentLocation.lat - 0.002, currentLocation.lng - 0.003],
            [currentLocation.lat - 0.001, currentLocation.lng - 0.001],
            [currentLocation.lat, currentLocation.lng]
        ];
        
        // Create a path line
        const path = L.polyline(historyPoints, {
            color: '#FF4081',
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 5'
        }).addTo(locationMapInstance);
        
        // Store path for later reference
        userPaths[userId] = path;
    }
}

// Load user details
function loadUserDetails(userId) {
    // Show loading state
    locationDetails.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading user details...</p>
        </div>
    `;
    
    // Get user location data
    database.ref(`UserLocations/${userId}`).once('value')
        .then((locationSnapshot) => {
            const locationData = locationSnapshot.val();
            
            if (!locationData) {
                locationDetails.innerHTML = '<p class="no-data">No location data available for this user</p>';
                return;
            }
            
            // Get user details by phone number
            return database.ref('users').orderByChild('phone').once('value')
                .then((usersSnapshot) => {
                    let userData = null;
                    
                    // Find user with matching phone number
                    usersSnapshot.forEach(userSnapshot => {
                        const user = userSnapshot.val();
                        if (user.phone && user.phone.replace(/[^\d]/g, '') === userId) {
                            userData = {
                                id: userSnapshot.key,
                                ...user
                            };
                            return true; // Break the forEach loop
                        }
                    });
                    
                    // Generate HTML for location details
                    const detailsHTML = `
                        <div class="location-user-header">
                            <div class="user-avatar">
                                <span class="material-icons">person</span>
                            </div>
                            <div class="user-info">
                                <h3>${userData?.fullName || 'Unknown User'}</h3>
                                <p>${formatPhoneNumber(userId)}</p>
                            </div>
                        </div>
                        <div class="location-data">
                            <div class="location-item">
                                <span class="material-icons">access_time</span>
                                <div class="location-item-details">
                                    <h4>Last Update</h4>
                                    <p>${formatTimestamp(locationData.timestamp)}</p>
                                </div>
                            </div>
                            <div class="location-item">
                                <span class="material-icons">location_on</span>
                                <div class="location-item-details">
                                    <h4>Coordinates</h4>
                                    <p>${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}</p>
                                </div>
                            </div>
                            <div class="location-item">
                                <span class="material-icons">speed</span>
                                <div class="location-item-details">
                                    <h4>Speed</h4>
                                    <p>${locationData.speed ? `${(locationData.speed * 3.6).toFixed(1)} km/h` : 'Not available'}</p>
                                </div>
                            </div>
                            <div class="location-item">
                                <span class="material-icons">explore</span>
                                <div class="location-item-details">
                                    <h4>Accuracy</h4>
                                    <p>${locationData.accuracy ? `${locationData.accuracy.toFixed(1)} meters` : 'Not available'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="location-actions">
                            <button class="secondary-btn" id="refresh-location">
                                <span class="material-icons">refresh</span> Refresh
                            </button>
                            <button class="primary-btn" id="contact-user">
                                <span class="material-icons">call</span> Contact User
                            </button>
                        </div>
                    `;
                    
                    // Update details container
                    locationDetails.innerHTML = detailsHTML;
                    
                    // Add event listeners
                    document.getElementById('refresh-location').addEventListener('click', () => {
                        loadUserLocationHistory(userId);
                        loadUserDetails(userId);
                    });
                    
                    document.getElementById('contact-user').addEventListener('click', () => {
                        if (userData && userData.phone) {
                            alert(`Contacting user at ${userData.phone}`);
                            // In a real application, this would open communication channels
                        } else {
                            alert('No contact information available for this user');
                        }
                    });
                });
        })
        .catch((error) => {
            console.error('Error loading user details:', error);
            locationDetails.innerHTML = `<p class="error-message">Error loading user details: ${error.message}</p>`;
        });
}

// Setup event listeners
function setupLocationEventListeners() {
    // Refresh button
    document.querySelector('#location-page .primary-btn').addEventListener('click', () => {
        loadLocationUsers();
        
        // If a user is selected, refresh their details
        if (selectedUserId) {
            loadUserLocationHistory(selectedUserId);
            loadUserDetails(selectedUserId);
        }
    });
    
    // Search input
    const searchInput = document.querySelector('#location-page .search-input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        // Filter user cards
        document.querySelectorAll('.user-card').forEach(card => {
            const userName = card.querySelector('h4').textContent.toLowerCase();
            const userPhone = card.querySelector('p').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || userPhone.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Focus on a specific user on the map (called from other pages)
window.focusUserOnMap = function(userId) {
    // If the user exists in our data, select them
    if (userMarkers[userId]) {
        selectUser(userId);
    } else {
        // Otherwise, refresh the data and try again
        loadLocationUsers();
        setTimeout(() => {
            if (userMarkers[userId]) {
                selectUser(userId);
            } else {
                alert('User location not available');
            }
        }, 1000);
    }
};

// Helper Functions

// Check if a location update is recent (within the last hour)
function isRecentLocation(timestamp) {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    
    return diffHour <= 1;
}

// Format phone number for display
function formatPhoneNumber(phoneNumber) {
    // Basic formatting for readability
    if (!phoneNumber) return 'Unknown';
    
    // If it's a sanitized phone (all digits)
    if (/^\d+$/.test(phoneNumber)) {
        if (phoneNumber.length === 10) {
            return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else {
            return phoneNumber;
        }
    }
    
    return phoneNumber;
}

// Format timestamp to relative time
function formatTimestamp(timestamp) {
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