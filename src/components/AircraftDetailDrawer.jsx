import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plane, ArrowUpRight, Gauge, MapPin, Clock, Navigation } from 'lucide-react';
import { getAirlineFromCallsign, getAircraftTypeLabel } from '../lib/airlineLookup.js';
import { isA380 } from '../lib/aircraftNormalize.js';

export default function AircraftDetailDrawer({ aircraft, onClose, darkMode }) {
  const t = darkMode ? {
    bgCard: '#141414', bgTertiary: '#1f1f1f', border: '#2e2e2e',
    textPrimary: '#fafafa', textSecondary: '#a3a3a3', textTertiary: '#525252',
    accent: '#fafafa', accentText: '#0a0a0a',
  } : {
    bgCard: '#ffffff', bgTertiary: '#e8e8e8', border: '#d4d4d4',
    textPrimary: '#0a0a0a', textSecondary: '#525252', textTertiary: '#a3a3a3',
    accent: '#171717', accentText: '#ffffff',
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [onClose]);

  if (!aircraft) return null;

  const airline = getAirlineFromCallsign(aircraft.callsign);
  const a380 = isA380(aircraft.aircraft_type);
  const pred = aircraft.prediction;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 animate-slide-in"
           style={{ background: t.bgCard, border: `1px solid ${t.border}` }}>

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ background: t.bgTertiary, color: t.textPrimary }}>
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
               style={{ background: t.bgTertiary }}>
            <Plane className="w-7 h-7" style={{ color: t.textPrimary }} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: t.textPrimary }}>
              {aircraft.callsign || 'Unknown'}
            </div>
            <div className="text-sm" style={{ color: t.textSecondary }}>
              {airline && <span className="font-medium mr-2" style={{ color: t.textPrimary }}>{airline}</span>}
              {getAircraftTypeLabel(aircraft.aircraft_type)}
            </div>
            {a380 && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: t.accent, color: t.accentText }}>Airbus A380</span>
            )}
          </div>
        </div>

        {/* Prediction */}
        {pred && (
          <div className="mb-5 p-4 rounded-xl" style={{ background: t.bgTertiary, border: `1px solid ${t.border}` }}>
            <div className="text-sm font-semibold mb-2" style={{ color: t.textPrimary }}>Predicted Closest Approach</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs" style={{ color: t.textTertiary }}>Distance</div>
                <div className="text-xl font-bold" style={{ color: t.textPrimary }}>{pred.closestDistanceKm} km</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: t.textTertiary }}>Time Until</div>
                <div className="text-xl font-bold" style={{ color: t.textPrimary }}>{pred.minutesUntilClosest} min</div>
              </div>
            </div>
          </div>
        )}

        {/* Flight Data Grid */}
        <div className="space-y-3">
          <DetailRow icon={ArrowUpRight} label="Altitude"
            value={aircraft.altitude_ft != null ? `${aircraft.altitude_ft.toLocaleString()} ft` : 'N/A'} t={t} />
          <DetailRow icon={Gauge} label="Ground Speed"
            value={aircraft.ground_speed_kmh != null ? `${aircraft.ground_speed_kmh} km/h` : 'N/A'} t={t} />
          <DetailRow icon={Navigation} label="Track / Heading"
            value={aircraft.track_deg != null ? `${Math.round(aircraft.track_deg)}°` : 'N/A'} t={t} />
          <DetailRow icon={MapPin} label="Position"
            value={aircraft.lat != null ? `${aircraft.lat.toFixed(4)}, ${aircraft.lon.toFixed(4)}` : 'N/A'} t={t} />
          <DetailRow icon={Clock} label="Data Source"
            value={aircraft.source || 'Unknown'} t={t} capitalize />
          <DetailRow icon={Plane} label="ICAO Address"
            value={aircraft.icao24 || 'N/A'} t={t} mono />
        </div>

        {/* Vertical Rate */}
        {aircraft.vertical_rate != null && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <DetailRow icon={ArrowUpRight} label="Vertical Rate"
              value={`${aircraft.vertical_rate > 0 ? '+' : ''}${aircraft.vertical_rate} ft/min`} t={t} />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function DetailRow({ icon: Icon, label, value, t, capitalize, mono }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2" style={{ color: t.textTertiary }}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono' : ''}`}
            style={{ color: t.textPrimary }}>
        {value}
      </span>
    </div>
  );
}
