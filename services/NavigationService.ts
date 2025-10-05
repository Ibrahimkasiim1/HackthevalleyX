import * as Location from 'expo-location';
import Geolocation from '@react-native-community/geolocation';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from '@mapbox/polyline';
import { config } from '@/config/environment';
import {
  haversineDistance,
  calculateBearing,
  findClosestPointOnRoute,
  calculateRouteProgress,
  isOffRoute,
  smoothGPSCoordinate,
  calculateETA
} from '@/utils/NavigationAlgorithms';

// Error classes for better error handling
export class NavigationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NavigationError';
  }
}

export class LocationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LocationError';
  }
}

export class RouteError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RouteError';
  }
}

export interface RouteStep {
  i: number;
  instructionHtml: string;
  maneuver: string;
  side: 'L' | 'R' | 'B';
  triggerAt: { lat: number; lng: number };
  end: { lat: number; lng: number };
  distanceMeters: number;
}

export interface RouteData {
  routeId: string;
  summary: {
    originName: string;
    destinationName: string;
    distanceMeters: number;
    durationSeconds: number;
    eta: string;
  };
  polyline: { points: string };
  steps: RouteStep[];
}

export interface NavigationState {
  currentLocation: Location.LocationObject | null;
  currentStepIndex: number;
  routeProgress: number;
  isNavigating: boolean;
  nextTurn: RouteStep | null;
  distanceToNextTurn: number;
  distanceToRoute: number;
  isOffRoute: boolean;
  currentSpeed: number;
  estimatedTimeOfArrival: string;
  smoothedLocation: { latitude: number; longitude: number } | null;
  totalDistanceRemaining: number;
}

const SERVER_URL = config.SERVER_URL;
const PARTNER_TOKEN = config.PARTNER_TOKEN;
const PROXIMITY_THRESHOLD = config.PROXIMITY_THRESHOLD; // meters
const TURN_WARNING_DISTANCE = config.TURN_WARNING_DISTANCE; // meters

class NavigationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private geolocationWatchId: number | null = null;
  private currentRoute: RouteData | null = null;
  private routeCoordinates: Array<{ latitude: number; longitude: number }> = [];
  private navigationState: NavigationState = {
    currentLocation: null,
    currentStepIndex: 0,
    routeProgress: 0,
    isNavigating: false,
    nextTurn: null,
    distanceToNextTurn: 0,
    distanceToRoute: 0,
    isOffRoute: false,
    currentSpeed: 0,
    estimatedTimeOfArrival: '',
    smoothedLocation: null,
    totalDistanceRemaining: 0,
  };
  private listeners: Array<(state: NavigationState) => void> = [];
  private completedSteps: Set<number> = new Set();
  private locationHistory: Array<{ latitude: number; longitude: number }> = [];
  private lastRerouteTime: number = 0;

  constructor() {
    this.setupNotifications();
  }

  private async setupNotifications() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  public addListener(callback: (state: NavigationState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private decodeRoutePolyline(encodedPolyline: string): Array<{ latitude: number; longitude: number }> {
    try {
      return decode(encodedPolyline).map(([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.navigationState }));
  }

  public async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new LocationError('Location permissions not granted', 'PERMISSION_DENIED');
      }
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      if (error instanceof LocationError) {
        throw error;
      }
      throw new LocationError('Failed to request location permissions', 'PERMISSION_ERROR');
    }
  }

  public async buildRoute(start: string, destination: string, mode: string = 'walking'): Promise<RouteData> {
    try {
      const url = `${SERVER_URL}/convo/route.build?token=${PARTNER_TOKEN}&start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          throw new RouteError('Authentication failed. Check server configuration.', 'AUTH_ERROR');
        } else if (response.status === 502) {
          throw new RouteError('Route building failed. Check your locations.', 'ROUTE_ERROR');
        } else {
          throw new RouteError(`Server error: ${response.status}`, 'SERVER_ERROR');
        }
      }

      const route: RouteData = await response.json();
      
      if (!route.steps || route.steps.length === 0) {
        throw new RouteError('No route found between the specified locations', 'NO_ROUTE');
      }
      
      this.currentRoute = route;
      
      // Save route to local storage for persistence
      await AsyncStorage.setItem('currentRoute', JSON.stringify(route));
      
      return route;
    } catch (error) {
      console.error('Error building route:', error);
      if (error instanceof RouteError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new RouteError('Network error. Check your internet connection.', 'NETWORK_ERROR');
      }
      throw new RouteError('Failed to build route. Please try again.', 'UNKNOWN_ERROR');
    }
  }

  public async startNavigation(): Promise<boolean> {
    if (!this.currentRoute) {
      throw new NavigationError('No route available. Build a route first.');
    }

    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) {
      return false;
    }

    try {
      // Decode route polyline for tracking
      this.routeCoordinates = this.decodeRoutePolyline(this.currentRoute.polyline.points);

      // Start high-accuracy location tracking with react-native-community/geolocation
      this.geolocationWatchId = Geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              altitudeAccuracy: position.coords.altitudeAccuracy || null,
            },
            timestamp: position.timestamp,
            mocked: false,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Don't throw here as it will break the watch - instead notify user
          this.sendNotification(
            'GPS Error',
            'Unable to get precise location. Navigation may be affected.'
          ).catch(console.error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000,
          distanceFilter: 1, // Update every meter
          interval: 1000, // Update every second
          fastestInterval: 500,
        }
      );

      this.navigationState.isNavigating = true;
      this.navigationState.currentStepIndex = 0;
      this.completedSteps.clear();
      this.locationHistory = [];
      this.notifyListeners();

      // Send initial navigation start notification
      await this.sendNotification(
        'Navigation Started',
        `Navigating to ${this.currentRoute.summary.destinationName}`
      );

      return true;
    } catch (error) {
      console.error('Error starting navigation:', error);
      return false;
    }
  }

  private async handleLocationUpdate(location: Location.LocationObject) {
    this.navigationState.currentLocation = location;

    if (!this.currentRoute || !this.navigationState.isNavigating || this.routeCoordinates.length === 0) {
      this.notifyListeners();
      return;
    }

    const currentPos = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Smooth GPS coordinates to reduce jitter
    this.locationHistory.push(currentPos);
    const smoothedLocation = smoothGPSCoordinate(currentPos, this.locationHistory.slice(-5));
    this.navigationState.smoothedLocation = smoothedLocation;

    // Calculate current speed (m/s)
    this.navigationState.currentSpeed = location.coords.speed || 0;

    // Calculate route progress using advanced algorithms
    const progressData = calculateRouteProgress(
      smoothedLocation.latitude,
      smoothedLocation.longitude,
      this.routeCoordinates
    );

    this.navigationState.routeProgress = progressData.progressPercentage / 100;
    this.navigationState.totalDistanceRemaining = progressData.remainingDistance;

    // Check if user is off route using distance-to-line algorithm
    const offRoute = isOffRoute(
      smoothedLocation.latitude,
      smoothedLocation.longitude,
      this.routeCoordinates,
      50 // 50 meter threshold
    );

    this.navigationState.isOffRoute = offRoute;

    // Get distance to route
    const { distanceToRoute } = findClosestPointOnRoute(
      smoothedLocation.latitude,
      smoothedLocation.longitude,
      this.routeCoordinates
    );
    this.navigationState.distanceToRoute = distanceToRoute;

    // Handle rerouting if off route for too long
    if (offRoute && Date.now() - this.lastRerouteTime > 30000) { // Reroute max once per 30 seconds
      await this.handleRerouting(smoothedLocation);
    }

    // Calculate ETA
    const etaData = calculateETA(
      progressData.remainingDistance,
      this.navigationState.currentSpeed,
      1.4 // Walking speed fallback
    );
    this.navigationState.estimatedTimeOfArrival = etaData.formattedETA;

    // Check for step completion and upcoming turns using Haversine distance
    await this.checkStepProgressAdvanced(smoothedLocation);

    this.notifyListeners();
  }

  private async handleRerouting(currentLocation: { latitude: number; longitude: number }) {
    this.lastRerouteTime = Date.now();
    
    try {
      // Request new route from current position to destination
      const currentRoute = this.currentRoute;
      if (!currentRoute) return;

      await this.sendNotification(
        'Recalculating Route',
        'You seem to be off route. Calculating a new path...'
      );

      // In a real app, you would call the rerouting API here
      // For now, we'll just notify the user
      console.log('Rerouting from:', currentLocation, 'to:', currentRoute.summary.destinationName);
      
    } catch (error) {
      console.error('Rerouting failed:', error);
      await this.sendNotification(
        'Rerouting Failed',
        'Unable to calculate new route. Please return to the original path.'
      );
    }
  }

  private async checkStepProgressAdvanced(currentPos: { latitude: number; longitude: number }) {
    if (!this.currentRoute) return;

    const currentStepIndex = this.navigationState.currentStepIndex;
    const currentStep = this.currentRoute.steps[currentStepIndex];

    if (!currentStep) {
      // Navigation complete
      await this.completeNavigation();
      return;
    }

    // Use Haversine formula for accurate distance calculation
    const distanceToTrigger = haversineDistance(
      currentPos.latitude,
      currentPos.longitude,
      currentStep.triggerAt.lat,
      currentStep.triggerAt.lng
    );
    
    if (distanceToTrigger <= PROXIMITY_THRESHOLD && !this.completedSteps.has(currentStepIndex)) {
      // Mark step as completed and move to next
      this.completedSteps.add(currentStepIndex);
      this.navigationState.currentStepIndex++;

      // Send turn notification with enhanced messaging
      if (currentStep.side !== 'B') {
        const turnDirection = currentStep.side === 'L' ? 'left' : 'right';
        const bearing = calculateBearing(
          currentPos.latitude,
          currentPos.longitude,
          currentStep.end.lat,
          currentStep.end.lng
        );
        
        await this.sendNotification(
          `Turn ${turnDirection}`,
          `${this.stripHtmlTags(currentStep.instructionHtml)} (Bearing: ${Math.round(bearing)}°)`
        );
      }
    }

    // Check for upcoming turns with accurate distance calculation
    const nextStep = this.currentRoute.steps[currentStepIndex + 1];
    if (nextStep) {
      const distanceToNext = haversineDistance(
        currentPos.latitude,
        currentPos.longitude,
        nextStep.triggerAt.lat,
        nextStep.triggerAt.lng
      );
      
      this.navigationState.distanceToNextTurn = distanceToNext;
      this.navigationState.nextTurn = nextStep;

      // Enhanced turn warnings with bearing information
      if (distanceToNext <= TURN_WARNING_DISTANCE && 
          distanceToNext > PROXIMITY_THRESHOLD && 
          nextStep.side !== 'B') {
        const turnDirection = nextStep.side === 'L' ? 'left' : 'right';
        const bearing = calculateBearing(
          currentPos.latitude,
          currentPos.longitude,
          nextStep.triggerAt.lat,
          nextStep.triggerAt.lng
        );
        
        await this.sendNotification(
          `Prepare to turn ${turnDirection}`,
          `In ${Math.round(distanceToNext)}m, ${this.stripHtmlTags(nextStep.instructionHtml)}`
        );
      }
    } else {
      this.navigationState.nextTurn = null;
      this.navigationState.distanceToNextTurn = 0;
    }
  }

  private updateRouteProgress(currentPos: { lat: number; lng: number }) {
    if (!this.currentRoute) return;

    const totalDistance = this.currentRoute.summary.distanceMeters;
    let distanceTraveled = 0;

    // Calculate distance traveled based on completed steps
    for (let i = 0; i < this.navigationState.currentStepIndex; i++) {
      if (this.completedSteps.has(i)) {
        distanceTraveled += this.currentRoute.steps[i].distanceMeters;
      }
    }

    // Add partial distance to current step
    const currentStep = this.currentRoute.steps[this.navigationState.currentStepIndex];
    if (currentStep) {
      const distanceToCurrentStepStart = this.calculateDistance(
        currentPos,
        currentStep.triggerAt
      );
      const stepDistance = this.calculateDistance(
        currentStep.triggerAt,
        currentStep.end
      );
      const stepProgress = Math.max(0, stepDistance - distanceToCurrentStepStart);
      distanceTraveled += stepProgress;
    }

    this.navigationState.routeProgress = Math.min(
      distanceTraveled / totalDistance,
      1
    );
  }

  private async checkStepProgress(currentPos: { lat: number; lng: number }) {
    if (!this.currentRoute) return;

    const currentStepIndex = this.navigationState.currentStepIndex;
    const currentStep = this.currentRoute.steps[currentStepIndex];

    if (!currentStep) {
      // Navigation complete
      await this.completeNavigation();
      return;
    }

    // Check if we've reached the current step's trigger point
    const distanceToTrigger = this.calculateDistance(currentPos, currentStep.triggerAt);
    
    if (distanceToTrigger <= PROXIMITY_THRESHOLD && !this.completedSteps.has(currentStepIndex)) {
      // Mark step as completed and move to next
      this.completedSteps.add(currentStepIndex);
      this.navigationState.currentStepIndex++;

      // Send turn notification
      if (currentStep.side !== 'B') {
        const turnDirection = currentStep.side === 'L' ? 'left' : 'right';
        await this.sendNotification(
          `Turn ${turnDirection}`,
          this.stripHtmlTags(currentStep.instructionHtml)
        );
      }
    }

    // Check for upcoming turns
    const nextStep = this.currentRoute.steps[currentStepIndex + 1];
    if (nextStep) {
      const distanceToNext = this.calculateDistance(currentPos, nextStep.triggerAt);
      this.navigationState.distanceToNextTurn = distanceToNext;
      this.navigationState.nextTurn = nextStep;

      // Warn about upcoming turns
      if (distanceToNext <= TURN_WARNING_DISTANCE && 
          distanceToNext > PROXIMITY_THRESHOLD && 
          nextStep.side !== 'B') {
        const turnDirection = nextStep.side === 'L' ? 'left' : 'right';
        await this.sendNotification(
          `Prepare to turn ${turnDirection}`,
          `In ${Math.round(distanceToNext)}m, ${this.stripHtmlTags(nextStep.instructionHtml)}`
        );
      }
    } else {
      this.navigationState.nextTurn = null;
      this.navigationState.distanceToNextTurn = 0;
    }
  }

  private async completeNavigation() {
    if (!this.currentRoute) return;

    this.navigationState.isNavigating = false;
    this.navigationState.routeProgress = 1;

    await this.sendNotification(
      'Destination Reached',
      `You have arrived at ${this.currentRoute.summary.destinationName}`
    );

    this.stopNavigation();
  }

  public stopNavigation() {
    // Stop both location tracking methods
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.geolocationWatchId !== null) {
      Geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }

    this.navigationState.isNavigating = false;
    this.navigationState.isOffRoute = false;
    this.navigationState.distanceToRoute = 0;
    this.completedSteps.clear();
    this.locationHistory = [];
    this.notifyListeners();
  }

  private calculateDistance(pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private async sendNotification(title: string, body: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  public getCurrentRoute(): RouteData | null {
    return this.currentRoute;
  }

  public getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  public async loadSavedRoute(): Promise<RouteData | null> {
    try {
      const savedRoute = await AsyncStorage.getItem('currentRoute');
      if (savedRoute) {
        this.currentRoute = JSON.parse(savedRoute);
        return this.currentRoute;
      }
    } catch (error) {
      console.error('Error loading saved route:', error);
    }
    return null;
  }
}

export default new NavigationService();