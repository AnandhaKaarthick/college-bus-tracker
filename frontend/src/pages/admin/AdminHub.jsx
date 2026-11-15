import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Activity, Shield, Navigation, 
  MessageSquare, BarChart3, Bell, LogOut, Compass, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggleButton from '../../components/ThemeToggleButton';

import ActiveRoutesMonitor from './ActiveRoutesMonitor';
import RouteCreatorStudio from './RouteCreatorStudio';
import FleetMaintenance from './FleetMaintenance';
import CommunicationHub from './CommunicationHub';
import ScheduleManager from './ScheduleManager';
import InsightsDashboard from './InsightsDashboard';

const NAV_ITEMS = [
  { id: 'monitor',     label: 'Live Monitor',   shortLabel: 'Monitor', icon: Activity,      path: '/admin/monitor' },
  { id: 'routes',      label: 'Route Studio',   shortLabel: 'Studio',  icon: Compass,       path: '/admin/routes' },
  { id: 'dispatch',    label: 'Communication',  shortLabel: 'Comm',    icon: MessageSquare, path: '/admin/communication' },
  { id: 'fleet',       label: 'Fleet Status',   shortLabel: 'Fleet',   icon: Navigation,    path: '/admin/fleet' },
  { id: 'schedules',   label: 'Schedules',      shortLabel: 'Sched',   icon: Bell,          path: '/admin/schedules' },
  { id: 'insights',    label: 'Insights',       shortLabel: 'Insights',icon: BarChart3,     path: '/admin/insights' },
];

export default function AdminHub() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.id || 'monitor';

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--bg-primary)] overflow-hidden transition-colors duration-500">
      
      {/* MOBILE TOP BAR (visible on screens < md) */}
      <div className="md:hidden flex items-center justify-between p-4 px-5 bg-[var(--bg-secondary)] border-b border-[var(--border)] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase text-[var(--text-primary)] leading-none">Admin Hub</h1>
            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Fleet Control v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] hover:border-blue-500 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col pt-16">
          <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6 space-y-3 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Fleet Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20 font-black' 
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] font-bold'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm tracking-tight">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center">
              <button 
                onClick={logout}
                className="flex items-center gap-3 p-3 text-red-500 font-bold text-xs uppercase tracking-wider hover:bg-red-500/10 rounded-xl"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider p-3"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* DESKTOP SIDEBAR (visible on screens >= md) */}
      <div className="hidden md:flex w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex-col z-20 shrink-0">
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-[var(--text-primary)]">Admin Hub</h1>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Fleet Control v2.0</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <ThemeToggleButton showLabel className="flex w-full" />
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0">
        <Routes>
          <Route path="monitor" element={<ActiveRoutesMonitor />} />
          <Route path="routes" element={<RouteCreatorStudio />} />
          <Route path="communication" element={<CommunicationHub />} />
          <Route path="fleet" element={<FleetMaintenance />} />
          <Route path="schedules" element={<ScheduleManager />} />
          <Route path="insights" element={<InsightsDashboard />} />
          <Route path="*" element={<Navigate to="monitor" replace />} />
        </Routes>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (quick switcher on screens < md) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-around z-30 px-2 shadow-lg">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
                isActive ? 'text-[var(--accent-primary)] font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} className={isActive ? 'scale-110' : ''} />
              <span className="text-[9px] uppercase tracking-wider">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
