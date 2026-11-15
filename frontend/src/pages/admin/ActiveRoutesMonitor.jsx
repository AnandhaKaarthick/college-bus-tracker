import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();

    // WebSocket for live bus positions
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'bus_position') {
        setBuses(prev => ({
          ...prev,
          [msg.bus_id]: { ...prev[msg.bus_id], ...msg }
        }));
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar: Route List */}
      <div className="w-80 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
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
            onRouteSelect={setSelectedRouteId} 
            buses={Object.values(buses)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main Panel: Map */}
      <div className="flex-1 relative">
        <LiveMapPanel 
          buses={Object.values(buses)} 
          selectedRouteId={selectedRouteId} 
          onBusClick={setSelectedBusId}
          routes={routes}
        />
      </div>

      {/* Telemetry Modal */}
      {selectedBusId && (
        <BusTelemetryModal 
          busId={selectedBusId} 
          onClose={() => setSelectedBusId(null)} 
        />
      )}
    </div>
  );
}
