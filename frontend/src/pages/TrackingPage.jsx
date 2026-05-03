import React, { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import MapComponent from "../components/MapComponent";
import BottomSheet from "../components/BottomSheet";
import StopStepper from "../components/tracking/StopStepper";
import StopDetailModal from "../components/tracking/StopDetailModal";
import { useBusContext } from "../context/BusContext";

const DUMMY_STOPS = [
  { stop_id: 1, name: "Ayapakkam Bus Stand", arrival_time: "07:00" },
  { stop_id: 2, name: "Ambattur OT", arrival_time: "07:09" },
  { stop_id: 3, name: "Thirumullaivoyal", arrival_time: "07:18" },
  { stop_id: 4, name: "Avadi Bus Stand" },
  { stop_id: 5, name: "Paruthipattu" },
  { stop_id: 6, name: "Sennerkuppam" },
  { stop_id: 7, name: "Poonamallee Bus Stand" },
  { stop_id: 8, name: "Kuthambakkam" },
  { stop_id: 9, name: "RIT Chennai — Main Gate" }
];
export default function TrackingPage() {
  const { myBus, setMyBus } = useBusContext();
  const [selectedStop, setSelectedStop] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(myBus?.route_id || "1");

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/routes');
        const data = await res.json();
        setAvailableRoutes(data.routes);
        const route = data.routes.find(r => String(r.id) === String(selectedRouteId));
        setRouteData(route);
      } catch (err) {
        console.error("Error fetching routes:", err);
      }
    };
    fetchRoutes();
  }, [selectedRouteId]);

  useEffect(() => {
    // Listen for updates for the currently selected route's bus
    const ws = new WebSocket('ws://localhost:8000/ws/buses');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'bus_position' && String(msg.route_id) === String(selectedRouteId)) {
        // Update myBus with live telemetry if it matches our selected route
        setMyBus(prev => ({ ...prev, ...msg }));
      }
    };
    return () => ws.close();
  }, [selectedRouteId]);

  function handleStopTap(stop, eta, studentLocation) {
    // Dummy logic for testing modal
    setModalData({ stop, busETA: eta || 12, walkETA: 5 });
    setSelectedStop(stop);
  }

  const stops = routeData ? routeData.stops : [];

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <PageHeader title="Live Tracking" showBack />

      {/* Map — top portion */}
      <div className="absolute inset-0 top-14 lg:left-[420px]">
        {/* Route Selector Overlay */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          {availableRoutes.map(route => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all ${
                String(selectedRouteId) === String(route.id)
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white'
              }`}
            >
              {route.name.split(' ')[0]} {/* Show just the first word for brevity */}
            </button>
          ))}
        </div>
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
        <StopStepper
          stops={stops}
          busState={myBus}
          studentLocation={null}
          onStopTap={handleStopTap}
        />
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
