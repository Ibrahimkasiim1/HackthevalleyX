# Bluetooth Functionality

This app now includes comprehensive Bluetooth Low Energy (BLE) functionality for device communication.

## Features

### 1. Bluetooth Device Search
- **Location**: Bluetooth tab in the main navigation
- **Functionality**: 
  - Scan for nearby Bluetooth devices
  - Display device information (name, ID, signal strength)
  - Connect to selected devices

### 2. Bluetooth Terminal
- **Location**: Accessible after connecting to a device
- **Functionality**:
  - Send ASCII "F" command to connected device
  - View communication history
  - Disconnect from device
  - Clear terminal output

## Technical Implementation

### Dependencies
- `react-native-ble-plx`: Bluetooth Low Energy library for React Native

### Files Added/Modified
- `services/BluetoothService.ts`: Core Bluetooth service for device management
- `app/(tabs)/bluetooth.tsx`: Device search and connection interface
- `app/bluetooth-terminal.tsx`: Terminal interface for device communication
- `app/(tabs)/_layout.tsx`: Added Bluetooth tab to navigation
- `app.json`: Added Bluetooth permissions for Android and iOS

### Permissions
The app includes the following permissions:

**Android:**
- `BLUETOOTH`
- `BLUETOOTH_ADMIN`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

**iOS:**
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

## Usage

1. **Enable Bluetooth**: Make sure Bluetooth is enabled on your device
2. **Search for Devices**: Tap the "Bluetooth" tab and press "Start Scanning"
3. **Connect**: Tap on a device from the list to connect
4. **Send Commands**: Once connected, you'll be redirected to the terminal where you can send the "F" command
5. **Disconnect**: Use the disconnect button to end the connection

## Notes

- The app uses Bluetooth Low Energy (BLE) for communication
- Location permissions are required for Bluetooth scanning on Android
- The terminal interface provides a simple way to send ASCII commands to connected devices
- All communication is logged in the terminal for debugging purposes

## Troubleshooting

- Ensure Bluetooth is enabled on your device
- Grant location permissions when prompted (required for BLE scanning)
- Make sure the target device is in pairing mode
- Check that the device supports BLE communication
