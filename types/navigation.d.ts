// Type definitions for the navigation app
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Type for location coordinates
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Type for GPS position
export interface GPSPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    heading: number | null;
    speed: number | null;
    altitudeAccuracy?: number | null;
  };
  timestamp: number;
  mocked?: boolean;
}

// Type for route waypoints
export interface RouteWaypoint {
  lat: number;
  lng: number;
}

// Type for navigation metrics
export interface NavigationMetrics {
  distanceTraveled: number;
  averageSpeed: number;
  maxSpeed: number;
  duration: number;
  accuracy: number;
}

export {};