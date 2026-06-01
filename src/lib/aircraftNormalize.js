/**
 * Aircraft type display helpers
 */

export function getAircraftLabel(type) {
  if (!type) return 'Unknown type';
  if (type === 'A388') return 'Airbus A380';
  return type;
}

export function isA380(type) {
  return type === 'A388';
}
