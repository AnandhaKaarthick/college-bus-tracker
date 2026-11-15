import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertTriangle, Map, List, Compass } from 'lucide-react';
import RouteGrid from './components/RouteGrid';
import LiveMapPanel from './components/LiveMapPanel';
import BusTelemetryModal from './components/BusTelemetryModal';
import { API_BASE_URL, WS_BASE_URL } from '../../config';

export default function ActiveRoutesMonitor() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState({});
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileTab, setMobileTab] = useState('map'); // 'map' or 'routes'

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();

    // WebSocket for live bus positions and route changes
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'bus_position') {
          setBuses(prev => ({
            ...prev,
            [msg.bus_id]: { ...prev[msg.bus_id], ...msg }
          }));
        } else if (msg.type === 'route_created' || msg.type === 'route_deleted') {
          fetchRoutes();
        }
      } catch (e) {
        console.error("WS error in monitor:", e);
      }
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/routes/${routeToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRoutes(prev => prev.filter(r => r.id !== String(routeToDelete.id)));
        if (selectedRouteId === String(routeToDelete.id)) {
          setSelectedRouteId(null);
        }
        setRouteToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting route:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--bg-primary)]">
      
      {/* MOBILE SEGMENTED VIEW SWITCHER (< lg) */}
      <div className="lg:hidden flex items-center justify-between p-3 px-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] shrink-0 gap-2">
        <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border)] flex-1 max-w-xs">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'map' ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-muted)]'
            }`}
          >
            <Map size={14} />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMobileTab('routes')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'routes' ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-muted)]'
            }`}
          >
            <List size={14} />
            <span>Routes ({routes.length})</span>
          </button>
        </div>

        <button 
          onClick={() => navigate('/admin/routes')}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider shrink-0"
        >
          <Plus size={14} />
          <span>New Route</span>
        </button>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Sidebar: Route List */}
        <div className={`
          ${mobileTab === 'routes' ? 'flex flex-col flex-1 w-full' : 'hidden'} 
          lg:flex lg:flex-col lg:w-80 border-r border-[var(--border)] bg-[var(--bg-secondary)] shrink-0 overflow-hidden
        `}>
          <div className="hidden lg:flex p-6 border-b border-[var(--border)] justify-between items-center">
            <div>
              <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)] uppercase">Active Routes</h2>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Select to filter map</p>
            </div>
            <button 
              onClick={() => navigate('/admin/routes')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
              title="Create New Route in Studio"
            >
              <Plus size={15} />
              <span>New</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <RouteGrid 
              routes={routes} 
              selectedRouteId={selectedRouteId} 
              onRouteSelect={(id) => {
                setSelectedRouteId(id);
                // On mobile, auto-switch to map view when a route is picked!
                setMobileTab('map');
              }} 
              onDeleteRoute={(route) => setRouteToDelete(route)}
              buses={Object.values(buses)}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Main Panel: Map */}
        <div className={`
          ${mobileTab === 'map' ? 'flex-1 relative block h-full' : 'hidden'} 
          lg:flex-1 lg:relative lg:block
        `}>
          <LiveMapPanel 
            buses={Object.values(buses)} 
            selectedRouteId={selectedRouteId} 
            routes={routes}
            onBusSelect={setSelectedBusId}
          />
        </div>

      </div>

      {/* Telemetry Modal */}
      {selectedBusId && (
        <BusTelemetryModal 
          bus={buses[selectedBusId]} 
          onClose={() => setSelectedBusId(null)} 
        />
      )}

      {/* DELETE ROUTE CONFIRMATION MODAL */}
      {routeToDelete && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-[35px] border border-red-500/30 p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Delete Route?</h3>
              <p className="text-xs font-semibold text-[var(--text-muted)] mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">{routeToDelete.name}</span>? This will permanently remove its stops, timetable schedules, and unassign any fleet buses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setRouteToDelete(null)}
                disabled={isDeleting}
                className="py-3 px-4 rounded-xl border border-[var(--border)] text-xs font-black uppercase text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? "Deleting..." : "Delete Route"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
