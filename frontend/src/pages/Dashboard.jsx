import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import MyBusCard from "../components/dashboard/MyBusCard";
import StatsCard from "../components/dashboard/StatsCard";
import MiniMapWidget from "../components/dashboard/MiniMapWidget";
import AlertsFeed from "../components/dashboard/AlertsFeed";
import { useAuth } from "../context/AuthContext";
import { useBusContext } from "../context/BusContext";
import { motion } from "framer-motion";

function getGreeting(name, hour) {
  if (hour < 12) return `Good morning, ${name} 👋`;
  if (hour < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 👋`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBusCount, studentsBoardedCount } = useBusContext();
  const hour = new Date().getHours();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="max-w-[1200px] mx-auto pb-24"
    >
      <PageHeader title="Campus Transit" />

      <div className="px-4 md:px-8 pt-6 pb-6 flex flex-col gap-6"
        style={{ background: "var(--bg-primary)" }}>

        {/* Greeting */}
        <div className="mb-2">
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: 24,
                       fontWeight: 700, color: "var(--text-primary)" }}>
            {getGreeting(user?.name || "Student", hour)}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                      color: "var(--text-muted)", marginTop: "4px" }}>
            Here is your campus commute status for today.
          </p>
        </div>

        {/* 2-Column Grid Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <StatsCard icon="🚌" value={activeBusCount}
                label={<span>Active Buses <span className="text-green-500 font-bold ml-1">+2 today</span></span>} 
                color="var(--text-primary)" />
              <StatsCard icon="👥" value={studentsBoardedCount}
                label={<span>Boarded <span className="text-[var(--text-muted)] ml-1">avg 1.5k</span></span>} />
            </div>

            {/* Mini Map (Live Location) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-semibold text-[var(--text-primary)]">Live Location</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-green-500">Live</span>
                </div>
              </div>
              <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] shadow-sm">
                <MiniMapWidget />
              </div>
            </div>

            {/* Alerts */}
            <div className="flex flex-col gap-2 mt-2">
               <div className="flex justify-between items-center px-1">
                <h3 className="font-semibold text-[var(--text-primary)]">Admin Alerts</h3>
                <button className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                  Clear All
                </button>
              </div>
              <AlertsFeed />
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* My Bus Card (Large) */}
            <div className="h-full">
              <MyBusCard isDesktop />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors text-center border-dashed border-2">
                <span className="font-headline font-bold text-xl mb-1">SOS</span>
                <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Emergency SOS</span>
              </div>
              <div className="card flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors text-center border-dashed border-2" onClick={() => navigate('/map')}>
                <span className="text-2xl mb-2">🗺️</span>
                <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Full Map</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Action Button (Red Star) */}
      <button className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform z-50 shadow-[0_4px_20px_rgba(230,57,70,0.4)]">
        ✽
      </button>

    </motion.div>
  );
}
