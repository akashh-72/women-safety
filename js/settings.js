/**
 * Settings management for Women Safety Admin Panel
 */

// DOM Elements
const settingsPage = document.getElementById('settings-page');
const apiSettingsForm = document.getElementById('api-settings-form');
const notificationSettingsForm = document.getElementById('notification-settings-form');
const appSettingsForm = document.getElementById('app-settings-form');
const adminProfileForm = document.getElementById('admin-profile-form');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const importSettingsBtn = document.getElementById('import-settings-btn');
const exportSettingsBtn = document.getElementById('export-settings-btn');

// Default settings
const defaultSettings = {
    api: {
        baseUrl: 'https://api.womensafety.example.com',
        environment: 'production',
        timeout: 10000,
        retryCount: 3,
        cacheEnabled: true,
        cacheDuration: 300, // 5 minutes
        batchRequests: true,
    },
    notifications: {
        soundEnabled: true,
        desktopEnabled: true,
        emergencyAlerts: true,
        userUpdates: true,
        systemAlerts: true,
        soundVolume: 80,
        autoRefresh: true,
        refreshInterval: 30, // seconds
    },
    app: {
        theme: 'light',
        language: 'en',
        mapProvider: 'openstreetmap',
        defaultMapCenter: {
            lat: 20.5937,
            lng: 78.9629
        },
        defaultMapZoom: 5,
        dashboardRefreshInterval: 60, // seconds
        dateFormat: 'MMM DD, YYYY',
        timeFormat: '12h',
        itemsPerPage: 10,
        analyticsRange: 30, // days
        emergencyAlertsLimit: 100,
        userLocationHistoryLimit: 50,
        sidebarCollapsed: false,
        developerMode: false,
    },
    profile: {
        name: '',
        email: '',
        phone: '',
        role: 'admin',
        notificationEmail: '',
        backupEmail: '',
        organization: 'Women Safety',
        department: 'Administration',
    }
};

/**
 * Initialize settings
 */
function initSettings() {
    // Load settings when settings page is clicked
    document.querySelector('a[href="#settings-page"]').addEventListener('click', loadSettingsPage);
    
    // If settings page is active on page load, initialize it
    if (window.location.hash === '#settings-page' || settingsPage.classList.contains('active')) {
        loadSettingsPage();
    }
}

/**
 * Load settings page
 */
function loadSettingsPage() {
    if (!firebase.auth().currentUser) {
        console.error('User not authenticated');
        return;
    }
    
    // Load settings from Firebase
    loadSettings();
    
    // Set up event listeners
    setupSettingsEventListeners();
    
    // Update theme switcher status
    updateThemeSwitchers();
}

/**
 * Load settings from Firebase
 */
async function loadSettings() {
    try {
        const userId = firebase.auth().currentUser.uid;
        const settingsRef = firebase.database().ref(`adminSettings/${userId}`);
        
        // Show loading indicators
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.add('loading');
        });
        
        // Get settings from Firebase
        const snapshot = await settingsRef.once('value');
        const settings = snapshot.val() || {};
        
        // Merge with default settings
        const mergedSettings = {
            api: { ...defaultSettings.api, ...settings.api },
            notifications: { ...defaultSettings.notifications, ...settings.notifications },
            app: { ...defaultSettings.app, ...settings.app },
            profile: { ...defaultSettings.profile, ...settings.profile }
        };
        
        // Populate forms
        populateApiSettingsForm(mergedSettings.api);
        populateNotificationSettingsForm(mergedSettings.notifications);
        populateAppSettingsForm(mergedSettings.app);
        populateAdminProfileForm(mergedSettings.profile);
        
        // Remove loading indicators
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('loading');
        });
        
        // Apply settings to application
        applySettings(mergedSettings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        utils.showToast('Failed to load settings. Using defaults.', 'error');
        
        // Use default settings
        populateApiSettingsForm(defaultSettings.api);
        populateNotificationSettingsForm(defaultSettings.notifications);
        populateAppSettingsForm(defaultSettings.app);
        populateAdminProfileForm(defaultSettings.profile);
        
        // Remove loading indicators
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('loading');
        });
        
        // Apply default settings
        applySettings(defaultSettings);
    }
}

/**
 * Populate API settings form
 * 
 * @param {Object} apiSettings - API settings
 */
function populateApiSettingsForm(apiSettings) {
    if (!apiSettingsForm) return;
    
    const inputs = apiSettingsForm.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const name = input.name.replace('api-', '');
        
        if (input.type === 'checkbox') {
            input.checked = apiSettings[name] || false;
        } else if (input.type === 'number') {
            input.value = apiSettings[name] || 0;
        } else {
            input.value = apiSettings[name] || '';
        }
    });
}

