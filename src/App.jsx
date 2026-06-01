import { useState, useEffect, useRef, useCallback } from 'react';
import LocationGate from './components/LocationGate.jsx';
import AircraftMap from './components/AircraftMap.jsx';
import AlertPanel from './components/AlertPanel.jsx';
import Controls from './components/Controls.jsx';
import AircraftDetailDrawer from './components/AircraftDetailDrawer.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import { fetchAircraft } from './lib/api.js';
import { getAlerts } from './lib/prediction.js';
import { ALL_AIRLINES, ALL_AIRCRAFT_TYPES, getAirlineFromCallsign } from './lib/airlineLookup.js';
import { loadSelectedAirlines, saveSelectedAirlines, loadSelectedTypes, saveSelectedTypes, addHistoryEntry, getHistoryStats } from './lib/storage.js';
import { Radar, Moon, Sun, BarChart3 } from 'lucide-react';

export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Location state
  const [location, setLocation] = useState(null);

  // Data state
  const [aircraft, setAircraft] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sourceUsed, setSourceUsed] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Control state
  const [searchRadiusKm, setSearchRadiusKm] = useState(50);
  const [alertRadiusKm, setAlertRadiusKm] = useState(3);
  const [lookaheadMin, setLookaheadMin] = useState(5);
  const [a380Only, setA380Only] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Filter state – initialized from localStorage
  const [selectedAirlines, setSelectedAirlines] = useState(() => loadSelectedAirlines());
  const [selectedTypes, setSelectedTypes] = useState(() => loadSelectedTypes());

  // Persist filters on change
  useEffect(() => { saveSelectedAirlines(selectedAirlines); }, [selectedAirlines]);
  useEffect(() => { saveSelectedTypes(selectedTypes); }, [selectedTypes]);

  // Detail drawer
  const [selectedAircraft, setSelectedAircraft] = useState(null);

  // Stats
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(getHistoryStats());

  // Track which icao24s have been logged to history this session
  const loggedThisSession = useRef(new Set());

  // Static catalogs
  const availableAirlines = ALL_AIRLINES;
  const availableTypes = ALL_AIRCRAFT_TYPES;

  const toggleAirline = (airline) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]
    );
  };
  const clearAirlines = () => setSelectedAirlines([]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const clearTypes = () => setSelectedTypes([]);

  // Apply all filters to aircraft list
  const filteredAircraft = aircraft.filter((ac) => {
    if (a380Only && ac.aircraft_type !== 'A388') return false;
    if (selectedAirlines.length > 0) {
      const airline = getAirlineFromCallsign(ac.callsign);
      if (!selectedAirlines.includes(airline)) return false;
    }
    if (selectedTypes.length > 0) {
      if (!selectedTypes.includes(ac.aircraft_type)) return false;
    }
    return true;
  });

  // Alert settings
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Dedup tracker
  const alertDedup = useRef(new Map());
  const DEDUP_WINDOW_MS = 10 * 60 * 1000;

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Fetch aircraft data
  const loadData = useCallback(async () => {
    if (!location) return;
    setRefreshing(true);
    setError(null);

    try {
      const data = await fetchAircraft(location.lat, location.lon, searchRadiusKm);
      const acList = data.aircraft || [];
      setAircraft(acList);
      setSourceUsed(data.sourceUsed);
      setFetchedAt(data.fetchedAt);

      const predicted = getAlerts(
        location.lat,
        location.lon,
        acList,
        alertRadiusKm,
        lookaheadMin,
        a380Only
      );

      // Log new alerts to history
      const now = Date.now();
      let newLogAdded = false;
      predicted.forEach((ac) => {
        const last = alertDedup.current.get(ac.icao24);
        if (!last || now - last >= DEDUP_WINDOW_MS) {
          alertDedup.current.set(ac.icao24, now);
          // Add to persistent history (once per session per icao)
          if (!loggedThisSession.current.has(ac.icao24)) {
            loggedThisSession.current.add(ac.icao24);
            addHistoryEntry({
              icao24: ac.icao24,
              callsign: ac.callsign,
              airline: getAirlineFromCallsign(ac.callsign),
              type: ac.aircraft_type,
              date: new Date().toDateString(),
            });
            newLogAdded = true;
          }
        }
      });

      if (newLogAdded) setStats(getHistoryStats());
      setAlerts(predicted);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [location, searchRadiusKm, alertRadiusKm, lookaheadMin, a380Only]);

  useEffect(() => {
    if (location) loadData();
  }, [location, loadData]);

  useEffect(() => {
    if (!autoRefresh || !location) return;
    const id = setInterval(loadData, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshInterval, location, loadData]);

  useEffect(() => {
    if (aircraft.length > 0 && location) {
      const predicted = getAlerts(
        location.lat,
        location.lon,
        aircraft,
        alertRadiusKm,
        lookaheadMin,
        a380Only
      );
      setAlerts(predicted);
    }
  }, [alertRadiusKm, lookaheadMin, a380Only, aircraft, location]);

  const toggleNotifications = async () => {
    if (!notificationEnabled) {
      if (!('Notification' in window)) {
        setError('Browser does not support notifications.');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationEnabled(true);
      } else {
        setError('Notification permission denied.');
      }
    } else {
      setNotificationEnabled(false);
    }
  };

  // Landing screen
  if (!location) {
    return <LocationGate onLocationAccepted={setLocation} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div className="h-screen flex flex-col transition-colors duration-300"
         style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header – fixed 48px */}
      <header className="flex-none flex items-center justify-between px-5 h-12 border-b transition-colors duration-300"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-2.5">
          <Radar className="w-5 h-5 animate-pulse-subtle" style={{ color: 'var(--text-primary)' }} />
          <span className="font-bold text-lg tracking-tight">SkyWatch</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
            {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            {location.manual && <span className="ml-1 opacity-60">(manual)</span>}
          </span>
          <button
            onClick={() => { setShowStats(!showStats); if (!showStats) setStats(getHistoryStats()); }}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: showStats ? 'var(--accent)' : 'var(--bg-tertiary)', color: showStats ? 'var(--accent-text)' : 'var(--text-secondary)' }}
            title="Toggle stats panel">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2.5 text-sm border-b animate-fade-in"
             style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline hover:opacity-70">Dismiss</button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-none overflow-hidden"
           style={{ height: 'calc(100vh - 48px)', minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 360px' }}>
        {/* Map panel */}
        <div className="relative h-full min-h-0 overflow-hidden p-2">
          <AircraftMap
            userLat={location.lat}
            userLon={location.lon}
            aircraft={filteredAircraft}
            alertRadiusKm={alertRadiusKm}
            searchRadiusKm={searchRadiusKm}
            darkMode={darkMode}
            onAircraftClick={setSelectedAircraft}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col h-full min-h-0 overflow-y-auto border-l transition-colors duration-300"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>

          {/* Stats Panel (toggleable) */}
          {showStats && (
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <StatsPanel stats={stats} />
            </div>
          )}

          {/* Alerts */}
          <div className="flex-1 p-4 min-h-[200px]">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--text-tertiary)' }}>
              Overhead Alerts ({alerts.length})
            </h2>
            <AlertPanel
              alerts={alerts}
              notificationEnabled={notificationEnabled}
              onToggleNotifications={toggleNotifications}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onAircraftClick={setSelectedAircraft}
            />
          </div>

          {/* Controls */}
          <div className="p-4 border-t transition-colors duration-300"
               style={{ borderColor: 'var(--border)' }}>
            <Controls
              searchRadiusKm={searchRadiusKm}
              setSearchRadiusKm={setSearchRadiusKm}
              alertRadiusKm={alertRadiusKm}
              setAlertRadiusKm={setAlertRadiusKm}
              lookaheadMin={lookaheadMin}
              setLookaheadMin={setLookaheadMin}
              a380Only={a380Only}
              setA380Only={setA380Only}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
              refreshInterval={refreshInterval}
              setRefreshInterval={setRefreshInterval}
              onManualRefresh={loadData}
              refreshing={refreshing}
              sourceUsed={sourceUsed}
              fetchedAt={fetchedAt}
              availableAirlines={availableAirlines}
              selectedAirlines={selectedAirlines}
              toggleAirline={toggleAirline}
              clearAirlines={clearAirlines}
              availableTypes={availableTypes}
              selectedTypes={selectedTypes}
              toggleType={toggleType}
              clearTypes={clearTypes}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* Aircraft Detail Drawer */}
      {selectedAircraft && (
        <AircraftDetailDrawer
          aircraft={selectedAircraft}
          onClose={() => setSelectedAircraft(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
