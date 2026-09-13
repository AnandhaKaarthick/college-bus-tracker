import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, MapPin, Navigation, Signal, Radio, 
  MessageSquare, AlertTriangle, Send, Phone, 
  Info, Zap, ChevronRight, User, Settings
} from 'lucide-react';
import { WS_BASE_URL } from '../config';

export default function DriverApp() {
  const [activeTab, setActiveTab] = useState('trip');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState('');
  const [isSOSActive, setIsSOSActive] = useState(false);
  
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  
  useEffect(() => {
    if (isBroadcasting) {
      wsRef.current = new WebSocket(`${WS_BASE_URL}/ws/driver/1`);
      wsRef.current.onerror = () => setError('Connection lost. Reconnecting...');
      return () => { if (wsRef.current) wsRef.current.close(); };
    }
  }, [isBroadcasting]);

  const toggleBroadcasting = () => {
    if (isBroadcasting) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setIsBroadcasting(false);
      setLocation(null);
    } else {
      if (!navigator.geolocation) { setError('GPS not supported'); return; }
      setIsBroadcasting(true);
      setError('');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : 0
          };
          setLocation(newLoc);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'location_update',
              data: { lat: newLoc.lat, lng: newLoc.lng, speed: parseFloat(newLoc.speed) }
            }));
          }
        },
        (err) => { setError(err.message); setIsBroadcasting(false); },
        { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
      );
    }
  };

  const handleSOS = () => {
    setIsSOSActive(true);
    setTimeout(() => setIsSOSActive(false), 5000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030213] text-slate-200 overflow-hidden selection:bg-blue-500/30">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-[20%] w-[60%] h-[40%] bg-blue-900/20 blur-[150px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-10 p-8 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 border border-white/10">
              <User size={28} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#030213]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-none">Capt. Rajesh</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1.5 opacity-80">Unit 01 • Active Shift</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings size={20} />
          </button>
          <button 
            onClick={handleSOS} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
              isSOSActive 
                ? 'bg-red-600 border-red-500' 
                : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white'
            }`}
          >
            <AlertTriangle size={20} />
          </button>
        </div>
      </div>

      {/* Main Experience Container */}
      <div className="flex-1 relative z-10 overflow-y-auto px-6 pb-32">
        {activeTab === 'trip' ? (
          <div className="space-y-8 max-w-lg mx-auto">
            {/* Status Orbit Card */}
            <div className={`p-10 rounded-[60px] border flex flex-col items-center relative overflow-hidden group transition-all duration-1000 ${
              isBroadcasting 
                ? 'bg-gradient-to-b from-blue-600 to-blue-800 border-blue-400 shadow-2xl' 
                : 'bg-white/5 border-white/10 backdrop-blur-2xl'
            }`}>
              <div className={`relative z-10 w-24 h-24 rounded-[35px] flex items-center justify-center mb-8 border-2 transition-all duration-700 ${
                isBroadcasting ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'
              }`}>
                {isBroadcasting ? <Radio size={40} className="animate-pulse" /> : <Shield size={40} />}
              </div>

              <h1 className="relative z-10 text-4xl font-bold text-white tracking-tight text-center mb-2">
                {isBroadcasting ? 'Live Mode' : 'Begin Trip'}
              </h1>
              <p className={`relative z-10 text-[10px] font-bold text-center uppercase tracking-widest mb-12 ${isBroadcasting ? 'text-blue-100' : 'text-slate-500'}`}>
                {isBroadcasting ? 'Broadcasting Real-time Telemetry' : 'Press to initialize GPS tracking'}
              </p>

              <button
                onClick={toggleBroadcasting}
                className={`relative z-10 w-full py-7 rounded-[40px] font-bold text-2xl transition-all active:scale-[0.96] uppercase tracking-widest border-4 ${
                  isBroadcasting 
                    ? 'bg-white text-blue-700 border-white' 
                    : 'bg-blue-600 text-white border-blue-500/50 hover:bg-blue-500'
                }`}
              >
                {isBroadcasting ? 'Stop Session' : 'Start Journey'}
              </button>
            </div>

            {/* Metrics Dashboard */}
            {isBroadcasting && location ? (
              <div className="grid grid-cols-2 gap-5">
                <MetricCard icon={Navigation} label="Ground Speed" value={location.speed} unit="KM/H" color="blue" />
                <MetricCard icon={Signal} label="Network Link" value="98%" unit="Stable" color="emerald" />
                
                <div className="col-span-2 p-8 rounded-[50px] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-between group transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Route Progress</span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">4.2 <span className="text-sm font-bold text-slate-500 uppercase">KM Tracked</span></div>
                    <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[42%] rounded-full" />
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-blue-600/10 rounded-full border-4 border-blue-600/20 border-t-blue-600 flex items-center justify-center">
                    <Zap size={24} className="text-blue-500" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[50px] bg-white/5 border border-white/10 border-dashed flex flex-col items-center justify-center opacity-40">
                <Info size={32} className="mb-4 text-slate-600" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Live stats appear after initialization</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 max-w-lg mx-auto">
            {/* Support Hero */}
            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-10 rounded-[60px] border border-white/10 backdrop-blur-2xl flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-[25px] flex items-center justify-center shadow-xl shadow-purple-900/40">
                <MessageSquare size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Control Room</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct link to Admin</p>
              </div>
            </div>

            {/* Reporting Interface */}
            <div className="space-y-5">
              <div className="flex justify-between items-end px-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Report Details</label>
                <span className="text-[10px] font-bold text-blue-500">Priority: Normal</span>
              </div>
              <textarea 
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Briefly explain the situation..."
                className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 text-white focus:outline-none focus:border-blue-600 transition-all min-h-[180px] placeholder:text-slate-700 font-medium"
              />
              <button className="w-full group bg-white text-[#030213] py-6 rounded-[40px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-blue-500 hover:text-white active:scale-[0.98]">
                Submit Report
                <Send size={18} />
              </button>
            </div>

            {/* Quick Dial Row */}
            <div className="grid grid-cols-2 gap-5">
              <ActionButton icon={Phone} label="Emergency Dial" color="emerald" />
              <ActionButton icon={Info} label="Fleet Status" color="blue" />
            </div>
          </div>
        )}
      </div>

      {/* Floating SOS Trigger (Mobile Optimized) */}
      {isBroadcasting && activeTab === 'trip' && (
        <div className="fixed bottom-36 right-8">
          <button 
            onClick={handleSOS}
            className="w-24 h-24 bg-red-600 text-white rounded-[40px] flex flex-col items-center justify-center shadow-2xl animate-pulse border-4 border-red-500/50"
          >
            <Zap size={28} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">SOS</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-[#030213] to-transparent z-[100]">
        <div className="max-w-md mx-auto p-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[35px] flex gap-2">
          <TabButton 
            active={activeTab === 'trip'} 
            onClick={() => setActiveTab('trip')} 
            icon={MapPin} 
            label="Live Ops" 
          />
          <TabButton 
            active={activeTab === 'support'} 
            onClick={() => setActiveTab('support')} 
            icon={MessageSquare} 
            label="Admin Hub" 
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color }) {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    purple: 'text-purple-500 bg-purple-500/10'
  };
  
  return (
    <div className="bg-white/5 p-8 rounded-[50px] border border-white/10 flex flex-col items-center group transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="font-bold text-3xl text-white tracking-tight">
        {value} <span className="text-xs text-slate-500 uppercase">{unit}</span>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color }) {
  const colors = {
    emerald: 'hover:bg-emerald-600 hover:text-white text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'hover:bg-blue-600 hover:text-white text-blue-500 bg-blue-500/10 border-blue-500/20'
  };
  return (
    <button className={`p-8 rounded-[45px] border flex flex-col items-center gap-3 transition-all active:scale-[0.96] ${colors[color]}`}>
      <Icon size={28} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex-1 py-4 rounded-[28px] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
        active 
          ? 'bg-blue-600 text-white shadow-xl' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
