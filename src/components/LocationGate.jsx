import { useState } from 'react';
import { MapPin, ShieldCheck, AlertTriangle, Navigation, Moon, Sun } from 'lucide-react';

export default function LocationGate({ onLocationAccepted, darkMode, setDarkMode }) {
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setShowManual(true);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocationAccepted({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) setError('Location permission denied. Enter your location manually.');
        else if (err.code === err.TIMEOUT) setError('Location request timed out. Try again or enter manually.');
        else setError('Could not determine location. Please enter manually.');
        setShowManual(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) { setError('Please enter valid numeric coordinates.'); return; }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) { setError('Latitude: -90..90, Longitude: -180..180.'); return; }
    setError(null);
    onLocationAccepted({ lat, lon, accuracy: null, manual: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
         style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Theme toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 z-50"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-2 transition-colors duration-300"
               style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <Navigation className="w-9 h-9 animate-pulse-subtle" style={{ color: 'var(--text-primary)' }} />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">SkyWatch</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Get alerts when aircraft may pass overhead.</p>
        </div>

        {/* Primary button */}
        {!showManual && (
          <button
            onClick={requestBrowserLocation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />Locating...</>
            ) : (
              <><MapPin className="w-5 h-5" />Use my accurate location</>
            )}
          </button>
        )}

        {/* Privacy note */}
        {!showManual && (
          <div className="flex items-start gap-3 p-4 rounded-xl transition-colors duration-300"
               style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your location is used only to find nearby aircraft. Exact coordinates are not stored or transmitted to any third party.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl animate-fade-in"
               style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {/* Manual fallback */}
        {showManual && (
          <form onSubmit={handleManualSubmit} className="space-y-4 p-6 rounded-2xl animate-fade-in transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold">Enter location manually</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Latitude</label>
                <input type="number" step="any" placeholder="51.5074" value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none transition-all duration-200 focus:ring-2"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Longitude</label>
                <input type="number" step="any" placeholder="-0.1278" value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none transition-all duration-200 focus:ring-2"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Use this location
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>⚠️ Prediction accuracy depends on location accuracy.</p>
          </form>
        )}

        {!showManual && !error && (
          <button onClick={() => setShowManual(true)}
            className="w-full text-sm py-2 transition-colors duration-200 hover:opacity-70"
            style={{ color: 'var(--text-tertiary)' }}>
            Enter location manually instead
          </button>
        )}
      </div>
    </div>
  );
}
