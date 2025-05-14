// DOM Elements
const dashboardPage = document.getElementById('dashboard-page');
const totalUsersElement = document.getElementById('totalUsers');
const newUsersElement = document.getElementById('newUsers');
const activeUsersElement = document.getElementById('activeUsers');
const totalEmergenciesElement = document.getElementById('totalEmergencies');
const activeEmergenciesElement = document.getElementById('activeEmergencies');
const safetyScoreElement = document.getElementById('safetyScore');
const dashboardEmergencyList = document.getElementById('dashboardEmergencyList');
const dashboardMap = document.getElementById('dashboardMap');
const recentUsersList = document.getElementById('recentUsersList');
const safetyZonesList = document.getElementById('safetyZonesList');
const viewAllEmergencies = document.getElementById('viewAllEmergencies');

// Map instance
let map = null;
let markers = [];

// Listen for dashboard page active
document.addEventListener('dashboardPageActive', initDashboard);
document.addEventListener('dashboardLoaded', initDashboard);
document.addEventListener('dataLoaded', handleDataLoaded);
document.addEventListener('emergencyDataUpdated', handleEmergencyDataUpdated);

// Initialize dashboard
function initDashboard() {
    // Only initialize if dashboard page is active
    if (!dashboardPage.classList.contains('active')) return;
    
    console.log("Initializing dashboard...");

    // Initialize map if not already initialized
    if (!map) {
        initDashboardMap();
    }
}

// Handle all data loaded
function handleDataLoaded(event) {
    const data = event.detail;
    console.log("Dashboard received data:", data);
    
    if (data.emergencies && data.emergencies.length > 0) {
        // Load emergency alerts to dashboard
        loadDashboardEmergencies(data.emergencies);
    }
    
    if (data.locations) {
        // Update user locations on map
        updateUserLocationsOnMap(data.locations);
    }
    
    if (data.safetyZones) {
        // Load safety zones
        loadSafetyZones(data.safetyZones);
    }
}

// Handle emergency data updated
function handleEmergencyDataUpdated(event) {
    const emergencies = event.detail;
    loadDashboardEmergencies(emergencies);
}

