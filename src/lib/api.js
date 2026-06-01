/**
 * Frontend API client for SkyWatch
 * All calls go through Netlify Functions - no keys exposed
 */

export async function fetchAircraft(lat, lon, radiusKm) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radiusKm: String(radiusKm),
  });

  const res = await fetch(`/.netlify/functions/aircraft?${params}`);

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
