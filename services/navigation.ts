// Enhanced navigation service with location bias
export async function getRoute(start: string, destination: string, mode: string = 'walking', userLocation?: {latitude: number, longitude: number}) {
  let url = `https://hackthevalleyx.onrender.com/convo/route.build?token=supersecret&start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
  
  // Add user location for better place resolution
  if (userLocation) {
    url += `&userLat=${userLocation.latitude}&userLng=${userLocation.longitude}`;
  }
  
  console.log('Calling navigation API:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Got route data:', data);
  
  return data;
}