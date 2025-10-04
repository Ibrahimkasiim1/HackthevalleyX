# NavSense Authentication Setup Guide

This guide will help you set up Auth0 authentication with JWT tokens and MongoDB for your NavSense app.

## Prerequisites

1. Auth0 account (sign up at https://auth0.com)
2. MongoDB Atlas cluster (already configured)
3. Google Maps API key (for existing functionality)

## Auth0 Setup

### 1. Create an Auth0 Application

1. Go to your Auth0 Dashboard
2. Click "Applications" → "Create Application"
3. Choose "Native" as the application type
4. Name it "NavSense Mobile App"

### 2. Configure Application Settings

In your Auth0 application settings:

**Allowed Callback URLs:**
```
com.navsense://YOUR_AUTH0_DOMAIN/ios/com.navsense/callback,
com.navsense://YOUR_AUTH0_DOMAIN/android/com.navsense/callback
```

**Allowed Logout URLs:**
```
com.navsense://YOUR_AUTH0_DOMAIN/ios/com.navsense/callback,
com.navsense://YOUR_AUTH0_DOMAIN/android/com.navsense/callback
```

**Allowed Web Origins:**
```
http://localhost:8081,
exp://localhost:19000
```

### 3. Get Your Auth0 Credentials

From your Auth0 application settings, copy:
- Domain
- Client ID

## Configuration

### 1. Update Auth0 Configuration

Edit `auth0-configuration.ts`:

```typescript
export const auth0Config = {
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id',
  audience: 'your-api-audience', // Optional
};
```

### 2. Update App Configuration

Edit `app.json` and replace `YOUR_AUTH0_DOMAIN` with your actual Auth0 domain:

```json
[
  "react-native-auth0",
  {
    "domain": "your-domain.auth0.com"
  }
]
```

### 3. Server Environment Variables

Copy `server/.env.example` to `server/.env` and update:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-audience

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Other variables...
```

## Running the Application

### 1. Start the Server

```bash
cd server
npm run dev
```

### 2. Start the Expo App

```bash
npm start
```

## Features Implemented

### Authentication
- ✅ Auth0 integration with email/password and social login
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ Secure credential storage

### Database
- ✅ MongoDB integration
- ✅ User profile storage
- ✅ User preferences management
- ✅ Automatic user creation/update

### Mobile App
- ✅ Login/signup screen
- ✅ Protected routes
- ✅ User profile display
- ✅ Logout functionality
- ✅ Authentication context

### Server API
- ✅ User storage endpoint
- ✅ Profile management
- ✅ Preferences updates
- ✅ JWT middleware

## API Endpoints

### Authentication Routes

**POST** `/api/auth/store-user`
- Stores/updates user information from Auth0

**GET** `/api/auth/profile/:auth0Id`
- Retrieves user profile

**PUT** `/api/auth/preferences/:auth0Id`
- Updates user preferences

**DELETE** `/api/auth/account/:auth0Id`
- Deletes user account

## Database Schema

### User Model
```javascript
{
  auth0Id: String (unique),
  email: String (unique),
  name: String,
  picture: String,
  preferences: {
    language: String,
    theme: String,
    notifications: Boolean
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- JWT tokens for API authentication
- Secure credential storage using react-native-keychain
- Auth0's built-in security features
- MongoDB connection with authentication
- Environment variable protection

## Troubleshooting

### Common Issues

1. **Auth0 Login Fails**
   - Check callback URLs in Auth0 dashboard
   - Verify domain and client ID in configuration

2. **Database Connection Fails**
   - Verify MongoDB connection string
   - Check network access in MongoDB Atlas

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in server environment
   - Check token expiration (24h default)

## Next Steps

1. Configure Auth0 social providers (Google, Facebook, etc.)
2. Add password reset functionality
3. Implement user roles and permissions
4. Add user profile editing
5. Set up push notifications
6. Add biometric authentication

## Notes

- The MongoDB connection string is already configured
- Make sure to replace all placeholder values with your actual credentials
- Keep your Auth0 client secret and JWT secret secure
- Consider implementing refresh token rotation for production