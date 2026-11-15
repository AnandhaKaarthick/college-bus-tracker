import FeatureBadge from "../FeatureBadge";
import { ChevronRight } from "lucide-react";

// Helper components for the visual lines and dots
function StepperLine({ status, prevStatus }) {
  const isPassed = prevStatus === "passed" && status === "passed";
  const isActive = prevStatus === "passed" && (status === "next" || status === "upcoming");
  
  return (
    <div className={`absolute left-4 top-0 -mt-6 h-12 w-0.5 z-0 ${isPassed ? 'bg-[var(--success)]' : isActive ? 'bg-[var(--accent-primary)]' : 'border-l-2 border-dashed border-[var(--border)]'}`} />
  );
}

function StepperNode({ status }) {
  if (status === "passed") {
    return <div className="w-5 h-5 rounded-full bg-[var(--success)] flex items-center justify-center text-white text-[10px] z-10 border-2 border-[var(--bg-secondary)]">✓</div>;
  }
  if (status === "next") {
    return (
      <div className="relative flex items-center justify-center z-10 w-5 h-5">
        <span className="absolute w-full h-full rounded-full bg-[var(--accent-primary)] opacity-40 animate-ping"></span>
        <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></div>
      </div>
    );
  }
  if (status === "destination" || status === "student_stop") {
    return <div className="text-xl z-10 bg-[var(--bg-secondary)] text-[var(--accent-primary)]">★</div>;
  }
  return <div className="w-3 h-3 rounded-full border-2 border-[var(--border)] bg-[var(--bg-secondary)] z-10"></div>;
}

export default function StopStepper({ stops, studentLocation, onStopTap }) {
  if (!stops || stops.length === 0) return null;

  // Mock statuses for visual demonstration since we don't have full backend logic hooked up yet
  const getStopStatus = (index) => {
    if (index < 3) return "passed";
    if (index === 3) return "next";
    if (index === stops.length - 1) return "destination";
    return "upcoming";
  };

  const getStopETA = (index) => {
    if (index < 3) return null;
    return (index - 2) * 8; // mock ETA calculation
  };

  return (
    <div className="relative px-2">
      {stops.map((stop, index) => {
        const status  = getStopStatus(index);
        const eta     = getStopETA(index);
        const isFirst = index === 0;

        return (
          <div key={stop.id || stop.stop_id || index} className="relative flex">

            {/* Vertical connector line (above node) */}
            {!isFirst && (
              <StepperLine status={status} prevStatus={getStopStatus(index - 1)} />
            )}

            <StopStepperRow
              stop={stop}
              status={status}
              eta={eta}
              onTap={
                status === "upcoming" || status === "destination" || status === "next" || status === "student_stop"
                  ? () => onStopTap && onStopTap(stop, eta, studentLocation)
                  : null
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function StopStepperRow({ stop, status, eta, onTap }) {
  const isPassed  = status === "passed";
  const isNext    = status === "next";
  const isTappable = !!onTap;

  return (
    <button
      onClick={onTap}
      disabled={!isTappable}
      className={`
        flex items-center gap-4 w-full text-left py-4 px-2
        transition-colors duration-150 z-10 bg-transparent
        ${isTappable ? "hover:bg-[var(--bg-tertiary)] active:scale-[0.99] rounded-xl cursor-pointer" : "cursor-default"}
      `}
    >
      {/* Node */}
      <div className="flex flex-col items-center justify-center w-6 h-6">
        <StepperNode status={status} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between">
        <div>
          {/* Timestamp (passed) or ETA label */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 700,
            color: isPassed ? "var(--success)" : "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {isPassed
              ? (stop.arrival_time || "07:00") // Mock past time
              : isNext
              ? "NEXT"
              : eta ? `~${eta}m` : ""}
          </p>

          {/* Stop name */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: isNext || status === "destination" ? 700 : 500,
            color: isPassed
              ? "var(--text-muted)"
              : isNext
              ? "var(--accent-primary)"
              : "var(--text-primary)",
            opacity: isPassed ? 0.6 : 1,
            marginTop: 2
          }}>
            {stop.name}
          </p>
        </div>

        {/* Right side: badges + chevron */}
        <div className="flex items-center gap-2">
          {stop?.id % 2 === 0 && <FeatureBadge type="wifi" />}
          {stop?.id % 3 === 0 && <FeatureBadge type="delay" />}
          {isNext && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14,
                           fontWeight: 800, color: "var(--accent-primary)" }}>
              {eta} min
            </span>
          )}
          {isTappable && (
            <ChevronRight size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>
    </button>
  );
}
