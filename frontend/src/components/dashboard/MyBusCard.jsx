import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { useBusContext } from "../../context/BusContext";

function getNextDepartureText() {
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < 8) {
    return `Today at 08:00 AM`;
  } else if (currentHour < 18) {
    const nextSlot = new Date(now.getTime() + 25 * 60000);
    return `Today at ${nextSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } else {
    return `Tomorrow at 07:30 AM`;
  }
}

function NoBusCard() {
  const navigate = useNavigate();
  return (
    <div className="card text-center py-8 flex flex-col items-center justify-center">
      <p className="text-[var(--text-primary)] font-semibold mb-2">No bus scheduled right now</p>
      <p className="text-[var(--text-muted)] text-sm mb-4">Next departure: {getNextDepartureText()}</p>
      <button onClick={() => navigate("/map")} className="btn-secondary">
        Browse All Routes
      </button>
    </div>
  );
}

export default function MyBusCard({ isDesktop }) {
  const navigate = useNavigate();
  const { myBus, myBusETA, nextStop } = useBusContext();

  if (!myBus) return <NoBusCard />;

  const etaColor = myBusETA <= 2
    ? "var(--danger)"
    : myBusETA <= 5
    ? "var(--accent-primary)"
    : "var(--bg-navy-card)";

  if (isDesktop) {
    return (
      <div className="rounded-[var(--radius-lg)] overflow-hidden h-full min-h-[300px] relative"
        style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", background: "var(--bg-navy-card)" }}>
        
        {/* Background watermark icon (Bus) */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>

        <div className="p-8 flex flex-col h-full justify-between relative z-10">
          <div>
            <span className="pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 10px", fontSize: "10px", letterSpacing: "1px" }}>MY BUS TRACKING</span>
            
            <div className="mt-4 flex justify-between items-start">
              <div>
                <h3 className="text-white text-xl font-headline font-bold">{myBus.route_name}</h3>
                <p className="text-white/60 text-sm mt-1">Headed to {nextStop?.name}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                <svg className="text-white w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>

            <div className="mt-8 flex items-baseline gap-2">
              <span style={{ fontFamily: "var(--font-headline)", fontSize: 84, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                {String(myBusETA).padStart(2, "0")}
              </span>
              <span className="text-white/70 font-semibold">mins</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm font-bold tracking-widest uppercase mt-2">Estimated Arrival</p>
          </div>

          <div className="flex justify-between items-end mt-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-xs text-white border-2 border-[var(--bg-navy-card)] z-10">
                🧑
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs text-black border-2 border-[var(--bg-navy-card)] -ml-4 z-0 font-bold">
                +15
              </div>
            </div>
            <button onClick={() => navigate("/tracking")} className="bg-white text-[var(--bg-navy-card)] px-6 py-3 rounded-[var(--radius-md)] font-bold text-sm tracking-wide hover:bg-gray-100 transition-colors">
              VIEW DETAILS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>

      {/* Top — Dark hero section */}
      <div className="px-5 pt-5 pb-4"
        style={{ background: etaColor, transition: "background 600ms ease" }}>

        {/* Route label */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                    color: "rgba(255,255,255,0.70)", fontWeight: 500 }}>
          🚌 {myBus.bus_id} · {myBus.route_name}
        </p>

        {/* ETA hero */}
        <div className="flex items-baseline gap-2 my-3">
          <span style={{ fontFamily: "var(--font-headline)", fontSize: 64,
                         fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {String(myBusETA).padStart(2, "0")}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14,
                         color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>
            mins away
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)",
                      marginBottom: 12 }} />

        {/* Next stop + status row */}
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                      color: "rgba(255,255,255,0.75)" }}>
            Next: <strong style={{ color: "#fff" }}>{nextStop?.name || "Loading..."}</strong>
          </p>
          <div className="flex gap-2">
            <span className="pill pill-success">● On Track</span>
            <span className="pill" style={{
              background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              🪑 {myBus.occupancy || "Med"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom — Driver info */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: "var(--bg-secondary)" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                      fontWeight: 500, color: "var(--text-primary)" }}>
            🧑 {myBus.driver_name || "Unknown Driver"}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12,
                      color: "var(--text-muted)" }}>
            Driver · {myBus.vehicle_number || "TN 00"}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${myBus.driver_phone || "0000"}`}
            className="btn-secondary p-2.5 rounded-[var(--radius-md)] flex items-center justify-center">
            <Phone size={16} />
          </a>
          <button onClick={() => navigate("/tracking")}
            className="btn-primary flex items-center gap-1.5 px-3 py-2.5
                       text-sm rounded-[var(--radius-md)]">
            Track <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
