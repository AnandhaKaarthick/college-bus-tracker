import { X, MapPin, Bell } from "lucide-react";
import FeatureBadge from "../FeatureBadge";

export default function StopDetailModal({ stop, busETA, walkETA, onClose, onSetAlert }) {
  if (!stop) return null;

  // Recommendation logic
  let bannerColor = "var(--success-bg)";
  let bannerText = "Plenty of time — walk at your own pace";
  let bannerEmoji = "💡";
  
  // Provide defaults for testing
  const finalBusETA = busETA || 15;
  const finalWalkETA = walkETA || 8;
  const buffer = finalBusETA - finalWalkETA;

  if (buffer < 0) {
    bannerColor = "var(--danger-bg)";
    bannerText = "Bus arrives before you can walk there. Board at your nearest stop.";
    bannerEmoji = "⚠️";
  } else if (buffer <= 5) {
    bannerColor = "var(--danger-bg)";
    bannerText = "Walk quickly — bus arrives soon!";
    bannerEmoji = "⚠️";
  } else if (buffer <= 15) {
    bannerColor = "var(--warning-bg)";
    bannerText = "Start walking now to board comfortably";
    bannerEmoji = "🏃";
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] w-full max-w-md shadow-[var(--shadow-modal)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-primary)]"><MapPin size={20} /></span>
            <h2 className="font-headline font-bold text-lg text-[var(--text-primary)]">{stop.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-6">
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bus Card */}
            <div className="card border-[var(--border)] shadow-none flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)]">
                <span>🚌</span> Bus arrives
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline font-bold text-4xl text-[var(--text-primary)]">{finalBusETA}</span>
                <span className="text-[var(--text-muted)] font-semibold">min</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">On schedule</p>
            </div>

            {/* Walk Card */}
            <div className="card border-[var(--border)] shadow-none flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)]">
                <span>🚶</span> You arrive
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline font-bold text-4xl text-[var(--text-primary)]">{finalWalkETA}</span>
                <span className="text-[var(--text-muted)] font-semibold">min</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">850m from you</p>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className="rounded-[var(--radius-md)] p-4 flex items-start gap-3 border border-black/5" style={{ background: bannerColor }}>
            <span className="text-xl">{bannerEmoji}</span>
            <div>
              <p className="font-bold text-[var(--text-primary)] text-sm">{buffer > 0 ? `${buffer} min buffer.` : "No buffer."}</p>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">{bannerText}</p>
            </div>
          </div>

          {/* Features Row */}
          <div className="flex flex-wrap gap-2">
             <FeatureBadge type="wifi" />
             <FeatureBadge type="low" />
          </div>

        </div>

        {/* Actions */}
        <div className="p-5 bg-[var(--bg-tertiary)] border-t border-[var(--border)] grid grid-cols-2 gap-3">
          <button className="btn-secondary flex items-center justify-center gap-2">
            <MapPin size={16} /> Show on Map
          </button>
          <button onClick={() => onSetAlert && onSetAlert(stop)} className="btn-primary flex items-center justify-center gap-2">
            <Bell size={16} /> Alert Me
          </button>
        </div>

      </div>
    </div>
  );
}
