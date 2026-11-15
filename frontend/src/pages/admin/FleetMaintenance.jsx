import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, Fuel, Settings2 
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function FleetMaintenance() {
  const [fleet, setFleet] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/buses`);
        if (res.ok) {
          const data = await res.json();
          setFleet(data.buses);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Fleet fetch error:", err);
        setIsLoading(false);
      }
    };
    fetchFleet();
  }, []);

  // Algorithm: Efficiency Grading
  const calculateGrade = (km) => {
    const avgKm = 80; // Baseline for the college fleet
    const ratio = km / avgKm;
    if (ratio >= 1.1) return { label: 'A', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (ratio >= 0.9) return { label: 'B', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (ratio >= 0.7) return { label: 'C', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'D', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
          Loading Fleet Data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10">
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Fleet Maintenance</h2>
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Performance Algorithms & Health Monitoring</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--border)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Avg Utilization</div>
                <div className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">84.2%</div>
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--border)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                <Fuel size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fleet Fuel Economy</div>
                <div className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">4.2 km/L</div>
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--border)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Critical Alerts</div>
                <div className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{fleet.filter(b => b.maintenanceDue).length} Units</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Table */}
        <div className="bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Bus Unit</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Distance (KM)</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Efficiency</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Health Grade</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {fleet.map(bus => {
                const grade = calculateGrade(bus.kmToday);
                return (
                  <tr key={bus.bus_id} className="hover:bg-[var(--bg-tertiary)] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-primary)] font-black text-xs group-hover:scale-110 transition-transform">
                          {bus.name.split(' ')[1]}
                        </div>
                        <div>
                          <div className="font-black text-[var(--text-primary)] uppercase tracking-tight">{bus.name}</div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{bus.vehicle_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-[var(--text-primary)]">{bus.kmToday} KM</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Fuel size={14} className="text-[var(--text-muted)]" />
                        <span className="font-bold text-sm text-[var(--text-secondary)]">{bus.fuelEfficiency} km/L</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${grade.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${grade.color.replace('text', 'bg')}`} />
                        <span className={`text-xs font-black ${grade.color}`}>GRADE {grade.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button className="p-2 hover:bg-[var(--accent-primary)] hover:text-white rounded-xl transition-all border border-[var(--border)]">
                        <Settings2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
