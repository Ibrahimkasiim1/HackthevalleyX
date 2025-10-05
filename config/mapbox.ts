// config/mapbox.ts
export const MapboxConfig = {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2FtdGpoaWEiLCJhIjoiY21nY3h3em84MWkzYzJpb2MxNm5wYmswZCJ9.i9YTVGMpwNRsNS2JBFMv5A',
    styleURL: 'mapbox://styles/mapbox/streets-v12', // Optional: Custom map style
  } as const;