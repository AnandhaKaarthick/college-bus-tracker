import React, { useState } from "react";
import { useNavigate }     from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, Navigation, 
  ArrowRight, Lock, Mail, 
  ChevronRight, CheckCircle2 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { 
    id: "student", 
    label: "Student", 
    icon: User, 
    color: "var(--accent-primary)", 
    desc: "Track your bus & plan your commute",
    idPlaceholder: "Enter Roll Number (e.g. 21CS001)"
  },
  { 
    id: "driver", 
    label: "Driver", 
    icon: Navigation, 
    color: "#10B981", 
    desc: "Start your trip & share live location",
    idPlaceholder: "Enter Driver ID (e.g. DR-402)"
  },
  { 
    id: "admin", 
    label: "Admin", 
    icon: Shield, 
    color: "#6366F1", 
    desc: "Manage fleet & monitor operations",
    idPlaceholder: "Enter Admin Email"
  }
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [idValue,      setIdValue]      = useState("");
  const [password,     setPassword]     = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const { login }                       = useAuth();
  const navigate                        = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const user = login({ id: idValue, role: selectedRole.id });
      
      // Orchestration: Redirect based on role
      if (user.role === "admin")   navigate("/admin");
      else if (user.role === "driver") navigate("/driver");
      else navigate("/dashboard");
      
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-primary)] overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-12 items-center z-10">
        
        {/* Left Side: Branding */}
        <div className="flex-1 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] mb-8 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">RIT Chennai Transit</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-6 leading-[0.9]"
          >
            SMART <br /> <span className="text-[var(--accent-primary)]">COMMUTE.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] max-w-md font-medium leading-relaxed"
          >
            Access the official campus transport portal. Track, manage, and optimize your daily travel with precision.
          </motion.p>
        </div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full md:w-[460px] glass border-white/10 rounded-[48px] p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">Portal Login</h2>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Select your role to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="flex p-1.5 bg-[var(--bg-tertiary)] rounded-2xl mb-8 border border-[var(--border)]/50">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role); setIdValue(""); }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all relative ${
                    isActive ? "bg-[var(--bg-secondary)] shadow-lg" : "hover:bg-white/5 opacity-60"
                  }`}
                >
                  <Icon size={18} color={isActive ? role.color : "var(--text-muted)"} />
                  <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                    {role.label}
                  </span>
                  {isActive && (
                    <motion.div layoutId="activeRole" className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent-primary)]" />
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Identity</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder={selectedRole.idPlaceholder}
                  value={idValue}
                  onChange={(e) => setIdValue(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-[var(--accent-primary)] focus:ring-4 ring-blue-500/10 transition-all font-bold text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Secure Pin</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-[var(--accent-primary)] focus:ring-4 ring-blue-500/10 transition-all font-bold text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--accent-primary)] hover:bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>AUTHENTICATE</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border)]/50 text-center">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
              Authorized personnel only. <br /> Unauthorized access is strictly prohibited.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
