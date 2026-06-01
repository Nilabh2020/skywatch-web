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

  // Build full predicted path (future positions)
  const futurePath = [];
  for (let i = 0; i <= steps; i++) {
    const d = stepDist * i;
    const pos = destination(lat, lon, track_deg, d);
    futurePath.push([pos.lat, pos.lon]);
  }

  // Estimate past path (reverse direction from current position)
  // Use ground speed to estimate how far back we can reasonably project
  // Assume we've been tracking for ~30 min max or until speed/track data is unreliable
  const pastMinutes = Math.min(30, lookaheadMin * 3);
  const pastDistKm = (speedKmh * pastMinutes) / 60;
  const pastSteps = 15;
  const pastStepDist = pastDistKm / pastSteps;
  const reverseTrack = (track_deg + 180) % 360;

  const pastPath = [];
  for (let i = pastSteps; i >= 0; i--) {
    const d = pastStepDist * i;
    const pos = destination(lat, lon, reverseTrack, d);
    pastPath.push([pos.lat, pos.lon]);
  }

  // Estimate flight hours since takeoff based on altitude climb profile
  // Simple heuristic: assume average climb rate of 1500 ft/min to cruise
  // Then cruise at current altitude. This is approximate.
  let estimatedFlightHours = null;
  if (aircraft.altitude_ft != null && aircraft.vertical_rate != null) {
    // If climbing, estimate time to reach current altitude
    if (aircraft.vertical_rate > 0) {
      estimatedFlightHours = Math.round((aircraft.altitude_ft / 1500 / 60) * 10) / 10;
    } else {
      // If level or descending, use distance traveled estimate
      // Assume average cruise speed of 850 km/h
      const avgCruiseSpeed = 850;
      const distTraveledKm = speedKmh * pastMinutes / 60;
      estimatedFlightHours = Math.round((distTraveledKm / avgCruiseSpeed) * 10) / 10;
      if (estimatedFlightHours < 0.5) estimatedFlightHours = 0.5; // Minimum reasonable
    }
  } else if (ground_speed_kmh > 200) {
    // Rough estimate based on speed alone
    estimatedFlightHours = Math.round((pastMinutes / 60) * 10) / 10;
  }

  return {
    closestDistanceKm: Math.round(minDist * 100) / 100,
    minutesUntilClosest: Math.round(minTimeMin * 10) / 10,
    closestLat,
    closestLon,
    futurePath,   // Array of [lat, lon] for predicted route
    pastPath,     // Array of [lat, lon] for estimated past route
    estimatedFlightHours,
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
