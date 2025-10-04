# 🔑 Google Places API Setup

To enable the location autocomplete feature, you need to set up a Google Places API key.

## Steps:

### 1. Get Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Places API** 
   - **Directions API** (already used by server)
   - **Geocoding API** (already used by server)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Add API Key to Client
Open `app/(tabs)/index.tsx` and replace both instances of:
```javascript
key: 'YOUR_GOOGLE_PLACES_API_KEY'
```
With your actual API key:
```javascript
key: 'AIzaSyD8F6b5U6Q7RqX9nJ2k1H3L8M9P4N7s0V6' // Your real key here
```

### 3. Security (Production)
For production apps:
- Restrict your API key to specific apps/domains
- Use environment variables
- Consider using a backend proxy for API calls

## What's New? ✨

### 🔍 Google Places Autocomplete
- **Smart Search**: Type any location and get suggestions
- **Canada Bias**: Results prioritized for Canadian locations
- **Current Location**: Quick option to use GPS location
- **Real-time**: Suggestions appear as you type

### 🎨 Improved UI
- **Better Spacing**: Less cramped, more readable layout
- **Modern Design**: Card-based interface with shadows
- **Clear Labels**: Each input has descriptive labels
- **Visual Hierarchy**: Important elements stand out

### 🛠️ Enhanced Features
- **Location Bias**: Server now uses your GPS for better place resolution
- **Responsive**: Works great on different screen sizes
- **Accessible**: Proper contrast and touch targets

## Testing
1. Make sure server is running: `cd server && npm run dev`
2. Start the app: `npm start`
3. Try searching for "Tim Hortons" or "CN Tower"
4. Notice how it suggests nearby locations first!