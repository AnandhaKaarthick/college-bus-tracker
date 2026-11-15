import { useState, useEffect } from 'react';
import { 
  Clock, Timer, Save, AlertTriangle 
} from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../../config';

const MOCK_DELAYS = [
  {
    busNumber: 'TN-01-AB-1234',
    stopName: 'Porur Junction',
    scheduled: '08:30',
    actual: '08:42',
    delta: 12,
    tag: 'Delayed'
  },
  {
    busNumber: 'TN-01-CD-5678',
    stopName: 'Main Gate',
    scheduled: '08:45',
    actual: '08:47',
    delta: 2,
    tag: 'On Time'
  }
];

export default function ScheduleManager() {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [scheduleData, setScheduleData] = useState([]);
  const [delayData] = useState(MOCK_DELAYS);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleCommitChanges = async () => {
    if (!selectedRouteId || scheduleData.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes/${selectedRouteId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: scheduleData.map(item => ({
            stop_id: item.id,
            expected_arrival: item.time
          }))
        })
      });
      if (res.ok) {
        setIsDirty(false);
        setSaveMessage('Timetable changes committed to database successfully!');
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch (e) {
      console.error("Error saving timetable:", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRoutes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRoutes(data.routes);
          }
        }
      } catch (err) { console.error("Error fetching routes:", err); }
    };
    fetchRoutes();

    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'route_created' || msg.type === 'route_deleted') {
          fetchRoutes();
        }
      } catch (e) {
        console.error("WS error in ScheduleManager:", e);
      }
    };

    return () => { 
      isMounted = false; 
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const handleSelectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    if (routeId) {
      const route = routes.find(r => r.id === routeId);
      if (route) {
        const schedule = route.stops.map((stop, index) => ({
          id: stop.id,
          name: stop.name,
          order: index + 1,
          time: `08:${(index * 15).toString().padStart(2, '0')}`
        }));
        setScheduleData(schedule);
      } else {
        setScheduleData([]);
      }
    } else {
      setScheduleData([]);
    }
  };

  const handleTimeChange = (id, newTime) => {
    setScheduleData(prev => prev.map(item => item.id === id ? { ...item, time: newTime } : item));
    setIsDirty(true);
  };

  const formatDelta = (delta) => {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta} min`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-1 sm:mb-2">Schedule Manager</h2>
        <p className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Delay Engine & Route Timetables</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Schedule Editor (Left) */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto p-4 sm:p-6 md:p-8 bg-[var(--bg-tertiary)]/10">
          <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Select Target Route</label>
                <select 
                  value={selectedRouteId}
                  onChange={(e) => handleSelectRoute(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Choose a route...</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {selectedRouteId ? (
              <div className="space-y-4">
                <div className="bg-[var(--bg-secondary)] rounded-3xl sm:rounded-[40px] border border-[var(--border)] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[340px]">
                      <thead className="bg-[var(--bg-tertiary)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Stop Order</th>
                          <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Stop Name</th>
                          <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Exp. Arrival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {scheduleData.map(item => (
                          <tr key={item.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                            <td className="px-4 sm:px-6 py-3.5 sm:py-5 font-black text-xs text-[var(--text-muted)]">#{item.order.toString().padStart(2, '0')}</td>
                            <td className="px-4 sm:px-6 py-3.5 sm:py-5 font-bold text-xs sm:text-sm text-[var(--text-primary)]">{item.name}</td>
                            <td className="px-4 sm:px-6 py-3.5 sm:py-5">
                              <input 
                                type="time" 
                                value={item.time}
                                onChange={(e) => handleTimeChange(item.id, e.target.value)}
                                className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-black text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {saveMessage && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-500 text-xs font-bold text-center">
                    ✓ {saveMessage}
                  </div>
                )}
                <button 
                  disabled={!isDirty || isSaving}
                  onClick={handleCommitChanges}
                  className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    isDirty 
                      ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Save size={18} />
                  {isSaving ? 'SAVING...' : 'COMMIT CHANGES'}
                </button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-3xl sm:rounded-[40px] text-[var(--text-muted)] italic text-xs sm:text-sm">
                Select a route to edit timetable
              </div>
            )}
          </div>
        </div>

        {/* Live Delay Dashboard (Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Live Delay Feed</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                <Timer size={10} className="animate-spin" />
                Updating Live
              </div>
            </div>

            <div className="space-y-4">
              {delayData.map((delay, idx) => (
                <div key={idx} className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:border-[var(--accent-primary)] transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center text-[var(--accent-primary)]">
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="font-black text-[var(--text-primary)] uppercase tracking-tight">Bus {delay.busNumber.split('-').pop()}</div>
                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{delay.stopName}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      delay.tag === 'Delayed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {delay.tag}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-2xl text-center">
                      <div className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">Scheduled</div>
                      <div className="font-black text-sm text-[var(--text-primary)]">{delay.scheduled}</div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-2xl text-center">
                      <div className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">Actual</div>
                      <div className="font-black text-sm text-[var(--text-primary)]">{delay.actual}</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-3 rounded-2xl text-center">
                      <div className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">Delta</div>
                      <div className={`font-black text-sm ${delay.tag === 'Delayed' ? 'text-red-500' : 'text-green-500'}`}>
                        {formatDelta(delay.delta)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-500 text-white rounded-xl">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-blue-500 uppercase tracking-tight mb-1">Engine Insights</h4>
                  <p className="text-xs font-bold text-blue-500/70">
                    Calculated average delay is currently <span className="underline">+4.5 minutes</span> across all active sectors. Traffic patterns suggest optimizing morning departure times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
