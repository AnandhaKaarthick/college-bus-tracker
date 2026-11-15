import { useState, useEffect } from 'react';
import { 
  TrendingUp, Fuel, Clock, 
  Download,
  Flame
} from 'lucide-react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { API_BASE_URL } from '../../config';

export default function InsightsDashboard() {
  const [activeTab, setActiveTab] = useState('efficiency');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/insights/fuel-km`);
        if (res.ok) {
          const data = await res.json();
          const list = data.fuel_km || [];
          const totalKm = list.reduce((acc, curr) => acc + curr.kmToday, 0);
          const totalFuel = list.reduce((acc, curr) => acc + curr.estimatedFuelL, 0);
          
          setStats({
            totalKm: Math.round(totalKm),
            avgKm: list.length ? Math.round(totalKm / list.length) : 0,
            estFuel: Math.round(totalFuel),
            topBuses: list.map(b => ({
              name: `Bus ${b.busId}`,
              driver: b.driverName,
              km: b.kmToday,
              efficiency: (b.kmToday / (b.estimatedFuelL/7 || 1)).toFixed(1),
              grade: b.kmToday > 20 ? 'A' : 'B'
            }))
          });
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching insights:", err);
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Fleet Insights</h2>
          <div className="flex gap-4">
            {[
              { id: 'efficiency', label: 'Fuel/KM', icon: Fuel },
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

      {/* Prediction Accuracy Chart */}
      <div className="bg-[var(--bg-secondary)] p-10 rounded-[50px] border border-[var(--border)] relative shadow-sm">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Prediction Accuracy (MAE & RMSE)</h3>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Weekly error metrics in minutes</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-blue-50 px-6 py-4 rounded-3xl text-center border border-blue-100">
              <div className="text-2xl font-black text-blue-600">2.31</div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Avg MAE</div>
              <div className="text-[10px] font-black text-green-500 mt-1">↓ 8%</div>
            </div>
            <div className="bg-purple-50 px-6 py-4 rounded-3xl text-center border border-purple-100">
              <div className="text-2xl font-black text-purple-600">3.14</div>
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">Avg RMSE</div>
              <div className="text-[10px] font-black text-green-500 mt-1">↓ 5%</div>
            </div>
          </div>
        </div>

        <div className="relative h-72 mb-8">
          {/* Y-Axis Labels */}
          <div className="absolute left-0 h-full w-8 flex flex-col justify-between text-[10px] font-bold text-[var(--text-muted)] pb-8">
            {[8, 6, 4, 2, 0].map(val => <span key={val}>{val}</span>)}
          </div>

          {/* Grid Lines */}
          <div className="absolute left-8 right-0 h-full flex flex-col justify-between pb-8">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-full border-t border-dashed border-[var(--border)] opacity-50" />
            ))}
          </div>

          {/* Bars Container */}
          <div className="absolute left-10 right-0 h-full flex items-end gap-10 pb-8">
            {[
              { mae: 2.2, rmse: 3.1 },
              { mae: 3.1, rmse: 4.2 },
              { mae: 1.8, rmse: 2.4 },
              { mae: 2.6, rmse: 3.5 },
              { mae: 1.4, rmse: 1.9 },
              { mae: 2.9, rmse: 3.8 },
              { mae: 2.1, rmse: 2.7 }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex items-end justify-center gap-1 h-full">
                {/* MAE Bar */}
                <div 
                  style={{ height: `${(d.mae / 8) * 100}%` }}
                  className="w-8 bg-blue-600 rounded-lg hover:brightness-110 transition-all cursor-pointer relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    MAE: {d.mae}m
                  </div>
                </div>
                {/* RMSE Bar */}
                <div 
                  style={{ height: `${(d.rmse / 8) * 100}%` }}
                  className="w-8 bg-purple-500 rounded-lg hover:brightness-110 transition-all cursor-pointer relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    RMSE: {d.rmse}m
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend & X-Axis */}
        <div className="ml-10">
          <div className="flex justify-between text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-10 px-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
          </div>
          
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">MAE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">RMSE</span>
            </div>
          </div>
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
        const res = await fetch(`${API_BASE_URL}/api/admin/insights/ridership`);
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative z-0">
        <MapContainer center={[13.0494, 80.0249]} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
