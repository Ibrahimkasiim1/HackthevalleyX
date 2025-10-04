// Simple navigation service - just one function for now
export async function getRoute(start: string, destination: string, mode: string = 'walking') {
  const url = `https://hackthevalleyx.onrender.com/convo/route.build?token=supersecret&start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
  
  console.log('Calling navigation API:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Got route data:', data);
  
  return data;
}