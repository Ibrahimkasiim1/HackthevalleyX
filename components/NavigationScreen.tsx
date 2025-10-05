import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decode } from '@mapbox/polyline';
import NavigationService, { NavigationState, RouteData } from '@/services/NavigationService';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { config } from '@/config/environment';
import { handleNavigationError } from '@/components/ErrorBoundary';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NavigationScreenProps {
  // Navigation screen props - currently no props needed
}

export default function NavigationScreen(_props: NavigationScreenProps) {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState>(
    NavigationService.getNavigationState()
  );
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const loadSavedRoute = useCallback(async () => {
    try {
      const savedRoute = await NavigationService.loadSavedRoute();
      if (savedRoute) {
        setCurrentRoute(savedRoute);
        decodePolyline(savedRoute.polyline.points);
        setStartLocation(savedRoute.summary.originName);
        setDestination(savedRoute.summary.destinationName);
      }
    } catch (error) {
      console.error('Error loading saved route:', error);
    }
  }, []);

  useEffect(() => {
    // Subscribe to navigation updates
    const unsubscribe = NavigationService.addListener((state) => {
      setNavigationState(state);
      
      // Auto-follow user during navigation with smooth animation
      if (state.isNavigating && state.currentLocation && mapRef.current) {
        const region = {
          latitude: state.smoothedLocation?.latitude || state.currentLocation.coords.latitude,
          longitude: state.smoothedLocation?.longitude || state.currentLocation.coords.longitude,
          latitudeDelta: 0.005, // Closer zoom for navigation
          longitudeDelta: 0.005,
        };
        
        // Use animateToRegion for smooth map following
        mapRef.current.animateToRegion(region, 1000);
      }
    });

    // Load any saved route
    loadSavedRoute();

    return unsubscribe;
  }, [loadSavedRoute]);

  const decodePolyline = (encodedPolyline: string) => {
    try {
      const coordinates = decode(encodedPolyline).map(([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoordinates(coordinates);
      
      // Fit map to route
      if (coordinates.length > 0 && mapRef.current) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error decoding polyline:', error);
    }
  };

  const handleBuildRoute = async () => {
    if (!startLocation.trim() || !destination.trim()) {
      Alert.alert('Error', 'Please enter both start location and destination');
      return;
    }

    setIsLoading(true);
    try {
      const route = await NavigationService.buildRoute(startLocation, destination, 'walking');
      setCurrentRoute(route);
      decodePolyline(route.polyline.points);
      
      Alert.alert(
        'Route Built Successfully',
        `Distance: ${(route.summary.distanceMeters / 1000).toFixed(1)}km\nDuration: ${Math.round(route.summary.durationSeconds / 60)}min`,
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      const errorMessage = handleNavigationError(error);
      Alert.alert('Route Error', errorMessage);
      console.error('Route building error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNavigation = async () => {
    if (!currentRoute) {
      Alert.alert('Error', 'Please build a route first');
      return;
    }

    try {
      const success = await NavigationService.startNavigation();
      if (!success) {
        Alert.alert('Navigation Error', 'Failed to start navigation. Please check location permissions.');
      }
    } catch (error) {
      const errorMessage = handleNavigationError(error);
      Alert.alert('Navigation Error', errorMessage);
      console.error('Navigation start error:', error);
    }
  };

  const handleStopNavigation = () => {
    NavigationService.stopNavigation();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const renderNavigationInfo = () => {
    if (!navigationState.isNavigating) return null;

    return (
      <View style={[styles.navigationInfo, { backgroundColor }]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
            <View
              style={[
                styles.progressFill,
                { 
                  backgroundColor: navigationState.isOffRoute ? '#ff6b6b' : tintColor,
                  width: `${navigationState.routeProgress * 100}%`
                }
              ]}
            />
          </View>
          <View style={styles.progressRow}>
            <ThemedText style={styles.progressText}>
              {Math.round(navigationState.routeProgress * 100)}% Complete
            </ThemedText>
            {navigationState.isOffRoute && (
              <ThemedText style={[styles.offRouteText, { color: '#ff6b6b' }]}>
                OFF ROUTE
              </ThemedText>
            )}
          </View>
        </View>

        {/* Speed and ETA Information */}
        <View style={styles.speedEtaContainer}>
          <View style={styles.speedContainer}>
            <ThemedText style={styles.speedLabel}>Speed</ThemedText>
            <ThemedText style={styles.speedValue}>
              {Math.round(navigationState.currentSpeed * 3.6)} km/h
            </ThemedText>
          </View>
          <View style={styles.etaContainer}>
            <ThemedText style={styles.etaLabel}>ETA</ThemedText>
            <ThemedText style={styles.etaValue}>
              {navigationState.estimatedTimeOfArrival}
            </ThemedText>
          </View>
          <View style={styles.distanceContainer}>
            <ThemedText style={styles.distanceLabel}>Remaining</ThemedText>
            <ThemedText style={styles.distanceValue}>
              {formatDistance(navigationState.totalDistanceRemaining)}
            </ThemedText>
          </View>
        </View>

        {navigationState.nextTurn && (
          <View style={styles.nextTurnContainer}>
            <View style={[styles.turnIcon, { 
              backgroundColor: navigationState.nextTurn.side === 'L' ? '#FF6B6B' : '#4ECDC4' 
            }]}>
              <IconSymbol
                name="chevron.right"
                size={24}
                color="white"
                style={{
                  transform: [
                    { rotate: navigationState.nextTurn.side === 'L' ? '-90deg' : '90deg' }
                  ]
                }}
              />
            </View>
            <View style={styles.turnInfo}>
              <ThemedText style={styles.turnDistance}>
                In {formatDistance(navigationState.distanceToNextTurn)}
              </ThemedText>
              <ThemedText style={styles.turnInstruction}>
                {navigationState.nextTurn.instructionHtml.replace(/<[^>]*>/g, '')}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Route accuracy information */}
        <View style={styles.accuracyContainer}>
          <ThemedText style={styles.accuracyText}>
            GPS Accuracy: ±{Math.round(navigationState.currentLocation?.coords.accuracy || 0)}m
            {navigationState.distanceToRoute > 0 && (
              <ThemedText> • Distance to route: {Math.round(navigationState.distanceToRoute)}m</ThemedText>
            )}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderRouteInfo = () => {
    if (!currentRoute) return null;

    return (
      <View style={[styles.routeInfo, { backgroundColor }]}>
        <View style={styles.routeInfoRow}>
          <IconSymbol name="house.fill" size={16} color={tintColor} />
          <ThemedText style={styles.routeInfoText} numberOfLines={1}>
            {currentRoute.summary.originName}
          </ThemedText>
        </View>
        <View style={styles.routeInfoRow}>
          <IconSymbol name="paperplane.fill" size={16} color={tintColor} />
          <ThemedText style={styles.routeInfoText} numberOfLines={1}>
            {currentRoute.summary.destinationName}
          </ThemedText>
        </View>
        <View style={styles.routeStats}>
          <ThemedText style={styles.routeStatText}>
            {formatDistance(currentRoute.summary.distanceMeters)}
          </ThemedText>
          <ThemedText style={styles.routeStatText}>
            {formatTime(currentRoute.summary.durationSeconds)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: tintColor }]}
          placeholder="Start location"
          placeholderTextColor="#888"
          value={startLocation}
          onChangeText={setStartLocation}
          editable={!navigationState.isNavigating}
        />
        <TextInput
          style={[styles.input, { color: textColor, borderColor: tintColor }]}
          placeholder="Destination"
          placeholderTextColor="#888"
          value={destination}
          onChangeText={setDestination}
          editable={!navigationState.isNavigating}
        />
        
        <View style={styles.buttonContainer}>
          {!navigationState.isNavigating ? (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor }]}
                onPress={handleBuildRoute}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Build Route</Text>
                )}
              </TouchableOpacity>
              
              {currentRoute && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#4CAF50' }]}
                  onPress={handleStartNavigation}
                >
                  <Text style={styles.buttonText}>Start Navigation</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f44336' }]}
              onPress={handleStopNavigation}
            >
              <Text style={styles.buttonText}>Stop Navigation</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={navigationState.isNavigating}
          initialRegion={config.DEFAULT_REGION}
        >
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={tintColor}
              strokeWidth={4}
            />
          )}
          
          {currentRoute && routeCoordinates.length > 0 && (
            <>
              {routeCoordinates[0] && (
                <Marker
                  coordinate={{
                    latitude: routeCoordinates[0].latitude,
                    longitude: routeCoordinates[0].longitude,
                  }}
                  title="Start"
                  description={currentRoute.summary.originName}
                  pinColor="green"
                />
              )}
              {routeCoordinates[routeCoordinates.length - 1] && (
                <Marker
                  coordinate={{
                    latitude: routeCoordinates[routeCoordinates.length - 1].latitude,
                    longitude: routeCoordinates[routeCoordinates.length - 1].longitude,
                  }}
                  title="Destination"
                  description={currentRoute.summary.destinationName}
                  pinColor="red"
                />
              )}
            </>
          )}
        </MapView>
        
        {renderNavigationInfo()}
        {renderRouteInfo()}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    padding: 16,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  navigationInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  nextTurnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  turnInstruction: {
    fontSize: 12,
    opacity: 0.8,
  },
  routeInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  routeStatText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offRouteText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedEtaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  speedContainer: {
    alignItems: 'center',
    flex: 1,
  },
  etaContainer: {
    alignItems: 'center',
    flex: 1,
  },
  distanceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  speedLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  speedValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  etaLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  distanceLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  accuracyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  accuracyText: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: 'center',
  },
});