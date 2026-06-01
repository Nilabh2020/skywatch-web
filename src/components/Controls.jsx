import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Settings2, RefreshCw, Plane, Filter, X, Check, Search } from 'lucide-react';

export default function Controls({
  searchRadiusKm, setSearchRadiusKm,
  alertRadiusKm, setAlertRadiusKm,
  lookaheadMin, setLookaheadMin,
  a380Only, setA380Only,
  autoRefresh, setAutoRefresh,
  refreshInterval, setRefreshInterval,
  onManualRefresh, refreshing,
  sourceUsed, fetchedAt,
  availableAirlines, selectedAirlines, toggleAirline, clearAirlines,
  availableTypes, selectedTypes, toggleType, clearTypes,
  darkMode,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sectionStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' };
  const btnInactive = { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
  const btnActive = { background: 'var(--accent)', color: 'var(--accent-text)', border: '1px solid var(--accent)' };

  return (
    <div className="p-4 rounded-xl space-y-4 transition-colors duration-300 animate-fade-in" style={sectionStyle}>
      <div className="flex items-center gap-2 font-semibold">
        <Settings2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        Controls
      </div>

      {/* Search Radius */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          <span>Search radius</span>
          <span style={{ color: 'var(--text-primary)' }}>{searchRadiusKm} km</span>
        </div>
        <input type="range" min={25} max={200} step={5} value={searchRadiusKm}
          onChange={(e) => setSearchRadiusKm(Number(e.target.value))} className="w-full" />
      </div>

      {/* Alert Radius */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          <span>Alert radius</span>
          <span style={{ color: 'var(--text-primary)' }}>{alertRadiusKm} km</span>
        </div>
        <input type="range" min={0.5} max={10} step={0.5} value={alertRadiusKm}
          onChange={(e) => setAlertRadiusKm(Number(e.target.value))} className="w-full" />
      </div>

      {/* Lookahead */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Lookahead time</label>
        <div className="flex gap-1">
          {[2, 5, 10].map((min) => (
            <button key={min} onClick={() => setLookaheadMin(min)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={lookaheadMin === min ? btnActive : btnInactive}>
              {min} min
            </button>
          ))}
        </div>
      </div>

      {/* Airline & Model Filters Button */}
      <button onClick={() => setFiltersOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        style={selectedAirlines.length > 0 || selectedTypes.length > 0 ? btnActive : btnInactive}>
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Airline & Model Filters
          {(selectedAirlines.length > 0 || selectedTypes.length > 0) && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              {selectedAirlines.length + selectedTypes.length}
            </span>
          )}
        </span>
      </button>

      {/* Full-screen Filter Modal */}
      {filtersOpen && createPortal(
        <FilterModal
          availableAirlines={availableAirlines}
          selectedAirlines={selectedAirlines}
          toggleAirline={toggleAirline}
          clearAirlines={clearAirlines}
          availableTypes={availableTypes}
          selectedTypes={selectedTypes}
          toggleType={toggleType}
          clearTypes={clearTypes}
          onClose={() => setFiltersOpen(false)}
          darkMode={darkMode}
        />,
        document.body
      )}

      {/* Toggles row */}
      <div className="flex gap-2">
        <button onClick={() => setA380Only(!a380Only)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={a380Only ? btnActive : btnInactive}>
          <Plane className="w-3.5 h-3.5" /> A380 Only
        </button>
        <button onClick={() => setAutoRefresh(!autoRefresh)}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={autoRefresh ? btnActive : btnInactive}>
          Auto {autoRefresh ? 'On' : 'Off'}
        </button>
      </div>

      {/* Refresh interval */}
      {autoRefresh && (
        <div className="animate-fade-in">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Refresh interval</label>
          <div className="flex gap-1">
            {[15, 30, 60].map((sec) => (
              <button key={sec} onClick={() => setRefreshInterval(sec)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={refreshInterval === sec ? btnActive : btnInactive}>
                {sec}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual refresh */}
      <button onClick={onManualRefresh} disabled={refreshing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        style={btnInactive}>
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Fetching...' : 'Refresh Now'}
      </button>

      {/* Status */}
      <div className="pt-2 text-[10px] space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
        <div>Source: <span style={{ color: 'var(--text-secondary)' }}>{sourceUsed || '—'}</span></div>
        <div>Updated: <span style={{ color: 'var(--text-secondary)' }}>{fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : '—'}</span></div>
      </div>
    </div>
  );
}

/**
 * Full-screen filter modal with large readable text and touch-friendly targets.
 * Uses hardcoded colors instead of CSS variables since portals render outside
 * the themed root element where CSS custom properties are defined.
 */
function FilterModal({
  availableAirlines, selectedAirlines, toggleAirline, clearAirlines,
  availableTypes, selectedTypes, toggleType, clearTypes,
  onClose, darkMode,
}) {
  const [activeTab, setActiveTab] = useState('airlines');
  const [searchQuery, setSearchQuery] = useState('');

  // Hardcoded theme colors for portal (CSS vars don't inherit through createPortal)
  const t = darkMode ? {
    bgCard: '#141414',
    bgTertiary: '#1f1f1f',
    bgPrimary: '#0a0a0a',
    border: '#2e2e2e',
    textPrimary: '#fafafa',
    textSecondary: '#a3a3a3',
    textTertiary: '#525252',
    accent: '#fafafa',
    accentText: '#0a0a0a',
  } : {
    bgCard: '#ffffff',
    bgTertiary: '#e8e8e8',
    bgPrimary: '#ffffff',
    border: '#d4d4d4',
    textPrimary: '#0a0a0a',
    textSecondary: '#525252',
    textTertiary: '#a3a3a3',
    accent: '#171717',
    accentText: '#ffffff',
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const totalSelected = selectedAirlines.length + selectedTypes.length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      {/* Backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal card */}
      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] flex flex-col rounded-2xl shadow-2xl animate-fade-in"
           style={{ background: t.bgCard, border: `1px solid ${t.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
             style={{ borderColor: t.border }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: t.textPrimary }}>Watchlist Filters</h2>
            <p className="text-sm mt-0.5" style={{ color: t.textSecondary }}>
              {totalSelected > 0
                ? `${totalSelected} filter${totalSelected !== 1 ? 's' : ''} active — showing only matches`
                : 'No filters — showing all aircraft'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: t.bgTertiary, color: t.textPrimary }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: t.border }}>
          <button onClick={() => setActiveTab('airlines')}
            className="flex-1 py-3.5 text-sm font-semibold transition-colors duration-200"
            style={{
              color: activeTab === 'airlines' ? t.textPrimary : t.textTertiary,
              borderBottom: activeTab === 'airlines' ? `2px solid ${t.accent}` : '2px solid transparent',
            }}>
            Airlines ({selectedAirlines.length})
          </button>
          <button onClick={() => setActiveTab('models')}
            className="flex-1 py-3.5 text-sm font-semibold transition-colors duration-200"
            style={{
              color: activeTab === 'models' ? t.textPrimary : t.textTertiary,
              borderBottom: activeTab === 'models' ? `2px solid ${t.accent}` : '2px solid transparent',
            }}>
            Aircraft Models ({selectedTypes.length})
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textTertiary }} />
            <input
              type="text"
              placeholder={activeTab === 'airlines' ? 'Search airlines...' : 'Search aircraft models...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
              style={{ background: t.bgTertiary, color: t.textPrimary, border: `1px solid ${t.border}` }}
              autoFocus
            />
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {activeTab === 'airlines' && (() => {
            const q = searchQuery.toLowerCase();
            const filtered = q ? availableAirlines.filter((a) => a.toLowerCase().includes(q)) : availableAirlines;
            return (
            <>
              {selectedAirlines.length > 0 && (
                <button onClick={clearAirlines}
                  className="w-full py-2.5 mb-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: t.bgTertiary, color: t.textSecondary, border: `1px solid ${t.border}` }}>
                  Clear all airlines
                </button>
              )}
              {filtered.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: t.textTertiary }}>No airlines match "{searchQuery}"</p>
              )}
              {filtered.map((airline) => {
                const isSelected = selectedAirlines.includes(airline);
                return (
                  <button key={airline} onClick={() => toggleAirline(airline)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: isSelected ? t.bgTertiary : 'transparent',
                      border: `1px solid ${isSelected ? t.border : 'transparent'}`,
                    }}>
                    <span className="text-base font-medium" style={{ color: isSelected ? t.textPrimary : t.textSecondary }}>
                      {airline}
                    </span>
                    {isSelected && <Check className="w-5 h-5" style={{ color: t.textPrimary }} />}
                  </button>
                );
              })}
            </>
            );
          })()}

          {activeTab === 'models' && (() => {
            const q = searchQuery.toLowerCase();
            const filtered = q ? availableTypes.filter(({ code, label }) => label.toLowerCase().includes(q) || code.toLowerCase().includes(q)) : availableTypes;
            return (
            <>
              {selectedTypes.length > 0 && (
                <button onClick={clearTypes}
                  className="w-full py-2.5 mb-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: t.bgTertiary, color: t.textSecondary, border: `1px solid ${t.border}` }}>
                  Clear all models
                </button>
              )}
              {filtered.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: t.textTertiary }}>No models match "{searchQuery}"</p>
              )}
              {filtered.map(({ code, label }) => {
                const isSelected = selectedTypes.includes(code);
                return (
                  <button key={code} onClick={() => toggleType(code)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: isSelected ? t.bgTertiary : 'transparent',
                      border: `1px solid ${isSelected ? t.border : 'transparent'}`,
                    }}>
                    <div>
                      <span className="text-base font-medium block" style={{ color: isSelected ? t.textPrimary : t.textSecondary }}>
                        {label}
                      </span>
                      <span className="text-xs font-mono" style={{ color: t.textTertiary }}>{code}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5" style={{ color: t.textPrimary }} />}
                  </button>
                );
              })}
            </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: t.border }}>
          <button onClick={onClose}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: t.accent, color: t.accentText }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
