export const auth0Config = {
  domain: 'dev-i7n3hc6uvpflk5jr.ca.auth0.com',
  clientId: 'cEiW41qxJ1AkT5LbgWgLpWhXnXOFqN6r',
  audience: 'https://navsense-api', // Optional - can be removed if not using API authentication
};

// ✅ Auth0 configuration updated with new credentials from dashboard
// 
// IMPORTANT: Make sure these callback URLs are configured in your Auth0 dashboard:
// - com.navsense://dev-i7n3hc6uvpflk5jr.ca.auth0.com/ios/com.navsense/callback
// - com.navsense://dev-i7n3hc6uvpflk5jr.ca.auth0.com/android/com.navsense/callback
//
// Logout URLs (same as callback URLs):
// - com.navsense://dev-i7n3hc6uvpflk5jr.ca.auth0.com/ios/com.navsense/callback
// - com.navsense://dev-i7n3hc6uvpflk5jr.ca.auth0.com/android/com.navsense/callback