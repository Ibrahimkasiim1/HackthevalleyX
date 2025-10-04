// app/bluetooth-terminal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import BluetoothService from '@/services/BluetoothService';

export default function BluetoothTerminalScreen() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const isConnected = BluetoothService.isConnected();
    const device = BluetoothService.getConnectedDevice();
    
    setConnected(isConnected);
    if (device) {
      setDeviceName(device.name || 'Unknown Device');
    }
    
    if (!isConnected) {
      Alert.alert(
        'Not Connected',
        'Please connect to a Bluetooth device first',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  };

  const sendAsciiF = async () => {
    if (!connected) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    try {
      const timestamp = new Date().toLocaleTimeString();
      const sendingMessage = `[${timestamp}] Sending ASCII F (value 70)...`;
      setMessages(prev => [...prev, sendingMessage]);

      await BluetoothService.sendAsciiF();

      const successMessage = `[${timestamp}] ✓ Successfully sent ASCII F`;
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      const errorMessage = `[${timestamp}] ✗ Failed to send: ${error.message}`;
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Send Failed', 'Could not send data to device');
    }
  };

  const disconnect = async () => {
    try {
      await BluetoothService.disconnectDevice();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bluetooth Terminal</Text>
          <Text style={styles.subtitle}>Not Connected</Text>
        </View>
        <View style={styles.notConnected}>
          <Text style={styles.notConnectedText}>
            Please connect to a device first
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Terminal</Text>
        <Text style={styles.subtitle}>Connected to: {deviceName}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendAsciiF}
        >
          <Text style={styles.sendButtonText}>Send ASCII 'F'</Text>
        </TouchableOpacity>

        <View style={styles.secondaryControls}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearMessages}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.terminal}>
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalTitle}>Terminal Output</Text>
          <View style={styles.connectionStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        </View>
        
        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <Text style={styles.noMessages}>
              No messages yet. Send a command to see output.
            </Text>
          ) : (
            messages.map((message, index) => (
              <Text key={index} style={styles.message}>
                {message}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  controls: {
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  disconnectButtonText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  terminal: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
  },
  terminalTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    color: '#22c55e',
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 20,
  },
  noMessages: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  notConnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notConnectedText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});