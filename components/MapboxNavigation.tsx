// components/MapboxNavigation.tsx
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Coordinate, NavigationError, RouteProgress } from '../types/navigation';

interface MapboxNavigationComponentProps {
  startCoordinate: Coordinate;
  destinationCoordinate: Coordinate;
  onNavigationCancel?: () => void;
  onNavigationComplete?: () => void;
}

const MapboxNavigationComponent: React.FC<MapboxNavigationComponentProps> = ({
  startCoordinate,
  destinationCoordinate,
  onNavigationCancel,
  onNavigationComplete
}) => {
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const coordinates: Coordinate[] = [startCoordinate, destinationCoordinate];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async (): Promise<void> => {
    try {
      // For iOS, location permissions are handled by the Mapbox SDK
      // You might want to use expo-location for more control
      setLocationPermissionGranted(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to provide turn-by-turn navigation.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRouteProgressChange = (event: any): void => {
    const progress: RouteProgress = event.nativeEvent;
    console.log(
      `Traveled: ${progress.distanceTraveled}m, ` +
      `Remaining: ${progress.durationRemaining}s, ` +
      `Progress: ${(progress.fractionTraveled * 100).toFixed(1)}%`
    );
  };

  const handleCancelNavigation = (): void => {
    console.log('Navigation was cancelled by the user');
    onNavigationCancel?.();
  };

  const handleArrive = (): void => {
    console.log('You have arrived at your destination!');
    onNavigationComplete?.();
  };

  const handleError = (event: any): void => {
    const error: NavigationError = event.nativeEvent;
    console.error('Navigation error:', error.message);
    Alert.alert('Navigation Error', error.message);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading navigation...</Text>
      </View>
    );
  }

  if (!locationPermissionGranted) {
    return (
      <View style={styles.centered}>
        <Text>Location permission is required for navigation.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationView}>
        <Text style={styles.mapPlaceholder}>
          🗺️ Navigation Map
        </Text>
        <Text style={styles.coordinatesText}>
          Start: {startCoordinate.latitude.toFixed(4)}, {startCoordinate.longitude.toFixed(4)}
        </Text>
        <Text style={styles.coordinatesText}>
          Destination: {destinationCoordinate.latitude.toFixed(4)}, {destinationCoordinate.longitude.toFixed(4)}
        </Text>
        <View style={styles.markerContainer}>
          <View style={styles.startMarker} />
          <Text style={styles.markerLabel}>Start</Text>
        </View>
        <View style={styles.markerContainer}>
          <View style={styles.destinationMarker} />
          <Text style={styles.markerLabel}>Destination</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  destinationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapPlaceholder: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  coordinatesText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  markerLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default MapboxNavigationComponent;