// types/navigation.ts

export interface Coordinate {
    latitude: number;
    longitude: number;
  }
  
  export interface RouteProgress {
    distanceTraveled: number;
    durationRemaining: number;
    fractionTraveled: number;
  }
  
  export interface NavigationError {
    message: string;
    code?: string;
  }
  
  export interface NavigationEvent {
    nativeEvent: RouteProgress | NavigationError;
  }