export const auth0Config = {
  domain: 'YOUR_AUTH0_DOMAIN', // Replace with your Auth0 domain
  clientId: 'YOUR_AUTH0_CLIENT_ID', // Replace with your Auth0 client ID
  audience: 'YOUR_AUTH0_AUDIENCE', // Replace with your Auth0 API audience (optional)
};

// You'll need to replace these values with your actual Auth0 configuration
// 1. Go to Auth0 Dashboard
// 2. Create a new Application (Native)
// 3. Get your Domain and Client ID
// 4. Configure Allowed Callback URLs: com.navsense://YOUR_AUTH0_DOMAIN/ios/com.navsense/callback,com.navsense://YOUR_AUTH0_DOMAIN/android/com.navsense/callback
// 5. Configure Allowed Logout URLs: com.navsense://YOUR_AUTH0_DOMAIN/ios/com.navsense/callback,com.navsense://YOUR_AUTH0_DOMAIN/android/com.navsense/callback