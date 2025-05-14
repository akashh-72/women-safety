/**
 * API Client for Women Safety Admin Panel
 * Handles communication with the backend API
 */

// API Configuration
let apiConfig = {
    baseUrl: 'https://api.womensafety.org/v1', // Default production URL
    apiKey: '',
    apiSecret: '',
    timeout: 30000, // 30 seconds
    retryCount: 3,
    environment: 'production'
};

// Initialize API on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load API configuration from settings if available
    loadApiConfig();
});

// Load API configuration from settings
function loadApiConfig() {
    if (typeof window.settingsManager !== 'undefined' && 
        typeof window.settingsManager.getSettings === 'function') {
        
        const settings = window.settingsManager.getSettings();
        
        if (settings && settings.apiSettings) {
            apiConfig.apiKey = settings.apiSettings.apiKey;
            apiConfig.apiSecret = settings.apiSettings.apiSecret;
            apiConfig.environment = settings.apiSettings.environment;
            
            // Set base URL based on environment
            if (settings.apiSettings.environment === 'development') {
                apiConfig.baseUrl = 'https://dev-api.womensafety.org/v1';
            } else if (settings.apiSettings.environment === 'staging') {
                apiConfig.baseUrl = 'https://staging-api.womensafety.org/v1';
            } else if (settings.apiSettings.environment === 'local') {
                apiConfig.baseUrl = 'http://localhost:5000/api/v1';
            }
            
            // Append version if specified
            if (settings.apiSettings.version && settings.apiSettings.version !== 'v1') {
                apiConfig.baseUrl = apiConfig.baseUrl.replace('/v1', `/${settings.apiSettings.version}`);
            }
        }
    }
}

/**
 * Make an authenticated API request
 * 
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {Object} options.body - Request body for POST/PUT/PATCH requests
 * @param {Object} options.params - URL parameters for GET requests
 * @param {boolean} options.useAuth - Whether to use authentication (default: true)
 * @param {number} options.timeout - Request timeout in milliseconds (default: from apiConfig)
 * @param {number} options.retryCount - Number of retry attempts (default: from apiConfig)
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(endpoint, options = {}) {
    // Default options
    const defaultOptions = {
        method: 'GET',
        useAuth: true,
        timeout: apiConfig.timeout,
        retryCount: apiConfig.retryCount
    };
    
    // Merge options
    const requestOptions = { ...defaultOptions, ...options };
    
    // Build URL
    let url = `${apiConfig.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Add query parameters if provided
    if (requestOptions.params) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(requestOptions.params)) {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        }
        const queryString = queryParams.toString();
        if (queryString) {
            url += `${url.includes('?') ? '&' : '?'}${queryString}`;
        }
    }
    
    // Build fetch options
    const fetchOptions = {
        method: requestOptions.method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        // Add credentials to include cookies in cross-origin requests
        credentials: 'include'
    };
    
    // Add authentication headers if required
    if (requestOptions.useAuth) {
        const authToken = await getAuthToken();
        fetchOptions.headers['Authorization'] = `Bearer ${authToken}`;
        fetchOptions.headers['X-API-Key'] = apiConfig.apiKey;
    }
    
    // Add body for non-GET requests
    if (requestOptions.method !== 'GET' && requestOptions.body) {
        fetchOptions.body = JSON.stringify(requestOptions.body);
    }
    
    // Make the request with retries
    let retries = 0;
    while (retries <= requestOptions.retryCount) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Request timeout after ${requestOptions.timeout}ms`));
                }, requestOptions.timeout);
            });
            
            // Race fetch against timeout
            const response = await Promise.race([
                fetch(url, fetchOptions),
                timeoutPromise
            ]);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle authentication errors
                if (response.status === 401 || response.status === 403) {
                    // If using Firebase Auth token, it might be expired
                    // Try to refresh token and retry
                    if (requestOptions.useAuth && retries < requestOptions.retryCount) {
                        await refreshAuthToken();
                        retries++;
                        continue;
                    }
                }
                
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData
                };
            }
            
            // Parse JSON response
            const data = await response.json();
            return { data, status: response.status, headers: response.headers };
            
        } catch (error) {
            // Handle network errors or timeouts
            if (retries >= requestOptions.retryCount) {
                // If out of retries, throw the error
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
        }
    }
}

/**
 * Get Firebase auth token for API requests
 * 
 * @returns {Promise<string>} - Auth token
 */
