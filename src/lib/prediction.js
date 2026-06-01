import { haversine, destination } from './geo.js';

/**
 * Predict closest approach of an aircraft to user position.
 * Returns null if aircraft cannot be predicted.
 */
export function predictClosestApproach(userLat, userLon, aircraft, lookaheadMin) {
  const { lat, lon, ground_speed_kmh, track_deg } = aircraft;

  // Skip if missing essential data
  if (
    lat == null ||
    lon == null ||
    ground_speed_kmh == null ||
    track_deg == null
  ) {
    return null;
  }

  // Ignore very slow aircraft (likely on ground or erroneous)
  if (ground_speed_kmh < 80) return null;

  const speedKmh = ground_speed_kmh;
  const totalDistKm = (speedKmh * lookaheadMin) / 60;
  const steps = 20;
  const stepDist = totalDistKm / steps;

  let minDist = Infinity;
  let minTimeMin = 0;
  let closestLat = lat;
  let closestLon = lon;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * lookaheadMin;
    const d = stepDist * i;
    const pos = destination(lat, lon, track_deg, d);
    const dist = haversine(userLat, userLon, pos.lat, pos.lon);

    if (dist < minDist) {
      minDist = dist;
      minTimeMin = t;
      closestLat = pos.lat;
      closestLon = pos.lon;
    }
  }

  return {
    closestDistanceKm: Math.round(minDist * 100) / 100,
    minutesUntilClosest: Math.round(minTimeMin * 10) / 10,
    closestLat,
    closestLon,
  };
}

/**
 * Process all aircraft and return sorted alerts
 */
export function getAlerts(userLat, userLon, aircraftList, alertRadiusKm, lookaheadMin, a380Only) {
  const results = [];

  for (const ac of aircraftList) {
    if (a380Only && ac.aircraft_type !== 'A388') continue;

    const prediction = predictClosestApproach(userLat, userLon, ac, lookaheadMin);
    if (!prediction) continue;

    if (prediction.closestDistanceKm <= alertRadiusKm) {
      results.push({
        ...ac,
        prediction,
      });
    }
  }

  // Sort by closest distance first, then soonest approach
  results.sort((a, b) => {
    if (a.prediction.closestDistanceKm !== b.prediction.closestDistanceKm) {
      return a.prediction.closestDistanceKm - b.prediction.closestDistanceKm;
    }
    return a.prediction.minutesUntilClosest - b.prediction.minutesUntilClosest;
  });

  return results;
}
