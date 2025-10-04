// services/BluetoothService.ts
import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';

class BluetoothService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private writeCharacteristic: Characteristic | null = null;

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

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      // Stop scanning before connecting
      this.stopScanning();

      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      // Try to find a writable characteristic
      await this.findWriteCharacteristic();

      return device;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      this.connectedDevice = null;
      this.writeCharacteristic = null;
      throw error;
    }
  }

  private async findWriteCharacteristic(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const services = await this.connectedDevice.services();
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          // Look for characteristics that can be written to
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            console.log('Found writable characteristic:', characteristic.uuid);
            this.writeCharacteristic = characteristic;
            return;
          }
        }
      }
      
      throw new Error('No writable characteristic found');
    } catch (error) {
      console.error('Error finding write characteristic:', error);
      throw error;
    }
  }

  async sendAsciiF(): Promise<void> {
    if (!this.connectedDevice || !this.writeCharacteristic) {
      throw new Error('No device connected or no write characteristic found');
    }

    try {
      // Create buffer with ASCII 'F' (value 70)
      const data = new Uint8Array([70]);
      const base64Data = this.uint8ArrayToBase64(data);

      console.log('Sending ASCII F to characteristic:', this.writeCharacteristic.uuid);

      if (this.writeCharacteristic.isWritableWithResponse) {
        await this.writeCharacteristic.writeWithResponse(base64Data);
      } else {
        await this.writeCharacteristic.writeWithoutResponse(base64Data);
      }

      console.log('Successfully sent ASCII F');
    } catch (error) {
      console.error('Failed to send ASCII F:', error);
      throw error;
    }
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  }

  async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
    this.connectedDevice = null;
    this.writeCharacteristic = null;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  destroy(): void {
    this.manager.destroy();
  }
}

export default new BluetoothService();