async function getAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    try {
        return await user.getIdToken(true);
    } catch (error) {
        console.error('Error getting auth token:', error);
        throw error;
    }
}

/**
 * Refresh Firebase auth token
 * 
 * @returns {Promise<string>} - Refreshed auth token
 */
async function refreshAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    try {
        // Force token refresh
        await firebase.auth().currentUser.getIdToken(true);
        return await user.getIdToken();
    } catch (error) {
        console.error('Error refreshing auth token:', error);
        throw error;
    }
}

// Users API
const usersApi = {
    /**
     * Get all users with pagination
     * 
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 20)
     * @param {string} params.sortBy - Sort field (default: 'createdAt')
     * @param {string} params.sortOrder - Sort order (default: 'desc')
     * @param {string} params.search - Search query
     * @returns {Promise<Object>} - Users data
     */
    getUsers: (params = {}) => {
        return apiRequest('/users', { params });
    },
    
    /**
     * Get a user by ID
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User data
     */
    getUser: (userId) => {
        return apiRequest(`/users/${userId}`);
    },
    
    /**
     * Update a user
     * 
     * @param {string} userId - User ID
     * @param {Object} userData - User data to update
     * @returns {Promise<Object>} - Updated user data
     */
    updateUser: (userId, userData) => {
        return apiRequest(`/users/${userId}`, {
            method: 'PATCH',
            body: userData
        });
    },
    
    /**
     * Delete a user
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Deletion result
     */
    deleteUser: (userId) => {
        return apiRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    },
    
    /**
     * Get user location history
     * 
     * @param {string} userId - User ID
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of locations to fetch (default: 50)
     * @param {number} params.days - Number of days to look back (default: 7)
     * @returns {Promise<Object>} - Location history data
     */
    getUserLocationHistory: (userId, params = {}) => {
        return apiRequest(`/users/${userId}/locations`, { params });
    },
    
    /**
     * Get user emergency alerts
     * 
     * @param {string} userId - User ID
     * @param {Object} params - Query parameters
     * @param {number} params.limit - Number of alerts to fetch (default: 20)
     * @param {string} params.status - Filter by status (active, resolved, all)
     * @returns {Promise<Object>} - Emergency alerts data
     */
    getUserEmergencyAlerts: (userId, params = {}) => {
        return apiRequest(`/users/${userId}/emergencies`, { params });
    }
};

// Emergency API
const emergencyApi = {
    /**
     * Get all emergency alerts with pagination
     * 
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 20)
     * @param {string} params.status - Filter by status (active, resolved, all)
     * @param {string} params.sortBy - Sort field (default: 'createdAt')
     * @param {string} params.sortOrder - Sort order (default: 'desc')
     * @returns {Promise<Object>} - Emergency alerts data
     */
    getEmergencyAlerts: (params = {}) => {
        return apiRequest('/emergencies', { params });
    },
    
    /**
     * Get an emergency alert by ID
     * 
     * @param {string} alertId - Emergency alert ID
     * @returns {Promise<Object>} - Emergency alert data
     */
    getEmergencyAlert: (alertId) => {
        return apiRequest(`/emergencies/${alertId}`);
    },
    
    /**
     * Update an emergency alert (e.g., mark as resolved)
     * 
     * @param {string} alertId - Emergency alert ID
     * @param {Object} alertData - Alert data to update
     * @returns {Promise<Object>} - Updated alert data
     */
    updateEmergencyAlert: (alertId, alertData) => {
        return apiRequest(`/emergencies/${alertId}`, {
            method: 'PATCH',
            body: alertData
        });
    },
    
    /**
     * Get real-time emergency alert updates
     * This is a demo function - in real implementation, this would be handled by Firebase Realtime Database
     * 
     * @param {function} callback - Callback function to handle new alerts
     * @returns {function} - Function to unsubscribe from updates
     */
    subscribeToEmergencyAlerts: (callback) => {
        // In a real implementation, this would use Firebase Realtime Database
        // For demo purposes, we're using a mock implementation
        
        const unsubscribe = firebase.database()
            .ref('emergencies')
            .orderByChild('status')
            .equalTo('active')
            .on('child_added', (snapshot) => {
                const alert = {
                    id: snapshot.key,
                    ...snapshot.val()
                };
                callback(alert);
            });
        
        return () => {
            firebase.database().ref('emergencies').off('child_added', unsubscribe);
        };
    }
};