// Initialize dashboard map
function initDashboardMap() {
    console.log("Initializing dashboard map...");
    
    // Create map centered on India (default location)
    map = L.map(dashboardMap).setView([20.5937, 78.9629], 5);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Load emergency alerts for dashboard
function loadDashboardEmergencies(emergencies) {
    if (!dashboardEmergencyList) return;
    
    console.log("Loading dashboard emergencies:", emergencies);
    
    // Clear current emergency list
    dashboardEmergencyList.innerHTML = '';
    
    // Filter only active emergencies
    const activeEmergencies = emergencies.filter(emergency => emergency.status === 'active');
    
    // Sort by timestamp (newest first)
    activeEmergencies.sort((a, b) => {
        const timestampA = typeof a.timestamp === 'string' ? 
            (a.timestamp.includes('-') ? new Date(a.timestamp).getTime() : parseInt(a.timestamp)) : 
            a.timestamp;
        const timestampB = typeof b.timestamp === 'string' ? 
            (b.timestamp.includes('-') ? new Date(b.timestamp).getTime() : parseInt(b.timestamp)) : 
            b.timestamp;
        
        return timestampB - timestampA;
    });
    
    // Add each emergency to the list (max 3 for dashboard)
    const displayEmergencies = activeEmergencies.slice(0, 3);
    displayEmergencies.forEach(emergency => {
        addEmergencyToList(emergency, dashboardEmergencyList);
        addEmergencyToMap(emergency);
    });
    
    // Add "No emergencies" message if no active emergencies
    if (displayEmergencies.length === 0) {
        dashboardEmergencyList.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i> No active emergency alerts
            </div>
        `;
    }
    
    // Update counter on "View All" button if we have more emergencies than shown
    if (activeEmergencies.length > displayEmergencies.length && viewAllEmergencies) {
        viewAllEmergencies.textContent = `View All (${activeEmergencies.length})`;
    }
}

// Add emergency to list
function addEmergencyToList(emergency, container) {
    const timeAgo = formatTimeAgo(emergency.timestamp);
    const emergencyItem = document.createElement('div');
    emergencyItem.className = 'emergency-item';
    
    emergencyItem.innerHTML = `
        <div class="emergency-header d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-0">${emergency.userName || 'Unknown User'}</h6>
                <p class="text-muted mb-0">${formatPhoneNumber(emergency.userPhone) || 'N/A'}</p>
            </div>
            <span class="badge bg-${emergency.status === 'active' ? 'danger' : 'success'}">${emergency.status}</span>
        </div>
        <div class="emergency-details">
            <div><i class="fas fa-clock me-2"></i> ${timeAgo}</div>
            <div><i class="fas fa-exclamation-circle me-2"></i> ${emergency.type || 'SOS Alert'}</div>
            ${emergency.location ? `<div><i class="fas fa-map-marker-alt me-2"></i> <a href="https://www.google.com/maps?q=${emergency.location.latitude},${emergency.location.longitude}" target="_blank">View on map</a></div>` : ''}
        </div>
        <div class="emergency-actions mt-2">
            <button class="btn btn-sm btn-outline-primary" onclick="focusEmergencyOnMap('${emergency.userId}')">
                <i class="fas fa-map-marker-alt me-1"></i> Locate
            </button>
            <button class="btn btn-sm btn-outline-success" onclick="resolveEmergency('${emergency.userId}')">
                <i class="fas fa-check me-1"></i> Resolve
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="contactUser('${emergency.userPhone}')">
                <i class="fas fa-phone me-1"></i> Contact
            </button>
        </div>
    `;
    
    container.appendChild(emergencyItem);
}

// Add emergency to map
function addEmergencyToMap(emergency) {
    if (!map || !emergency.location) return;
    
    // Create custom marker
    const markerIcon = L.divIcon({
        className: 'map-marker emergency',
        html: `<i class="fas fa-exclamation"></i>`,
        iconSize: [24, 24]
    });
    
    // Add marker to map
    const marker = L.marker([emergency.location.latitude, emergency.location.longitude], {
        icon: markerIcon
    }).addTo(map);
    
    // Add popup
    marker.bindPopup(`
        <div class="map-popup">
            <h5>${emergency.userName || 'Unknown User'}</h5>
            <p><strong>Phone:</strong> ${formatPhoneNumber(emergency.userPhone) || 'N/A'}</p>
            <p><strong>Time:</strong> ${formatTimeAgo(emergency.timestamp)}</p>
            <p><strong>Type:</strong> ${emergency.type || 'SOS Alert'}</p>
            <button class="btn btn-sm btn-danger w-100" onclick="resolveEmergency('${emergency.userId}')">
                Resolve Emergency
            </button>
        </div>
    `);
    
    // Store marker reference
    markers.push({
        id: emergency.userId,
        marker: marker,
        type: 'emergency'
    });
}

// Update user locations on map
function updateUserLocationsOnMap(locationsData) {
    if (!map || !locationsData) return;
    
    console.log("Updating user locations on map:", locationsData);
    
    // Clear existing user markers
    markers.filter(m => m.type === 'user').forEach(m => {
        map.removeLayer(m.marker);
    });
    markers = markers.filter(m => m.type !== 'user');
    
    // Add user markers
    for (const [phoneNumber, locationData] of Object.entries(locationsData)) {
        // Skip if no valid location data
        if (!locationData || !locationData.latitude || !locationData.longitude) continue;
        
        // Create marker
        const markerIcon = L.divIcon({
            className: 'map-marker active',
            html: `<i class="fas fa-user"></i>`,
            iconSize: [20, 20]
        });
        
        // Add marker to map
        const marker = L.marker([locationData.latitude, locationData.longitude], {
            icon: markerIcon
        }).addTo(map);
        
        // Add popup
        marker.bindPopup(`
            <div class="map-popup">
                <h5>User Location</h5>
                <p><strong>Phone:</strong> ${formatPhoneNumber(phoneNumber)}</p>
                <p><strong>Last Updated:</strong> ${locationData.timestamp || 'Unknown'}</p>
                <button class="btn btn-sm btn-primary w-100" onclick="focusUserLocation('${phoneNumber}')">
                    View Details
                </button>
            </div>
        `);
        
        // Store marker reference
        markers.push({
            id: phoneNumber,
            marker: marker,
            type: 'user'
        });
    }
    
    // If we have markers, fit map bounds to show all markers
    const allMarkers = markers.map(m => m.marker);
    if (allMarkers.length > 0) {
        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    } else {
        // If no markers, center on default location
        map.setView([16.7529, 74.3297], 13); // Default to your provided location
    }
}

// Load safety zones
function loadSafetyZones(safetyZonesData) {
    if (!safetyZonesList) return;
    
    console.log("Loading safety zones:", safetyZonesData);
    
    // Clear current list
    safetyZonesList.innerHTML = '';
    
    if (!safetyZonesData || Object.keys(safetyZonesData).length === 0) {
        // Display default message
        safetyZonesList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> No safety zones defined
            </div>
        `;
        return;
    }
    
    // Convert to array
    const zones = Object.entries(safetyZonesData)
        .map(([id, zone]) => ({ id, ...zone }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp
    
    // Add each zone to list
    zones.forEach(zone => {
        const zoneItem = document.createElement('div');
        zoneItem.className = 'zone-item p-2 border-bottom';
        
        zoneItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${zone.name || 'Safety Zone'}</h6>
                <span class="badge bg-${zone.zoneType === 'SAFE' ? 'success' : 'warning'}">${zone.zoneType || 'SAFE'}</span>
            </div>
            <div class="zone-details">
                <small class="text-muted">${zone.description || 'No description'}</small>
                <div class="mt-1">
                    <small>
                        <i class="fas fa-star text-warning me-1"></i> 
                        Safety Score: ${zone.safetyScore || 'N/A'}
                    </small>
                </div>
            </div>
        `;
        
        safetyZonesList.appendChild(zoneItem);
        
        // Also add zone to map if it has coordinates
        if (zone.coordinates && zone.coordinates.length > 2 && map) {
            addSafetyZoneToMap(zone);
        }
    });
}

// Add safety zone to map
function addSafetyZoneToMap(zone) {
    // Extract valid coordinates (lat, lng pairs)
    const validCoords = zone.coordinates
        .filter(coord => coord.latitude !== 0 && coord.longitude !== 0)
        .map(coord => [coord.latitude, coord.longitude]);
    
    if (validCoords.length < 3) return; // Need at least 3 points for a polygon
    
    // Create polygon
    const polygon = L.polygon(validCoords, {
        color: zone.zoneType === 'SAFE' ? '#2ecc71' : '#f39c12',
        fillOpacity: 0.3,
        weight: 2
    }).addTo(map);
    
    // Add popup
    polygon.bindPopup(`
        <div class="map-popup">
            <h5>${zone.name || 'Safety Zone'}</h5>
            <p>${zone.description || 'No description'}</p>
            <p><strong>Type:</strong> ${zone.zoneType || 'SAFE'}</p>
            <p><strong>Safety Score:</strong> ${zone.safetyScore || 'N/A'}</p>
        </div>
    `);
    
    // Store reference
    markers.push({
        id: zone.id,
        marker: polygon,
        type: 'zone'
    });
}

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

// Focus emergency on map
function focusEmergencyOnMap(userId) {
    const marker = markers.find(m => m.id === userId && m.type === 'emergency');
    
    if (marker && map) {
        map.setView(marker.marker.getLatLng(), 13);
        marker.marker.openPopup();
    }
}

// Resolve emergency
function resolveEmergency(userId) {
    // In a real app, this would update the database
    // For demo, just update the UI
    alert(`Emergency for user ${userId} has been resolved.`);
}

// Contact user
function contactUser(phone) {
    alert(`Contacting user at ${formatPhoneNumber(phone)}`);
}

// View user details
function viewUserDetails(userId) {
    document.querySelector('.nav-item[data-page="users"]').click();
    
    // This would typically trigger some action in the users page
    document.dispatchEvent(new CustomEvent('viewUserDetails', { detail: userId }));
}

// Helper Functions

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

// Focus user location
function focusUserLocation(phone) {
    // Implementation needed
    console.log(`Focusing on user location for ${phone}`);
} 