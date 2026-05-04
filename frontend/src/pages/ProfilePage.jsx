import React, { useState } from "react";
import { 
  User, Mail, Phone, Hash, MapPin, 
  Bell, Heart, Shield, Save, Plus, 
  ChevronRight, Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const [notifications, setNotifications] = useState({
    sms: true,
    push: false,
    eta: false
  });

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex-1 bg-[var(--bg-primary)] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">My Profile</h1>
          <p className="text-sm font-medium text-[var(--text-muted)]">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal & Notifications */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* User Info Card */}
            <div className="bg-[var(--bg-secondary)] p-10 rounded-[50px] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-600/20">
                  ST
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Student User</h2>
                  <p className="text-blue-600 font-bold text-sm">B.Tech Computer Science</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField icon={Mail} label="Email Address" value="user@rit.ac.in" />
                <InfoField icon={Phone} label="Phone Number" value="+91 98765 43210" />
                <InfoField icon={Hash} label="Roll Number" value="21CS104" />
                <InfoField icon={MapPin} label="Default Stop" value="Main Gate, Porur" />
              </div>
            </div>

            {/* Attendance Marking Card */}
            <div className="bg-blue-600 p-10 rounded-[50px] border border-blue-500 shadow-xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles size={120} className="text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Bus Attendance</h3>
                </div>

                <p className="text-blue-100 text-sm font-medium mb-8 max-w-md leading-relaxed">
                  Help us track occupancy! Mark your attendance when boarding or deboarding the bus.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button className="flex-1 bg-white text-blue-600 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Check In
                  </button>
                  <button className="flex-1 bg-blue-500/30 text-white border border-white/20 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500/50 transition-all">
                    Check Out
                  </button>
                </div>
                
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                    42 Students currently on board
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-[var(--bg-secondary)] p-10 rounded-[50px] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Bell className="text-[var(--text-primary)]" size={24} />
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Notification Preferences</h3>
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
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[30px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
              <Save size={20} />
              Save Changes
            </button>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Saved Routes */}
            <div className="bg-[var(--bg-secondary)] p-8 rounded-[40px] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="text-red-500" size={20} />
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Saved Routes</h3>
              </div>
              
              <div className="space-y-3">
                <SavedRouteCard from="Tambaram" to="Campus" info="Bus RIT-02 • 8:10 AM" />
                <SavedRouteCard from="Main Gate" to="Porur" info="Bus RIT-01 • 4:15 PM" />
              </div>
            </div>

            {/* Emergency Settings */}
            <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-red-600" size={20} />
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Emergency Settings</h3>
              </div>
              <p className="text-[10px] font-bold text-red-400 leading-relaxed mb-6 uppercase tracking-wider">
                In case of emergency during transit, these contacts will be immediately notified along with your live location.
              </p>
              
              <div className="space-y-3">
                <EmergencyContact label="Primary SOS Contact" name="Father" number="+91 99887 76655" />
                <EmergencyContact label="Campus Security" name="Helpdesk" number="044-1234-5678" />
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
    <div className="bg-[var(--bg-tertiary)] p-6 rounded-[28px] flex items-center gap-4 border border-[var(--border)]/50">
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[var(--text-muted)] shadow-sm">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</div>
        <div className="text-sm font-black text-[var(--text-primary)]">{value}</div>
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
        className={`w-14 h-8 rounded-full transition-all relative ${active ? 'bg-green-500' : 'bg-gray-200'}`}
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
    <div className="bg-white p-5 rounded-[28px] border border-red-100 shadow-sm">
      <div className="text-[8px] font-black text-red-300 uppercase tracking-[0.2em] mb-1">{label}</div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-[var(--text-primary)]">{name}</span>
        <span className="text-[10px] font-bold text-red-500">{number}</span>
      </div>
    </div>
  );
}