// Analytics API
const analyticsApi = {
    /**
     * Get emergency alerts count by day
     * 
     * @param {Object} params - Query parameters
     * @param {string} params.startDate - Start date (YYYY-MM-DD)
     * @param {string} params.endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} - Daily emergency alerts data
     */
    getDailyEmergencyAlerts: (params = {}) => {
        return apiRequest('/analytics/emergencies/daily', { params });
    },
    
    /**
     * Get user registrations by month
     * 
     * @param {Object} params - Query parameters
     * @param {number} params.months - Number of months to look back (default: 12)
     * @returns {Promise<Object>} - Monthly user registrations data
     */
    getMonthlyUserRegistrations: (params = {}) => {
        return apiRequest('/analytics/users/monthly', { params });
    },
    
    /**
     * Get emergency alerts by type
     * 
     * @param {Object} params - Query parameters
     * @param {string} params.startDate - Start date (YYYY-MM-DD)
     * @param {string} params.endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} - Emergency alerts by type data
     */
    getEmergencyAlertsByType: (params = {}) => {
        return apiRequest('/analytics/emergencies/types', { params });
    },
    
    /**
     * Get geographical distribution of users and alerts
     * 
     * @param {Object} params - Query parameters
     * @param {string} params.type - Type of data to fetch (users, emergencies, both)
     * @returns {Promise<Object>} - Geographical distribution data
     */
    getGeographicalDistribution: (params = {}) => {
        return apiRequest('/analytics/geo-distribution', { params });
    },
    
    /**
     * Export analytics data as CSV
     * 
     * @param {Object} params - Query parameters
     * @param {string} params.type - Type of data to export (users, emergencies, all)
     * @param {string} params.startDate - Start date (YYYY-MM-DD)
     * @param {string} params.endDate - End date (YYYY-MM-DD)
     * @param {string} params.format - Export format (csv, pdf, excel)
     * @returns {Promise<Blob>} - Exported data as a Blob
     */
    exportAnalytics: (params = {}) => {
        return apiRequest('/analytics/export', { 
            params,
            responseType: 'blob'
        });
    }
};

// Admin API
const adminApi = {
    /**
     * Get admin user profile
     * 
     * @returns {Promise<Object>} - Admin user profile data
     */
    getProfile: () => {
        return apiRequest('/admin/profile');
    },
    
    /**
     * Update admin user profile
     * 
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} - Updated profile data
     */
    updateProfile: (profileData) => {
        return apiRequest('/admin/profile', {
            method: 'PATCH',
            body: profileData
        });
    },
    
    /**
     * Change admin user password
     * 
     * @param {Object} passwordData - Password data
     * @param {string} passwordData.currentPassword - Current password
     * @param {string} passwordData.newPassword - New password
     * @returns {Promise<Object>} - Password change result
     */
    changePassword: (passwordData) => {
        return apiRequest('/admin/change-password', {
            method: 'POST',
            body: passwordData
        });
    },
    
    /**
     * Create a new admin user
     * 
     * @param {Object} adminData - Admin user data
     * @returns {Promise<Object>} - Created admin user data
     */
    createAdmin: (adminData) => {
        return apiRequest('/admin/users', {
            method: 'POST',
            body: adminData
        });
    },
    
    /**
     * Get all admin users
     * 
     * @returns {Promise<Object>} - Admin users data
     */
    getAdmins: () => {
        return apiRequest('/admin/users');
    }
};

