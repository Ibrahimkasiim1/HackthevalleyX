// app/bluetooth-terminal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import BluetoothService from '@/services/BluetoothService';
import { Device } from 'react-native-ble-plx';

export default function BluetoothTerminalScreen() {
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [sendingStates, setSendingStates] = useState<{[deviceId: string]: {[command: string]: boolean}}>({});
  const router = useRouter();

  useEffect(() => {
    loadConnectedDevices();
  }, []);

  const loadConnectedDevices = () => {
    const devices = BluetoothService.getConnectedDevicesList();
    setConnectedDevices(devices);
    
    if (devices.length === 0) {
      Alert.alert(
        'No Devices Connected',
        'Please connect to at least one device first',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  };

  const sendCommand = async (device: Device, command: string) => {
    if (!BluetoothService.isDeviceConnected(device.id)) {
      Alert.alert('Error', 'Device is not connected');
      return;
    }

    try {
      // Set sending state for this device and command
      setSendingStates(prev => ({
        ...prev,
        [device.id]: {
          ...prev[device.id],
          [command]: true
        }
      }));

      const timestamp = new Date().toLocaleTimeString();
      const sendingMessage = `[${timestamp}] Sending ASCII ${command} to ${device.name || 'Unknown Device'}...`;
      setMessages(prev => [...prev, sendingMessage]);

      await BluetoothService.sendAsciiCommand(device.id, command);

      const successMessage = `[${timestamp}] ✓ Successfully sent ASCII ${command} to ${device.name || 'Unknown Device'}`;
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      const errorMessage = `[${timestamp}] ✗ Failed to send ${command} to ${device.name || 'Unknown Device'}: ${error.message}`;
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Send Failed', `Could not send ${command} to ${device.name || 'Unknown Device'}`);
    } finally {
      // Clear sending state for this device and command
      setSendingStates(prev => ({
        ...prev,
        [device.id]: {
          ...prev[device.id],
          [command]: false
        }
      }));
    }
  };

  const disconnectDevice = async (device: Device) => {
    try {
      await BluetoothService.disconnectDevice(device.id);
      
      // Update connected devices list
      const updatedDevices = BluetoothService.getConnectedDevicesList();
      setConnectedDevices(updatedDevices);

      const timestamp = new Date().toLocaleTimeString();
      const disconnectMessage = `[${timestamp}] Disconnected from ${device.name || 'Unknown Device'}`;
      setMessages(prev => [...prev, disconnectMessage]);

      // If no devices left, go back
      if (updatedDevices.length === 0) {
        setTimeout(() => router.back(), 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect device');
    }
  };

  const disconnectAll = async () => {
    try {
      await BluetoothService.disconnectAllDevices();
      setConnectedDevices([]);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect all devices');
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const isSending = (deviceId: string, command: string): boolean => {
    return sendingStates[deviceId]?.[command] || false;
  };

  // Command buttons configuration
  const commandButtons = [
    { command: 'F', label: 'Send F', color: '#007AFF', description: 'ASCII: 70' },
    { command: 'R', label: 'Send R', color: '#FF9500', description: 'ASCII: 82' },
    { command: 'C', label: 'Send C', color: '#34C759', description: 'ASCII: 67' },
    { command: 'S', label: 'Send S', color: '#AF52DE', description: 'ASCII: 83' },
  ];

  if (connectedDevices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bluetooth Terminal</Text>
          <Text style={styles.subtitle}>No Devices Connected</Text>
        </View>
        <View style={styles.notConnected}>
          <Text style={styles.notConnectedText}>
            Please connect to devices first
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
        <Text style={styles.subtitle}>
          Connected to {connectedDevices.length} device(s)
        </Text>
      </View>

      {/* Device Controls */}
      <View style={styles.devicesContainer}>
        {connectedDevices.map((device, index) => (
          <View key={device.id} style={styles.deviceControl}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  Device {index + 1}: {device.name || 'Unknown Device'}
                </Text>
                <Text style={styles.deviceId}>{device.id}</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
            </View>
            
            {/* Command Buttons */}
            <View style={styles.commandButtonsContainer}>
              {commandButtons.map((btn) => (
                <TouchableOpacity
                  key={btn.command}
                  style={[
                    styles.commandButton,
                    { backgroundColor: btn.color },
                    isSending(device.id, btn.command) && styles.buttonDisabled
                  ]}
                  onPress={() => sendCommand(device, btn.command)}
                  disabled={isSending(device.id, btn.command)}
                >
                  {isSending(device.id, btn.command) ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.commandButtonContent}>
                      <Text style={styles.commandButtonText}>{btn.label}</Text>
                      <Text style={styles.commandButtonDescription}>{btn.description}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Device Actions */}
            <View style={styles.deviceActions}>
              <TouchableOpacity
                style={styles.deviceDisconnectButton}
                onPress={() => disconnectDevice(device)}
              >
                <Text style={styles.deviceDisconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Terminal Controls */}
      <View style={styles.terminalControls}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearMessages}
        >
          <Text style={styles.clearButtonText}>Clear Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.disconnectAllButton}
          onPress={disconnectAll}
        >
          <Text style={styles.disconnectAllText}>Disconnect All</Text>
        </TouchableOpacity>
      </View>

      {/* Terminal Output */}
      <View style={styles.terminal}>
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalTitle}>Terminal Output</Text>
          <Text style={styles.terminalSubtitle}>
            {connectedDevices.length} device(s) connected
          </Text>
        </View>
        
        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <Text style={styles.noMessages}>
              No messages yet. Send commands to see output.
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
    marginBottom: 20,
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
  devicesContainer: {
    marginBottom: 20,
  },
  deviceControl: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusIndicator: {
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
    fontWeight: '500',
  },
  commandButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  commandButton: {
    flex: 1,
    minWidth: '48%', // Approximately 2 buttons per row
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  commandButtonContent: {
    alignItems: 'center',
  },
  commandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commandButtonDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '400',
  },
  deviceActions: {
    flexDirection: 'row',
  },
  deviceDisconnectButton: {
    flex: 1,
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  deviceDisconnectText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  terminalControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  disconnectAllButton: {
    flex: 1,
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  disconnectAllText: {
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
    padding: 16,
    backgroundColor: '#2a2a2a',
  },
  terminalTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  terminalSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
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
    fontStyle: 'italic',
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