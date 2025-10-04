import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRoute } from '@/services/navigation';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [transportMode, setTransportMode] = useState<'walking' | 'transit'>('walking');

  // Request location permissions on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }
      getCurrentLocation();
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const startNavigation = async () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    setLoading(true);
    try {
      const fromLocation = origin.trim() || 'Current Location';
      const route = await getRoute(fromLocation, destination, transportMode);
      setRouteData(route);
      setIsNavigationActive(true);
      Alert.alert('Navigation Started!', `${transportMode.toUpperCase()} Route: ${route.summary.originName} → ${route.summary.destinationName}`);
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const stopNavigation = () => {
    setIsNavigationActive(false);
    setRouteData(null);
    Alert.alert('Navigation Stopped', 'You can start a new route anytime');
  };

  // Simple polyline decoder (basic implementation)
  const decodePolyline = (encoded: string) => {
    const coordinates: any[] = [];
    let index = 0, lat = 0, lng = 0;
    
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      coordinates.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5,
      });
    }
    return coordinates;
  };

  // Decode polyline to coordinates for map display
  const getPolylineCoordinates = () => {
    if (!routeData?.polyline?.points) return [];
    
    try {
      return decodePolyline(routeData.polyline.points);
    } catch (error) {
      // Fallback to start/end points if decode fails
      return [
        { latitude: routeData.summary.startLocation.latitude, longitude: routeData.summary.startLocation.longitude },
        { latitude: routeData.summary.endLocation.latitude, longitude: routeData.summary.endLocation.longitude }
      ];
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            style={styles.map}
            initialRegion={currentLocation}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Current location marker */}
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="You are here"
              pinColor="blue"
            />
            
            {/* Route visualization */}
            {routeData && (
              <>
                <Marker
                  coordinate={{ 
                    latitude: routeData.summary.startLocation.latitude, 
                    longitude: routeData.summary.startLocation.longitude 
                  }}
                  title={routeData.summary.originName}
                  description="Start point"
                  pinColor="green"
                />
                <Marker
                  coordinate={{ 
                    latitude: routeData.summary.endLocation.latitude, 
                    longitude: routeData.summary.endLocation.longitude 
                  }}
                  title={routeData.summary.destinationName}
                  description="Destination"
                  pinColor="red"
                />
                <Polyline
                  coordinates={getPolylineCoordinates()}
                  strokeColor="#007AFF"
                  strokeWidth={4}
                />
              </>
            )}
          </MapView>
        ) : (
          <ThemedView style={styles.loadingMap}>
            <ThemedText>📍 Loading map...</ThemedText>
          </ThemedView>
        )}
      </View>

      {/* Navigation Controls */}
      <ThemedView style={styles.controlsContainer}>
        <ThemedText type="title" style={styles.title}>🧭 NavSense</ThemedText>
        
        {!isNavigationActive ? (
          <ThemedView style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="From (optional - uses current location)"
              value={origin}
              onChangeText={setOrigin}
            />
            <TextInput
              style={styles.input}
              placeholder="To (destination)"
              value={destination}
              onChangeText={setDestination}
            />
            
            {/* Transportation Mode Selection */}
            <ThemedView style={styles.modeSection}>
              <ThemedText style={styles.modeTitle}>🚶 Transportation Mode:</ThemedText>
              <ThemedView style={styles.modeButtons}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    transportMode === 'walking' && styles.modeButtonActive
                  ]}
                  onPress={() => setTransportMode('walking')}
                >
                  <ThemedText style={[
                    styles.modeButtonText,
                    transportMode === 'walking' && styles.modeButtonTextActive
                  ]}>
                    🚶 Walking
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    transportMode === 'transit' && styles.modeButtonActive
                  ]}
                  onPress={() => setTransportMode('transit')}
                >
                  <ThemedText style={[
                    styles.modeButtonText,
                    transportMode === 'transit' && styles.modeButtonTextActive
                  ]}>
                    🚌 Transit
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            
            <TouchableOpacity 
              style={[styles.button, styles.startButton]} 
              onPress={startNavigation}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? "⏳ Loading..." : "🚀 Start Navigation"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.activeNavigation}>
            <TouchableOpacity 
              style={[styles.button, styles.stopButton]} 
              onPress={stopNavigation}
            >
              <ThemedText style={styles.buttonText}>⏹️ Stop Navigation</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {routeData && (
          <ThemedView style={styles.routeInfo}>
            <ThemedText type="subtitle">📍 Active Route</ThemedText>
            <ThemedText style={styles.routeDetail}>
              {routeData.summary.originName} → {routeData.summary.destinationName}
            </ThemedText>
            <ThemedText style={styles.routeDetail}>
              {(routeData.summary.distanceMeters / 1000).toFixed(1)} km • {Math.round(routeData.summary.durationSeconds / 60)} min
            </ThemedText>
            
            {/* Haptic Steps Preview */}
            <ThemedView style={styles.hapticPreview}>
              <ThemedText style={styles.hapticTitle}>� Upcoming Haptic Commands:</ThemedText>
              {routeData.steps.slice(0, 3).map((step: any, index: number) => (
                <ThemedView key={index} style={styles.hapticStep}>
                  <ThemedText style={styles.hapticCommand}>[{step.side}]</ThemedText>
                  <ThemedText style={styles.hapticText}>
                    {step.instructionHtml.replace(/<[^>]*>/g, '').slice(0, 50)}...
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.6, // 60% of screen height
    width: '100%',
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeNavigation: {
    marginBottom: 20,
  },
  routeInfo: {
    padding: 15,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 10,
    marginBottom: 20,
  },
  routeDetail: {
    marginVertical: 2,
    fontSize: 16,
  },
  hapticPreview: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  hapticTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  hapticStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    paddingVertical: 3,
  },
  hapticCommand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.2)',
    padding: 6,
    borderRadius: 4,
    marginRight: 10,
    minWidth: 35,
    textAlign: 'center',
  },
  hapticText: {
    fontSize: 12,
    flex: 1,
    color: '#666',
  },
  modeSection: {
    marginBottom: 20,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#007AFF',
  },
});
