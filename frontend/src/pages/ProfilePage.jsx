import { useState, useEffect } from "react";
import { 
  User, Mail, Phone, Hash, MapPin, 
  Bell, Heart, Shield, Save, Plus, 
  ChevronRight, Sparkles, LogOut, Navigation, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, WS_BASE_URL } from "../config";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('transit_notif_prefs');
    return saved ? JSON.parse(saved) : { sms: true, push: false, eta: true };
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Attendance state
  const busId = user?.assigned_bus_id ? parseInt(user.assigned_bus_id) : 1;
  const busName = user?.assigned_bus_name || 'Bus 04';
  const [passengerCount, setPassengerCount] = useState(24);
  const [occupancy, setOccupancy] = useState('medium');
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem(`bus_checked_in_${user?.id}`) === 'true';
  });
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Fetch initial attendance for this student's bus
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attendance/bus/${busId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.passenger_count !== undefined) {
            setPassengerCount(data.passenger_count);
            setOccupancy(data.occupancy);
          }
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    };
    fetchAttendance();

    // Listen to real-time occupancy updates
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'occupancy_update' && msg.bus_id === busId) {
          setPassengerCount(msg.passenger_count);
          setOccupancy(msg.occupancy);
        }
      } catch (e) {
        console.error("WS error in ProfilePage:", e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [busId]);

  const handleCheckIn = async () => {
    if (isCheckedIn || loadingAttendance) return;
    setLoadingAttendance(true);
    setAttendanceMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, bus_id: busId })
      });

      if (res.ok) {
        const data = await res.json();
        setIsCheckedIn(true);
        localStorage.setItem(`bus_checked_in_${user?.id}`, 'true');
        setPassengerCount(data.passenger_count);
        setOccupancy(data.occupancy);
        setAttendanceMsg(`✓ Checked in successfully on ${busName}!`);
        setTimeout(() => setAttendanceMsg(''), 4000);
      }
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    if (!isCheckedIn || loadingAttendance) return;
    setLoadingAttendance(true);
    setAttendanceMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, bus_id: busId })
      });

      if (res.ok) {
        const data = await res.json();
        setIsCheckedIn(false);
        localStorage.setItem(`bus_checked_in_${user?.id}`, 'false');
        setPassengerCount(data.passenger_count);
        setOccupancy(data.occupancy);
        setAttendanceMsg(`✓ Checked out of ${busName}. Have a great day!`);
        setTimeout(() => setAttendanceMsg(''), 4000);
      }
    } catch (err) {
      console.error("Check-out error:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSavePreferences = () => {
    localStorage.setItem('transit_notif_prefs', JSON.stringify(notifications));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex-1 bg-[var(--bg-primary)] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-1 sm:mb-2">My Profile</h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">Manage your personal transit verified account & boarding status.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column: Personal & Notifications */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* User Info Card */}
            <div className="bg-[var(--bg-secondary)] p-5 sm:p-8 md:p-10 rounded-3xl sm:rounded-[50px] border border-[var(--border)] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-[28px] flex items-center justify-center text-white text-lg sm:text-2xl font-black shadow-xl shadow-blue-600/20 shrink-0">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">{user?.name || "Student User"}</h2>
                    <p className="text-blue-600 font-bold text-xs uppercase tracking-wider">{user?.role || "Student"} • RIT Chennai</p>
                  </div>
                </div>

                <button 
                  onClick={logout}
                  className="self-start sm:self-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <InfoField icon={Mail} label="Email Address" value={user?.email || "user@rit.ac.in"} />
                <InfoField icon={Phone} label="Phone Number" value={user?.phone || "+91 98765 43210"} />
                <InfoField icon={Hash} label="Roll / Identifier" value={user?.identifier || "21CS001"} />
                <InfoField icon={MapPin} label="Default Pickup Stop" value={user?.assigned_stop_name || "Ayapakkam park"} />
                <InfoField icon={Navigation} label="Assigned Route" value={user?.assigned_route_name || "Ayapakkam → RIT Express"} />
                <InfoField icon={Shield} label="Assigned Fleet Bus" value={`${busName} (${user?.vehicle_number || 'TN 09 AB 1234'})`} />
              </div>
            </div>

            {/* Attendance Marking Card */}
            <div className="bg-blue-600 p-5 sm:p-8 md:p-10 rounded-3xl sm:rounded-[50px] border border-blue-500 shadow-xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
                <Sparkles size={120} className="text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0">
                      <User size={18} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Bus Attendance</h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isCheckedIn ? 'bg-green-400 text-slate-900' : 'bg-white/20 text-white'
                  }`}>
                    {isCheckedIn ? '● Boarded' : '○ Not Boarded'}
                  </span>
                </div>

                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-6 sm:mb-8 max-w-md leading-relaxed">
                  Help us track real-time occupancy! Mark your attendance when boarding or deboarding {busName}.
                </p>

                {attendanceMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-white text-blue-700 text-xs font-black shadow-lg flex items-center gap-2">
                    <Check size={16} />
                    <span>{attendanceMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button 
                    onClick={handleCheckIn}
                    disabled={isCheckedIn || loadingAttendance}
                    className={`flex-1 py-3.5 sm:py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isCheckedIn 
                        ? 'bg-white/40 text-blue-900 opacity-60 cursor-not-allowed' 
                        : 'bg-white text-blue-600 hover:bg-blue-50 active:scale-95'
                    }`}
                  >
                    <Plus size={16} />
                    {isCheckedIn ? 'Checked In' : '+ Check In'}
                  </button>
                  <button 
                    onClick={handleCheckOut}
                    disabled={!isCheckedIn || loadingAttendance}
                    className={`flex-1 py-3.5 sm:py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border border-white/20 ${
                      !isCheckedIn 
                        ? 'bg-blue-500/20 text-white/50 opacity-50 cursor-not-allowed' 
                        : 'bg-blue-500/40 text-white hover:bg-blue-500/60 active:scale-95'
                    }`}
                  >
                    Check Out
                  </button>
                </div>
                
                <div className="mt-6 sm:mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2 shrink-0">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-blue-600 bg-blue-300 flex items-center justify-center text-[10px] font-black text-blue-900">
                        👤
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                      {passengerCount} Students Currently On Board
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                      Occupancy Status: {occupancy.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-[var(--bg-secondary)] p-5 sm:p-8 md:p-10 rounded-3xl sm:rounded-[50px] border border-[var(--border)] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Bell className="text-[var(--text-primary)]" size={24} />
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Notification Preferences</h3>
                </div>
                {saveSuccess && (
                  <span className="text-xs font-black text-green-500 flex items-center gap-1">
                    <Check size={14} /> Saved!
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <ToggleRow 
                  title="SMS Alerts for Delays" 
                  desc="Get an SMS if your bus is delayed by more than 10 mins." 
                  active={notifications.sms} 
                  onToggle={() => toggle('sms')} 
                />
                <ToggleRow 
                  title="App Push Notifications" 
                  desc="Receive live status updates on your device." 
                  active={notifications.push} 
                  onToggle={() => toggle('push')} 
                />
                <ToggleRow 
                  title="Early ETA Warnings" 
                  desc="Alert me when the bus is 5 minutes away." 
                  active={notifications.eta} 
                  onToggle={() => toggle('eta')} 
                />
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={handleSavePreferences}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[30px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              <Save size={20} />
              Save Preferences
            </button>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Saved Routes */}
            <div className="bg-[var(--bg-secondary)] p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="text-red-500" size={20} />
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Saved Routes</h3>
              </div>
              
              <div className="space-y-3">
                <div onClick={() => navigate('/tracking')}>
                  <SavedRouteCard from="Ayapakkam" to="Campus" info="Bus 04 • 8:10 AM" />
                </div>
                <div onClick={() => navigate('/tracking')}>
                  <SavedRouteCard from="JJ Nagar East" to="Campus" info="Bus 02 • 8:05 AM" />
                </div>
              </div>
            </div>

            {/* Emergency Settings */}
            <div className="bg-red-50 dark:bg-red-950/20 p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-red-100 dark:border-red-900/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-red-600" size={20} />
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Emergency Settings</h3>
              </div>
              <p className="text-[10px] font-bold text-red-400 leading-relaxed mb-6 uppercase tracking-wider">
                In case of emergency during transit, these contacts will be immediately notified along with your live location.
              </p>
              
              <div className="space-y-3">
                <EmergencyContact label="Primary SOS Contact" name="Father / Guardian" number="+91 99887 76655" />
                <EmergencyContact label="Campus Security" name="24x7 Helpdesk" number="044-1234-5678" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="bg-[var(--bg-tertiary)] p-4 sm:p-6 rounded-2xl sm:rounded-[28px] flex items-center gap-4 border border-[var(--border)]/50">
      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-[var(--text-muted)] shadow-sm shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">{label}</div>
        <div className="text-sm font-black text-[var(--text-primary)] truncate">{value}</div>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, active, onToggle }) {
  return (
    <div className="flex justify-between items-center py-2">
      <div>
        <div className="text-sm font-black text-[var(--text-primary)] tracking-tight">{title}</div>
        <div className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{desc}</div>
      </div>
      <button 
        onClick={onToggle}
        type="button"
        className={`w-14 h-8 rounded-full transition-all relative ${active ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

function SavedRouteCard({ from, to, info }) {
  return (
    <div className="bg-[var(--bg-tertiary)] p-5 rounded-[28px] border border-[var(--border)] group hover:border-blue-500/30 transition-all cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-black text-[var(--text-primary)]">{from}</span>
        <ChevronRight size={12} className="text-[var(--text-muted)]" />
        <span className="text-xs font-black text-[var(--text-primary)]">{to}</span>
      </div>
      <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{info}</div>
    </div>
  );
}

function EmergencyContact({ label, name, number }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-red-100 dark:border-red-900/30 shadow-sm">
      <div className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">{label}</div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-[var(--text-primary)]">{name}</span>
        <a href={`tel:${number}`} className="text-[10px] font-bold text-red-500 hover:underline">{number}</a>
      </div>
    </div>
  );
}