// Settings API
const settingsApi = {
    /**
     * Get app settings
     * 
     * @returns {Promise<Object>} - App settings data
     */
    getAppSettings: () => {
        return apiRequest('/settings/app');
    },
    
    /**
     * Update app settings
     * 
     * @param {Object} settingsData - Settings data to update
     * @returns {Promise<Object>} - Updated settings data
     */
    updateAppSettings: (settingsData) => {
        return apiRequest('/settings/app', {
            method: 'PATCH',
            body: settingsData
        });
    },
    
    /**
     * Get notification settings
     * 
     * @returns {Promise<Object>} - Notification settings data
     */
    getNotificationSettings: () => {
        return apiRequest('/settings/notifications');
    },
    
    /**
     * Update notification settings
     * 
     * @param {Object} settingsData - Settings data to update
     * @returns {Promise<Object>} - Updated settings data
     */
    updateNotificationSettings: (settingsData) => {
        return apiRequest('/settings/notifications', {
            method: 'PATCH',
            body: settingsData
        });
    },
    
    /**
     * Get API credentials
     * 
     * @returns {Promise<Object>} - API credentials data
     */
    getApiCredentials: () => {
        return apiRequest('/settings/api-credentials');
    },
    
    /**
     * Regenerate API credentials
     * 
     * @returns {Promise<Object>} - New API credentials
     */
    regenerateApiCredentials: () => {
        return apiRequest('/settings/api-credentials', {
            method: 'POST'
        });
    }
};

// Firebase Database API Handler
class FirebaseAPI {
    constructor() {
        this.database = firebaseServices.database;
    }

    // Users
    async getUsers() {
        try {
            const snapshot = await this.database.ref('Users').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const snapshot = await this.database.ref(`Users/${userId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    // User Locations
    async getUserLocations() {
        try {
            const snapshot = await this.database.ref('UserLocations').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching user locations:', error);
            throw error;
        }
    }

    // Safety Zones
    async getSafetyZones() {
        try {
            const snapshot = await this.database.ref('safety_zones').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching safety zones:', error);
            throw error;
        }
    }

    // Nearby Devices
    async getNearbyDevices() {
        try {
            const snapshot = await this.database.ref('nearby_devices').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching nearby devices:', error);
            throw error;
        }
    }

    // Real-time Listeners
    setupUserLocationsListener(callback) {
        return this.database.ref('UserLocations').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    }

    setupEmergencyAlertsListener(callback) {
        return this.database.ref('emergency_alerts').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    }

    setupSafetyZonesListener(callback) {
        return this.database.ref('safety_zones').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    }

    // Remove Listeners
    removeListener(reference) {
        if (reference) {
            this.database.ref().off('value', reference);
        }
    }

    // Update Operations
    async updateUser(userId, data) {
        try {
            await this.database.ref(`Users/${userId}`).update(data);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async updateSafetyZone(zoneId, data) {
        try {
            await this.database.ref(`safety_zones/${zoneId}`).update(data);
            return true;
        } catch (error) {
            console.error('Error updating safety zone:', error);
            throw error;
        }
    }

    // Delete Operations
    async deleteUser(userId) {
        try {
            await this.database.ref(`Users/${userId}`).remove();
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    async deleteSafetyZone(zoneId) {
        try {
            await this.database.ref(`safety_zones/${zoneId}`).remove();
            return true;
        } catch (error) {
            console.error('Error deleting safety zone:', error);
            throw error;
        }
    }
}

// Initialize Firebase API
const firebaseAPI = new FirebaseAPI();

// Export for use in other files
window.firebaseAPI = firebaseAPI;

// Export API modules
window.api = {
    users: usersApi,
    emergency: emergencyApi,
    analytics: analyticsApi,
    admin: adminApi,
    settings: settingsApi,
    
    // Core functions
    request: apiRequest,
    config: apiConfig,
    
    // Helper function to update API configuration
    updateConfig: (config) => {
        apiConfig = { ...apiConfig, ...config };
    }
}; 