import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Shield, Users, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleButton from './ThemeToggleButton';

function MapFixes() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);
  return null;
}

const busIcon = (color = "#3B82F6") => new L.DivIcon({
  className: 'custom-bus-icon',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="relative bg-[var(--bg-secondary)] p-2 rounded-full shadow-md border-2" style="border-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.8 2 11 2 11.2V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [buses, setBuses] = useState({});
  const collegePosition = [13.0494, 80.0249];

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/buses');
        if (response.ok) {
          const data = await response.json();
          const busesObj = {};
          data.buses.forEach(bus => { busesObj[bus.bus_id] = bus; });
          setBuses(busesObj);
        }
      } catch (err) { console.error("Admin API Error:", err); }
    };
    fetchBuses();

    const ws = new WebSocket('ws://localhost:8000/ws/buses');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'bus_position') {
        setBuses(prev => ({
          ...prev,
          [msg.bus_id]: { ...prev[msg.bus_id], ...msg, status: 'on_track' }
        }));
      }
    };
    return () => ws.close();
  }, []);

  const occupancyColor = (lvl) => {
    if (lvl === 'full') return theme === 'dark' ? '#F87171' : '#DC2626';
    if (lvl === 'medium') return theme === 'dark' ? '#FCD34D' : '#D97706';
    return theme === 'dark' ? '#4ADE80' : '#16A34A';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--bg-primary)] w-full overflow-hidden text-[var(--text-primary)] transition-colors duration-500">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-96 bg-[var(--bg-secondary)] border-r border-[var(--border)] shadow-2xl z-10 flex flex-col h-1/2 md:h-full">
        <div className="p-8 border-b border-[var(--border)] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--accent-primary)] rounded-lg shadow-lg shadow-blue-500/20"><Shield size={20} className="text-[var(--text-inverse)]" /></div>
              <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Fleet Control</h1>
            </div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Global Telemetry Monitor</p>
          </div>
          <ThemeToggleButton />
        </div>
        
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {Object.values(buses).length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)] italic text-sm">Syncing with fleet...</div>
          ) : (
            Object.values(buses).map(bus => (
              <div key={bus.bus_id} className="bg-[var(--bg-tertiary)] p-5 rounded-3xl border border-[var(--border)] shadow-sm hover:border-[var(--accent-primary)] transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors border border-[var(--border)]">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <div className="font-black text-[var(--text-primary)] tracking-tight">{bus.name}</div>
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{bus.vehicle_number}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    bus.status === 'on_track' ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/20' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                  }`}>
                    {bus.status || 'offline'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Live Speed</p>
                    <div className="text-xl font-black text-[var(--text-primary)]">{bus.speed || 0} <span className="text-xs font-bold text-[var(--text-muted)] uppercase">KMH</span></div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Occupancy</p>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: occupancyColor(bus.occupancy) }} />
                      <span className="text-sm font-black uppercase" style={{ color: occupancyColor(bus.occupancy) }}>{bus.occupancy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 h-1/2 md:h-full relative z-0">
        <MapContainer center={collegePosition} zoom={15} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {Object.values(buses).filter(b => b.lat).map(bus => (
            <Marker key={bus.bus_id} position={[bus.lat, bus.lng]} icon={busIcon(occupancyColor(bus.occupancy))}>
              <Popup><b>{bus.name}</b></Popup>
            </Marker>
          ))}
          <MapFixes />
        </MapContainer>
        
        <div className="absolute bottom-8 left-8 z-[1000] hidden md:flex items-center gap-4">
          <div className="glass p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fleet Connectivity</div>
              <div className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tighter">{Object.values(buses).filter(b => b.status === 'on_track').length} Active Units</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
