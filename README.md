# NavSense - Smart Navigation App 🧭

A React Native navigation app with real-time location tracking, turn-by-turn directions, and Google Maps integration.

## ✨ Features

- **Real-time Location Tracking**: Uses React Native's geolocation and watchPosition for precise location updates
- **Turn-by-Turn Navigation**: Voice and visual notifications for upcoming turns
- **Route Progress Tracking**: Visual progress bar showing completion percentage
- **Google Maps Integration**: Full route visualization with polylines and markers
- **Smart Notifications**: Alerts for upcoming turns and route completion
- **Persistent Route Storage**: Saves routes locally for resuming navigation
- **Cross-Platform Support**: Works on iOS, Android, and Web

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- Expo CLI
- Google Maps API Key
- iOS Simulator or Android Emulator (or physical device)

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <your-repo-url>
cd HackthevalleyX
npm install
\`\`\`

### 2. Server Setup

\`\`\`bash
cd server
npm install
cp .env.example .env
\`\`\`

Edit `server/.env` and add your Google Maps API key:
\`\`\`
GOOGLE_API_KEY=your_google_maps_api_key_here
PARTNER_TOKEN=supersecret
PORT=3000
\`\`\`

### 3. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Places API**
   - **Directions API** 
   - **Geocoding API**
   - **Maps JavaScript API** (for web)
   - **Maps SDK for Android** (for Android)
   - **Maps SDK for iOS** (for iOS)
4. Create credentials → API Key
5. Configure API key restrictions for security

### 4. Start the Backend Server

**Windows:**
\`\`\`powershell
.\scripts\start-server.bat
\`\`\`

**macOS/Linux:**
\`\`\`bash
./scripts/start-server.sh
\`\`\`

**Manual:**
\`\`\`bash
cd server
npm run dev
\`\`\`

The server will start on `http://localhost:3000`

### 5. Start the Mobile App

\`\`\`bash
npx expo start
\`\`\`

Choose your preferred option:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Press `w` for web
- Scan QR code with Expo Go app on your device

## 📱 How to Use

### Building a Route

1. Enter your **start location** (e.g., "UTSC", "Toronto Union Station")
2. Enter your **destination** (e.g., "CN Tower", "Eaton Centre")
3. Tap **"Build Route"** to generate the navigation path
4. Review the route information (distance, duration, ETA)

### Starting Navigation

1. After building a route, tap **"Start Navigation"**
2. Grant location permissions when prompted
3. Grant notification permissions for turn alerts
4. The app will:
   - Track your real-time location
   - Show progress along the route
   - Send notifications for upcoming turns
   - Display distance to next turn

### During Navigation

- **Progress Bar**: Shows percentage of route completed
- **Next Turn Info**: Displays upcoming turn direction and distance
- **Map View**: Real-time location with route overlay
- **Auto-Follow**: Map automatically follows your location
- **Turn Notifications**: Audio/visual alerts when approaching turns

### Stopping Navigation

- Tap **"Stop Navigation"** to end the current route
- Navigation automatically stops when you reach your destination

## 🔧 Technical Implementation

### Location Tracking

- Uses `expo-location` with `BestForNavigation` accuracy
- Updates every 1 second or 5 meters movement
- Tracks user progress along the route polyline
- Calculates distance to route waypoints

### Turn-by-Turn Directions

- Monitors proximity to turn points (30m threshold)
- Sends advance warnings at 100m before turns
- Uses Google Directions API maneuver data
- Converts HTML instructions to plain text

### Notifications

- Local push notifications for turn alerts
- Background notifications when app is minimized
- Custom notification sounds and vibration
- Handles notification permissions gracefully

### Route Progress Calculation

- Tracks completed route segments
- Calculates percentage based on total distance
- Updates progress bar in real-time
- Persists navigation state

### Google Maps Integration

- Displays routes using polylines
- Shows start/end markers
- Real-time user location
- Auto-zoom and follow functionality

## 🚨 Troubleshooting

### Location Permissions

**iOS**: Make sure to accept location permissions when prompted
**Android**: Enable "Precise Location" in app settings if needed

### Server Connection Issues

1. Ensure server is running on `http://localhost:3000`
2. Check that `GOOGLE_API_KEY` is set in `server/.env`
3. Verify Google Maps APIs are enabled
4. Check API key quotas and billing

### Navigation Not Working

1. Verify location permissions are granted
2. Ensure you're testing on a physical device (simulators may have limited GPS)
3. Check that route was built successfully before starting navigation
4. Make sure you're outdoors with good GPS signal

### Notification Issues

1. Grant notification permissions when prompted
2. Check device notification settings
3. Ensure app has permission to send notifications

## 🎯 Future Enhancements

- [ ] Voice navigation announcements
- [ ] Multiple route options (fastest, shortest, avoid highways)
- [ ] Offline map support
- [ ] Traffic-aware routing
- [ ] Speed limit warnings
- [ ] Points of interest along route
- [ ] Route sharing functionality
- [ ] Multiple transportation modes (driving, walking, cycling, transit)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ using React Native, Expo, and Google Maps API
