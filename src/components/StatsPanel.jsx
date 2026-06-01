import { BarChart3, Plane, TrendingUp, Calendar } from 'lucide-react';
import { getAircraftTypeLabel } from '../lib/airlineLookup.js';

export default function StatsPanel({ stats }) {
  if (!stats || stats.totalToday === 0) {
    return (
      <div className="p-4 rounded-xl animate-fade-in"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 font-semibold mb-3">
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          Today's Stats
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No aircraft logged today yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl space-y-3 animate-fade-in"
         style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 font-semibold">
        <BarChart3 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        Today's Stats
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox icon={Plane} label="Total" value={stats.totalToday} />
        <StatBox icon={TrendingUp} label="A380s" value={stats.a380Count} />
        <StatBox icon={Calendar} label="All Time" value={stats.totalAllTime} />
      </div>

      {/* Top Airlines */}
      {stats.topAirlines.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Top Airlines
          </div>
          <div className="space-y-1">
            {stats.topAirlines.map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Types */}
      {stats.topTypes.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Top Aircraft Types
          </div>
          <div className="space-y-1">
            {stats.topTypes.map(({ code, count }) => (
              <div key={code} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{getAircraftTypeLabel(code)}</span>
                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)' }}>
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
      <div className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}
