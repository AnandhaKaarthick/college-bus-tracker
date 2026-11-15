import { Navigation, Trash2 } from 'lucide-react';

export default function RouteGrid({ routes, selectedRouteId, onRouteSelect, onDeleteRoute, buses, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 w-full bg-[var(--bg-tertiary)] animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* "All Routes" Option */}
      <button
        onClick={() => onRouteSelect(null)}
        className={`w-full text-left p-4 rounded-2xl transition-all border ${
          selectedRouteId === null 
            ? 'bg-[var(--accent-primary)] border-transparent shadow-lg' 
            : 'bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
        }`}
      >
        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedRouteId === null ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>Overview</div>
        <div className={`text-sm font-black uppercase tracking-tight ${selectedRouteId === null ? 'text-white' : 'text-[var(--text-primary)]'}`}>All Active Routes</div>
      </button>

      {routes.map(route => {
        const isActive = selectedRouteId === route.id;
        const activeBuses = buses.filter(b => b.route_id === route.id && b.status === 'on_track').length;
        
        return (
          <div
            key={route.id}
            onClick={() => onRouteSelect(route.id)}
            className={`w-full text-left p-5 rounded-3xl transition-all border group cursor-pointer ${
              isActive 
                ? 'bg-[var(--bg-secondary)] border-[var(--accent-primary)] ring-4 ring-blue-500/10 shadow-xl' 
                : 'bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-[var(--accent-primary)]/50 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]'}`}>
                <Navigation size={18} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                  activeBuses > 0 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}>
                  {activeBuses} Units Live
                </div>
                {onDeleteRoute && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoute(route);
                    }}
                    title="Delete this route"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`font-black text-sm tracking-tight mb-1 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              {route.name}
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span>{route.startStop}</span>
              <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
              <span>{route.endStop}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
