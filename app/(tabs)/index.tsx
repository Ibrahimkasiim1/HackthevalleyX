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
        <>
          <ThemedView style={styles.routeInfo}>
            <ThemedText type="subtitle">📍 Route Information</ThemedText>
            <ThemedText style={styles.routeDetail}>From: {routeData.summary.originName}</ThemedText>
            <ThemedText style={styles.routeDetail}>To: {routeData.summary.destinationName}</ThemedText>
            <ThemedText style={styles.routeDetail}>Distance: {(routeData.summary.distanceMeters / 1000).toFixed(1)} km</ThemedText>
            <ThemedText style={styles.routeDetail}>Duration: {Math.round(routeData.summary.durationSeconds / 60)} min</ThemedText>
            <ThemedText style={styles.routeDetail}>Steps: {routeData.steps.length} navigation steps</ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepsSection}>
            <ThemedText type="subtitle">🎮 Haptic Navigation Steps</ThemedText>
            {routeData.steps.slice(0, 5).map((step: any, index: number) => (
              <ThemedView key={index} style={styles.stepItem}>
                <ThemedText style={styles.stepNumber}>{index + 1}.</ThemedText>
                <ThemedText style={styles.hapticCommand}>[{step.side}]</ThemedText>
                <ThemedText style={styles.stepText}>
                  {step.instructionHtml.replace(/<[^>]*>/g, '')}
                </ThemedText>
              </ThemedView>
            ))}
            {routeData.steps.length > 5 && (
              <ThemedText style={styles.moreSteps}>... and {routeData.steps.length - 5} more steps</ThemedText>
            )}
          </ThemedView>
        </>
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
  stepsSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 30,
  },
  hapticCommand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.1)',
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 35,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  moreSteps: {
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
