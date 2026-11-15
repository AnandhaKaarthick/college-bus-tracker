import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import MapComponent from "../components/MapComponent";
import BottomSheet from "../components/BottomSheet";
import StopStepper from "../components/tracking/StopStepper";
import StopDetailModal from "../components/tracking/StopDetailModal";
import { useBusContext } from "../context/BusContext";
import { API_BASE_URL, WS_BASE_URL } from "../config";

export default function TrackingPage() {
  const { myBus, setMyBus } = useBusContext();
  const [modalData, setModalData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(myBus?.route_id ? String(myBus.route_id) : "1");

  useEffect(() => {
    let isMounted = true;

    const fetchRoutes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        
        const routesList = Array.isArray(data.routes) ? data.routes : [];
        setAvailableRoutes(routesList);
        
        const currentRoute = routesList.find(r => String(r.id) === String(selectedRouteId)) || routesList[0];
        if (currentRoute) {
          setRouteData(currentRoute);
          if (!selectedRouteId) setSelectedRouteId(String(currentRoute.id));
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
      }
    };
    fetchRoutes();

    // Listen for live updates and newly published routes
    let ws;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'bus_position' && String(msg.route_id) === String(selectedRouteId)) {
            setMyBus(prev => ({ ...prev, ...msg }));
          } else if (msg.type === 'route_created' || msg.type === 'route_deleted') {
            fetchRoutes();
          }
        } catch (e) {
          console.error("WS error in TrackingPage:", e);
        }
      };
    } catch (wsErr) {
      console.warn("WebSocket initialization skipped:", wsErr);
    }

    return () => {
      isMounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedRouteId, setMyBus]);

  function handleStopTap(stop, eta) {
    setModalData({ stop, busETA: eta || 12, walkETA: 5 });
  }

  const stops = routeData?.stops || [];

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <PageHeader title="Live Tracking" showBack />

      {/* Map — top portion */}
      <div className="absolute inset-0 top-14 lg:left-[420px]">
        {/* Route Selector Overlay */}
        {availableRoutes.length > 0 && (
          <div className="absolute top-4 left-4 z-[1000] flex gap-2 overflow-x-auto max-w-[calc(100vw-32px)] pb-2 scrollbar-none">
            {availableRoutes.map(route => (
              <button
                key={route.id}
                onClick={() => {
                  setSelectedRouteId(String(route.id));
                  setRouteData(route);
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg whitespace-nowrap transition-all ${
                  String(selectedRouteId) === String(route.id)
                    ? 'bg-[var(--accent-primary)] text-white shadow-blue-500/25'
                    : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white border border-slate-200'
                }`}
              >
                {route.name ? (route.name.split(' ')[0] || route.name) : `Route ${route.id}`}
              </button>
            ))}
          </div>
        )}
        <MapComponent hideUI={true} initialRouteId={selectedRouteId} />
      </div>

      {/* Bottom sheet — stop stepper */}
      <BottomSheet defaultExpanded={false}>
        {/* Bus info strip */}
        <div className="mb-4 pb-4 border-b border-[var(--border)]">
          <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg">
            {routeData ? `${myBus?.bus_id || selectedRouteId} · ${routeData.name}` : "Loading Route..."}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="pill pill-success">● On Track</span>
            <span className="pill pill-danger">🔴 {myBus?.occupancy?.toUpperCase() || "LOW"}</span>
            <span className="text-sm font-semibold text-[var(--text-muted)]">
              ~{stops.length * 5 || 45} min total
            </span>
          </div>
          <div className="mt-4 p-3 bg-[var(--info-bg)] rounded-[var(--radius-md)] flex items-center gap-2 border border-[var(--info)]/20">
            <span>📶</span>
            <span className="text-sm font-semibold text-[var(--info)]">Live WiFi available on this bus</span>
          </div>
        </div>

        {/* Stop stepper */}
        {stops.length > 0 ? (
          <StopStepper
            stops={stops}
            busState={myBus}
            studentLocation={null}
            onStopTap={handleStopTap}
          />
        ) : (
          <div className="py-8 text-center text-sm font-bold text-[var(--text-muted)]">
            Loading route stops and real-time ETAs...
          </div>
        )}
      </BottomSheet>

      {/* Stop detail modal (conditional) */}
      {modalData && (
        <StopDetailModal
          stop={modalData.stop}
          busETA={modalData.busETA}
          walkETA={modalData.walkETA}
          onClose={() => setModalData(null)}
          onSetAlert={(stop) => {
            alert(`Alert set for ${stop.name}`);
            setModalData(null);
          }}
        />
      )}
    </div>
  );
}
