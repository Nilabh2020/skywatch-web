import { Plane, Clock, MapPin, Gauge, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { getAircraftLabel, isA380 } from '../lib/aircraftNormalize.js';
import { getAirlineFromCallsign, getAircraftTypeLabel } from '../lib/airlineLookup.js';

export default function AircraftCard({ aircraft }) {
  const a380 = isA380(aircraft.aircraft_type);
  const pred = aircraft.prediction;
  const airline = getAirlineFromCallsign(aircraft.callsign);

  return (
    <div className="relative p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] animate-slide-in"
         style={{
           background: 'var(--bg-card)',
           border: `1px solid ${a380 ? 'var(--text-primary)' : 'var(--border)'}`,
         }}>
      {a380 && (
        <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
             style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
          A380
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300"
             style={{ background: 'var(--bg-tertiary)' }}>
          <Plane className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">{aircraft.callsign || 'Unknown'}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {airline && <span className="font-medium mr-1.5" style={{ color: 'var(--text-primary)' }}>{airline}</span>}
            {getAircraftTypeLabel(aircraft.aircraft_type)}
          </div>
        </div>
      </div>

      {/* Prediction */}
      {pred && (
        <div className="mb-3 p-2.5 rounded-lg animate-fade-in"
             style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" />
            Predicted overhead pass
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>Closest: <strong style={{ color: 'var(--text-primary)' }}>{pred.closestDistanceKm} km</strong></span>
            <span>In: <strong style={{ color: 'var(--text-primary)' }}>{pred.minutesUntilClosest} min</strong></span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{aircraft.altitude_ft != null ? `${aircraft.altitude_ft.toLocaleString()} ft` : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" />
          <span>{aircraft.ground_speed_kmh != null ? `${aircraft.ground_speed_kmh} km/h` : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{aircraft.track_deg != null ? `${Math.round(aircraft.track_deg)}°` : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span className="capitalize">{aircraft.source}</span>
        </div>
      </div>
    </div>
  );
}
