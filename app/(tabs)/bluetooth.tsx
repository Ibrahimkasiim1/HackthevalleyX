// app/bluetooth.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useRouter } from 'expo-router';
import BluetoothService from '@/services/BluetoothService';

export default function BluetoothScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [bluetoothReady, setBluetoothReady] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const router = useRouter();

  useEffect(() => {
    initializeBluetooth();
    return () => {
      BluetoothService.stopScanning();
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      const isReady = await BluetoothService.initialize();
      setBluetoothReady(isReady);
      if (!isReady) {
        Alert.alert('Bluetooth Error', 'Please enable Bluetooth and try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };

  const startScanning = () => {
    if (!bluetoothReady) {
      Alert.alert('Bluetooth Not Ready', 'Please ensure Bluetooth is enabled');
      return;
    }

    setScanning(true);
    setDevices([]);

    BluetoothService.startScanning((device) => {
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (!exists && !BluetoothService.isDeviceConnected(device.id)) {
          return [...prev, device];
        }
        return prev;
      });
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      stopScanning();
    }, 10000);
  };

  const stopScanning = () => {
    BluetoothService.stopScanning();
    setScanning(false);
  };

  const connectToDevice = async (device: Device) => {
    if (!BluetoothService.canConnectMoreDevices()) {
      Alert.alert('Maximum Devices Connected', 'You can only connect to 2 devices at a time');
      return;
    }

    try {
      setScanning(false);
      BluetoothService.stopScanning();

      Alert.alert(
        'Connecting',
        `Connecting to ${device.name || 'Unknown Device'}...`
      );

      await BluetoothService.connectToDevice(device.id);
      
      // Update connected devices list
      const connectedList = BluetoothService.getConnectedDevicesList();
      setConnectedDevices(connectedList);
      
      // Remove from available devices
      setDevices(prev => prev.filter(d => d.id !== device.id));

      Alert.alert(
        'Connected!',
        `Successfully connected to ${device.name || 'Unknown Device'}\n\nConnected devices: ${connectedList.length}/2`
      );

      // If we have 2 devices, show option to proceed to terminal
      if (connectedList.length === 2) {
        setTimeout(() => {
          Alert.alert(
            'Ready to Proceed',
            'You have connected to 2 devices. Would you like to go to the terminal?',
            [
              { text: 'Stay Here', style: 'cancel' },
              { text: 'Go to Terminal', onPress: () => router.push('/bluetooth-terminal') }
            ]
          );
        }, 1000);
      }

    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Connection Failed', 'Could not connect to the device');
    }
  };

  const disconnectDevice = async (device: Device) => {
    try {
      await BluetoothService.disconnectDevice(device.id);
      const connectedList = BluetoothService.getConnectedDevicesList();
      setConnectedDevices(connectedList);
      
      // Add back to available devices if still in range
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (!exists) {
          return [...prev, device];
        }
        return prev;
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect device');
    }
  };

  const proceedToTerminal = () => {
    if (connectedDevices.length === 0) {
      Alert.alert('No Devices', 'Please connect to at least one device first');
      return;
    }
    router.push('/bluetooth-terminal');
  };

  const renderConnectedDevice = ({ item }: { item: Device }) => (
    <View style={styles.connectedDeviceItem}>
      <View style={styles.connectedDeviceInfo}>
        <Text style={styles.connectedDeviceName}>
          {item.name || 'Unknown Device'}
        </Text>
        <Text style={styles.connectedDeviceId}>{item.id}</Text>
      </View>
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={() => disconnectDevice(item)}
      >
        <Text style={styles.disconnectButtonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAvailableDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={!BluetoothService.canConnectMoreDevices()}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.name || 'Unknown Device'}
        </Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={[
        styles.connectText,
        !BluetoothService.canConnectMoreDevices() && styles.connectTextDisabled
      ]}>
        Connect
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        <Text style={styles.subtitle}>
          Connect to up to 2 devices simultaneously
        </Text>
      </View>

      {/* Connected Devices Section */}
      {connectedDevices.length > 0 && (
        <View style={styles.connectedSection}>
          <Text style={styles.sectionTitle}>
            Connected Devices ({connectedDevices.length}/2)
          </Text>
          <FlatList
            data={connectedDevices}
            renderItem={renderConnectedDevice}
            keyExtractor={(item) => item.id}
            style={styles.connectedList}
            scrollEnabled={false}
          />
          
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={proceedToTerminal}
          >
            <Text style={styles.proceedButtonText}>
              Proceed to Terminal
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan Controls */}
      <TouchableOpacity
        style={[
          styles.scanButton, 
          !bluetoothReady && styles.buttonDisabled,
          !BluetoothService.canConnectMoreDevices() && styles.buttonDisabled
        ]}
        onPress={scanning ? stopScanning : startScanning}
        disabled={!bluetoothReady || !BluetoothService.canConnectMoreDevices()}
      >
        {scanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>
            🔍 {BluetoothService.canConnectMoreDevices() ? 'Start Scanning' : 'Maximum Devices Connected'}
          </Text>
        )}
      </TouchableOpacity>

      {scanning && (
        <Text style={styles.scanningText}>
          Scanning... {devices.length} devices found
        </Text>
      )}

      {/* Available Devices Section */}
      {BluetoothService.canConnectMoreDevices() && (
        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>
            Available Devices
          </Text>
          <FlatList
            data={devices}
            renderItem={renderAvailableDevice}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
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
  connectedSection: {
    marginBottom: 20,
  },
  availableSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanningText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  proceedButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  connectedList: {
    marginBottom: 8,
  },
  deviceList: {
    flex: 1,
  },
  connectedDeviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  connectedDeviceInfo: {
    flex: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  connectedDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  connectedDeviceId: {
    fontSize: 12,
    color: '#666',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  connectText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  connectTextDisabled: {
    color: '#ccc',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});