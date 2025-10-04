import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRoute } from '@/services/navigation';
import { useState } from 'react';
import { Alert, Button, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);

  const testNavigation = async () => {
    setLoading(true);
    try {
      const route = await getRoute('UTSC', 'CN Tower');
      setRouteData(route);
      Alert.alert('Success!', `Route loaded: ${route.summary.originName} → ${route.summary.destinationName}`);
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">🧭 NavSense</ThemedText>
        <ThemedText type="subtitle">Navigation Testing</ThemedText>
      </ThemedView>

      <ThemedView style={styles.testSection}>
        <Button 
          title={loading ? "⏳ Loading..." : "🧪 Test Navigation API"} 
          onPress={testNavigation} 
          disabled={loading}
        />
      </ThemedView>
        
      {routeData && (
        <ThemedView style={styles.routeInfo}>
          <ThemedText type="subtitle">📍 Route Information</ThemedText>
          <ThemedText style={styles.routeDetail}>From: {routeData.summary.originName}</ThemedText>
          <ThemedText style={styles.routeDetail}>To: {routeData.summary.destinationName}</ThemedText>
          <ThemedText style={styles.routeDetail}>Distance: {(routeData.summary.distanceMeters / 1000).toFixed(1)} km</ThemedText>
          <ThemedText style={styles.routeDetail}>Duration: {Math.round(routeData.summary.durationSeconds / 60)} min</ThemedText>
          <ThemedText style={styles.routeDetail}>Steps: {routeData.steps.length} navigation steps</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 50,
  },
  testSection: {
    marginBottom: 30,
  },
  routeInfo: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
  },
  routeDetail: {
    marginVertical: 4,
    fontSize: 16,
  },
});
