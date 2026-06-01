/**
 * SkyWatch Netlify Function - Aircraft Proxy
 * Fetches ADS-B data from free APIs, never exposes keys to frontend.
 */

const ADSBLOL_KEY = process.env.ADSBLOL_API_KEY || '';
const OPENSKY_USER = process.env.OPENSKY_USERNAME || '';
const OPENSKY_PASS = process.env.OPENSKY_PASSWORD || '';
const AIRPLANESLIVE_KEY = process.env.AIRPLANESLIVE_API_KEY || '';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function errorResponse(status, message) {
  return {
    statusCode: status,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Validate query parameters
 */
function validateParams(params) {
  const lat = parseFloat(params.lat);
  const lon = parseFloat(params.lon);
  const radiusKm = parseFloat(params.radiusKm) || 50;

  if (isNaN(lat) || isNaN(lon)) {
    return { error: 'Missing or invalid lat/lon' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { error: 'lat must be -90..90, lon must be -180..180' };
  }
  if (radiusKm < 1 || radiusKm > 500) {
    return { error: 'radiusKm must be 1..500' };
  }

  return { lat, lon, radiusKm };
}

// ─── ADSB.lol ────────────────────────────────────────────────
async function fetchAdsbLol(lat, lon, radiusKm) {
  // ADSB.lol uses /v2/point/{lat}/{lon}/{radiusNm}
  const radiusNm = Math.round(radiusKm * 0.539957);
  const url = `https://api.adsb.lol/v2/point/${lat}/${lon}/${radiusNm}`;

  const headers = {};
  if (ADSBLOL_KEY) headers['Authorization'] = `Bearer ${ADSBLOL_KEY}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`ADSB.lol returned ${res.status}`);

  const data = await res.json();
  const acList = data.ac || data.aircraft || [];

  return {
    aircraft: acList.map((a) => ({
      icao24: a.hex || a.icao24 || '',
      callsign: (a.flight || a.callsign || '').trim(),
      lat: a.lat ?? null,
      lon: a.lon ?? null,
      altitude_ft: a.alt_baro ?? a.altitude ?? null,
      ground_speed_kmh: a.gs != null ? Math.round(a.gs * 1.852) : null,
      track_deg: a.track ?? null,
      vertical_rate: a.baro_rate ?? a.vertRate ?? null,
      aircraft_type: a.t || a.type || null,
      source: 'adsb.lol',
    })),
    sourceUsed: 'adsb.lol',
  };
}

// ─── OpenSky Network ─────────────────────────────────────────
async function fetchOpenSky(lat, lon, radiusKm) {
  // OpenSky bounding box approximation
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const params = new URLSearchParams({
    lamin: String(lat - latDelta),
    lamax: String(lat + latDelta),
    lomin: String(lon - lonDelta),
    lomax: String(lon + lonDelta),
  });

  const url = `https://opensky-network.org/api/states/all?${params}`;
  const headers = {};

  if (OPENSKY_USER && OPENSKY_PASS) {
    headers['Authorization'] =
      'Basic ' + Buffer.from(`${OPENSKY_USER}:${OPENSKY_PASS}`).toString('base64');
  }

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);

  const data = await res.json();
  const states = data.states || [];

  return {
    aircraft: states.map((s) => ({
      icao24: s[0] || '',
      callsign: (s[1] || '').trim(),
      lon: s[5] ?? null,
      lat: s[6] ?? null,
      altitude_ft: s[7] != null ? Math.round(s[7] * 3.28084) : null,
      ground_speed_kmh: s[9] != null ? Math.round(s[9] * 3.6) : null,
      track_deg: s[10] ?? null,
      vertical_rate: s[11] != null ? Math.round(s[11] * 196.85) : null,
      aircraft_type: null, // OpenSky doesn't provide type in states endpoint
      source: 'opensky',
    })),
    sourceUsed: 'opensky',
  };
}

// ─── Airplanes.live ──────────────────────────────────────────
async function fetchAirplanesLive(lat, lon, radiusKm) {
  const radiusNm = Math.round(radiusKm * 0.539957);
  const url = `https://api.airplanes.live/v2/point/${lat}/${lon}/${radiusNm}`;

  const headers = {};
  if (AIRPLANESLIVE_KEY) headers['Authorization'] = `Bearer ${AIRPLANESLIVE_KEY}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Airplanes.live returned ${res.status}`);

  const data = await res.json();
  const acList = data.ac || [];

  return {
    aircraft: acList.map((a) => ({
      icao24: a.hex || '',
      callsign: (a.flight || '').trim(),
      lat: a.lat ?? null,
      lon: a.lon ?? null,
      altitude_ft: a.alt_baro ?? null,
      ground_speed_kmh: a.gs != null ? Math.round(a.gs * 1.852) : null,
      track_deg: a.track ?? null,
      vertical_rate: a.baro_rate ?? null,
      aircraft_type: a.t || null,
      source: 'airplanes.live',
    })),
    sourceUsed: 'airplanes.live',
  };
}

// ─── Main Handler ────────────────────────────────────────────
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  const validation = validateParams(event.queryStringParameters || {});
  if (validation.error) {
    return errorResponse(400, validation.error);
  }

  const { lat, lon, radiusKm } = validation;

  // Try sources in order: ADSB.lol → OpenSky → Airplanes.live
  const sources = [
    { name: 'adsb.lol', fn: () => fetchAdsbLol(lat, lon, radiusKm) },
    { name: 'opensky', fn: () => fetchOpenSky(lat, lon, radiusKm) },
    { name: 'airplanes.live', fn: () => fetchAirplanesLive(lat, lon, radiusKm) },
  ];

  let lastError = null;

  for (const src of sources) {
    try {
      const result = await src.fn();
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          aircraft: result.aircraft,
          sourceUsed: result.sourceUsed,
          fetchedAt: new Date().toISOString(),
        }),
      };
    } catch (err) {
      console.warn(`[${src.name}] Failed: ${err.message}`);
      lastError = err.message;
    }
  }

  return errorResponse(
    502,
    `All ADS-B sources failed. Last error: ${lastError}`
  );
};
