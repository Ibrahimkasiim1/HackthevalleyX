// Enhanced navigation service using Mapbox
// @ts-ignore - Mapbox SDK doesn't have TypeScript definitions
import mapboxClient from '@mapbox/mapbox-sdk';
// @ts-ignore - Mapbox SDK doesn't have TypeScript definitions  
import directionsAPI from '@mapbox/mapbox-sdk/services/directions';

// Initialize Mapbox client with environment variable
const mapboxAccessToken = process.env.MY_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';
const client = mapboxClient({ accessToken: mapboxAccessToken });
const directions = directionsAPI(client);

// Get route using Mapbox Directions API
export async function getMapboxRoute(
  startCoords: [number, number], // [longitude, latitude]
  endCoords: [number, number],   // [longitude, latitude] 
  mode: string = 'walking'
) {
  try {
    console.log('🗺️ Getting Mapbox route:', { 
      from: startCoords, 
      to: endCoords, 
      mode 
    });

    const response = await directions.getDirections({
      profile: mode, // 'walking', 'cycling', or 'driving'
      waypoints: [
        { coordinates: startCoords },
        { coordinates: endCoords }
      ],
      geometries: 'geojson',
      steps: true,
      voice_instructions: true,
      banner_instructions: true,
      overview: 'full',
      alternatives: false
    }).send();

    if (!response.body.routes || response.body.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.body.routes[0];
    const leg = route.legs[0];
    
    // Transform Mapbox response to match your existing format
    const transformedRoute = {
      routeId: `mapbox_${Date.now()}`,
      summary: {
        originName: `${startCoords[1]}, ${startCoords[0]}`,
        destinationName: `${endCoords[1]}, ${endCoords[0]}`,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        eta: new Date(Date.now() + route.duration * 1000).toISOString()
      },
      polyline: {
        coordinates: route.geometry.coordinates
      },
      steps: leg.steps.map((step: any, index: number) => ({
        i: index,
        instructionText: step.maneuver.instruction,
        instructionHtml: step.maneuver.instruction,
        maneuver: step.maneuver.type,
        side: getManeuverSide(step.maneuver.modifier),
        triggerAt: { 
          lat: step.maneuver.location[1], 
          lng: step.maneuver.location[0] 
        },
        end: {
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0]
        },
        distanceMeters: step.distance,
        voiceInstruction: step.voiceInstructions?.[0]?.announcement || step.maneuver.instruction
      }))
    };

    console.log('✅ Mapbox route calculated:', {
      distance: `${Math.round(route.distance / 1000)}km`,
      duration: `${Math.round(route.duration / 60)}min`,
      steps: transformedRoute.steps.length
    });

    return transformedRoute;

  } catch (error) {
    console.error('❌ Mapbox routing error:', error);
    throw new Error(`Mapbox routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert Mapbox maneuver modifier to simple L/R/B format
function getManeuverSide(modifier: string): string {
  if (!modifier) return 'B';
  
  const leftModifiers = ['left', 'sharp left', 'slight left'];
  const rightModifiers = ['right', 'sharp right', 'slight right'];
  
  if (leftModifiers.includes(modifier)) return 'L';
  if (rightModifiers.includes(modifier)) return 'R';
  return 'B';
}

// Geocoding function using Mapbox
export async function getMapboxCoordinates(address: string): Promise<[number, number]> {
  try {
    // This is a simple implementation - you might want to use Mapbox Geocoding API
    // For now, we'll use a basic approach
    throw new Error('Geocoding not implemented yet - please provide coordinates directly');
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    throw error;
  }
}