# NavSense Server (Phase 1)

Express endpoint for ElevenLabs to call to build a route using Google Places/Geocoding/Directions.

## Quick start
1) Node 18+ required.
2) `cp .env.example .env` and set `GOOGLE_API_KEY` + `PARTNER_TOKEN`.
3) `npm install`
4) `npm run dev`

Health check: `GET http://localhost:3000/health`

### Build a route
```bash
curl -X POST "http://localhost:3000/convo/route.build?token=supersecret"       -H "Content-Type: application/json"       -d '{"text":"from UTSC to Eaton Centre","userLocation":{"lat":43.785,"lng":-79.188},"mode":"walking"}'
```

Response includes: `routeId`, `summary`, `polyline.points`, and normalized `steps`.
```