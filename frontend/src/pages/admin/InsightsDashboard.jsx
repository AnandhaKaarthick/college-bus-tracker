import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, TrendingUp, Fuel, Clock, 
  Download, Filter, ChevronRight, BarChart,
  Play, Pause, FastForward, Map as MapIcon,
  Flame, History
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

export default function InsightsDashboard() {
  const [activeTab, setActiveTab] = useState('efficiency');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating stats calculation
    setTimeout(() => {
      setStats({
        totalKm: 1240,
        avgKm: 82.6,
        estFuel: 310,
        topBuses: [
          { name: 'Bus 04', driver: 'Suresh Raina', km: 112, efficiency: 4.8, grade: 'A' },
          { name: 'Bus 01', driver: 'Ramesh Kumar', km: 95, efficiency: 4.2, grade: 'B' },
          { name: 'Bus 09', driver: 'M.S. Dhoni', km: 88, efficiency: 4.5, grade: 'B' },
          { name: 'Bus 12', driver: 'Virat Kohli', km: 42, efficiency: 3.1, grade: 'D' },
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Fleet Insights</h2>
          <div className="flex gap-4">
            {[
              { id: 'efficiency', label: 'Fuel/KM', icon: Fuel },
              { id: 'history', label: 'Time Machine', icon: History },
              { id: 'heatmap', label: 'Ridership', icon: Flame },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent-primary)] transition-all">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'efficiency' && <EfficiencyView stats={stats} />}
            {activeTab === 'history' && <TimeMachineView />}
            {activeTab === 'heatmap' && <RidershipHeatmapView />}
          </div>
        )}
      </div>
    </div>
  );
}

function EfficiencyView({ stats }) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Total Fleet Distance</div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{stats.totalKm} <span className="text-sm">KM</span></div>
          <p className="text-[10px] font-bold text-green-500 mt-2">↑ 12% from last week</p>
        </div>
        <div className="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Clock size={80}/></div>
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Avg Daily Utilization</div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{stats.avgKm} <span className="text-sm">KM/Bus</span></div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2">Baseline: 80.0 KM</p>
        </div>
        <div className="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Fuel size={80}/></div>
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Est. Fuel Consumption</div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{stats.estFuel} <span className="text-sm">LITERS</span></div>
          <p className="text-[10px] font-bold text-red-500 mt-2">Cost: ₹{stats.estFuel * 96}</p>
        </div>
      </div>

      {/* Performance Distribution Chart */}
      <div className="bg-[var(--bg-secondary)] p-10 rounded-[50px] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Performance Distribution</h3>
          <div className="flex gap-2">
            {['7D', '30D', 'ALL'].map(p => (
              <button key={p} className={`px-4 py-1.5 rounded-full text-[10px] font-black ${p === '7D' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-end gap-4">
          {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
            <div key={i} className="flex-1 bg-[var(--bg-tertiary)] rounded-t-2xl relative group overflow-hidden">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="absolute bottom-0 w-full bg-[var(--accent-primary)] opacity-20 group-hover:opacity-40 transition-opacity"
              />
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h * 0.6}%` }}
                transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                className="absolute bottom-0 w-full bg-[var(--accent-primary)]"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </div>
  );
}

function TimeMachineView() {
  const [timeValue, setTimeValue] = useState(480); // 08:00 AM
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [snapshots, setSnapshots] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/admin/history/snapshots?date=2024-05-01');
        if (res.ok) {
          const data = await res.json();
          setSnapshots(data.snapshots || {});
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching history:", err);
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeValue(prev => (prev >= 1439 ? 0 : prev + 1));
    }, 1000 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const currentFrame = snapshots[timeValue] || [];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Controls Overlay */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-center pointer-events-none">
        <div className="glass p-4 rounded-3xl flex items-center gap-6 shadow-2xl pointer-events-auto border border-white/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-[var(--accent-primary)] text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
            </button>
            <div>
              <div className="text-[24px] font-black text-[var(--text-primary)] tracking-tighter leading-none mb-1">
                {formatTime(timeValue)}
              </div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Playback Time</div>
            </div>
          </div>
          
          <div className="h-10 w-px bg-[var(--border)]" />
          
          <div className="flex items-center gap-2">
            {[1, 5, 10, 30].map(s => (
              <button 
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${playbackSpeed === s ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}
              >
                {s}X
              </button>
            ))}
          </div>
        </div>
        
        <div className="glass p-4 rounded-3xl shadow-2xl pointer-events-auto border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{currentFrame.length} Units</div>
              <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active in snapshot</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 z-0">
        <MapContainer center={[13.0494, 80.0249]} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {currentFrame.map((bus, idx) => (
            <Marker 
              key={`${bus.bus_id}-${idx}`}
              position={[bus.lat, bus.lng]}
              icon={new L.DivIcon({
                className: 'history-bus-icon',
                html: `<div class="w-8 h-8 bg-[var(--accent-primary)] rounded-xl shadow-lg border-2 border-white flex items-center justify-center text-white"><Navigation size={14} /></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          ))}
        </MapContainer>
      </div>

      {/* Timeline Slider */}
      <div className="p-8 bg-[var(--bg-secondary)] border-t border-[var(--border)] shrink-0">
        <div className="relative group">
          <div className="absolute -top-8 left-0 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">00:00</div>
          <div className="absolute -top-8 right-0 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">23:59</div>
          <input 
            type="range"
            min={0}
            max={1439}
            value={timeValue}
            onChange={(e) => setTimeValue(parseInt(e.target.value))}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
          />
        </div>
      </div>
    </div>
  );
}

function RidershipHeatmapView() {
  const [ridership, setRidership] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRidership = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/admin/insights/ridership');
        if (res.ok) {
          const data = await res.json();
          setRidership(data.ridership || []);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching ridership:", err);
        setIsLoading(false);
      }
    };
    fetchRidership();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative z-0">
        <MapContainer center={[13.0494, 80.0249]} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {ridership.map(stop => (
            <CircleMarker 
              key={stop.stop_id}
              center={[stop.lat, stop.lng]}
              radius={stop.avgOccupancy / 2 + 5}
              fillColor="#EF4444"
              color="#EF4444"
              weight={1}
              opacity={0.3}
              fillOpacity={0.6}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-black uppercase tracking-tight">{stop.name}</div>
                  <div className="text-[10px] font-bold text-red-500 uppercase">Avg Occupancy: {stop.avgOccupancy} / {stop.capacity}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Peak Hour: {stop.peakHour}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      
      <div className="p-8 bg-[var(--bg-secondary)] border-t border-[var(--border)] overflow-x-auto shrink-0">
        <div className="flex gap-6">
          <div className="flex-1 min-w-[300px] bg-[var(--bg-tertiary)] p-6 rounded-[32px] border border-[var(--border)]">
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Top 5 Crowded Stops</h4>
            <div className="space-y-4">
              {ridership.sort((a,b) => b.avgOccupancy - a.avgOccupancy).slice(0, 5).map((stop, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{stop.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(stop.avgOccupancy / stop.capacity) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-red-500">{stop.avgOccupancy} PAX</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-80 bg-blue-500/10 p-6 rounded-[32px] border border-blue-500/20 flex flex-col justify-center text-center">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Flame size={24} />
            </div>
            <h4 className="text-sm font-black text-blue-500 uppercase tracking-tight mb-2">Heatmap Insight</h4>
            <p className="text-[10px] font-bold text-blue-500/70 leading-relaxed">
              Main Gate and Porur Junction show 40% higher occupancy during 08:00 AM - 09:00 AM. Recommend adding 1 extra bus during this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
