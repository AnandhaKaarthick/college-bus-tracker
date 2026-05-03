import React, { useState, useEffect, useRef } from 'react';
import { Shield, MapPin, Navigation, Signal, Radio } from 'lucide-react';

export default function DriverApp() {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  
  useEffect(() => {
    if (isBroadcasting) {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/driver/1');
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 p-6 items-center justify-center font-sans">
      <div className="max-w-md w-full glass-dark rounded-[40px] shadow-2xl overflow-hidden p-10 flex flex-col items-center relative">
        
        {/* Pulsing Signal Background */}
        {isBroadcasting && (
          <div className="absolute top-10 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping absolute"></div>
            <div className="w-24 h-24 bg-blue-500/30 rounded-full animate-ping absolute" style={{ animationDelay: '0.5s' }}></div>
          </div>
        )}

        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 relative z-10 border border-slate-700">
          {isBroadcasting ? <Radio className="text-blue-500 animate-pulse" size={32} /> : <Shield className="text-slate-500" size={32} />}
        </div>
        
        <h1 className="text-3xl font-black mb-2 text-white tracking-tighter uppercase">Driver Portal</h1>
        <p className="text-slate-500 text-center mb-10 font-bold text-sm tracking-widest uppercase">
          Unit 01 • North Campus
        </p>

        {error && (
          <div className="w-full bg-red-500/10 text-red-500 p-4 rounded-2xl mb-8 text-xs font-bold text-center border border-red-500/20">
            {error}
          </div>
        )}

        <button
          onClick={toggleBroadcasting}
          className={`w-full py-6 rounded-3xl font-black text-xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-tighter ${
            isBroadcasting 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
          }`}
        >
          {isBroadcasting ? 'End Shift' : 'Begin Trip'}
        </button>

        {isBroadcasting && location && (
          <div className="mt-12 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Signal Strength</span>
              <div className="flex gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`}></div>)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex flex-col items-center">
                <Navigation className="text-slate-600 mb-2" size={16} />
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Speed</div>
                <div className="font-black text-2xl text-white">{location.speed} <span className="text-xs text-slate-600">KMH</span></div>
              </div>
              <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex flex-col items-center">
                <Signal className="text-slate-600 mb-2" size={16} />
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Status</div>
                <div className="font-black text-sm text-emerald-500 uppercase">On Route</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
