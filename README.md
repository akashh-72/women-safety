# Women Safety App - Admin Panel

This is the admin panel for the Women Safety application. It provides a comprehensive dashboard for monitoring user activity, emergency alerts, and location tracking.

## Features

- **Dashboard**: Overview of key metrics and recent activity
- **User Management**: View and manage user accounts
- **Emergency Monitoring**: Track and respond to emergency alerts
- **Location Tracking**: Monitor user locations in real-time
- **Analytics**: View usage statistics and trends

## Setup Instructions

1. Make sure you have the Firebase project credentials set up correctly in `js/firebase-config.js`
2. Place the admin panel files on a secure web server
3. Create an admin user by uncommenting the `createAdminUser()` function in `js/auth.js` (run once then comment it again)
4. Access the admin panel through a web browser

## Security

Ensure that:
- The admin panel is hosted on a secure (HTTPS) connection
- Access is restricted to authorized personnel only
- Admin credentials are strong and regularly updated

## Dependencies

- Firebase (Auth, Realtime Database)
- Leaflet.js for maps
- Chart.js for analytics

## Directory Structure

- `/css`: Contains all styling files
- `/js`: Contains JavaScript functionality
- `/img`: Contains images and icons

## Contact

For support or questions, contact the development team.

## License

This admin panel is proprietary software and is not licensed for redistribution. 