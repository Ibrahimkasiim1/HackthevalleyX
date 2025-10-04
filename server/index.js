import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const PARTNER_TOKEN = process.env.PARTNER_TOKEN || 'devtoken';

if (!GOOGLE_API_KEY) {
  console.warn('[WARN] GOOGLE_API_KEY not set. Set it in .env before calling the endpoint.');
}

const RequestSchema = z.object({
  // Natural language input (fallback)
  text: z.string().min(1).optional(),
  
  // Explicit start/destination parameters
  start: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  
  // Legacy support
  origin: z.string().min(1).optional(),
  
  // User's current location for better place resolution
  userLocation: z.object({ 
    lat: z.number(), 
    lng: z.number() 
  }).optional(),
  
  // Transportation mode
  mode: z.enum(['walking','driving','bicycling','transit']).default('walking')
});

const maneuverToSide = (m) => {
  if (!m) return 'B';
  const L = ['turn-left','turn-sharp-left','turn-slight-left','ramp-left','fork-left','keep-left','roundabout-left','uturn-left'];
  const R = ['turn-right','turn-sharp-right','turn-slight-right','ramp-right','fork-right','keep-right','roundabout-right','uturn-right'];
  if (L.includes(m)) return 'L';
  if (R.includes(m)) return 'R';
  return 'B';
};

async function gjson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed ${r.status}`);
  return r.json();
}

async function findPlace(query, near) {
  const input = encodeURIComponent(query);
  const fields = 'place_id,name,geometry/location,formatted_address';
  let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=${fields}&key=${GOOGLE_API_KEY}`;
  if (near) url += `&locationbias=circle:4000@${near.lat},${near.lng}`;
  const fp = await gjson(url);
  if (fp.candidates?.length) {
    const c = fp.candidates[0];
    return {
      name: c.name || c.formatted_address,
      placeId: c.place_id,
      lat: c.geometry.location.lat,
      lng: c.geometry.location.lng,
      address: c.formatted_address
    };
  }
  throw new Error(`No place found for "${query}"`);
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/convo/route.build', async (req, res) => {
  try {
    // Log incoming requests for debugging
    console.log('🎯 Navigation request received:', {
      timestamp: new Date().toISOString(),
      body: req.body,
      query: req.query,
      userAgent: req.get('User-Agent')
    });
    
    // simple token auth
    if ((req.query.token || '') !== PARTNER_TOKEN) {
      console.log('❌ Unauthorized request - wrong token');
      return res.status(401).json({ error: 'unauthorized' });
    }
    // Get parameters from URL query string
    const start = req.query.start;
    const destination = req.query.destination; 
    const mode = req.query.mode || 'walking';
    const userLat = req.query.userLat ? parseFloat(req.query.userLat) : null;
    const userLng = req.query.userLng ? parseFloat(req.query.userLng) : null;
    
    // Validate required parameters
    if (!start) {
      return res.status(400).json({ error: 'Missing required parameter: start' });
    }
    if (!destination) {
      return res.status(400).json({ error: 'Missing required parameter: destination' });
    }
    if (!['walking','driving','bicycling','transit'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be: walking, driving, bicycling, or transit' });
    }

    // Use the URL parameters directly
    let startLocation = start;
    let endLocation = destination;

    // Create location bias object if user coordinates provided
    const locationBias = (userLat && userLng) ? { lat: userLat, lng: userLng } : null;
    
    console.log('📍 Using location bias:', locationBias ? `${userLat},${userLng}` : 'None provided');

    // Resolve start and destination locations with improved bias
    const O = await findPlace(startLocation, locationBias);
    const D = await findPlace(endLocation, locationBias || O);

    // directions
    const originParam = O.placeId ? `place_id:${O.placeId}` : `${O.lat},${O.lng}`;
    const destParam   = D.placeId ? `place_id:${D.placeId}` : `${D.lat},${D.lng}`;
    const dirURL = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}&mode=${mode}&units=metric&key=${GOOGLE_API_KEY}`;
    const dir = await gjson(dirURL);
    if (dir.status !== 'OK') {
      return res.status(502).json({ error: 'Directions failed', details: dir.status, msg: dir.error_message });
    }
    const route = dir.routes[0];
    const leg = route.legs[0];

    const steps = (leg.steps || []).map((s, i) => ({
      i,
      instructionHtml: s.html_instructions || '',
      maneuver: s.maneuver || 'straight',
      side: maneuverToSide(s.maneuver),
      triggerAt: { lat: s.start_location.lat, lng: s.start_location.lng },
      end: { lat: s.end_location.lat, lng: s.end_location.lng },
      distanceMeters: s.distance?.value ?? 0
    }));

    const routeId = `rte_${uuidv4().slice(0,7)}`;
    const etaISO = new Date(Date.now() + (leg.duration?.value ?? 0) * 1000).toISOString();

    const response = {
      routeId,
      summary: {
        originName: O.name,
        destinationName: D.name,
        distanceMeters: leg.distance?.value ?? 0,
        durationSeconds: leg.duration?.value ?? 0,
        eta: etaISO
      },
      polyline: { points: route.overview_polyline?.points ?? '' },
      steps
    };
    
    console.log('✅ Route calculated successfully:', {
      routeId,
      from: O.name,
      to: D.name,
      distance: `${Math.round((leg.distance?.value ?? 0) / 1000)}km`,
      duration: `${Math.round((leg.duration?.value ?? 0) / 60)}min`,
      steps: steps.length
    });
    
    res.json(response);
  } catch (e) {
    console.log('❌ Error processing route:', e.message);
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`NavSense server up on http://localhost:${PORT}`);
});