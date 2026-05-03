import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, Phone, Navigation, AlertTriangle, Users, ChevronRight, X, Info, Clock, MapPin, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleButton from './ThemeToggleButton';

// --- LEAFLET ASSET FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- CUSTOM ICONS ---
const busIcon = (color = "#3B82F6", heading = 0) => new L.DivIcon({
  className: 'custom-bus-icon',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12" style="transform: rotate(${heading}deg)">
      <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ripple"></div>
      <div class="relative bg-white p-2.5 rounded-full shadow-2xl border-4" style="border-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.8 2 11 2 11.2V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const stopIcon = (status = 'upcoming', theme = 'light') => {
  const colors = {
    passed: theme === 'dark' ? '#1E3A5F' : '#CBD5E1',
    next: '#2563EB',
    upcoming: theme === 'dark' ? '#4A6B8A' : '#64748B'
  };
  const color = colors[status] || colors.upcoming;
  return new L.DivIcon({
    className: 'custom-stop-icon',
    html: `
      <div class="flex items-center justify-center">
        <div class="w-4 h-4 rounded-full border-4 bg-white transition-all duration-500" style="border-color: ${color}; transform: ${status === 'next' ? 'scale(1.3)' : 'scale(1)'}"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// --- SUB-COMPONENTS ---
function MapFixes({ bounds }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 100); }, [map]);
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [100, 100] }); }, [bounds, map]);
  return null;
}

export default function MapComponent({ hideUI = false, initialRouteId = null }) {
  const { theme } = useTheme();
  const [buses, setBuses] = useState({});
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(initialRouteId);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [sheetState, setSheetState] = useState('collapsed'); 
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  
  const collegePosition = [13.0494, 80.0249];
  
  useEffect(() => {
    if (initialRouteId) setSelectedRouteId(initialRouteId);
  }, [initialRouteId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [routesRes, busesRes] = await Promise.all([
          fetch('http://localhost:8000/api/routes'),
          fetch('http://localhost:8000/api/buses')
        ]);
        const routesData = await routesRes.json();
        const busesData = await busesRes.json();
        setRoutes(routesData.routes);
        const busesMap = {};
        busesData.buses.forEach(b => { if (b.lat) busesMap[b.bus_id] = b; });
        setBuses(busesMap);
      } catch (err) { console.error("API Error:", err); }
    };
    init();

    const ws = new WebSocket('ws://localhost:8000/ws/buses');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'bus_position') {
        setBuses(prev => ({ ...prev, [msg.bus_id]: msg }));
      }
    };
    return () => ws.close();
  }, []);

  const selectedRoute = useMemo(() => {
    const found = routes.find(r => String(r.id) === String(selectedRouteId));
    console.log("Map Debug: Selected Route", { id: selectedRouteId, found: !!found });
    return found;
  }, [routes, selectedRouteId]);
  
  const activeBus = useMemo(() => Object.values(buses).find(b => String(b.route_id) === String(selectedRouteId)), [buses, selectedRouteId]);
  
  const stopsWithStatus = useMemo(() => {
    if (!selectedRoute || !selectedRoute.stops) return [];
    
    let nextIdx = 0;
    if (activeBus && selectedRoute.stops.length > 0) {
      let minDist = 999;
      selectedRoute.stops.forEach((s, idx) => {
        const d = getDistance(activeBus.lat, activeBus.lng, s.lat, s.lng);
        if (d < minDist) { minDist = d; nextIdx = idx; }
      });
    }
    
    return selectedRoute.stops.map((s, idx) => {
      let status = 'upcoming';
      if (idx < nextIdx) status = 'passed';
      else if (idx === nextIdx) status = 'next';
      return { ...s, status };
    });
  }, [selectedRoute, activeBus]);

  const nextStop = useMemo(() => stopsWithStatus.find(s => s.status === 'next'), [stopsWithStatus]);

  const eta = useMemo(() => {
    if (!activeBus || !nextStop) return null;
    const dist = getDistance(activeBus.lat, activeBus.lng, nextStop.lat, nextStop.lng);
    const speed = activeBus.speed > 5 ? activeBus.speed : 20;
    return Math.ceil((dist / speed) * 60);
  }, [activeBus, nextStop]);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const handleStopTap = (stop) => {
    const busEta = 5 + Math.floor(Math.random() * 15);
    const walkEta = 8 + Math.floor(Math.random() * 5);
    setModalData({
        stop,
        bus_eta: busEta,
        walk_eta: walkEta,
        buffer: busEta - walkEta,
        recommendation: busEta - walkEta > 5 ? "You have plenty of time. Walk comfortably." : "Walk quickly! Bus arrives soon.",
        type: busEta - walkEta > 5 ? "safe" : "urgent"
    });
    setShowModal(true);
  };

  const occupancyColor = (lvl) => {
    if (lvl === 'full') return theme === 'dark' ? '#F87171' : '#DC2626';
    if (lvl === 'medium') return theme === 'dark' ? '#FCD34D' : '#D97706';
    return theme === 'dark' ? '#4ADE80' : '#16A34A';
  };

  const mapContent = (
    <>
      <MapContainer center={collegePosition} zoom={13} className="h-full w-full" zoomControl={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {selectedRoute && selectedRoute.polyline && (
          <Polyline positions={selectedRoute.polyline} color={theme === 'dark' ? '#60A5FA' : '#2563EB'} weight={6} opacity={0.6} />
        )}
        {stopsWithStatus.map((s, idx) => (
          <Marker key={s.stop_id || idx} position={[s.lat, s.lng]} icon={stopIcon(s.status, theme)}>
            <Popup>{s.name}</Popup>
          </Marker>
        ))}
        {Object.values(buses).map(b => (
          <Marker key={b.bus_id} position={[b.lat, b.lng]} icon={busIcon(occupancyColor(b.occupancy), b.heading)}>
            <Popup><b>{b.name}</b></Popup>
          </Marker>
        ))}
        {activeBus && nextStop && <MapFixes bounds={L.latLngBounds([[activeBus.lat, activeBus.lng], [nextStop.lat, nextStop.lng]])} />}
        {!activeBus && selectedRoute && selectedRoute.polyline && selectedRoute.polyline.length > 0 && (
          <MapFixes bounds={L.latLngBounds(selectedRoute.polyline)} />
        )}
        {!activeBus && !selectedRoute && <MapFixes />}
      </MapContainer>
    </>
  );

  if (hideUI) {
    return <div className="h-full w-full relative z-0">{mapContent}</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      
      {/* 1. TOP OVERLAY: SEARCH BAR */}
      <div className="absolute top-6 left-0 w-full px-6 z-[1000] pointer-events-none">
        <div className="max-w-xl mx-auto flex items-center gap-3 pointer-events-auto">
          <div className="flex-1 glass rounded-3xl p-3 flex items-center gap-4 px-6 shadow-2xl border-white/20">
            <Search className="text-[var(--text-muted)]" size={22} />
            <input 
              type="text" 
              placeholder="Where are you going?" 
              className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)] text-base font-bold"
            />
            <div className="h-6 w-px bg-[var(--border)] mx-1"></div>
            <button className="text-[var(--text-muted)] p-1 hover:text-[var(--accent-primary)] transition-colors"><Menu size={22} /></button>
          </div>
          <ThemeToggleButton />
        </div>
      </div>

      {/* 2. SIDEBAR (Desktop) */}
      <div className="hidden md:flex w-[420px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] flex-col z-10 shadow-2xl">
        <div className="p-10 pb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[var(--accent-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
               <Navigation size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)] uppercase">Campus Transit</h1>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">RIT Chennai Fleet</p>
            </div>
          </div>

          <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Active Routes</h3>
          <div className="space-y-3">
            {routes.map((r, idx) => (
              <button 
                key={r.id || idx}
                onClick={() => setSelectedRouteId(r.id)}
                className={`w-full p-5 rounded-[28px] flex items-center gap-5 transition-all border-2 ${
                  selectedRouteId === r.id ? 'bg-[var(--accent-primary-light)] border-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] border-transparent hover:border-[var(--border)]'
                }`}
              >
                <div className={`p-3 rounded-2xl ${selectedRouteId === r.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] shadow-sm'}`}>
                  <Navigation size={22} />
                </div>
                <div className="text-left flex-1">
                  <div className={`font-black text-lg leading-none mb-1 ${selectedRouteId === r.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {r.name}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Live Track · {(r.stops && r.stops.length) || 0} Stops</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-4 scrollbar-hide">
          {selectedRoute && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">Route Progress</h3>
                <div className="space-y-1">
                  {stopsWithStatus.map((stop, idx) => (
                    <button 
                      key={stop.stop_id || idx}
                      onClick={() => handleStopTap(stop)}
                      className={`w-full group flex items-center gap-5 p-3 rounded-2xl transition-all hover:bg-[var(--bg-tertiary)] ${stop.status === 'next' ? 'scale-105' : ''}`}
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 z-10 ${
                          stop.status === 'passed' ? 'bg-[var(--text-muted)] border-[var(--text-muted)]' : 
                          stop.status === 'next' ? 'bg-[var(--accent-primary)] border-white ring-4 ring-blue-500/20' : 'bg-white border-[var(--border)]'
                        }`}></div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-black ${stop.status === 'next' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>{stop.name}</div>
                        {stop.status === 'next' && <div className="text-[10px] font-black uppercase text-[var(--accent-primary)] animate-pulse">Next Stop · {eta} min</div>}
                        {stop.status === 'passed' && <div className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Departed</div>}
                      </div>
                      <ChevronRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. MAP */}
      <div className="flex-1 relative z-0 order-1 md:order-2">
        {mapContent}

        <button className="absolute bottom-28 right-6 md:bottom-10 md:right-10 z-[1000] bg-red-600 text-white p-5 rounded-3xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-3 font-black">
          <AlertTriangle size={26} /> <span className="hidden sm:inline uppercase tracking-tighter text-lg">SOS</span>
        </button>
      </div>

      {/* 4. MOBILE SHEET */}
      <AnimatePresence>
        <motion.div 
          className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--bg-secondary)] rounded-t-[50px] z-[2000] shadow-2xl border-t border-[var(--border)] overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: sheetState === 'collapsed' ? '75%' : sheetState === 'half' ? '35%' : '0%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.y < -50) setSheetState(sheetState === 'collapsed' ? 'half' : 'full');
            if (info.offset.y > 50) setSheetState(sheetState === 'full' ? 'half' : 'collapsed');
          }}
        >
          <div className="w-full flex justify-center py-5 cursor-grab" onClick={() => setSheetState(sheetState === 'full' ? 'collapsed' : 'half')}>
            <div className="w-16 h-1.5 bg-[var(--border)] rounded-full"></div>
          </div>

          <div className="px-10 pb-12 overflow-y-auto max-h-[85vh]">
            {!selectedRouteId ? (
              <div className="py-4">
                <h2 className="text-2xl font-black mb-8 tracking-tighter">Live Routes</h2>
                <div className="space-y-4">
                  {routes.map((r, idx) => (
                    <button key={r.id || idx} onClick={() => { setSelectedRouteId(r.id); setSheetState('half'); }} className="w-full p-6 bg-[var(--bg-tertiary)] rounded-[32px] flex items-center gap-5 text-left border-2 border-transparent active:border-[var(--accent-primary)] transition-all">
                      <div className="p-4 bg-[var(--accent-primary-light)] text-[var(--accent-primary)] rounded-2xl shadow-sm"><Navigation size={28} /></div>
                      <div className="flex-1">
                        <div className="font-black text-xl leading-tight mb-1">{r.name}</div>
                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Tap to Track Live</div>
                      </div>
                      <ChevronRight className="text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-10 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">{selectedRoute.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">On Track</div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Bus 04 • RIT Express</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRouteId(null)} className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center text-[var(--text-muted)]"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-tertiary)] rounded-[32px] p-8 border border-[var(--border)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={40} /></div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Arriving In</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black ${eta < 5 ? 'text-red-500 animate-pulse' : 'text-[var(--accent-primary)]'}`}>{eta || '--'}</span>
                      <span className="text-[var(--text-muted)] font-black text-sm uppercase">mins</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-[var(--bg-tertiary)] rounded-[32px] p-6 border border-[var(--border)] flex flex-col items-center justify-center gap-1">
                        <Users size={22} style={{ color: activeBus ? occupancyColor(activeBus.occupancy) : 'var(--text-muted)' }} />
                        <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: activeBus ? occupancyColor(activeBus.occupancy) : 'var(--text-muted)' }}>{activeBus?.occupancy || 'low'}</span>
                    </div>
                    <button className="flex-1 bg-[var(--accent-primary)] text-white rounded-[32px] p-6 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Phone size={24} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">Stop-by-Stop Progress</h3>
                  <div className="space-y-2">
                    {stopsWithStatus.map((stop, idx) => (
                        <button key={stop.stop_id || idx} onClick={() => handleStopTap(stop)} className="w-full flex items-center gap-6 p-4 rounded-3xl hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)] transition-all group">
                            <div className="relative flex flex-col items-center">
                                <div className={`w-4 h-4 rounded-full border-4 z-10 transition-all ${
                                    stop.status === 'passed' ? 'bg-[var(--text-muted)] border-[var(--border)]' : 
                                    stop.status === 'next' ? 'bg-[var(--accent-primary)] border-white ring-8 ring-blue-500/10' : 'bg-white border-[var(--border)]'
                                }`}></div>
                            </div>
                            <div className="flex-1 text-left">
                                <div className={`text-lg font-black leading-tight ${stop.status === 'next' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>{stop.name}</div>
                                {stop.status === 'next' && <div className="text-[10px] font-black uppercase text-[var(--accent-primary)] mt-1">Approaching Now</div>}
                                {stop.status === 'passed' && <div className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Passed</div>}
                                {stop.status === 'upcoming' && <div className="text-[10px] font-bold uppercase text-[var(--text-muted)]">~ {5 * (stopsWithStatus.indexOf(stop) - (stopsWithStatus.indexOf(nextStop) >= 0 ? stopsWithStatus.indexOf(nextStop) : 0))} min</div>}
                            </div>
                            <ChevronRight size={18} className="text-[var(--text-muted)] opacity-50" />
                        </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 5. STOP DETAIL MODAL */}
      <AnimatePresence>
        {showModal && modalData && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000]"></motion.div>
            <motion.div 
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                className="fixed inset-x-6 bottom-10 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] bg-[var(--bg-secondary)] rounded-[40px] shadow-2xl z-[3001] p-8 border border-[var(--border)]"
            >
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Stop Detail</div>
                        <h3 className="text-2xl font-black tracking-tighter">{modalData.stop.name}</h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-3 bg-[var(--bg-tertiary)] rounded-2xl text-[var(--text-muted)]"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[var(--accent-primary-light)] p-5 rounded-[32px] border border-[var(--accent-primary)]/20">
                        <div className="flex items-center gap-2 mb-2 text-[var(--accent-primary)]">
                            <Navigation size={16} />
                            <span className="text-[10px] font-black uppercase">Bus ETA</span>
                        </div>
                        <div className="text-4xl font-black text-[var(--accent-primary)]">{modalData.bus_eta}<span className="text-sm font-bold ml-1 uppercase">min</span></div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] p-5 rounded-[32px] border border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)]">
                            <User size={16} />
                            <span className="text-[10px] font-black uppercase">Walking</span>
                        </div>
                        <div className="text-4xl font-black text-[var(--text-primary)]">{modalData.walk_eta}<span className="text-sm font-bold ml-1 uppercase">min</span></div>
                    </div>
                </div>

                <div className={`p-6 rounded-[32px] border mb-8 flex items-start gap-4 ${modalData.type === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}>
                    <Info size={24} className="shrink-0 mt-1" />
                    <div>
                        <p className="text-sm font-black leading-tight mb-1">{modalData.recommendation}</p>
                        <p className="text-[10px] font-bold uppercase opacity-70">{modalData.buffer} min buffer available</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className="py-4 bg-[var(--bg-tertiary)] rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-[var(--border)] transition-colors">Show on Map</button>
                    <button className="py-4 bg-[var(--accent-primary)] text-white rounded-2xl font-black text-sm uppercase tracking-tighter shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Alert Me</button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
