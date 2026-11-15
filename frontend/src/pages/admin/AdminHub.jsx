import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Activity, Shield, Navigation, 
  MessageSquare, BarChart3, Bell, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggleButton from '../../components/ThemeToggleButton';

import ActiveRoutesMonitor from './ActiveRoutesMonitor';
import FleetMaintenance from './FleetMaintenance';
import CommunicationHub from './CommunicationHub';
import ScheduleManager from './ScheduleManager';
import InsightsDashboard from './InsightsDashboard';

const NAV_ITEMS = [
  { id: 'monitor',     label: 'Live Monitor',   icon: Activity,      path: '/admin/monitor' },
  { id: 'dispatch',    label: 'Communication',  icon: MessageSquare, path: '/admin/communication' },
  { id: 'fleet',       label: 'Fleet Status',   icon: Navigation,    path: '/admin/fleet' },
  { id: 'schedules',   label: 'Schedules',      icon: Bell,          path: '/admin/schedules' },
  { id: 'insights',    label: 'Insights',       icon: BarChart3,     path: '/admin/insights' },
];

export default function AdminHub() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.id || 'monitor';

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden transition-colors duration-500">
      
      {/* SIDEBAR */}
      <div className="w-20 md:w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col z-20">
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div className="hidden md:block">
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
                <span className="hidden md:block font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <ThemeToggleButton showLabel className="hidden md:flex w-full" />
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:block font-bold text-sm tracking-tight">Sign Out</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Routes>
          <Route path="monitor" element={<ActiveRoutesMonitor />} />
          <Route path="communication" element={<CommunicationHub />} />
          <Route path="fleet" element={<FleetMaintenance />} />
          <Route path="schedules" element={<ScheduleManager />} />
          <Route path="insights" element={<InsightsDashboard />} />
          <Route path="*" element={<Navigate to="monitor" replace />} />
        </Routes>
      </div>
    </div>
  );
}
