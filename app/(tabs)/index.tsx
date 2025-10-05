import { AudioClassificationDisplay } from '@/components/AudioClassificationDisplay';
import { SecurePlacesAutocomplete } from '@/components/SecurePlacesAutocomplete';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AudioClassificationResult, audioClassificationService } from '@/services/AudioClassificationService';
import { getRoute } from '@/services/navigation';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hapticNotification, setHapticNotification] = useState<{visible: boolean, message: string, command: string}>({visible: false, message: '', command: ''});
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number>(0);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
  
  // Audio classification state
  const [audioClassificationResult, setAudioClassificationResult] = useState<AudioClassificationResult | null>(null);
  const [isAudioClassificationActive, setIsAudioClassificationActive] = useState(false);
  const [audioClassificationError, setAudioClassificationError] = useState<string | null>(null);

  // Request location permissions on component mount
  useEffect(() => {
    requestLocationPermission();
    initializeAudioClassification();
  }, []);

  // Initialize audio classification
  const initializeAudioClassification = async () => {
    try {
      console.log('Initializing audio classification...');
      const modelLoaded = await audioClassificationService.loadModel();
      if (modelLoaded) {
        console.log('Audio classification model loaded successfully');
        await startAudioClassification();
      } else {
        setAudioClassificationError('Failed to load audio classification model');
      }
    } catch (error) {
      console.error('Failed to initialize audio classification:', error);
      setAudioClassificationError('Failed to initialize audio classification');
    }
  };

  // Start audio classification
  const startAudioClassification = async () => {
    try {
      const started = await audioClassificationService.startClassification((result) => {
        setAudioClassificationResult(result);
        console.log('Audio classification result:', result);
      });
      
      if (started) {
        setIsAudioClassificationActive(true);
        setAudioClassificationError(null);
        console.log('Audio classification started successfully');
      } else {
        setAudioClassificationError('Failed to start audio classification');
      }
    } catch (error) {
      console.error('Failed to start audio classification:', error);
      setAudioClassificationError('Failed to start audio classification');
    }
  };

  // Stop audio classification
  const stopAudioClassification = async () => {
    try {
      await audioClassificationService.stopClassification();
      setIsAudioClassificationActive(false);
      setAudioClassificationResult(null);
      console.log('Audio classification stopped');
    } catch (error) {
      console.error('Failed to stop audio classification:', error);
    }
  };

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

  // Start real-time location tracking
  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          
          setCurrentLocation(newLocation);
          console.log('📍 Location updated:', location.coords.latitude, location.coords.longitude);
          
          // Check if approaching a turn during active navigation
          if (isNavigationActive) {
            checkTurnProximity(location.coords.latitude, location.coords.longitude);
          }
        }
      );
      
      setLocationSubscription(subscription);
      console.log('🛰️ Real-time GPS tracking started');
    } catch (error) {
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      console.log('🛑 GPS tracking stopped');
    }
  };

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Check if user is approaching a turn and trigger haptic notification
  const checkTurnProximity = (userLat: number, userLon: number) => {
    if (!routeData || !routeData.steps || currentStepIndex >= routeData.steps.length) return;
    
    const currentStep = routeData.steps[currentStepIndex];
    if (!currentStep) return;

    const distance = calculateDistance(
      userLat, userLon,
      currentStep.triggerAt.lat, currentStep.triggerAt.lng
    );
    
    setDistanceToNextTurn(Math.round(distance));

    // Trigger haptic notification when within 30 meters of turn
    if (distance < 30 && !hapticNotification.visible) {
      const instruction = currentStep.instructionHtml.replace(/<[^>]*>/g, '');
      showHapticNotification(currentStep.side, instruction);
      
      // Move to next step after triggering
      setTimeout(() => {
        if (currentStepIndex < routeData.steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }, 5000);
    }
  };

  // Show haptic notification popup
  const showHapticNotification = (command: string, instruction: string) => {
    setHapticNotification({
      visible: true,
      message: instruction,
      command: command
    });
    
    console.log(`🎮 HAPTIC TRIGGER: [${command}] ${instruction}`);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setHapticNotification({visible: false, message: '', command: ''});
    }, 4000);
  };

  const startNavigation = async () => {
    if (!origin.trim()) {
      Alert.alert('Error', 'Please enter a starting location');
      return;
    }
    
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    setLoading(true);
    try {
      // Use the specified origin location
      const fromLocation = origin.trim();
      
      // Pass current location for better place resolution
      const userLocationForBias = currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      } : undefined;
      
      const route = await getRoute(fromLocation, destination, transportMode, userLocationForBias);
      setRouteData(route);
      setIsNavigationActive(true);
      setCurrentStepIndex(0);
      setDistanceToNextTurn(0);
      
      // Start real-time GPS tracking
      await startLocationTracking();
      
      // Hide input panel and show floating button
      setIsInputPanelVisible(false);
      
      Alert.alert(
        'Navigation Started!', 
        `${transportMode.toUpperCase()} Route: ${route.summary.originName} → ${route.summary.destinationName}\n\n🛰️ Real-time GPS tracking is now active!`
      );
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const stopNavigation = () => {
    setIsNavigationActive(false);
    setRouteData(null);
    setCurrentStepIndex(0);
    setDistanceToNextTurn(0);
    setHapticNotification({visible: false, message: '', command: ''});
    
    // Stop real-time GPS tracking
    stopLocationTracking();
    
    // Show input panel again
    setIsInputPanelVisible(true);
    
    Alert.alert('Navigation Stopped', '🛑 GPS tracking stopped. You can start a new route anytime.');
  };

  const openVoiceAI = async () => {
    try {
      const url = 'https://elevenlabs.io/app/talk-to?agent_id=agent_9901k6p9fcrffe2vtyeayzykb9a5'; // Replace with your actual Voice AI website URL
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the Voice AI website');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Voice AI website');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      stopAudioClassification();
    };
  }, []);

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
    <View style={styles.container}>
      {/* Haptic Popup Notification */}
      {hapticNotification.visible && (
        <View style={styles.hapticPopupOverlay}>
          <View style={styles.hapticPopup}>
            <View style={styles.hapticCommandContainer}>
              <ThemedText style={styles.hapticPopupCommand}>
                {hapticNotification.command === 'L' && 'TURN LEFT'}
                {hapticNotification.command === 'R' && 'TURN RIGHT'}
                {hapticNotification.command === 'B' && 'GO STRAIGHT'}
              </ThemedText>
            </View>
            <ThemedText style={styles.hapticPopupMessage}>
              {hapticNotification.message}
            </ThemedText>
            <View style={styles.hapticPopupIndicator}>
              <ThemedText style={styles.hapticIndicatorText}>
                HAPTIC COMMAND TRIGGERED
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Audio Classification Display */}
      <AudioClassificationDisplay
        result={audioClassificationResult}
        isActive={isAudioClassificationActive}
        error={audioClassificationError}
      />
      
      {/* Fullscreen Map View */}
      <View style={styles.fullscreenMap}>
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
            {routeData && routeData.summary && (
              <>
                {routeData.summary.startLocation && (
                  <Marker
                    coordinate={{ 
                      latitude: routeData.summary.startLocation.latitude, 
                      longitude: routeData.summary.startLocation.longitude 
                    }}
                    title={routeData.summary.originName || "Start"}
                    description="Start point"
                    pinColor="green"
                  />
                )}
                {routeData.summary.endLocation && (
                  <Marker
                    coordinate={{ 
                      latitude: routeData.summary.endLocation.latitude, 
                      longitude: routeData.summary.endLocation.longitude 
                    }}
                    title={routeData.summary.destinationName || "Destination"}
                    description="Destination"
                    pinColor="red"
                  />
                )}
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
            <ThemedText>Loading map...</ThemedText>
          </ThemedView>
        )}
      </View>

      {/* Floating Button */}
      {!isInputPanelVisible && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setIsInputPanelVisible(true)}
        >
          <ThemedText style={styles.floatingButtonText}>📍</ThemedText>
        </TouchableOpacity>
      )}

      {/* Simple Bottom Panel */}
      {isInputPanelVisible && (
        <View style={styles.bottomPanel}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsInputPanelVisible(false)}
          >
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
          
          <ScrollView 
            style={styles.panelScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.panelScrollContent}
          >
        {!isNavigationActive ? (
          <ThemedView style={styles.inputSection}>
            {/* Origin Input */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>From Location *</ThemedText>
              <SecurePlacesAutocomplete
                placeholder="Enter starting location..."
                value={origin}
                onChangeText={setOrigin}
                onPlaceSelected={(place) => {
                  setOrigin(place.description);
                }}
                userLocation={currentLocation ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                } : undefined}
              />
            </ThemedView>

            {/* Destination Input */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>To Destination *</ThemedText>
              <SecurePlacesAutocomplete
                placeholder="Enter destination..."
                value={destination}
                onChangeText={setDestination}
                onPlaceSelected={(place) => {
                  setDestination(place.description);
                }}
                userLocation={currentLocation ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                } : undefined}
              />
            </ThemedView>
            
            {/* Transportation Mode Selection */}
            <ThemedView style={styles.modeSection}>
              <ThemedText style={styles.modeTitle}>Transportation Mode</ThemedText>
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
                    Walking
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
                    Transit
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            
            <TouchableOpacity 
              style={[styles.button, styles.startButton]} 
              onPress={startNavigation}
              disabled={loading || !origin.trim() || !destination.trim()}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? "Loading..." : "Start Navigation"}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.voiceAIButton]} 
              onPress={openVoiceAI}
            >
              <ThemedText style={styles.buttonText}>
                Voice AI Agent
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.activeNavigation}>
            <TouchableOpacity 
              style={[styles.button, styles.stopButton]} 
              onPress={stopNavigation}
            >
              <ThemedText style={styles.buttonText}>Stop Navigation</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Navigation Status Display */}
        {isNavigationActive && routeData && (
          <ThemedView style={styles.navigationStatus}>
            <ThemedText style={styles.statusTitle}>Navigation Status</ThemedText>
            
            {/* Distance to Next Turn */}
            <ThemedView style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Distance to Next Turn:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {distanceToNextTurn > 0 ? `${distanceToNextTurn}m` : 'Calculating...'}
              </ThemedText>
            </ThemedView>
            
            {/* Current Step Progress */}
            <ThemedView style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Navigation Step:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {currentStepIndex + 1} of {routeData.steps ? routeData.steps.length : 0}
              </ThemedText>
            </ThemedView>
            
            {/* Next Turn Command */}
            {routeData.steps && routeData.steps[currentStepIndex] && (
              <ThemedView style={styles.nextTurnContainer}>
                <ThemedText style={styles.nextTurnLabel}>Next Haptic Command:</ThemedText>
                <ThemedView style={styles.nextTurnCommand}>
                  <ThemedText style={styles.nextTurnText}>
                    [{routeData.steps[currentStepIndex].side || 'B'}] {routeData.steps[currentStepIndex].instructionHtml ? routeData.steps[currentStepIndex].instructionHtml.replace(/<[^>]*>/g, '').slice(0, 60) : 'Continue straight'}...
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            )}
            
            {/* GPS Tracking Indicator */}
            <ThemedView style={styles.gpsIndicator}>
              <ThemedText style={styles.gpsIndicatorText}>
                Real-time GPS Tracking Active
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {routeData && routeData.summary && (
          <ThemedView style={styles.routeInfo}>
            <ThemedText type="subtitle" style={styles.routeTitle}>Active Route</ThemedText>
            <ThemedText style={styles.routeDetail}>
              {routeData.summary.originName || "Start"} → {routeData.summary.destinationName || "Destination"}
            </ThemedText>
            <ThemedText style={styles.routeDetail}>
              {routeData.summary.distanceMeters ? (routeData.summary.distanceMeters / 1000).toFixed(1) : "0"} km • {routeData.summary.durationSeconds ? Math.round(routeData.summary.durationSeconds / 60) : "0"} min
            </ThemedText>
            
            {/* Haptic Steps Preview */}
            <ThemedView style={styles.hapticPreview}>
              <ThemedText style={styles.hapticTitle}>�Upcoming Haptic Commands:</ThemedText>
              {routeData.steps && routeData.steps.length > 0 && routeData.steps.slice(0, 3).map((step: any, index: number) => (
                <ThemedView key={index} style={styles.hapticStep}>
                  <ThemedText style={styles.hapticCommand}>[{step.side || 'B'}]</ThemedText>
                  <ThemedText style={styles.hapticText}>
                    {step.instructionHtml ? step.instructionHtml.replace(/<[^>]*>/g, '').slice(0, 50) : 'Continue straight'}...
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fullscreenMap: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.4, // Better balance for autocomplete
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  inputSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#007AFF',
    marginTop: 8,
  },
  voiceAIButton: {
    backgroundColor: '#34C759',
    marginTop: 12,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeNavigation: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfo: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  routeTitle: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeDetail: {
    marginVertical: 4,
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
    fontWeight: '500',
  },
  hapticPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  hapticTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007AFF',
  },
  hapticStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,122,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  hapticCommand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.2)',
    padding: 6,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 35,
    textAlign: 'center',
  },
  hapticText: {
    fontSize: 13,
    flex: 1,
    color: '#2c3e50',
    lineHeight: 18,
  },
  modeSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
    paddingLeft: 4,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  modeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
    shadowOpacity: 0.15,
    elevation: 3,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hapticPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  hapticPopup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  hapticCommandContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 35,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hapticPopupCommand: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  hapticPopupMessage: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  hapticPopupIndicator: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  hapticIndicatorText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  navigationStatus: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00AA00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00AA00',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nextTurnContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  nextTurnLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  nextTurnCommand: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 10,
    padding: 12,
  },
  nextTurnText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
    lineHeight: 18,
  },
  gpsIndicator: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  gpsIndicatorText: {
    fontSize: 12,
    color: '#00AA00',
    fontWeight: 'bold',
  },
  apiNotice: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  apiNoticeText: {
    color: '#1976d2',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: height * 0.7, // Set maximum height to 70% of screen
    flex: 1,
  },
  panelScrollView: {
    flex: 1,
    paddingTop: 20, // Space for close button
  },
  panelScrollContent: {
    paddingBottom: 20, // Bottom padding for better scrolling
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
});
