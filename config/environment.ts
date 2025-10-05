// Environment configuration
export const config = {
  // For development, use your local IP address or localhost
  // For production, use your deployed server URL
  SERVER_URL: process.env.NODE_ENV === 'production' ? 'https://your-production-server.com' : 'http://localhost:3000',
  PARTNER_TOKEN: 'devtoken',
  
  // Navigation settings
  PROXIMITY_THRESHOLD: 30, // meters
  TURN_WARNING_DISTANCE: 100, // meters
  
  // Map settings
  DEFAULT_REGION: {
    latitude: 43.7853, // UTSC coordinates
    longitude: -79.1884,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};