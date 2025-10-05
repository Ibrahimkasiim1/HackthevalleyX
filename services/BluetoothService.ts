// services/BluetoothService.ts
import { Platform } from 'react-native';
import { BleManager, Characteristic, Device, State } from 'react-native-ble-plx';

interface ConnectedDevice {
  device: Device;
  writeCharacteristic: Characteristic | null;
}

class BluetoothService {
  private manager: BleManager | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private maxConnections = 2;

  constructor() {
    // Lazy initialization - don't create BleManager here
  }

  private getManager(): BleManager {
    if (!this.manager) {
      try {
        // Check if we're on a supported platform
        if (Platform.OS === 'web') {
          throw new Error('Bluetooth is not supported on web platform');
        }
        
        // Check if we're in a simulator/emulator environment
        if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
          console.warn('Bluetooth may not work properly in simulator/emulator. Use a physical device for full functionality.');
        }
        
        this.manager = new BleManager();
      } catch (error) {
        console.error('Failed to create BleManager:', error);
        throw new Error('Bluetooth is not available on this device or platform. Make sure you are running on a physical device with Bluetooth support.');
      }
    }
    return this.manager;
  }

  async initialize(): Promise<boolean> {
    try {
      const manager = this.getManager();
      const state = await manager.state();
      
      console.log('Bluetooth state:', state);
      
      if (state === State.PoweredOn) {
        console.log('Bluetooth is ready');
        return true;
      } else {
        console.warn('Bluetooth is not powered on. Current state:', state);
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not available')) {
        console.error('Bluetooth hardware is not available on this device');
      } else if (errorMessage.includes('permission')) {
        console.error('Bluetooth permissions are not granted');
      } else {
        console.error('Unknown Bluetooth initialization error:', error);
      }
      
      return false;
    }
  }

  async startScanning(onDeviceFound: (device: Device) => void): Promise<void> {
    try {
      this.getManager().startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }
        if (device && device.name) {
          onDeviceFound(device);
        }
      });
    } catch (error) {
      console.error('Failed to start scanning:', error);
      throw error;
    }
  }

  stopScanning(): void {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  canConnectMoreDevices(): boolean {
    return this.connectedDevices.size < this.maxConnections;
  }

  getConnectedDevicesCount(): number {
    return this.connectedDevices.size;
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      if (!this.canConnectMoreDevices()) {
        throw new Error(`Cannot connect to more than ${this.maxConnections} devices`);
      }

      // Stop scanning before connecting
      this.stopScanning();

      const device = await this.getManager().connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      // Try to find a writable characteristic
      const writeCharacteristic = await this.findWriteCharacteristic(device);
      
      // Store the connected device
      this.connectedDevices.set(deviceId, {
        device,
        writeCharacteristic
      });

      return device;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      throw error;
    }
  }

  private async findWriteCharacteristic(device: Device): Promise<Characteristic | null> {
    try {
      const services = await device.services();
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          // Look for characteristics that can be written to
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            console.log('Found writable characteristic:', characteristic.uuid);
            return characteristic;
          }
        }
      }
      
      console.warn('No writable characteristic found for device:', device.id);
      return null;
    } catch (error) {
      console.error('Error finding write characteristic:', error);
      return null;
    }
  }

  async sendAsciiCommand(deviceId: string, command: string): Promise<void> {
    const connectedDevice = this.connectedDevices.get(deviceId);
    
    if (!connectedDevice || !connectedDevice.device) {
      throw new Error('Device not connected');
    }

    if (!connectedDevice.writeCharacteristic) {
      throw new Error('No writable characteristic found for this device');
    }

    try {
      // Validate command and get ASCII value
      let asciiValue: number;
      switch (command.toUpperCase()) {
        case 'F':
          asciiValue = 70; // F
          break;
        case 'R':
          asciiValue = 82; // R
          break;
        case 'C':
          asciiValue = 67; // C
          break;
        case 'S':
          asciiValue = 83; // S
          break;
        default:
          throw new Error(`Unsupported command: ${command}`);
      }

      // Create buffer with ASCII value
      const data = new Uint8Array([asciiValue]);
      const base64Data = this.uint8ArrayToBase64(data);

      console.log(`Sending ASCII ${command} (value ${asciiValue}) to device: ${deviceId}`);

      const characteristic = connectedDevice.writeCharacteristic;

      if (characteristic.isWritableWithResponse) {
        await characteristic.writeWithResponse(base64Data);
      } else {
        await characteristic.writeWithoutResponse(base64Data);
      }

      console.log(`Successfully sent ASCII ${command}`);
    } catch (error) {
      console.error(`Failed to send ASCII ${command}:`, error);
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const connectedDevice = this.connectedDevices.get(deviceId);
    
    if (connectedDevice) {
      try {
        await connectedDevice.device.cancelConnection();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.connectedDevices.delete(deviceId);
    }
  }

  async disconnectAllDevices(): Promise<void> {
    const disconnectPromises = Array.from(this.connectedDevices.keys()).map(deviceId => 
      this.disconnectDevice(deviceId)
    );
    await Promise.all(disconnectPromises);
  }

  getConnectedDevice(deviceId: string): ConnectedDevice | undefined {
    return this.connectedDevices.get(deviceId);
  }

  getAllConnectedDevices(): Map<string, ConnectedDevice> {
    return new Map(this.connectedDevices);
  }

  getConnectedDevicesList(): Device[] {
    return Array.from(this.connectedDevices.values()).map(connectedDevice => connectedDevice.device);
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  isConnected(): boolean {
    return this.connectedDevices.size > 0;
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  }

  destroy(): void {
    if (this.manager) {
      this.manager.destroy();
    }
    this.connectedDevices.clear();
  }
}

export default new BluetoothService();