// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBW1az9e1ICx0rq3HOlK0TkDJufkCEUlPc",
  authDomain: "women-safety-7a024.firebaseapp.com",
  databaseURL: "https://women-safety-7a024-default-rtdb.firebaseio.com",
  projectId: "women-safety-7a024",
  storageBucket: "women-safety-7a024.appspot.com",
  messagingSenderId: "1081298084042",
  appId: "1:1081298084042:web:7ce871cf7a2fef76da5433",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize the Firebase app
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get references to the database services
const database = firebase.database();
const auth = firebase.auth();

// Export the Firebase services
window.firebaseServices = {
    database,
    auth
}; 