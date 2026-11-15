import { useState, useEffect } from 'react';
import { 
  Bell, AlertCircle, 
  Send, Navigation, Phone, 
  ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock SOS for testing (will be replaced by real WS)
const MOCK_SOS = {
  busId: 'BUS-04',
  busNumber: 'TN-01-AB-1234',
  driverName: 'Suresh Raina',
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

  // Simulation: Trigger SOS for testing
  const triggerTestSOS = () => {
    setSosAlert(MOCK_SOS);
    setSosActive(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      
      {/* Tab Header */}
      <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Comm Hub</h2>
          <div className="flex gap-4">
            {['announcements', 'dispatch', 'emergency'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${
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
          className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
        >
          Simulate SOS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'announcements' && <AnnouncementPanel />}
        {activeTab === 'dispatch' && <DriverDispatchPanel />}
        {activeTab === 'emergency' && <EmergencyLogsPanel />}
      </div>

      {/* SOS EMERGENCY OVERLAY */}
      <AnimatePresence>
        {sosActive && (
          <SOSResponseOverlay 
            alert={sosAlert} 
            onDismiss={() => {
              setSosActive(false);
              setSosAlert(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementPanel() {
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Post Broadcast</h3>
        <div className="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-xl space-y-6">
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Alert Title</label>
            <input 
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all"
              placeholder="e.g. Schedule Change, Rain Alert"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Message Body</label>
            <textarea 
              rows={4}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl p-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all resize-none"
              placeholder="Provide details for the students..."
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Target Audience</label>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Global</button>
              <button className="flex-1 py-3 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--border)]">By Route</button>
            </div>
          </div>
          <button className="w-full py-5 bg-[var(--accent-primary)] text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
            <Send size={18} />
            PUBLISH BROADCAST
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[var(--bg-tertiary)] p-6 rounded-3xl border border-[var(--border)] flex gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                <Bell size={20} />
              </div>
              <div>
                <div className="font-black text-[var(--text-primary)] text-sm mb-1 uppercase tracking-tight">Route Change Alert</div>
                <p className="text-xs text-[var(--text-muted)] mb-3">Bus 04 will be arriving 10 mins late due to heavy traffic on NH4.</p>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Sent 2h ago • Admin John</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverDispatchPanel() {
  return (
    <div className="h-[600px] bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] shadow-xl overflow-hidden flex">
      {/* Driver List */}
      <div className="w-64 border-r border-[var(--border)] flex flex-col bg-[var(--bg-tertiary)]/50">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Online Drivers</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4].map(i => (
            <button key={i} className={`w-full p-4 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-all ${i === 1 ? 'bg-[var(--bg-tertiary)] border-r-2 border-[var(--accent-primary)]' : ''}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[var(--accent-primary)]">
                  <Navigation size={18} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
              </div>
              <div className="text-left">
                <div className="font-black text-xs text-[var(--text-primary)] uppercase tracking-tight">Bus 0{i}</div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Ramesh Kumar</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h4 className="font-black text-sm uppercase tracking-tight">Bus 01 Dispatch Thread</h4>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase">Active</span>
          </div>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><AlertCircle size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[var(--bg-tertiary)]/10">
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-[var(--bg-tertiary)] p-4 rounded-3xl rounded-tl-none border border-[var(--border)] shadow-sm">
              <p className="text-sm font-bold text-[var(--text-secondary)]">Traffic is very heavy near the Porur junction. Might be 10 mins late.</p>
              <div className="text-[8px] font-black text-[var(--text-muted)] uppercase mt-2">Driver • 14:02</div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-[var(--accent-primary)] p-4 rounded-3xl rounded-tr-none shadow-lg shadow-blue-500/20">
              <p className="text-sm font-bold text-white">Copy that. Broadcasting delay to students now.</p>
              <div className="text-[8px] font-black text-white/70 uppercase mt-2 text-right">You • 14:03</div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex gap-4">
            <input 
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-all"
              placeholder="Type instruction to driver..."
            />
            <button className="p-4 bg-[var(--accent-primary)] text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyLogsPanel() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">SOS History</h3>
      <div className="bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-tertiary)]">
            <tr className="border-b border-[var(--border)]">
              <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Unit</th>
              <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Event</th>
              <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Time</th>
              <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-8 py-6 font-black text-xs text-[var(--text-primary)]">BUS-09</td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase">Panic Alert</span>
                </div>
              </td>
              <td className="px-8 py-6 text-xs text-[var(--text-muted)]">2026-05-02 11:42:01</td>
              <td className="px-8 py-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                  <CheckCircle2 size={12} />
                  <span className="text-[10px] font-black uppercase">Resolved</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SOSResponseOverlay({ alert, onDismiss }) {
  useEffect(() => {
    console.log("ALGO: SOS Alarm triggered for Bus", alert.busNumber);
  }, [alert.busNumber]);

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
          <p className="text-xl font-bold opacity-80 uppercase tracking-widest mb-10 italic">Bus {alert.busNumber} • Panic Signal Triggered</p>
          
          <div className="grid grid-cols-2 gap-4 text-left mb-10">
            <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Unit Captain</div>
              <div className="text-xl font-black uppercase tracking-tight">{alert.driverName}</div>
            </div>
            <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Current Sector</div>
              <div className="text-xl font-black uppercase tracking-tight">{alert.nearestStop}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <a 
              href={`tel:${alert.driverPhone}`}
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
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Critical incident logging active • {alert.triggeredAt}</p>
        </div>
      </motion.div>
    </div>
  );
}