/**
 * Populate notification settings form
 * 
 * @param {Object} notificationSettings - Notification settings
 */
function populateNotificationSettingsForm(notificationSettings) {
    if (!notificationSettingsForm) return;
    
    const inputs = notificationSettingsForm.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const name = input.name.replace('notification-', '');
        
        if (input.type === 'checkbox') {
            input.checked = notificationSettings[name] || false;
        } else if (input.type === 'range') {
            input.value = notificationSettings[name] || 0;
            const output = input.nextElementSibling;
            if (output && output.tagName === 'OUTPUT') {
                output.value = input.value;
            }
        } else if (input.type === 'number') {
            input.value = notificationSettings[name] || 0;
        } else {
            input.value = notificationSettings[name] || '';
        }
    });
}

/**
 * Populate app settings form
 * 
 * @param {Object} appSettings - App settings
 */
function populateAppSettingsForm(appSettings) {
    if (!appSettingsForm) return;
    
    const inputs = appSettingsForm.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const name = input.name.replace('app-', '');
        
        if (name === 'defaultMapCenter') {
            // Handle special case for map center coordinates
            if (input.name === 'app-defaultMapCenter-lat') {
                input.value = appSettings.defaultMapCenter?.lat || defaultSettings.app.defaultMapCenter.lat;
            } else if (input.name === 'app-defaultMapCenter-lng') {
                input.value = appSettings.defaultMapCenter?.lng || defaultSettings.app.defaultMapCenter.lng;
            }
        } else if (input.type === 'checkbox') {
            input.checked = appSettings[name] || false;
        } else if (input.type === 'number') {
            input.value = appSettings[name] || 0;
        } else {
            input.value = appSettings[name] || '';
        }
    });
}

/**
 * Populate admin profile form
 * 
 * @param {Object} profileSettings - Profile settings
 */
function populateAdminProfileForm(profileSettings) {
    if (!adminProfileForm) return;
    
    const inputs = adminProfileForm.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        const name = input.name.replace('profile-', '');
        input.value = profileSettings[name] || '';
    });
    
    // Set user info from Firebase if available
    const user = firebase.auth().currentUser;
    if (user) {
        const nameInput = adminProfileForm.querySelector('input[name="profile-name"]');
        const emailInput = adminProfileForm.querySelector('input[name="profile-email"]');
        
        if (nameInput && !nameInput.value) {
            nameInput.value = user.displayName || '';
        }
        
        if (emailInput && !emailInput.value) {
            emailInput.value = user.email || '';
        }
    }
}

/**
 * Apply settings to application
 * 
 * @param {Object} settings - Settings to apply
 */
function applySettings(settings) {
    // Apply theme
    applyTheme(settings.app.theme);
    
    // Apply language
    applyLanguage(settings.app.language);
    
    // Apply sidebar state
    applySidebarState(settings.app.sidebarCollapsed);
    
    // Set refresh intervals
    setRefreshIntervals(settings);
    
    // Set notification settings
    setNotificationSettings(settings.notifications);
    
    // Set API client settings
    setApiSettings(settings.api);
    
    // Set developer mode
    setDeveloperMode(settings.app.developerMode);
    
    // Store settings in local storage for quick access
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    
    // Publish settings change event
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
}

/**
 * Apply theme to application
 * 
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    } else {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
    }
    
    // Update theme meta tag for mobile devices
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = theme === 'dark' ? '#1a202c' : '#ffffff';
    }
    
    // Store theme preference
    localStorage.setItem('theme', theme);
}

/**
 * Apply language to application
 * 
 * @param {string} language - Language code
 */
function applyLanguage(language) {
    // Set language attribute on html element
    document.documentElement.setAttribute('lang', language);
    
    // Store language preference
    localStorage.setItem('language', language);
    
    // Language switching would be implemented here if the app supports multiple languages
    // For now, we just store the preference
}

/**
 * Apply sidebar state
 * 
 * @param {boolean} collapsed - Whether sidebar should be collapsed
 */
function applySidebarState(collapsed) {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    
    if (!sidebar || !content) return;
    
    if (collapsed) {
        sidebar.classList.add('collapsed');
        content.classList.add('expanded');
    } else {
        sidebar.classList.remove('collapsed');
        content.classList.remove('expanded');
    }
    
    // Store sidebar state
    localStorage.setItem('sidebarCollapsed', collapsed);
}

/**
 * Set refresh intervals
 * 
 * @param {Object} settings - Settings object
 */
