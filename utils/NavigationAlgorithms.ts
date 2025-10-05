/**
 * Advanced Navigation Utilities
 * Implements all required algorithms for precise navigation tracking
 */

// Haversine Formula for accurate distance calculations between GPS coordinates
export function haversineDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in metres
  return distance;
}

// Calculate bearing between two points
export function calculateBearing(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - 
           Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360; // in degrees
}

// Distance-to-Line Algorithm - Detects when you've left the route path
export function distanceToLineSegment(
  pointLat: number,
  pointLng: number,
  lineLat1: number,
  lineLng1: number,
  lineLat2: number,
  lineLng2: number
): number {
  // Convert to Cartesian coordinates for easier calculation
  const A = { x: lineLat1, y: lineLng1 };
  const B = { x: lineLat2, y: lineLng2 };
  const P = { x: pointLat, y: pointLng };

  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AP = { x: P.x - A.x, y: P.y - A.y };

  const AB_squared = AB.x * AB.x + AB.y * AB.y;
  
  if (AB_squared === 0) {
    // A and B are the same point
    return haversineDistance(pointLat, pointLng, lineLat1, lineLng1);
  }

  const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / AB_squared));
  
  const projection = {
    x: A.x + t * AB.x,
    y: A.y + t * AB.y
  };

  return haversineDistance(pointLat, pointLng, projection.x, projection.y);
}

// Find closest point on route to current position
export function findClosestPointOnRoute(
  currentLat: number,
  currentLng: number,
  routeCoordinates: Array<{ latitude: number; longitude: number }>
): {
  closestIndex: number;
  distanceToRoute: number;
  projectedPoint: { latitude: number; longitude: number };
} {
  let minDistance = Infinity;
  let closestIndex = 0;
  let projectedPoint = routeCoordinates[0];

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentDistance = distanceToLineSegment(
      currentLat,
      currentLng,
      routeCoordinates[i].latitude,
      routeCoordinates[i].longitude,
      routeCoordinates[i + 1].latitude,
      routeCoordinates[i + 1].longitude
    );

    if (segmentDistance < minDistance) {
      minDistance = segmentDistance;
      closestIndex = i;
      
      // Calculate projected point on the line segment
      const A = routeCoordinates[i];
      const B = routeCoordinates[i + 1];
      const P = { latitude: currentLat, longitude: currentLng };
      
      const AB = { 
        lat: B.latitude - A.latitude, 
        lng: B.longitude - A.longitude 
      };
      const AP = { 
        lat: P.latitude - A.latitude, 
        lng: P.longitude - A.longitude 
      };
      
      const AB_squared = AB.lat * AB.lat + AB.lng * AB.lng;
      const t = AB_squared === 0 ? 0 : 
        Math.max(0, Math.min(1, (AP.lat * AB.lat + AP.lng * AB.lng) / AB_squared));
      
      projectedPoint = {
        latitude: A.latitude + t * AB.lat,
        longitude: A.longitude + t * AB.lng
      };
    }
  }

  return {
    closestIndex,
    distanceToRoute: minDistance,
    projectedPoint
  };
}

// Calculate route progress based on distance traveled
export function calculateRouteProgress(
  currentLat: number,
  currentLng: number,
  routeCoordinates: Array<{ latitude: number; longitude: number }>
): {
  progressPercentage: number;
  distanceTraveled: number;
  totalDistance: number;
  remainingDistance: number;
} {
  const { closestIndex } = findClosestPointOnRoute(currentLat, currentLng, routeCoordinates);
  
  // Calculate total route distance
  let totalDistance = 0;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    totalDistance += haversineDistance(
      routeCoordinates[i].latitude,
      routeCoordinates[i].longitude,
      routeCoordinates[i + 1].latitude,
      routeCoordinates[i + 1].longitude
    );
  }

  // Calculate distance traveled up to closest point
  let distanceTraveled = 0;
  for (let i = 0; i < closestIndex; i++) {
    distanceTraveled += haversineDistance(
      routeCoordinates[i].latitude,
      routeCoordinates[i].longitude,
      routeCoordinates[i + 1].latitude,
      routeCoordinates[i + 1].longitude
    );
  }

  // Add distance from closest segment start to current position projection
  if (closestIndex < routeCoordinates.length - 1) {
    const { projectedPoint } = findClosestPointOnRoute(currentLat, currentLng, routeCoordinates);
    distanceTraveled += haversineDistance(
      routeCoordinates[closestIndex].latitude,
      routeCoordinates[closestIndex].longitude,
      projectedPoint.latitude,
      projectedPoint.longitude
    );
  }

  const progressPercentage = totalDistance > 0 ? (distanceTraveled / totalDistance) * 100 : 0;
  const remainingDistance = totalDistance - distanceTraveled;

  return {
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    distanceTraveled,
    totalDistance,
    remainingDistance
  };
}

// Check if user has deviated from route
export function isOffRoute(
  currentLat: number,
  currentLng: number,
  routeCoordinates: Array<{ latitude: number; longitude: number }>,
  threshold: number = 50 // meters
): boolean {
  const { distanceToRoute } = findClosestPointOnRoute(currentLat, currentLng, routeCoordinates);
  return distanceToRoute > threshold;
}

// Smooth GPS coordinates to reduce jitter
export function smoothGPSCoordinate(
  newCoordinate: { latitude: number; longitude: number },
  previousCoordinates: Array<{ latitude: number; longitude: number }>,
  maxHistory: number = 5
): { latitude: number; longitude: number } {
  const coordinates = [...previousCoordinates, newCoordinate].slice(-maxHistory);
  
  if (coordinates.length === 1) {
    return newCoordinate;
  }

  // Simple moving average
  const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
  const avgLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;

  return {
    latitude: avgLat,
    longitude: avgLng
  };
}

// Calculate ETA based on current speed and remaining distance
export function calculateETA(
  remainingDistance: number, // in meters
  currentSpeed: number, // in m/s
  averageSpeed?: number // fallback average speed in m/s
): {
  etaSeconds: number;
  etaTimestamp: Date;
  formattedETA: string;
} {
  const speedToUse = currentSpeed > 0 ? currentSpeed : (averageSpeed || 1.4); // 1.4 m/s = walking speed
  const etaSeconds = remainingDistance / speedToUse;
  const etaTimestamp = new Date(Date.now() + etaSeconds * 1000);
  
  const hours = Math.floor(etaSeconds / 3600);
  const minutes = Math.floor((etaSeconds % 3600) / 60);
  
  let formattedETA = '';
  if (hours > 0) {
    formattedETA = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formattedETA = `${minutes}m`;
  } else {
    formattedETA = '<1m';
  }

  return {
    etaSeconds,
    etaTimestamp,
    formattedETA
  };
}