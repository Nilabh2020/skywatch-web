import { useEffect, useRef } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import AircraftCard from './AircraftCard.jsx';

export default function AlertPanel({ alerts, notificationEnabled, onToggleNotifications, soundEnabled, onToggleSound, onAircraftClick }) {
  const prevAlertIds = useRef(new Set());
  const audioRef = useRef(null);

  useEffect(() => {
    const newIds = new Set(alerts.map((a) => a.icao24));
    const hasNew = alerts.some((a) => !prevAlertIds.current.has(a.icao24));

    if (hasNew && alerts.length > 0) {
      if (notificationEnabled && Notification.permission === 'granted') {
        const top = alerts[0];
        new Notification('SkyWatch Alert', {
          body: `${top.callsign || 'Aircraft'} predicted ${top.prediction.closestDistanceKm} km away in ${top.prediction.minutesUntilClosest} min`,
          tag: 'skywatch-alert',
        });
      }
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
    prevAlertIds.current = newIds;
  }, [alerts, notificationEnabled, soundEnabled]);

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";

  return (
    <div className="flex flex-col h-full">
      {/* Toggle buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onToggleNotifications}
          className={btnBase}
          style={{
            background: notificationEnabled ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: notificationEnabled ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: `1px solid ${notificationEnabled ? 'var(--accent)' : 'var(--border)'}`,
          }}>
          {notificationEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          {notificationEnabled ? 'On' : 'Off'}
        </button>
        <button onClick={onToggleSound}
          className={btnBase}
          style={{
            background: soundEnabled ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: soundEnabled ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: `1px solid ${soundEnabled ? 'var(--accent)' : 'var(--border)'}`,
          }}>
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 stagger-children">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in" style={{ color: 'var(--text-tertiary)' }}>
            <BellOff className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No overhead alerts right now</p>
          </div>
        ) : (
          alerts.map((ac) => (
            <div key={ac.icao24} onClick={() => onAircraftClick?.(ac)} className="cursor-pointer">
              <AircraftCard aircraft={ac} />
            </div>
          ))
        )}
      </div>

      <audio ref={audioRef} preload="auto" src="/radar-ping.wav" />
    </div>
  );
}
