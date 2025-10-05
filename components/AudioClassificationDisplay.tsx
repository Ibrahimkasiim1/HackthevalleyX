import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AudioClassificationResult } from '@/services/AudioClassificationService';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface AudioClassificationDisplayProps {
  result: AudioClassificationResult | null;
  isActive: boolean;
  error: string | null;
}

export function AudioClassificationDisplay({ result, isActive, error }: AudioClassificationDisplayProps) {
  const getStatusColor = () => {
    if (error) return '#FF3B30';
    if (isActive) return '#00AA00';
    return '#FF3B30';
  };

  const getStatusText = () => {
    if (error) return 'ERROR';
    if (isActive) return 'ACTIVE';
    return 'INACTIVE';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#00AA00'; // High confidence - green
    if (confidence >= 0.6) return '#FFA500'; // Medium confidence - orange
    return '#FF3B30'; // Low confidence - red
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>
          🎤 Audio Classification
        </ThemedText>
        <View style={[
          styles.status,
          { backgroundColor: getStatusColor() }
        ]}>
          <ThemedText style={styles.statusText}>
            {getStatusText()}
          </ThemedText>
        </View>
      </ThemedView>
      
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            ⚠️ {error}
          </ThemedText>
        </ThemedView>
      )}
      
      {result && (
        <ThemedView style={styles.resultContainer}>
          <ThemedText style={styles.detectedLabel}>
            Detected: {result.label}
          </ThemedText>
          <ThemedText style={[
            styles.confidence,
            { color: getConfidenceColor(result.confidence) }
          ]}>
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {new Date(result.timestamp).toLocaleTimeString()}
          </ThemedText>
        </ThemedView>
      )}
      
      {!result && isActive && !error && (
        <ThemedView style={styles.listeningContainer}>
          <ThemedText style={styles.listeningText}>
            🎧 Listening for sounds...
          </ThemedText>
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#E6F7FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  detectedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  listeningContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#87CEEB',
  },
  listeningText: {
    fontSize: 14,
    color: '#4682B4',
    fontStyle: 'italic',
  },
});
