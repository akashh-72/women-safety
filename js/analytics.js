// DOM Elements
const dailyAlertsChart = document.getElementById('daily-alerts-chart');
const userRegistrationChart = document.getElementById('user-registration-chart');
const alertTypesChart = document.getElementById('alert-types-chart');
const geoDistributionMap = document.getElementById('geo-distribution-map');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

// Initialize analytics page on auth state change
auth.onAuthStateChanged(user => {
    if (user) {
        // Only load analytics data when the analytics page is active
        document.querySelector('[data-page="analytics"]').addEventListener('click', () => {
            initAnalyticsPage();
        });
    }
});

// Initialize analytics page
function initAnalyticsPage() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    dateFrom.value = formatDateForInput(thirtyDaysAgo);
    dateTo.value = formatDateForInput(today);
    
    // Initialize charts
    initDailyAlertsChart();
    initUserRegistrationChart();
    initAlertTypesChart();
    initGeoDistributionMap();
    
    // Setup event listeners
    setupAnalyticsEventListeners();
}

// Initialize Daily Alerts Chart
function initDailyAlertsChart() {
    const ctx = dailyAlertsChart.getContext('2d');
    
    // Get date range
    const startDate = new Date(dateFrom.value);
    const endDate = new Date(dateTo.value);
    
    // Generate date labels for the date range
    const labels = getDateRange(startDate, endDate);
    
    // In a real app, we would fetch this data from Firebase
    // For demo purposes, we'll generate random data
    const data = generateRandomData(labels.length, 0, 10);
    
    // Create chart
    if (window.dailyAlertsChartInstance) {
        window.dailyAlertsChartInstance.destroy();
    }
    
    window.dailyAlertsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emergency Alerts',
                data: data,
                backgroundColor: 'rgba(244, 67, 54, 0.7)',
                borderColor: 'rgba(244, 67, 54, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Initialize User Registration Chart
function initUserRegistrationChart() {
    const ctx = userRegistrationChart.getContext('2d');
    
    // Get date range (use last 12 months for this chart)
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    // Generate month labels
    const labels = getMonthRange(lastYear, today);
    
    // In a real app, we would fetch this data from Firebase
    // For demo purposes, we'll generate random data
    const data = generateRandomData(labels.length, 5, 20);
    
    // Calculate cumulative sum for the line chart
    const cumulativeData = [];
    let sum = 50; // Start with some existing users
    for (const value of data) {
        sum += value;
        cumulativeData.push(sum);
    }
    
    // Create chart
    if (window.userRegistrationChartInstance) {
        window.userRegistrationChartInstance.destroy();
    }
    
    window.userRegistrationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'New Users',
                    data: data,
                    backgroundColor: 'rgba(63, 81, 181, 0.2)',
                    borderColor: 'rgba(63, 81, 181, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Total Users',
                    data: cumulativeData,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'New Users'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Total Users'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Initialize Alert Types Chart
function initAlertTypesChart() {
    const ctx = alertTypesChart.getContext('2d');
    
    // In a real app, we would fetch this data from Firebase
    // For demo purposes, we'll use mock data
    const data = {
        labels: ['Shake Detection', 'Button Press', 'Voice Command', 'Manual Trigger'],
        datasets: [{
            data: [45, 25, 10, 20],
            backgroundColor: [
                'rgba(244, 67, 54, 0.7)',
                'rgba(63, 81, 181, 0.7)',
                'rgba(255, 152, 0, 0.7)',
                'rgba(76, 175, 80, 0.7)'
            ],
            borderColor: [
                'rgba(244, 67, 54, 1)',
                'rgba(63, 81, 181, 1)',
                'rgba(255, 152, 0, 1)',
                'rgba(76, 175, 80, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Create chart
    if (window.alertTypesChartInstance) {
        window.alertTypesChartInstance.destroy();
    }
    
    window.alertTypesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize Geographical Distribution Map
function initGeoDistributionMap() {
    // Create a map in the geo-distribution-map div
    if (window.geoMapInstance) {
        window.geoMapInstance.remove();
    }
    
    window.geoMapInstance = L.map(geoDistributionMap).setView([20.5937, 78.9629], 5); // Default to India center
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.geoMapInstance);
    
    // In a real app, we would fetch real user location clusters from Firebase
    // For demo purposes, we'll add some random clusters
    addDemoLocationClusters(window.geoMapInstance);
}

// Add demo location clusters to the map
function addDemoLocationClusters(map) {
    // Major cities in India with mock data
    const cities = [
        { name: 'Mumbai', coords: [19.0760, 72.8777], users: 85, emergencies: 12 },
        { name: 'Delhi', coords: [28.6139, 77.2090], users: 120, emergencies: 18 },
        { name: 'Bangalore', coords: [12.9716, 77.5946], users: 95, emergencies: 8 },
        { name: 'Hyderabad', coords: [17.3850, 78.4867], users: 65, emergencies: 5 },
        { name: 'Chennai', coords: [13.0827, 80.2707], users: 70, emergencies: 7 },
        { name: 'Kolkata', coords: [22.5726, 88.3639], users: 55, emergencies: 9 },
        { name: 'Pune', coords: [18.5204, 73.8567], users: 45, emergencies: 4 },
        { name: 'Ahmedabad', coords: [23.0225, 72.5714], users: 40, emergencies: 6 },
        { name: 'Jaipur', coords: [26.9124, 75.7873], users: 35, emergencies: 5 },
    ];
    
    cities.forEach(city => {
        // Create circle marker with size proportional to number of users
        const radius = Math.sqrt(city.users) * 1.5;
        
        // Create a circular marker
        const marker = L.circleMarker(city.coords, {
            radius: radius,
            fillColor: '#3f51b5',
            color: '#3f51b5',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.4
        }).addTo(map);
        
        // Add popup with city info
        marker.bindPopup(`
            <div class="map-popup">
                <h3>${city.name}</h3>
                <p><strong>Users:</strong> ${city.users}</p>
                <p><strong>Emergency Alerts:</strong> ${city.emergencies}</p>
                <p><strong>Demographic:</strong> ${Math.floor(Math.random() * 30) + 70}% Female</p>
            </div>
        `);
    });
    
    // Fit map to show all clusters
    const bounds = L.latLngBounds(cities.map(city => city.coords));
    map.fitBounds(bounds.pad(0.1));
}

// Setup event listeners
function setupAnalyticsEventListeners() {
    // Date range change
    dateFrom.addEventListener('change', updateCharts);
    dateTo.addEventListener('change', updateCharts);
    
    // Filter button
    document.querySelector('#analytics-page .secondary-btn').addEventListener('click', updateCharts);
    
    // Export button
    document.querySelector('#analytics-page .primary-btn').addEventListener('click', exportAnalytics);
}

// Update charts based on date range
function updateCharts() {
    initDailyAlertsChart();
    initUserRegistrationChart();
    initAlertTypesChart();
}

// Export analytics data
function exportAnalytics() {
    alert('Analytics data export initiated. The data will be sent to your email.');
    // In a real app, this would generate a CSV/Excel file with analytics data
}

// Helper Functions

// Format date for input field
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get array of dates between start and end
function getDateRange(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dateArray.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateArray;
}

// Get array of months between start and end
function getMonthRange(startDate, endDate) {
    const monthArray = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        monthArray.push(currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return monthArray;
}

// Generate random data for charts
function generateRandomData(length, min, max) {
    return Array(length).fill(0).map(() => Math.floor(Math.random() * (max - min + 1)) + min);
} 