import React, { useState, useEffect } from 'react';
import { X, User, Phone, Navigation, Zap, Users, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BusTelemetryModal({ busId, onClose }) {
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a specific API call
    // For now, we simulate fetching detailed telemetry
    const fetchTelemetry = async () => {
      setIsLoading(true);
      try {
        // Mocking a response for now
        setTimeout(() => {
          setTelemetry({
            busId: busId,
            speed: Math.floor(Math.random() * 60) + 20,
            occupancy: Math.floor(Math.random() * 30) + 10,
            capacity: 40,
            status: 'On Track',
            driver: {
              name: 'Suresh Raina',
              phone: '+91 98765 43210',
              license: 'TN-01-2023-0042',
              rating: 4.8
            },
            route: 'Ayapakkam → RIT Express',
            lastStop: 'Main Gate'
          });
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching telemetry:", err);
        setIsLoading(false);
      }
    };
    fetchTelemetry();
  }, [busId]);

  if (!busId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border)] shadow-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
          ) : telemetry && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Left Column: Driver info */}
              <div className="md:w-64 bg-[var(--bg-tertiary)] p-8 border-r border-[var(--border)]">
                <div className="w-20 h-20 bg-[var(--accent-primary)]/10 rounded-3xl flex items-center justify-center text-[var(--accent-primary)] mb-6 mx-auto md:mx-0">
                  <User size={40} />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-1">{telemetry.driver.name}</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Assigned Captain</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-xs font-bold text-[var(--text-secondary)]">{telemetry.driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-xs font-bold text-[var(--text-secondary)]">LIC: {telemetry.driver.license}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Stats */}
              <div className="flex-1 p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none mb-2">Live Telemetry</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Bus {busId} • {telemetry.route}</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">
                    <X size={20} className="text-[var(--text-muted)]" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-tertiary)] p-5 rounded-3xl border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                      <Gauge size={16} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Speed</span>
                    </div>
                    <div className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                      {telemetry.speed} <span className="text-xs text-[var(--text-muted)] uppercase">km/h</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-tertiary)] p-5 rounded-3xl border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                      <Users size={16} className="text-green-500" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Occupancy</span>
                    </div>
                    <div className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                      {telemetry.occupancy}<span className="text-xs text-[var(--text-muted)] uppercase">/{telemetry.capacity}</span>
                    </div>
                  </div>

                  <div className="col-span-2 bg-[var(--bg-tertiary)] p-5 rounded-3xl border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                      <Navigation size={16} className="text-indigo-500" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Next Milestone</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-black text-[var(--text-primary)] tracking-tight">Currently passing {telemetry.lastStop}</div>
                      <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">On Schedule</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button className="flex-1 bg-[var(--accent-primary)] hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    EMERGENCY CALL
                  </button>
                  <button className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-black py-4 rounded-2xl transition-all active:scale-95">
                    SEND MESSAGE
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
