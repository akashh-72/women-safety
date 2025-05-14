/**
 * Common utility functions for the Women Safety Admin Panel
 */

// Format a timestamp to display as a relative time (e.g., "2 hours ago")
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const now = Date.now();
    const secondsAgo = Math.floor((now - timestamp) / 1000);
    
    if (secondsAgo < 10) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
    
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 7) return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
    
    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo < 4) return `${weeksAgo} ${weeksAgo === 1 ? 'week' : 'weeks'} ago`;
    
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) return `${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;
    
    const yearsAgo = Math.floor(daysAgo / 365);
    return `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago`;
}

// Format a timestamp to a readable date/time string
function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Format a timestamp to a readable date string
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

// Format a timestamp to a readable time string
function formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Format a date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date(date);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Format a phone number to a readable format
function formatPhoneNumber(phone) {
    if (!phone) return 'Unknown';
    
    // Strip non-numeric characters
    const cleaned = String(phone).replace(/\D/g, '');
    
    // Check if it's an Indian number starting with country code
    if (cleaned.startsWith('91') && cleaned.length > 10) {
        const countryCode = cleaned.substring(0, 2);
        const number = cleaned.substring(2);
        
        // Format as +91 XXXXX XXXXX
        if (number.length === 10) {
            return `+${countryCode} ${number.substring(0, 5)} ${number.substring(5)}`;
        }
    }
    
    // Format as regular number with country code if present
    if (cleaned.length > 10) {
        const countryCode = cleaned.substring(0, cleaned.length - 10);
        const number = cleaned.substring(cleaned.length - 10);
        return `+${countryCode} ${number.substring(0, 5)} ${number.substring(5)}`;
    } 
    // Format as regular 10-digit number
    else if (cleaned.length === 10) {
        return `${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
    }
    
    // If all else fails, return the original but with + if it starts with a country code
    return cleaned.length > 10 ? `+${cleaned}` : cleaned;
}

// Check if a location update is recent (within 15 minutes)
function isLocationRecent(timestamp) {
    if (!timestamp) return false;
    
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);
    
    return timestamp >= fifteenMinutesAgo;
}

// Check if a string is a valid email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if a string is a valid Indian phone number
function isValidPhone(phone) {
    // Allow +91 format or just 10 digits
    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    return phoneRegex.test(phone);
}

// Generate an avatar URL based on name (using UI Avatars API)
function generateAvatarUrl(name, size = 128) {
    if (!name) name = 'User';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=random`;
}

// Generate a random avatar URL (using Pravatar API)
function getRandomAvatarUrl(seed, size = 128) {
    // Use the seed (could be user ID) to get a consistent avatar for a user
    if (seed) {
        return `https://i.pravatar.cc/${size}?u=${seed}`;
    }
    
    // Random avatar if no seed provided
    return `https://i.pravatar.cc/${size}?img=${Math.floor(Math.random() * 70)}`;
}

// Format file size to readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate a date range array between two dates
function getDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Generate a month range array for the last N months
function getMonthRange(months = 12) {
    const dateArray = [];
    let currentDate = new Date();
    
    // Set to first day of current month
    currentDate.setDate(1);
    
    // Add current month and go back N-1 months
    for (let i = 0; i < months; i++) {
        dateArray.unshift(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() - 1);
    }
    
    return dateArray;
}

// Generate random data for demo purposes
function generateRandomData(count, min = 0, max = 100) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}

// Check if user is on a mobile device
function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy text to clipboard
function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => resolve(true))
                .catch(err => {
                    console.error('Clipboard write failed: ', err);
                    reject(err);
                });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    resolve(true);
                } else {
                    reject(new Error('Copy command was unsuccessful'));
                }
            } catch (err) {
                document.body.removeChild(textArea);
                reject(err);
            }
        }
    });
}

// Export all utility functions
window.utils = {
    formatTimeAgo,
    formatDateTime,
    formatDate,
    formatTime,
    formatDateForInput,
    formatPhoneNumber,
    isLocationRecent,
    isValidEmail,
    isValidPhone,
    generateAvatarUrl,
    getRandomAvatarUrl,
    formatFileSize,
    getDateRange,
    getMonthRange,
    generateRandomData,
    isMobileDevice,
    debounce,
    throttle,
    copyToClipboard
}; 