# Audio Classification Implementation

This document describes the audio classification feature implemented in NavSense.

## Overview

The audio classification system uses TensorFlow Lite to detect and classify audio sounds in real-time, specifically designed to detect sirens and other important navigation-related sounds.

## Features

- **Real-time Audio Classification**: Continuously monitors audio input and classifies sounds
- **Siren Detection**: Specifically trained to detect emergency vehicle sirens
- **Background Noise Filtering**: Distinguishes between background noise and important sounds
- **Confidence Scoring**: Provides confidence levels for each classification
- **Visual Display**: Shows current classification results on the home screen

## Implementation Details

### Files Added/Modified

1. **`services/AudioClassificationService.ts`**
   - Main service for audio classification
   - Handles model loading and inference
   - Manages audio recording and processing

2. **`components/AudioClassificationDisplay.tsx`**
   - React component for displaying classification results
   - Shows current detection, confidence, and status

3. **`app/(tabs)/index.tsx`**
   - Integrated audio classification into the home screen
   - Added state management for classification results

4. **`app.json`**
   - Added microphone permissions for iOS and Android

### Dependencies Added

- `@tensorflow/tfjs` - TensorFlow.js core library
- `@tensorflow/tfjs-react-native` - TensorFlow.js for React Native
- `expo-av` - Audio recording and playback
- `expo-media-library` - Media library access
- `react-native-fs` - File system operations

### Model Files

- **`TF/soundclassifier_with_metadata.tflite`** - TensorFlow Lite model
- **`TF/labels.txt`** - Classification labels (Background Noise, Sirens)

## Usage

The audio classification starts automatically when the app launches. The system:

1. Requests microphone permissions
2. Loads the TensorFlow Lite model
3. Starts continuous audio recording
4. Processes audio in real-time
5. Displays results on the home screen

## Display Information

The audio classification display shows:

- **Status**: ACTIVE/INACTIVE/ERROR
- **Detected Sound**: Current classification result
- **Confidence**: Percentage confidence in the classification
- **Timestamp**: When the classification was made

## Permissions Required

### iOS
- `NSMicrophoneUsageDescription`: "This app uses the microphone for audio classification to detect sirens and other sounds for navigation assistance."

### Android
- `android.permission.RECORD_AUDIO`: Required for audio recording

## Technical Notes

### Current Implementation Status

The current implementation includes:

✅ **Completed:**
- Service architecture and state management
- UI components and display
- Permission handling
- Mock classification system

🔄 **In Progress:**
- TensorFlow Lite model integration
- Real audio processing pipeline
- Model inference implementation

### Next Steps for Full Implementation

1. **Model Conversion**: Convert the `.tflite` model to a format compatible with TensorFlow.js
2. **Audio Preprocessing**: Implement proper audio preprocessing for the model
3. **Real Inference**: Replace mock classification with actual model inference
4. **Performance Optimization**: Optimize for real-time processing
5. **Testing**: Comprehensive testing with real audio data

### Mock Implementation

Currently, the system uses a mock classification that:
- Simulates random classification results
- Updates every second
- Provides realistic confidence scores
- Demonstrates the UI and state management

This allows for immediate testing of the UI and integration while the full TensorFlow Lite integration is being developed.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure microphone permissions are granted
2. **Model Loading Failed**: Check that model files are in the correct location
3. **No Audio Input**: Verify microphone is working and not being used by other apps

### Debug Information

The service logs detailed information to the console:
- Model loading status
- Audio recording status
- Classification results
- Error messages

Check the console output for debugging information.

## Future Enhancements

- **Additional Sound Classes**: Expand beyond sirens to include other navigation-relevant sounds
- **Custom Model Training**: Train models on specific audio data
- **Offline Processing**: Ensure all processing works offline
- **Performance Metrics**: Add performance monitoring and optimization
- **User Feedback**: Allow users to provide feedback on classification accuracy
