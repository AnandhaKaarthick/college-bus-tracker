import { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Route as RouteIcon, Plus, Trash2, ArrowUp, ArrowDown, 
  Check, AlertCircle, Save, Undo, Sparkles, Navigation, Clock, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

// Custom Numbered Stop Pin
function createNumberedIcon(number, color = '#3B82F6') {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13px;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        transform: translate(-50%, -50%);
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Map Click Listener Component
function MapClickInterceptor({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

// Map Bounds Auto-Fitter
function MapAutoFitter({ stops }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length >= 2) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [stops.length, map]);
  return null;
}

// Preset Routes for quick demonstration
const PRESETS = [
  {
    name: "Tambaram → RIT Express",
    color: "#3B82F6",
    stops: [
      { name: "Tambaram Sanatorium", lat: 12.9279, lng: 80.1215, expected_arrival: "07:30" },
      { name: "Chromepet Bus Stand", lat: 12.9516, lng: 80.1407, expected_arrival: "07:45" },
      { name: "Pallavaram Flyover", lat: 12.9675, lng: 80.1491, expected_arrival: "07:55" },
      { name: "Poonamallee Bypass", lat: 13.0503, lng: 80.0889, expected_arrival: "08:15" },
      { name: "RIT Chennai — Main Gate", lat: 13.0375, lng: 80.0449, expected_arrival: "08:30" }
    ]
  },
  {
    name: "Avadi → RIT Corridor",
    color: "#10B981",
    stops: [
      { name: "Avadi Checkpost", lat: 13.1147, lng: 80.1008, expected_arrival: "07:35" },
      { name: "Paruthipattu Junction", lat: 13.0850, lng: 80.1100, expected_arrival: "07:50" },
      { name: "Sennerkuppam", lat: 13.0560, lng: 80.1170, expected_arrival: "08:05" },
      { name: "RIT Chennai Campus", lat: 13.0375, lng: 80.0449, expected_arrival: "08:25" }
    ]
  }
];

export default function RouteCreatorStudio() {
  const navigate = useNavigate();

  // Route Form State
  const [routeName, setRouteName] = useState('');
  const [routeColor, setRouteColor] = useState('#3B82F6');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [availableBuses, setAvailableBuses] = useState([]);
  
  // Stops & Geometry State
  const [stops, setStops] = useState([]);
  const [snappedPolyline, setSnappedPolyline] = useState([]);
  const [isSnapping, setIsSnapping] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Load existing fleet buses for bus assignment
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/buses`);
        if (res.ok) {
          const data = await res.json();
          setAvailableBuses(data.buses || []);
        }
      } catch (err) {
        console.error("Error fetching fleet buses:", err);
      }
    };
    fetchBuses();
  }, []);

  // Compute road snapping via OSRM whenever stops change (>= 2 stops)
  useEffect(() => {
    if (stops.length < 2) {
      setSnappedPolyline(stops.map(s => [s.lat, s.lng]));
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    const snapToRoads = async () => {
      setIsSnapping(true);
      try {
        // Construct coordinate string: "lng1,lat1;lng2,lat2;..."
        const coordString = stops.map(s => `${s.lng},${s.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const osrmRoute = data.routes[0];
            // GeoJSON coordinates are [lon, lat] -> convert to Leaflet [lat, lon]
            const poly = osrmRoute.geometry.coordinates.map(c => [c[1], c[0]]);
            setSnappedPolyline(poly);
            setDistanceKm(parseFloat((osrmRoute.distance / 1000).toFixed(1)));
            setDurationMin(Math.round(osrmRoute.duration / 60));
            setIsSnapping(false);
            return;
          }
        }
      } catch (err) {
        console.warn("OSRM routing service unavailable or timed out, falling back to direct points:", err);
      }

      // Fallback: direct line between stops
      setSnappedPolyline(stops.map(s => [s.lat, s.lng]));
      // Approximate straight line distance
      let totalDist = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        const dLat = stops[i+1].lat - stops[i].lat;
        const dLng = stops[i+1].lng - stops[i].lng;
        totalDist += Math.sqrt(dLat * dLat + dLng * dLng) * 111;
      }
      setDistanceKm(parseFloat(totalDist.toFixed(1)));
      setDurationMin(Math.round(totalDist * 2.2));
      setIsSnapping(false);
    };

    const timer = setTimeout(snapToRoads, 400);
    return () => clearTimeout(timer);
  }, [stops]);

  // Map Click Handler: Add new stop
  const handleMapClick = (latlng) => {
    const orderNum = stops.length + 1;
    const baseHour = 7 + Math.floor((orderNum * 12) / 60);
    const baseMin = (orderNum * 12) % 60;
    const defaultTime = `${String(baseHour).padStart(2, '0')}:${String(baseMin).padStart(2, '0')}`;

    const newStop = {
      name: `Stop #${orderNum}`,
      lat: parseFloat(latlng.lat.toFixed(6)),
      lng: parseFloat(latlng.lng.toFixed(6)),
      expected_arrival: defaultTime
    };
    setStops(prev => [...prev, newStop]);
    setErrorMsg('');
  };

  const handleUpdateStopName = (index, newName) => {
    setStops(prev => prev.map((s, idx) => idx === index ? { ...s, name: newName } : s));
  };

  const handleUpdateTime = (index, newTime) => {
    setStops(prev => prev.map((s, idx) => idx === index ? { ...s, expected_arrival: newTime } : s));
  };

  const handleRemoveStop = (index) => {
    setStops(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUndoStop = () => {
    setStops(prev => prev.slice(0, -1));
  };

  const handleClearStops = () => {
    setStops([]);
    setSnappedPolyline([]);
    setDistanceKm(0);
    setDurationMin(0);
  };

  const handleLoadPreset = (preset) => {
    setRouteName(preset.name);
    setRouteColor(preset.color);
    setStops(preset.stops);
    setErrorMsg('');
  };

  // Submit and Publish Route
  const handlePublishRoute = async () => {
    if (!routeName.trim()) {
      setErrorMsg("Please enter a Route Name (e.g. Tambaram → RIT Express)");
      return;
    }
    if (stops.length < 2) {
      setErrorMsg("Please drop at least 2 stops on the map before publishing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: routeName.trim(),
        description: `${stops[0].name} to ${stops[stops.length - 1].name} Express Line`,
        color: routeColor,
        bus_id: selectedBusId ? parseInt(selectedBusId) : null,
        stops: stops.map((s, idx) => ({
          name: s.name.trim() || `Stop #${idx + 1}`,
          lat: s.lat,
          lng: s.lng,
          order: idx + 1,
          expected_arrival: s.expected_arrival || "08:00"
        })),
        polyline: snappedPolyline
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData(data.route);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to create route");
      }
    } catch (err) {
      console.error("Route creation error:", err);
      setErrorMsg("Network error communicating with server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      
      {/* Studio Top Header */}
      <div className="p-6 px-8 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Compass size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Route Creator Studio</h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Interactive Road Snapping
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              Click anywhere on the map to sequence stops and auto-snap highway driving routes.
            </p>
          </div>
        </div>

        {/* Quick Demo Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mr-1 hidden lg:inline">
            Quick Presets:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(p)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-blue-500 text-[var(--text-primary)] transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>{p.name.split(' ')[0]} Line</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workspace (Split View) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: Route Config & Stops Sequencer */}
        <div className="w-full lg:w-[460px] border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col overflow-hidden">
          
          <div className="p-6 border-b border-[var(--border)] space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Route Name
              </label>
              <input
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Tambaram → RIT Express"
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-3.5 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                  Route Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={routeColor}
                    onChange={(e) => setRouteColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-bold uppercase text-[var(--text-muted)]">{routeColor}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                  Assign Bus Unit
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                  <option value="">Unassigned</option>
                  {availableBuses.map(b => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.name} ({b.vehicle_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-[var(--bg-tertiary)] p-3 rounded-2xl border border-[var(--border)] text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Stops</div>
                <div className="text-xl font-black text-[var(--text-primary)]">{stops.length}</div>
              </div>
              <div className="bg-[var(--bg-tertiary)] p-3 rounded-2xl border border-[var(--border)] text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Distance</div>
                <div className="text-xl font-black text-blue-500">{distanceKm} <span className="text-[10px]">KM</span></div>
              </div>
              <div className="bg-[var(--bg-tertiary)] p-3 rounded-2xl border border-[var(--border)] text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Est. Time</div>
                <div className="text-xl font-black text-green-500">{durationMin} <span className="text-[10px]">MIN</span></div>
              </div>
            </div>
          </div>

          {/* Stops List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                Stop Sequence ({stops.length})
              </h4>
              {stops.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleUndoStop}
                    className="text-[10px] font-bold text-[var(--text-muted)] hover:text-blue-500 flex items-center gap-1 uppercase"
                  >
                    <Undo size={12} /> Undo
                  </button>
                  <button 
                    onClick={handleClearStops}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase ml-2"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {stops.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-3xl text-slate-400 space-y-2">
                <Navigation size={28} className="mx-auto text-blue-500 animate-pulse" />
                <p className="text-xs font-bold text-[var(--text-muted)]">No stops added yet.</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Click on the interactive map on the right to place Stop #1, Stop #2, etc.
                </p>
              </div>
            ) : (
              stops.map((stop, idx) => (
                <div 
                  key={idx} 
                  className="bg-[var(--bg-tertiary)] p-3.5 rounded-2xl border border-[var(--border)] flex items-center gap-3 group"
                >
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md"
                    style={{ background: routeColor }}
                  >
                    #{idx + 1}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      value={stop.name}
                      onChange={(e) => handleUpdateStopName(idx, e.target.value)}
                      placeholder={`Stop #${idx + 1} Name`}
                      className="w-full bg-transparent font-bold text-xs text-[var(--text-primary)] outline-none border-b border-transparent focus:border-blue-500"
                    />
                    <div className="text-[9px] font-medium text-[var(--text-muted)]">
                      {stop.lat}, {stop.lng}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={stop.expected_arrival}
                      onChange={(e) => handleUpdateTime(idx, e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1 text-[10px] font-bold text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={() => handleRemoveStop(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove stop"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handlePublishRoute}
              disabled={isSubmitting || stops.length < 2 || !routeName.trim()}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                stops.length >= 2 && routeName.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-98'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Save size={18} />
              {isSubmitting ? "PUBLISHING ROUTE..." : "PUBLISH ROUTE TO FLEET"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Leaflet Map */}
        <div className="flex-1 relative overflow-hidden bg-slate-900">
          
          {/* Snapping Overlay Indicator */}
          {isSnapping && (
            <div className="absolute top-4 right-4 z-[1000] bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold flex items-center gap-2 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Tracing Chennai Highways (OSRM)...</span>
            </div>
          )}

          {/* Map Helper Prompt */}
          <div className="absolute top-4 left-4 z-[1000] bg-[var(--bg-secondary)]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[var(--border)] shadow-lg max-w-sm pointer-events-none">
            <div className="text-[10px] font-black uppercase text-blue-500 tracking-wider mb-0.5">Map Action</div>
            <div className="text-xs font-bold text-[var(--text-primary)]">
              {stops.length === 0 ? "Click to place the Starting Stop" : `Click to place Stop #${stops.length + 1}`}
            </div>
          </div>

          <MapContainer
            center={[13.045, 80.11]} // Default Chennai West corridor
            zoom={12}
            className="w-full h-full"
            style={{ background: '#0f172a' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickInterceptor onMapClick={handleMapClick} />
            <MapAutoFitter stops={stops} />

            {/* Placed Stop Pins */}
            {stops.map((stop, idx) => (
              <Marker
                key={idx}
                position={[stop.lat, stop.lng]}
                icon={createNumberedIcon(idx + 1, routeColor)}
              >
                <Popup>
                  <div className="p-1">
                    <div className="font-black text-xs uppercase" style={{ color: routeColor }}>
                      #{idx + 1} {stop.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Arrival: {stop.expected_arrival}</div>
                    <div className="text-[9px] text-slate-400">{stop.lat}, {stop.lng}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Road-snapped Polyline */}
            {snappedPolyline.length > 0 && (
              <Polyline
                positions={snappedPolyline}
                pathOptions={{
                  color: routeColor,
                  weight: 6,
                  opacity: 0.85,
                  lineJoin: 'round',
                  lineCap: 'round'
                }}
              />
            )}
          </MapContainer>
        </div>

      </div>

      {/* SUCCESS PUBLISHED MODAL */}
      {successData && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-[40px] border border-green-500/30 p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500 rounded-3xl flex items-center justify-center text-green-500 mx-auto">
              <Check size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Route Published!</h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">
                <span className="text-[var(--text-primary)] font-bold">{successData.name}</span> has been saved to the database with {successData.stops_count} stops and road-snapped geometry.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/monitor')}
                className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all"
              >
                View Live Monitor
              </button>
              <button
                onClick={() => navigate('/admin/schedules')}
                className="py-3.5 px-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-blue-500 text-[var(--text-primary)] font-black text-xs uppercase tracking-wider transition-all"
              >
                Edit Timetable
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
