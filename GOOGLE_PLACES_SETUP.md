# 🔑 Google Places API Setup Guide

## Quick Setup (5 minutes)

### 1. Get Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Places API** (New Experience)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. **Copy your API key**

### 2. Add API Key to App
Open `app/(tabs)/index.tsx` and find these two lines (around line 373 and 408):
```javascript
key: 'AIzaSyBvOkBwgGlbUiuS-oSma-iXiXHjUvJBFEY', // You need to replace this
```

Replace with your actual API key:
```javascript
key: 'AIzaSyD8F6b5U6Q7RqX9nJ2k1H3L8M9P4N7s0V6', // Your real key here
```

### 3. Test the Autocomplete
1. Start the app: `npm start`
2. Type in the destination field
3. You should see dropdown suggestions appear!

## What You Get ✨

### 🔍 **Real Google Places Autocomplete**
- Type "Tim Hortons" → See nearby Tim Hortons locations
- Type "CN Tower" → Get the exact CN Tower
- Type "UTSC" → Gets University of Toronto Scarborough Campus
- **Canada-biased results** (no more Oregon!)

### 🎯 **Location Selection**
- **Dropdown list** of real places
- **Tap to select** the exact location you want
- **No more guessing** which "Toronto" you mean

### 🗺️ **Better Navigation**
- Precise coordinates from Google
- **Fixes the Oregon routing issue**
- Works with your existing haptic system

## Security Note 🔒
For production apps, restrict your API key in Google Cloud Console to your specific app bundle ID.

## Troubleshooting
- **No suggestions?** Check your API key and internet connection
- **Still going to Oregon?** Make sure you selected from the dropdown, not just typed
- **Billing errors?** Google Places has a free tier with generous limits