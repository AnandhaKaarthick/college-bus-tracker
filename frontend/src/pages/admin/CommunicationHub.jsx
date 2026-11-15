import { useState, useEffect, useRef } from 'react';
import { 
  Bell, AlertCircle, 
  Send, Navigation, Phone, 
  ShieldAlert, CheckCircle2, Check, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, WS_BASE_URL } from '../../config';

function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60 && diffSec >= 0) return "Just now";
    if (diffSec < 3600 && diffSec >= 60) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400 && diffSec >= 3600) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return "Today";
  }
}

const MOCK_SOS = {
  id: null,
  busId: 'BUS-04',
  busNumber: 'TN-01-AB-1234',
  driverName: 'Rajesh Kumar',
  driverPhone: '+91 98765 43210',
  routeName: 'Ayapakkam → RIT Express',
  lat: 13.0494,
  lng: 80.0249,
  nearestStop: 'Main Gate',
  triggeredAt: new Date().toISOString()
};

export default function CommunicationHub() {
  const [activeTab, setActiveTab] = useState('announcements');
  const [sosActive, setSosActive] = useState(false);
  const [sosAlert, setSosAlert] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Listen to live bus and SOS alerts
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'sos_alert' && msg.alert) {
          setSosAlert(msg.alert);
          setSosActive(true);
        }
      } catch (err) {
        console.error("CommHub WS message error:", err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const triggerTestSOS = () => {
    setSosAlert(MOCK_SOS);
    setSosActive(true);
  };

  const handleDismissSOS = async () => {
    if (sosAlert?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/alerts/${sosAlert.id}/resolve`, { method: 'PUT' });
      } catch (e) {
        console.error("Error resolving SOS alert:", e);
      }
    }
    setSosActive(false);
    setSosAlert(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      
      {/* Tab Header */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-secondary)] shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Comm Hub</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 max-w-[calc(100vw-32px)]">
            {['announcements', 'dispatch', 'emergency'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-widest pb-1.5 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={triggerTestSOS}
          className="self-end sm:self-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 shrink-0"
        >
          Simulate SOS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'announcements' && <AnnouncementPanel />}
        {activeTab === 'dispatch' && <DriverDispatchPanel />}
        {activeTab === 'emergency' && <EmergencyLogsPanel />}
      </div>

      {/* SOS EMERGENCY OVERLAY */}
      <AnimatePresence>
        {sosActive && (
          <SOSResponseOverlay 
            alert={sosAlert} 
            onDismiss={handleDismissSOS} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementPanel() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('global');
  const [routeId, setRouteId] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`);
      if (res.ok) {
        const data = await res.json();
        setRecentAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsPublishing(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          target_type: targetType,
          route_id: targetType === 'by_route' ? parseInt(routeId) : null,
          sender_name: 'Admin John'
        })
      });

      if (res.ok) {
        setTitle('');
        setMessage('');
        setSuccessMsg('Broadcast published to all student and driver apps!');
        fetchAnnouncements();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Post Broadcast</h3>
        <form onSubmit={handlePublish} className="bg-[var(--bg-secondary)] p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-[var(--border)] shadow-xl space-y-4 sm:space-y-6">
          {successMsg && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-500 text-xs font-bold flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Alert Title</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all"
              placeholder="e.g. Schedule Change, Rain Alert"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Message Body</label>
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all resize-none"
              placeholder="Provide details for the students..."
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Target Audience</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setTargetType('global')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  targetType === 'global' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                Global
              </button>
              <button 
                type="button"
                onClick={() => setTargetType('by_route')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  targetType === 'by_route' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                By Route
              </button>
            </div>
            {targetType === 'by_route' && (
              <div className="mt-3">
                <select 
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                  <option value={1}>Route 1: Ayapakkam → RIT Express</option>
                  <option value={2}>Route 2: JJ Nagar East → RIT Direct</option>
                </select>
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={isPublishing}
            className="w-full py-4 sm:py-5 bg-[var(--accent-primary)] text-white font-black rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs sm:text-sm tracking-wider"
          >
            <Send size={18} />
            {isPublishing ? 'PUBLISHING...' : 'PUBLISH BROADCAST'}
          </button>
        </form>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Recent Activity</h3>
        <div className="space-y-3 sm:space-y-4">
          {recentAnnouncements.length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border)] text-sm text-[var(--text-muted)] font-medium">
              No recent announcements.
            </div>
          ) : (
            recentAnnouncements.map((item) => (
              <div key={item.id} className="bg-[var(--bg-tertiary)] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--border)] flex gap-3 sm:gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-black text-[var(--text-primary)] text-sm mb-1 uppercase tracking-tight">{item.title}</div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 uppercase">
                      {item.target_type === 'global' ? 'Global' : `Route ${item.route_id || 1}`}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{item.message}</p>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={11} className="text-cyan-500" />
                    <span>{formatRelativeTime(item.created_at)} • Admin John</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DriverDispatchPanel() {
  const [drivers, setDrivers] = useState([
    { id: 2, name: 'Rajesh Kumar', busName: 'Bus 01', vehicle: 'TN-09-RIT-0001', online: true },
    { id: 3, name: 'Suresh Raina', busName: 'Bus 02', vehicle: 'TN-09-RIT-0002', online: true }
  ]);
  const [selectedDriverId, setSelectedDriverId] = useState(2);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  const fetchMessages = async (driverId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${driverId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Messages fetch error:", err);
    }
  };

  useEffect(() => {
    fetchMessages(selectedDriverId);
    const interval = setInterval(() => fetchMessages(selectedDriverId), 4000);
    return () => clearInterval(interval);
  }, [selectedDriverId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const payload = {
      driver_id: selectedDriverId,
      sender: 'admin',
      text: inputMsg.trim()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setInputMsg('');
        fetchMessages(selectedDriverId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  return (
    <div className="h-[620px] md:h-[600px] bg-[var(--bg-secondary)] rounded-3xl md:rounded-[40px] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col md:flex-row">
      {/* Driver List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col bg-[var(--bg-tertiary)]/50 shrink-0">
        <div className="p-3 sm:p-6 border-b border-[var(--border)]">
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Online Fleet Captains</div>
        </div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-0 gap-2 md:gap-0">
          {drivers.map(driver => (
            <button 
              key={driver.id} 
              onClick={() => setSelectedDriverId(driver.id)}
              className={`shrink-0 p-3 sm:p-4 rounded-xl md:rounded-none flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-all ${
                selectedDriverId === driver.id 
                  ? 'bg-[var(--bg-tertiary)] md:border-r-4 border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 md:ring-0' 
                  : ''
              }`}
            >
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[var(--accent-primary)]">
                  <Navigation size={18} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
              </div>
              <div className="text-left">
                <div className="font-black text-xs text-[var(--text-primary)] uppercase tracking-tight">{driver.busName}</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{driver.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 border-b border-[var(--border)] flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h4 className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">
              {selectedDriver.busName} ({selectedDriver.name})
            </h4>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase shrink-0">Active</span>
          </div>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"><AlertCircle size={18}/></button>
        </div>

        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-[var(--bg-tertiary)]/10">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-[var(--text-muted)] pt-8 font-medium">
              No messages in this dispatch thread yet. Send an instruction below.
            </div>
          ) : (
            messages.map(m => {
              const isAdmin = m.sender === 'admin';
              return (
                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-3xl ${
                    isAdmin 
                      ? 'bg-[var(--accent-primary)] text-white rounded-tr-none shadow-lg shadow-blue-500/20' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-tl-none border border-[var(--border)] shadow-sm'
                  }`}>
                    <p className="text-xs sm:text-sm font-bold">{m.text}</p>
                    <div className={`text-[8px] font-black uppercase mt-2 ${isAdmin ? 'text-white/70 text-right' : 'text-[var(--text-muted)]'}`}>
                      {isAdmin ? 'You (Admin)' : selectedDriver.name} • {m.sent_at}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 sm:p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex gap-4">
            <input 
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-all text-[var(--text-primary)]"
              placeholder={`Type instruction to ${selectedDriver.name}...`}
            />
            <button type="submit" className="p-4 bg-[var(--accent-primary)] text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all hover:scale-105">
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmergencyLogsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error("Alerts error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/alerts/${id}/resolve`, { method: 'PUT' });
      fetchAlerts();
    } catch (e) {
      console.error("Error resolving alert:", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">SOS History & Live Panic Logs</h3>
      <div className="bg-[var(--bg-secondary)] rounded-3xl sm:rounded-[40px] border border-[var(--border)] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Unit</th>
                <th className="px-4 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Event</th>
                <th className="px-4 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Time</th>
                <th className="px-4 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-8 py-6 text-center text-xs text-[var(--text-muted)]">Loading emergency logs...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-8 py-6 text-center text-xs text-[var(--text-muted)]">No emergency records logged.</td>
                </tr>
              ) : (
                alerts.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 font-black text-xs text-[var(--text-primary)]">{a.unit}</td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-red-500 shrink-0" />
                        <span className="text-xs font-bold text-red-500 uppercase">{a.event}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs text-[var(--text-muted)]">{a.time}</td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      {a.status === 'resolved' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-black uppercase">Resolved</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleResolve(a.id)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors text-[10px] font-black uppercase"
                        >
                          <ShieldAlert size={12} />
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SOSResponseOverlay({ alert, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-red-600/20 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-red-600 rounded-[50px] shadow-[0_0_100px_rgba(220,38,38,0.5)] border-4 border-white/20 overflow-hidden"
      >
        <div className="p-12 text-center text-white">
          <div className="mb-6 animate-pulse">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto border-4 border-white">
              <ShieldAlert size={60} />
            </div>
          </div>
          <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">SOS EMERGENCY</h2>
          <p className="text-xl font-bold opacity-80 uppercase tracking-widest mb-10 italic">
            Bus {alert?.busNumber || 'TN-01-AB-1234'} • Panic Signal Triggered
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left mb-10">
            <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Unit Captain</div>
              <div className="text-xl font-black uppercase tracking-tight">{alert?.driverName || 'Rajesh Kumar'}</div>
            </div>
            <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Current Sector</div>
              <div className="text-xl font-black uppercase tracking-tight">{alert?.nearestStop || 'Main Gate'}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <a 
              href={`tel:${alert?.driverPhone || '+919876543210'}`}
              className="flex-1 py-6 bg-white text-red-600 rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
            >
              <Phone size={24} />
              CALL DRIVER
            </a>
            <button 
              onClick={onDismiss}
              className="flex-1 py-6 bg-black text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 border-2 border-white/20 hover:bg-white/10 transition-colors"
            >
              <CheckCircle2 size={24} />
              ACKNOWLEDGE
            </button>
          </div>
        </div>
        
        <div className="bg-black/30 p-4 text-center">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">
            Critical incident logging active • {alert?.triggeredAt || new Date().toISOString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
