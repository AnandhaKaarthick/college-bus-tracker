import { useState, useEffect, useRef } from 'react';
import { 
  Shield, MapPin, Navigation, Signal, Radio, 
  MessageSquare, AlertTriangle, Send, Phone, 
  Info, Zap, User, Settings, LogOut, Check,
  Clock, Compass, Play, Square, Volume2, VolumeX,
  ChevronRight, ArrowRight, ShieldCheck, Wrench,
  Fuel, Activity, Users, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WS_BASE_URL, API_BASE_URL } from '../config';

// Synthesized audio feedback engine using Web Audio API (zero network lag, 100% reliable)
function playTone(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'arrive') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'sos') {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}

// Calculate realistic stop arrival times synchronized to current real time
function getDynamicTime(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitialStops() {
  return [];
}

// Quick delay incident options for 1-tap reporting
const INCIDENT_PRESETS = [
  { label: "Heavy Traffic (+10m)", icon: "🚦", text: "Heavy highway traffic, arriving ~10 mins behind schedule.", delta: 10 },
  { label: "Rain / Waterlogging (+15m)", icon: "🌧️", text: "Severe rain slowdown, speed restricted for student safety.", delta: 15 },
  { label: "Road Diversion (+10m)", icon: "🚧", text: "NH4 diversion in effect, taking alternate bypass route.", delta: 10 },
  { label: "Mechanical / Flat Tyre", icon: "🛑", text: "Vehicle mechanical check needed, pulled over safely.", delta: 25 },
  { label: "Fuel Refill (+5m)", icon: "⛽", text: "Brief 5-min fuel stop at company pump on highway.", delta: 5 }
];

export default function DriverApp() {
  const { user, logout } = useAuth();
  
  // Navigation & Control States
  const [activeTab, setActiveTab] = useState('cockpit'); // 'cockpit', 'route', 'dispatch', 'vehicle'
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [simMode, setSimMode] = useState(false); // Default to Phone GPS for real-world testing
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Telemetry & GPS State
  const [location, setLocation] = useState({ lat: 13.1020, lng: 80.1345, speed: 0, heading: 90 });
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'acquiring', 'locked', 'error'
  const [gpsLastUpdate, setGpsLastUpdate] = useState(null);
  const [shiftSeconds, setShiftSeconds] = useState(1450); // ~24 mins initial shift
  const [wallClock, setWallClock] = useState(new Date());
  const [error, setError] = useState('');
  
  // Route & Stops State
  const [stops, setStops] = useState(getInitialStops);
  const [currentStopIdx, setCurrentStopIdx] = useState(2); // Approaching Maduravoyal
  const [arrivedStopId, setArrivedStopId] = useState(null);
  const [stopsProgress, setStopsProgress] = useState(40); // 40% completed
  
  // Passengers & Attendance
  const [passengerCount, setPassengerCount] = useState(26);
  const maxCapacity = 40;
  const occupancy = passengerCount > 34 ? 'high' : passengerCount > 18 ? 'medium' : 'low';
  
  // Incident & SOS
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [incidentMsg, setIncidentMsg] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');
  
  // Dispatch Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  
  // Vehicle Checklist
  const [safetyChecklist, setSafetyChecklist] = useState({
    brakes: true,
    tires: true,
    mirrors: true,
    fuel: true,
    firstAid: true,
    emergencyDoor: true
  });

  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  const simTimerRef = useRef(null);
  const routeWaypointsRef = useRef([]);

  const assignedBusId = user?.assigned_bus_id || '1';
  const busName = user?.assigned_bus_name || 'Bus 01';
  const vehicleNumber = user?.vehicle_number || 'TN-09-RIT-0001';
  const [activeRouteName, setActiveRouteName] = useState(user?.assigned_route_name || '');
  const routeName = activeRouteName || user?.assigned_route_name || 'Transit Route';

  // Load Route Data & Timetable from backend
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes`);
        if (res.ok) {
          const data = await res.json();
          const targetRoute = data.routes?.find(r => String(r.bus_id) === String(assignedBusId) || String(r.id) === String(user?.assigned_route_id || '1')) || data.routes?.[0];
          if (targetRoute) {
            setActiveRouteName(targetRoute.name);
            if (targetRoute.stops && targetRoute.stops.length > 0) {
              setStops(targetRoute.stops.map((s, idx) => ({
                id: s.id || idx + 1,
                name: s.name,
                time: s.expected_arrival || getDynamicTime(idx * 12 - 15),
                expectedStudents: Math.max(4, 12 - idx * 2),
                lat: s.lat,
                lng: s.lng
              })));
            } else {
              setStops([]);
            }
          } else {
            setActiveRouteName('No Active Route Configured');
            setStops([]);
          }
        }
      } catch (err) {
        console.error("Error loading route in DriverApp:", err);
      }
    };
    fetchRoute();
  }, [assignedBusId, user?.assigned_route_id]);

  // Load Initial Attendance & Dispatch Messages
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attRes = await fetch(`${API_BASE_URL}/api/attendance/bus/${assignedBusId}`);
        if (attRes.ok) {
          const data = await attRes.json();
          if (data.passenger_count !== undefined) {
            setPassengerCount(data.passenger_count);
          }
        }

        if (user?.id) {
          const msgRes = await fetch(`${API_BASE_URL}/api/messages/${user.id}`);
          if (msgRes.ok) {
            const data = await msgRes.json();
            setMessages(data.messages || []);
          }
        }
      } catch (e) {
        console.error("Initial fetch error in DriverApp:", e);
      }
    };
    fetchInitialData();
  }, [assignedBusId, user?.id]);

  // Listen to Global WebSocket (attendance updates & new dispatch messages from admin)
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'occupancy_update' && String(msg.bus_id) === String(assignedBusId)) {
          setPassengerCount(msg.passenger_count);
        } else if (msg.type === 'new_dispatch_message' && (msg.message?.driver_id === user?.id || !msg.message?.driver_id)) {
          setMessages(prev => [...prev, msg.message]);
          if (soundEnabled) playTone('arrive');
        }
      } catch (err) {
        console.error("Driver WS listener error:", err);
      }
    };
    return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
  }, [assignedBusId, user?.id, soundEnabled]);

  // Shift Timer & Wall-clock Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setShiftSeconds(prev => prev + 1);
      setWallClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Seconds to HH:MM:SS
  const formatShiftTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Telemetry WebSocket Connection Handler
  useEffect(() => {
    if (isBroadcasting) {
      wsRef.current = new WebSocket(`${WS_BASE_URL}/ws/driver/${assignedBusId}`);
      wsRef.current.onerror = () => setError('Connection reconnecting...');
      return () => { if (wsRef.current) wsRef.current.close(); };
    }
  }, [isBroadcasting, assignedBusId]);

  // Broadcast helper function to push coordinates over WebSocket
  const sendLocationUpdate = (lat, lng, speed, heading = 90) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'location_update',
        data: { lat, lng, speed: parseFloat(speed), heading }
      }));
    }
  };

  // Journey Start / Stop Toggle
  const toggleBroadcasting = () => {
    if (isBroadcasting) {
      // STOP TRIP
      setIsBroadcasting(false);
      setSpeedKmh(0);
      setGpsStatus('idle');
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (soundEnabled) playTone('stop');
      setFeedbackBanner('Shift paused. GPS broadcast terminated.');
      setTimeout(() => setFeedbackBanner(''), 4000);
    } else {
      // START TRIP
      setIsBroadcasting(true);
      setError('');
      if (soundEnabled) playTone('start');
      setFeedbackBanner('🚀 GPS Active! Now broadcasting live bus coordinates to campus.');
      setTimeout(() => setFeedbackBanner(''), 4000);

      if (simMode) {
        // SIMULATION AUTO-DRIVE MODE (Ideal for demos, presentations & testing)
        setGpsStatus('locked');
        let step = 0;
        // Generate realistic highway route interpolations between stops
        const waypoints = [
          [13.1020, 80.1345], [13.1057, 80.1510], [13.1118, 80.1509],
          [13.1147, 80.1479], [13.1175, 80.1493], [13.1220, 80.1475],
          [13.0850, 80.1100], [13.0645, 80.1596], [13.0560, 80.1170],
          [13.0488, 80.0857], [13.0410, 80.0584], [13.0375, 80.0449]
        ];
        routeWaypointsRef.current = waypoints;

        simTimerRef.current = setInterval(() => {
          step = (step + 1) % waypoints.length;
          const [lat, lng] = waypoints[step];
          const mockSpeed = Math.floor(36 + Math.random() * 12);
          setSpeedKmh(mockSpeed);
          setLocation({ lat, lng, speed: mockSpeed, heading: 90 });
          setGpsLastUpdate(new Date());
          sendLocationUpdate(lat, lng, mockSpeed, 90);

          // Update route progress
          const progress = Math.min(95, Math.round(((step + 1) / waypoints.length) * 100));
          setStopsProgress(progress);
        }, 2500);

      } else {
        // REAL DEVICE HARDWARE GPS MODE
        if (!navigator.geolocation) {
          setError('GPS hardware or Geolocation API not supported on this browser/device');
          setGpsStatus('error');
          setIsBroadcasting(false);
          return;
        }

        setGpsStatus('acquiring');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const rawSpeed = pos.coords.speed !== null && !isNaN(pos.coords.speed) && pos.coords.speed >= 0
              ? Math.round(pos.coords.speed * 3.6)
              : 0;
            const newLoc = {
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              speed: Number(rawSpeed),
              heading: pos.coords.heading || 90
            };
            const accuracyM = Math.round(pos.coords.accuracy || 0);
            setLocation(newLoc);
            setSpeedKmh(newLoc.speed);
            setGpsAccuracy(accuracyM);
            setGpsStatus('locked');
            setGpsLastUpdate(new Date());
            sendLocationUpdate(newLoc.lat, newLoc.lng, newLoc.speed, newLoc.heading);
          },
          (err) => {
            console.error("GPS Watch error:", err);
            setGpsStatus('error');
            let friendlyError = err.message;
            if (err.code === 1) {
              friendlyError = 'Permission denied: Please allow Location Access in your browser settings to broadcast live GPS.';
            } else if (err.code === 2) {
              friendlyError = 'Position unavailable: Please turn on Device Location / GPS in system settings.';
            } else if (err.code === 3) {
              friendlyError = 'GPS acquisition timeout: Searching for satellite signal...';
            }
            setError(friendlyError);
            setIsBroadcasting(false);
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      }
    }
  };

  // Cleanup simulation timers on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Mark Stop Arrived
  const handleMarkStopArrived = () => {
    if (currentStopIdx >= stops.length - 1) {
      setFeedbackBanner('🎉 Final Destination Reached (RIT Chennai Campus)!');
      if (soundEnabled) playTone('arrive');
      setTimeout(() => setFeedbackBanner(''), 5000);
      return;
    }

    const arrived = stops[currentStopIdx];
    setArrivedStopId(arrived.id);
    if (soundEnabled) playTone('arrive');
    
    // Increment passenger boarding estimate
    const addedStudents = arrived.expectedStudents || 6;
    setPassengerCount(prev => Math.min(maxCapacity, prev + addedStudents));
    
    setFeedbackBanner(`✓ Arrived at ${arrived.name}! Boarding ${addedStudents} students.`);
    setTimeout(() => {
      setCurrentStopIdx(prev => Math.min(stops.length - 1, prev + 1));
      setArrivedStopId(null);
      setFeedbackBanner('');
    }, 3500);
  };

  // Manual Passenger Adjustments (+ / -)
  const handleAdjustPassenger = async (delta) => {
    const nextCount = Math.max(0, Math.min(maxCapacity, passengerCount + delta));
    setPassengerCount(nextCount);
    
    try {
      const endpoint = delta > 0 ? '/api/attendance/checkin' : '/api/attendance/checkout';
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: parseInt(assignedBusId),
          user_id: user?.id || 2
        })
      });
    } catch (e) {
      console.error("Attendance adjust error:", e);
    }
  };

  // 1-Tap Incident Preset Reporter
  const handleSendPresetIncident = async (preset) => {
    try {
      // 1. Send Dispatch Message
      await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user?.id || 2,
          sender: 'driver',
          text: `[INCIDENT ALERT] ${preset.icon} ${preset.label}: ${preset.text}`
        })
      });

      // 2. Publish Delay Announcement to all students
      await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Route Delay Alert: ${busName}`,
          message: `${preset.label} — ${busName} (${routeName}) is experiencing delays. Expected delay: ~${preset.delta} mins.`,
          target_type: 'by_route',
          route_id: parseInt(user?.assigned_route_id || '1'),
          sender_name: `Captain ${user?.name || 'Rajesh'}`
        })
      });

      setFeedbackBanner(`✓ Alert published! Transport Office & Student Dashboards notified.`);
      if (soundEnabled) playTone('arrive');
      setTimeout(() => setFeedbackBanner(''), 4000);

      // Refresh dispatch messages
      const updated = await fetch(`${API_BASE_URL}/api/messages/${user?.id || 2}`);
      if (updated.ok) {
        const d = await updated.json();
        setMessages(d.messages || []);
      }
    } catch (err) {
      console.error("Preset alert error:", err);
    }
  };

  // Two-way Dispatch Chat Send
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsSendingMsg(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user?.id || 2,
          sender: 'driver',
          text: chatInput.trim()
        })
      });

      if (res.ok) {
        setChatInput('');
        const updated = await fetch(`${API_BASE_URL}/api/messages/${user?.id || 2}`);
        if (updated.ok) {
          const d = await updated.json();
          setMessages(d.messages || []);
        }
      }
    } catch (e) {
      console.error("Error sending dispatch message:", e);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Emergency SOS Trigger
  const handleTriggerSOS = async () => {
    setIsSOSActive(true);
    setSosCountdown(5);
    if (soundEnabled) playTone('sos');

    try {
      await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'panic',
          bus_id: assignedBusId,
          triggered_by: user?.id || 2,
          lat: location.lat,
          lng: location.lng,
          message: `🚨 EMERGENCY PANIC BEACON: Captain ${user?.name || 'Rajesh'} triggered priority SOS on ${busName} (${vehicleNumber})!`,
          driver_name: user?.name || 'Rajesh Kumar',
          driver_phone: user?.phone || '+91 98765 43210'
        })
      });
      setFeedbackBanner('🚨 CRITICAL SOS BROADCAST TRANSMITTED! Campus Security & Ambulance alerted.');
    } catch (err) {
      console.error("SOS trigger error:", err);
    }

    setTimeout(() => {
      setIsSOSActive(false);
      setFeedbackBanner('');
    }, 6000);
  };

  const nextStop = stops[currentStopIdx] || stops[stops.length - 1] || { 
    id: 0, 
    name: "Awaiting Route Stops", 
    time: "--:--", 
    expectedStudents: 0 
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Background Ambience Cockpit Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] transition-colors duration-1000 ${
          isBroadcasting ? 'bg-cyan-500/20' : 'bg-blue-600/10'
        }`} />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* TOP COCKPIT HEADER HUD */}
      <header className="relative z-20 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 sm:p-5 px-4 sm:px-8 flex items-center justify-between gap-3 shrink-0 shadow-lg">
        
        {/* Driver Profile & Vehicle Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20 border border-white/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RK'}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
              isBroadcasting ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase truncate">
                {user?.name || "Capt. Rajesh Kumar"}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">
                #DR-402
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <span className="text-cyan-400 font-extrabold">{busName}</span>
              <span>•</span>
              <span>{vehicleNumber}</span>
              <span className="hidden md:inline">• {routeName}</span>
            </p>
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live Real-time Wall Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-black text-cyan-400">
            <Clock size={14} className="text-cyan-400" />
            <span className="font-mono">{wallClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </div>

          {/* Shift Elapsed Timer */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs font-bold text-slate-400">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">SHIFT:</span>
            <span className="font-mono text-slate-300">{formatShiftTime(shiftSeconds)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? "Mute Cockpit Chimes" : "Enable Cockpit Chimes"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} className="text-slate-500" />}
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={handleTriggerSOS}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg ${
              isSOSActive 
                ? 'bg-red-600 text-white animate-bounce border border-red-400 shadow-red-500/50' 
                : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white'
            }`}
          >
            <AlertTriangle size={15} />
            <span className="hidden xs:inline">SOS PANIC</span>
          </button>

          {/* Log Out */}
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign Out of Driver Cockpit"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* FEEDBACK & STATUS TOAST */}
      {feedbackBanner && (
        <div className="relative z-30 mx-4 sm:mx-8 mt-3 p-3 px-4 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-fade-in">
          <Activity size={16} className="text-cyan-400 shrink-0 animate-spin" />
          <span className="flex-1">{feedbackBanner}</span>
        </div>
      )}

      {error && (
        <div className="relative z-30 mx-4 sm:mx-8 mt-3 p-3 px-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* MAIN COCKPIT VIEWPORT */}
      <main className="flex-1 relative z-10 overflow-y-auto px-4 sm:px-8 py-5 pb-28 max-w-5xl mx-auto w-full">
        
        {/* ========================================================= */}
        {/* TAB 1: 🕹️ DRIVING COCKPIT HUD (Primary View)              */}
        {/* ========================================================= */}
        {activeTab === 'cockpit' && (
          <div className="space-y-5">
            
            {/* 1. HERO ENGINE START / STOP CONTROLLER */}
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all duration-700 relative overflow-hidden shadow-2xl ${
              isBroadcasting 
                ? 'bg-gradient-to-b from-slate-900 to-cyan-950/60 border-cyan-500/40 shadow-cyan-950/40' 
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                
                {/* Left: GPS Indicator & Engine Switch */}
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center border-2 transition-all shrink-0 ${
                    isBroadcasting 
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-xl shadow-cyan-500/30' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {isBroadcasting ? <Radio size={36} className="animate-pulse" /> : <Navigation size={36} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isBroadcasting ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                      }`} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {isBroadcasting ? 'BROADCASTING TELEMETRY' : 'STANDBY AT DEPOT'}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                      {isBroadcasting ? 'Active Route Mission' : 'Trip Ready to Begin'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {isBroadcasting 
                        ? `Broadcasting coordinates to students on ${routeName}` 
                        : 'Engage broadcast to start transmitting GPS coordinates'}
                    </p>
                  </div>
                </div>

                {/* Right: Mode Switcher & Start/Stop CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                  
                  {/* Mode Toggle (Sim Auto-Drive vs Real GPS) */}
                  <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
                    <button
                      onClick={() => setSimMode(true)}
                      className={`px-3 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        simMode ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap size={13} />
                      <span>Demo Sim</span>
                    </button>
                    <button
                      onClick={() => setSimMode(false)}
                      className={`px-3 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        !simMode ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Compass size={13} />
                      <span>Phone GPS</span>
                    </button>
                  </div>

                  {/* Start / Stop Journey Button */}
                  <button
                    onClick={toggleBroadcasting}
                    className={`py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
                      isBroadcasting 
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 font-black'
                    }`}
                  >
                    {isBroadcasting ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    <span>{isBroadcasting ? 'END JOURNEY' : 'START JOURNEY'}</span>
                  </button>
                </div>
              </div>

              {/* LIVE TELEMETRY & GPS SENSOR STATUS STRIP */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    !simMode && isBroadcasting && gpsStatus === 'locked'
                      ? 'bg-emerald-400 animate-ping'
                      : isBroadcasting
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span className="font-mono text-slate-300 font-bold">
                    {simMode 
                      ? 'SIMULATION SENSOR: Auto-drive Waypoints active'
                      : gpsStatus === 'locked'
                      ? `HARDWARE GPS LOCKED: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                      : gpsStatus === 'acquiring'
                      ? 'ACQUIRING HARDWARE GPS SATELLITES...'
                      : isBroadcasting
                      ? 'PHONE GPS READY'
                      : 'STANDBY — Set to "Phone GPS" to broadcast your physical device coordinates'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  {!simMode && gpsAccuracy !== null && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                      ACCURACY: ±{gpsAccuracy}m
                    </span>
                  )}
                  {gpsLastUpdate && (
                    <span className="font-mono text-slate-500 hidden sm:inline">
                      TICK: {gpsLastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-black ${
                    !simMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {!simMode ? '🛰️ PHONE GPS' : '🎮 DEMO SIM'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. NEXT STOP ARRIVAL BANNER (Prominent High-Contrast Navigator) */}
            <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 p-5 sm:p-6 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                    <span>NEXT SCHEDULED STOP • #{stops.length > 0 ? currentStopIdx + 1 : 0} OF {stops.length}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>ETA ~4 MINS</span>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                    {nextStop?.name || "Awaiting Route Stops"}
                  </h4>
                  <p className="text-xs font-bold text-slate-400">
                    Scheduled Time: <span className="text-white">{nextStop?.time || "--:--"}</span> • Approx. <span className="text-cyan-300 font-extrabold">+{nextStop?.expectedStudents || 0} students</span> waiting
                  </p>
                </div>
              </div>

              <button
                onClick={handleMarkStopArrived}
                disabled={arrivedStopId !== null || stops.length === 0}
                className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Check size={18} />
                <span>{stops.length === 0 ? 'NO STOPS' : arrivedStopId ? 'ARRIVING...' : 'MARK STOP ARRIVED'}</span>
              </button>
            </div>

            {/* 3. SPEEDOMETER, OCCUPANCY & ROUTE TELEMETRY GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Ground Speed HUD */}
              <div className="bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest">Ground Speed</span>
                  <Activity size={18} className="text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter font-mono">
                    {speedKmh}
                  </span>
                  <span className="text-xs font-black uppercase text-cyan-400">KM / H</span>
                </div>
                <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (speedKmh / 60) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-2">
                  Speed Governor: Active (Max 55 km/h)
                </span>
              </div>

              {/* Passenger Occupancy HUD */}
              <div className="bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest">Students Boarded</span>
                  <Users size={18} className="text-emerald-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter font-mono">
                      {passengerCount}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ {maxCapacity}</span>
                  </div>

                  {/* 1-Tap Manual Adjust */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustPassenger(-1)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm flex items-center justify-center active:scale-95"
                      title="Deboard 1 student"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustPassenger(1)}
                      className="w-8 h-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm flex items-center justify-center active:scale-95"
                      title="Board 1 student"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      occupancy === 'high' ? 'bg-rose-500' : occupancy === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (passengerCount / maxCapacity) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1">
                  <span>Occupancy:</span>
                  <span className={`font-black ${
                    occupancy === 'high' ? 'text-rose-400' : occupancy === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {occupancy.toUpperCase()} ({Math.round((passengerCount / maxCapacity) * 100)}%)
                  </span>
                </span>
              </div>

              {/* Route Progress HUD */}
              <div className="bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest">Route Sector Progress</span>
                  <Compass size={18} className="text-purple-400" />
                </div>

                <div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    {stopsProgress}% <span className="text-xs text-slate-400 font-bold uppercase">Covered</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Stop {currentStopIdx + 1} of {stops.length} reached
                  </p>
                </div>

                <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${stopsProgress}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-2">
                  Destination: RIT Campus Gate
                </span>
              </div>

            </div>

            {/* 4. ONE-TAP QUICK INCIDENT ALERT BAR */}
            <div className="bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span>1-Tap Highway Delay Incident Reporting</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Notifies Admin & Students</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {INCIDENT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPresetIncident(p)}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-left transition-all active:scale-95 group"
                  >
                    <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{p.icon}</div>
                    <div className="text-xs font-black text-white line-clamp-1">{p.label}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">+{p.delta}m delay</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 📋 STOPS TIMETABLE & SEQUENCE                       */}
        {/* ========================================================= */}
        {activeTab === 'route' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{routeName}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Full stop sequence, scheduled arrival times, and passenger pickup quotas.
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-wider border border-cyan-500/20">
                {stops.length} Total Stops
              </div>
            </div>

            {stops.length === 0 ? (
              <div className="bg-slate-900/60 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <MapPin size={28} />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">No Route Stops Configured</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create and assign your real transit route in Route Creator Studio (/admin/routes) to view stops, sequence and ETAs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stops.map((stop, idx) => {
                const isPassed = idx < currentStopIdx;
                const isCurrent = idx === currentStopIdx;
                return (
                  <div 
                    key={stop.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCurrent 
                        ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/30' 
                        : isPassed 
                        ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isCurrent 
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20' 
                          : isPassed 
                          ? 'bg-slate-800 text-emerald-400' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isPassed ? '✓' : `#${idx + 1}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
                            {stop.name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase">
                              Target Next
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">
                          Scheduled: <span className="text-slate-200">{stop.time}</span> • Estimated: ~{stop.expectedStudents} students
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isCurrent ? (
                        <button
                          onClick={handleMarkStopArrived}
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:bg-cyan-400 active:scale-95"
                        >
                          Arrived
                        </button>
                      ) : (
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isPassed ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {isPassed ? 'Completed' : 'Upcoming'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 💬 TWO-WAY DISPATCH ROOM (Admin Communication)      */}
        {/* ========================================================= */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Control Room Dispatch</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Direct encrypted channel with Transport Officer (Admin Control Room).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="h-80 sm:h-96 bg-slate-900/80 rounded-3xl border border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <MessageSquare size={36} className="mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-wider">No active dispatch messages</p>
                  <p className="text-[11px] text-slate-600 mt-1">Send a message below to reach the transit controller.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender === 'driver';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-xs font-bold ${
                        isMe 
                          ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-600/20' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                      }`}>
                        <p>{m.text}</p>
                        <div className={`text-[9px] uppercase mt-1.5 ${isMe ? 'text-cyan-200 text-right' : 'text-slate-400'}`}>
                          {isMe ? 'You (Captain)' : 'Admin Dispatch'} • {m.sent_at || 'Just now'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                "Reached stop on time", 
                "Heavy traffic, 10 min delay", 
                "All students boarded", 
                "Clear road ahead", 
                "Please call me"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(chip)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-bold text-slate-300 whitespace-nowrap active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type dispatch instruction or report..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
              />
              <button 
                type="submit"
                disabled={isSendingMsg || !chatInput.trim()}
                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: 🛡️ VEHICLE INSPECTION & SAFETY                     */}
        {/* ========================================================= */}
        {activeTab === 'vehicle' && (
          <div className="space-y-6">
            
            {/* Bus Specs Card */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{busName} Telemetry Spec</h3>
                    <p className="text-xs font-bold text-slate-400">License Plate: {vehicleNumber} • Euro-VI Diesel</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase">
                  Fitness Certified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400">Max Capacity</div>
                  <div className="text-lg font-black text-white mt-0.5">40 Seats</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400">Fuel Tank</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">82% Full</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400">Tire Pressure</div>
                  <div className="text-lg font-black text-cyan-400 mt-0.5">34 PSI OK</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400">Next Service</div>
                  <div className="text-lg font-black text-slate-300 mt-0.5">In 2,400 KM</div>
                </div>
              </div>
            </div>

            {/* Pre-Trip Safety Inspection Checklist */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wrench size={16} className="text-cyan-400" />
                <span>Pre-Trip Captain Safety Checklist</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'brakes', label: 'Air Brakes & Retarder Operational' },
                  { key: 'tires', label: 'Tire Tread & Pressure Inspected' },
                  { key: 'mirrors', label: 'Rearview & Blindspot Cameras Calibrated' },
                  { key: 'fuel', label: 'Fuel & Engine Oil Levels Verified' },
                  { key: 'firstAid', label: 'First Aid Kit & Fire Extinguisher Loaded' },
                  { key: 'emergencyDoor', label: 'Emergency Exit Door Lock Verified' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSafetyChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200">{item.label}</span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      safetyChecklist[item.key] ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {safetyChecklist[item.key] ? '✓' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Speed Dial */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Phone size={16} className="text-emerald-400" />
                <span>Campus Emergency Speed-Dial</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="tel:+914423456789"
                  className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-400 hover:text-white transition-all flex items-center gap-3 group"
                >
                  <Phone size={20} className="group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight">Security 24x7</div>
                    <div className="text-[10px] font-bold opacity-80">+91 44-2345-6789</div>
                  </div>
                </a>

                <a
                  href="tel:+919876543210"
                  className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/20 text-cyan-400 hover:text-white transition-all flex items-center gap-3 group"
                >
                  <Navigation size={20} className="group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight">Transport Officer</div>
                    <div className="text-[10px] font-bold opacity-80">+91 98765-43210</div>
                  </div>
                </a>

                <a
                  href="tel:108"
                  className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white transition-all flex items-center gap-3 group"
                >
                  <Zap size={20} className="group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight">Emergency 108</div>
                    <div className="text-[10px] font-bold opacity-80">Ambulance / Police</div>
                  </div>
                </a>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* BOTTOM COCKPIT NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 z-50 p-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around gap-1">
          
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'cockpit' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={18} />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'route' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin size={18} />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Stops ({stops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'dispatch' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicle')}
            className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'vehicle' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Safety</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
