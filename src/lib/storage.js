/**
 * LocalStorage persistence for SkyWatch settings and history.
 */

const KEYS = {
  AIRLINES: 'skywatch_airlines',
  TYPES: 'skywatch_types',
  SETTINGS: 'skywatch_settings',
  HISTORY: 'skywatch_history',
};

export function loadSelectedAirlines() {
  try {
    const raw = localStorage.getItem(KEYS.AIRLINES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSelectedAirlines(list) {
  localStorage.setItem(KEYS.AIRLINES, JSON.stringify(list));
}

export function loadSelectedTypes() {
  try {
    const raw = localStorage.getItem(KEYS.TYPES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSelectedTypes(list) {
  localStorage.setItem(KEYS.TYPES, JSON.stringify(list));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * History: array of { date, icao24, callsign, airline, type, timestamp }
 * Capped at 500 entries.
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addHistoryEntry(entry) {
  const history = loadHistory();
  history.unshift({ ...entry, timestamp: Date.now() });
  // Keep last 500
  if (history.length > 500) history.length = 500;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export function getHistoryStats() {
  const history = loadHistory();
  const today = new Date().toDateString();

  const todayEntries = history.filter((h) => new Date(h.timestamp).toDateString() === today);

  const byAirline = {};
  const byType = {};
  let totalToday = 0;
  let a380Count = 0;

  for (const entry of todayEntries) {
    totalToday++;
    if (entry.airline) {
      byAirline[entry.airline] = (byAirline[entry.airline] || 0) + 1;
    }
    if (entry.type) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
    }
    if (entry.type === 'A388') a380Count++;
  }

  // Top airlines
  const topAirlines = Object.entries(byAirline)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top types
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  return {
    totalToday,
    a380Count,
    topAirlines,
    topTypes,
    totalAllTime: history.length,
  };
}
