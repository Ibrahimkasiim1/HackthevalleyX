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
        if (!exists) {
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
    try {
      setScanning(false);
      BluetoothService.stopScanning();

      Alert.alert(
        'Connecting',
        `Connecting to ${device.name || 'Unknown Device'}...`
      );

      await BluetoothService.connectToDevice(device.id);
      
      Alert.alert(
        'Connected!',
        `Successfully connected to ${device.name || 'Unknown Device'}`,
        [
          {
            text: 'Open Terminal',
            onPress: () => router.push('/bluetooth-terminal'),
          },
        ]
      );
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Connection Failed', 'Could not connect to the device');
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.name || 'Unknown Device'}
        </Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        <Text style={styles.subtitle}>
          Scan for nearby Bluetooth devices
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.scanButton, !bluetoothReady && styles.buttonDisabled]}
        onPress={scanning ? stopScanning : startScanning}
        disabled={!bluetoothReady}
      >
        {scanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>🔍 Start Scanning</Text>
        )}
      </TouchableOpacity>

      {scanning && (
        <Text style={styles.scanningText}>
          Scanning... {devices.length} devices found
        </Text>
      )}

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        style={styles.deviceList}
        showsVerticalScrollIndicator={false}
      />
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
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
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
  deviceList: {
    flex: 1,
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
  },
  connectText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});