function setRefreshIntervals(settings) {
    // Clear existing intervals
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    
    if (window.notificationRefreshInterval) {
        clearInterval(window.notificationRefreshInterval);
    }
    
    // Set new intervals if auto-refresh is enabled
    if (settings.notifications.autoRefresh) {
        // Set notification refresh interval
        window.notificationRefreshInterval = setInterval(() => {
            if (typeof refreshNotifications === 'function') {
                refreshNotifications();
            }
        }, settings.notifications.refreshInterval * 1000);
        
        // Set dashboard refresh interval
        window.dashboardRefreshInterval = setInterval(() => {
            if (typeof refreshDashboard === 'function' && 
                document.getElementById('dashboard-page').classList.contains('active')) {
                refreshDashboard();
            }
        }, settings.app.dashboardRefreshInterval * 1000);
    }
}

/**
 * Set notification settings
 * 
 * @param {Object} notificationSettings - Notification settings
 */
function setNotificationSettings(notificationSettings) {
    // Check if notification permissions are granted
    if (notificationSettings.desktopEnabled && 
        Notification.permission !== 'granted' && 
        Notification.permission !== 'denied') {
        
        // Request permission
        Notification.requestPermission();
    }
    
    // Set notification settings in notification handler
    if (window.notificationHandler) {
        window.notificationHandler.settings = notificationSettings;
    }
}

/**
 * Set API client settings
 * 
 * @param {Object} apiSettings - API settings
 */
function setApiSettings(apiSettings) {
    // Update API client configuration if it exists
    if (window.apiConfig) {
        window.apiConfig = { ...window.apiConfig, ...apiSettings };
    }
}

/**
 * Set developer mode
 * 
 * @param {boolean} enabled - Whether developer mode is enabled
 */
function setDeveloperMode(enabled) {
    const body = document.body;
    
    if (enabled) {
        body.classList.add('developer-mode');
    } else {
        body.classList.remove('developer-mode');
    }
    
    // Set console logging level
    if (enabled) {
        localStorage.setItem('debug', 'womensafety:*');
    } else {
        localStorage.removeItem('debug');
    }
}

/**
 * Update theme switchers
 */
function updateThemeSwitchers() {
    const themeSwitches = document.querySelectorAll('.theme-switch');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    themeSwitches.forEach(switchEl => {
        if (switchEl.type === 'checkbox') {
            switchEl.checked = currentTheme === 'dark';
        }
    });
}

/**
 * Save settings to Firebase
 * 
 * @param {string} section - Settings section ('api', 'notifications', 'app', 'profile')
 * @param {HTMLFormElement} form - Form element containing settings
 */
async function saveSettings(section, form) {
    if (!firebase.auth().currentUser) {
        console.error('User not authenticated');
        utils.showToast('You must be logged in to save settings', 'error');
        return;
    }
    
    // Show loading indicator
    form.classList.add('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
        submitBtn.disabled = true;
    }
    
    try {
        const userId = firebase.auth().currentUser.uid;
        const settingsRef = firebase.database().ref(`adminSettings/${userId}/${section}`);
        
        // Get form data
        const formData = {};
        const formElements = form.elements;
        
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            
            if (element.name && element.name.startsWith(`${section}-`)) {
                const name = element.name.replace(`${section}-`, '');
                
                if (element.type === 'checkbox') {
                    formData[name] = element.checked;
                } else if (element.type === 'number' || element.name.includes('defaultMapCenter')) {
                    formData[name] = parseFloat(element.value);
                } else {
                    formData[name] = element.value;
                }
            }
        }
        
        // Special handling for map center coordinates
        if (section === 'app' && formData['defaultMapCenter-lat'] && formData['defaultMapCenter-lng']) {
            formData.defaultMapCenter = {
                lat: formData['defaultMapCenter-lat'],
                lng: formData['defaultMapCenter-lng']
            };
            
            // Remove individual coordinate fields
            delete formData['defaultMapCenter-lat'];
            delete formData['defaultMapCenter-lng'];
        }
        
        // Save to Firebase
        await settingsRef.update(formData);
        
        // Reload settings to apply changes
        await loadSettings();
        
        utils.showToast('Settings saved successfully', 'success');
        
    } catch (error) {
        console.error(`Error saving ${section} settings:`, error);
        utils.showToast(`Failed to save ${section} settings`, 'error');
    } finally {
        // Remove loading indicator
        form.classList.remove('loading');
        
        if (submitBtn) {
            submitBtn.textContent = 'Save';
            submitBtn.disabled = false;
        }
    }
}

/**
 * Reset settings to defaults
 */
