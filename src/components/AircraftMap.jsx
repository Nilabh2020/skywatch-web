import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAircraftLabel, isA380 } from '../lib/aircraftNormalize.js';
import { getAirlineFromCallsign } from '../lib/airlineLookup.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#fff;border:3px solid #000;border-radius:50%;box-shadow:0 0 0 4px rgba(0,0,0,0.1);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function aircraftIcon(ac) {
  const a380 = isA380(ac.aircraft_type);
  const size = a380 ? 14 : 10;
  const bg = a380 ? '#000' : '#737373';
  const border = a380 ? '#000' : '#525252';
  const anim = a380 ? 'animation:pulse-subtle 2s infinite;' : '';
  return new L.DivIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2px solid ${border};border-radius:50%;${anim}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapRecenter({ lat, lon }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (prev.current !== `${lat},${lon}`) {
      map.setView([lat, lon], map.getZoom(), { animate: true });
      prev.current = `${lat},${lon}`;
    }
  }, [lat, lon, map]);
  return null;
}

/**
 * Forces Leaflet to recalculate container size after mount and on prop changes.
 * Fixes the "bottom half blank tile" bug caused by flex/grid layout timing.
 */
function MapInvalidateSize({ aircraft, searchRadiusKm, alertRadiusKm, darkMode }) {
  const map = useMap();
  useEffect(() => {
    // Delay slightly so CSS transitions/layout have settled
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map, aircraft.length, searchRadiusKm, alertRadiusKm, darkMode]);
  return null;
}

export default function AircraftMap({ userLat, userLon, aircraft, alertRadiusKm, searchRadiusKm, darkMode, onAircraftClick }) {
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  const circleColor = darkMode ? '#525252' : '#a3a3a3';
  const alertColor = darkMode ? '#d4d4d4' : '#404040';

  return (
    <MapContainer center={[userLat, userLon]} zoom={10}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
      zoomControl={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url={tileUrl}
      />
      <MapRecenter lat={userLat} lon={userLon} />
      <MapInvalidateSize aircraft={aircraft} searchRadiusKm={searchRadiusKm} alertRadiusKm={alertRadiusKm} darkMode={darkMode} />

      <Marker position={[userLat, userLon]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      <Circle center={[userLat, userLon]} radius={alertRadiusKm * 1000}
        pathOptions={{ color: alertColor, fillColor: alertColor, fillOpacity: 0.06, weight: 1 }} />

      <Circle center={[userLat, userLon]} radius={searchRadiusKm * 1000}
        pathOptions={{ color: circleColor, fillColor: circleColor, fillOpacity: 0.02, weight: 1, dashArray: '6 4' }} />

      {aircraft.map((ac) => {
        if (ac.lat == null || ac.lon == null) return null;
        const airline = getAirlineFromCallsign(ac.callsign);
        return (
          <Marker key={ac.icao24} position={[ac.lat, ac.lon]} icon={aircraftIcon(ac)}
            eventHandlers={{ click: () => onAircraftClick?.(ac) }}>
            <Popup>
              <div className="text-sm space-y-1 min-w-[150px]" style={{ color: 'var(--text-primary)' }}>
                <div className="font-bold text-base">{ac.callsign || 'No callsign'}</div>
                {airline && <div className="font-medium opacity-70">{airline}</div>}
                <div className="opacity-60">{getAircraftLabel(ac.aircraft_type)}</div>
                <div className="pt-1 opacity-60">Alt: {ac.altitude_ft != null ? `${ac.altitude_ft.toLocaleString()} ft` : 'N/A'}</div>
                <div className="opacity-60">Spd: {ac.ground_speed_kmh != null ? `${ac.ground_speed_kmh} km/h` : 'N/A'}</div>
                <div className="opacity-60">Src: {ac.source}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
