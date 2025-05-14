// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.querySelector('.login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Direct Authentication Handler
class AuthHandler {
    constructor() {
        this.currentUser = null;
        this.adminCredentials = {
            email: 'akashvipatil9555@gmail.com',
            password: 'Admin@123'
        };
    }

    setupAuthStateListener() {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            this.currentUser = {
                email: this.adminCredentials.email,
                fullName: 'Admin User'
            };
            this.updateUIWithUserData(this.currentUser);
        } else {
            this.currentUser = null;
            // Only redirect if not on login page
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    updateUIWithUserData(userData) {
        // Update UI elements with user data
        const profileName = document.querySelector('.dropdown span');
        if (profileName) {
            profileName.textContent = userData.fullName || 'Admin';
        }
    }

    async login(email, password) {
        try {
            // Direct authentication
            if (email === this.adminCredentials.email && password === this.adminCredentials.password) {
                this.currentUser = {
                    email: email,
                    fullName: 'Admin User'
                };
                // Store login state
                localStorage.setItem('isLoggedIn', 'true');
                return this.currentUser;
            } else {
                throw new Error('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            this.currentUser = null;
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Failed to logout');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize auth handler
const authHandler = new AuthHandler();

// Export for use in other files
window.authHandler = authHandler;

// Setup auth state listener when the page loads
document.addEventListener('DOMContentLoaded', () => {
    authHandler.setupAuthStateListener();
});

// Login Form Submission
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    // Basic validation
    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span>';
    loginError.textContent = '';
    
    // Sign in with Firebase
    authHandler.login(email, password)
        .then((userCredential) => {
            // Hide the login modal
            loginModal.classList.remove('active');
            // Clear the form
            loginForm.reset();
        })
        .catch((error) => {
            console.error('Login error:', error);
            loginError.textContent = error.message;
        })
        .finally(() => {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    authHandler.logout()
        .then(() => {
            // Show login modal
            loginModal.classList.add('active');
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
});

// Create admin user if it doesn't exist
async function createAdminUserIfNotExists() {
    try {
        const email = 'akashvipatil9555@gmail.com';
        const password = 'Admin@123'; // You should change this password

        // Try to sign in first
        try {
            await authHandler.login(email, password);
            console.log('Admin user already exists');
            return;
        } catch (error) {
            // If user doesn't exist, create one
            if (error.code === 'auth/user-not-found') {
                const userCredential = await authHandler.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Store admin info in database
                await authHandler.database.ref(`Users/${user.uid}`).set({
                    email: user.email,
                    fullName: 'Admin User',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                });
                
                console.log('Admin user created successfully');
            }
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', createAdminUserIfNotExists); 