async function resetSettingsToDefault() {
    if (!confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
        return;
    }
    
    if (!firebase.auth().currentUser) {
        console.error('User not authenticated');
        utils.showToast('You must be logged in to reset settings', 'error');
        return;
    }
    
    try {
        const userId = firebase.auth().currentUser.uid;
        const settingsRef = firebase.database().ref(`adminSettings/${userId}`);
        
        // Apply default settings
        await settingsRef.set({ 
            api: defaultSettings.api,
            notifications: defaultSettings.notifications,
            app: defaultSettings.app,
            profile: defaultSettings.profile
        });
        
        // Reload settings
        await loadSettings();
        
        utils.showToast('Settings reset to default values', 'success');
        
    } catch (error) {
        console.error('Error resetting settings:', error);
        utils.showToast('Failed to reset settings', 'error');
    }
}

/**
 * Export settings to JSON file
 */
function exportSettingsToJson() {
    if (!firebase.auth().currentUser) {
        console.error('User not authenticated');
        utils.showToast('You must be logged in to export settings', 'error');
        return;
    }
    
    // Get current settings from local storage
    const settings = JSON.parse(localStorage.getItem('adminSettings')) || defaultSettings;
    
    // Add export metadata
    const exportData = {
        exportedBy: firebase.auth().currentUser.email,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0', // Replace with actual app version
        settings: settings
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute("href", dataStr);
    downloadLink.setAttribute("download", `women-safety-settings-${new Date().toISOString().split('T')[0]}.json`);
    downloadLink.click();
    downloadLink.remove();
    
    utils.showToast('Settings exported successfully', 'success');
}

/**
 * Import settings from JSON file
 */
function importSettingsFromJson() {
    if (!firebase.auth().currentUser) {
        console.error('User not authenticated');
        utils.showToast('You must be logged in to import settings', 'error');
        return;
    }
    
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Check file size
        if (file.size > 1024 * 1024) { // 1MB limit
            utils.showToast('File is too large', 'error');
            return;
        }
        
        try {
            // Read file
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!importData.settings || 
                        !importData.settings.api || 
                        !importData.settings.notifications || 
                        !importData.settings.app || 
                        !importData.settings.profile) {
                        
                        utils.showToast('Invalid settings file format', 'error');
                        return;
                    }
                    
                    // Confirm import
                    if (!confirm('Are you sure you want to import these settings? This will overwrite your current settings.')) {
                        return;
                    }
                    
                    const userId = firebase.auth().currentUser.uid;
                    const settingsRef = firebase.database().ref(`adminSettings/${userId}`);
                    
                    // Save imported settings
                    await settingsRef.set(importData.settings);
                    
                    // Reload settings
                    await loadSettings();
                    
                    utils.showToast('Settings imported successfully', 'success');
                    
                } catch (error) {
                    console.error('Error parsing settings file:', error);
                    utils.showToast('Invalid settings file format', 'error');
                }
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error importing settings:', error);
            utils.showToast('Failed to import settings', 'error');
        }
    });
    
    // Trigger file selection
    fileInput.click();
}

/**
 * Set up event listeners for settings
 */
function setupSettingsEventListeners() {
    // API settings form
    if (apiSettingsForm) {
        apiSettingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveSettings('api', apiSettingsForm);
        });
    }
    
    // Notification settings form
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveSettings('notifications', notificationSettingsForm);
        });
        
        // Update range input value displays
        const rangeInputs = notificationSettingsForm.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const output = input.nextElementSibling;
            if (output && output.tagName === 'OUTPUT') {
                input.addEventListener('input', () => {
                    output.value = input.value;
                });
            }
        });
    }
    
    // App settings form
    if (appSettingsForm) {
        appSettingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveSettings('app', appSettingsForm);
        });
        
        // Theme switcher
        const themeSwitch = appSettingsForm.querySelector('input[name="app-theme"]');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', () => {
                const theme = themeSwitch.checked ? 'dark' : 'light';
                applyTheme(theme);
            });
        }
    }
    
    // Admin profile form
    if (adminProfileForm) {
        adminProfileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveSettings('profile', adminProfileForm);
        });
    }
    
    // Reset settings button
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetSettingsToDefault);
    }
    
    // Import settings button
    if (importSettingsBtn) {
        importSettingsBtn.addEventListener('click', importSettingsFromJson);
    }
    
    // Export settings button
    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', exportSettingsToJson);
    }
}

// Initialize settings when the DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);

// Export settings functionality
window.appSettings = {
    getSettings: () => {
        return JSON.parse(localStorage.getItem('adminSettings')) || defaultSettings;
    },
    applyTheme: applyTheme,
    resetSettings: resetSettingsToDefault,
    exportSettings: exportSettingsToJson,
    importSettings: importSettingsFromJson
}; 