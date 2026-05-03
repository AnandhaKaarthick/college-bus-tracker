import React, { useState, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";

const HOLD_DURATION = 3000;

export default function SOSHoldButton({ onSuccess }) {
  const [progress, setProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const startTime = useRef(null);
  const animFrame = useRef(null);
  const controls = useAnimation();

  const startHold = useCallback(() => {
    if (sent || isSending) return;
    startTime.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        triggerSOS();
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [sent, isSending]);

  const endHold = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    if (progress < 100 && !sent) {
      // Shake and reset
      controls.start({
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.4 }
      });
      setProgress(0);
    }
  }, [progress, controls, sent]);

  async function triggerSOS() {
    setIsSending(true);
    // Mock API call
    setTimeout(() => {
      setSent(true);
      setIsSending(false);
      onSuccess?.({ id: "8841", lat: 13.0827, lng: 80.2707 });
    }, 500);
  }

  // SVG ring calculation
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="card flex flex-col items-center gap-6 py-8">
      <motion.div animate={controls} className="relative w-40 h-40">
        {/* Progress ring SVG */}
        <svg className="absolute inset-0 -rotate-90" width="160" height="160">
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--danger-bg)" strokeWidth="4" />
          <circle 
            cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke="var(--danger)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            style={{ transition: progress === 0 ? "none" : "stroke-dasharray 50ms linear" }}
          />
        </svg>

        {/* SOS Button core */}
        <motion.button
          className="absolute inset-3 rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
          style={{
            background: sent ? "var(--success)" : "var(--danger)",
            color: "var(--text-inverse)",
          }}
          animate={sent ? { scale: [1, 1.05, 1] } : {}}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 28 }}>{sent ? "✅" : "🚨"}</span>
          <span style={{ fontFamily: "var(--font-headline)", fontSize: 22, fontWeight: 800 }}>
            {sent ? "Sent" : "SOS"}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500, opacity: 0.8 }}>
            {sent ? "Help is on the way" : "Hold 3 sec"}
          </span>
        </motion.button>
      </motion.div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", textAlign: "center", maxWidth: 240 }}>
        Your GPS location will be shared instantly with Campus Security
      </p>
    </div>
  );
}
