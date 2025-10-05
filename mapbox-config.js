// Mapbox configuration
import Mapbox from '@rnmapbox/maps';

// Initialize Mapbox with access token
// Get your token from: https://account.mapbox.com/access-tokens/
const MAPBOX_ACCESS_TOKEN = process.env.MY_MAPBOX_ACCESS_TOKEN;

// Set the access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Optional: Configure additional settings
Mapbox.setTelemetryEnabled(false); // Disable telemetry for privacy

export default Mapbox;
export { MAPBOX_ACCESS_TOKEN };
