// services/BluetoothService.ts
import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';

interface ConnectedDevice {
  device: Device;
  writeCharacteristic: Characteristic | null;
}

class BluetoothService {
  private manager: BleManager;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private maxConnections = 2;

  constructor() {
    this.manager = new BleManager();
  }

  async initialize(): Promise<boolean> {
    try {
      const state = await this.manager.state();
      return state === State.PoweredOn;
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      return false;
    }
  }

  async startScanning(onDeviceFound: (device: Device) => void): Promise<void> {
    try {
      this.manager.startDeviceScan(null, null, (error, device) => {
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
    this.manager.stopDeviceScan();
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

      const device = await this.manager.connectToDevice(deviceId);
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

  async sendAsciiF(deviceId: string): Promise<void> {
    const connectedDevice = this.connectedDevices.get(deviceId);
    
    if (!connectedDevice || !connectedDevice.device) {
      throw new Error('Device not connected');
    }

    if (!connectedDevice.writeCharacteristic) {
      throw new Error('No writable characteristic found for this device');
    }

    try {
      // Create buffer with ASCII 'F' (value 70)
      const data = new Uint8Array([70]);
      const base64Data = this.uint8ArrayToBase64(data);

      console.log(`Sending ASCII F to device: ${deviceId}`);

      const characteristic = connectedDevice.writeCharacteristic;

      if (characteristic.isWritableWithResponse) {
        await characteristic.writeWithResponse(base64Data);
      } else {
        await characteristic.writeWithoutResponse(base64Data);
      }

      console.log('Successfully sent ASCII F');
    } catch (error) {
      console.error('Failed to send ASCII F:', error);
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
    this.manager.destroy();
    this.connectedDevices.clear();
  }
}

export default new BluetoothService();