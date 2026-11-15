import { useState, useEffect } from 'react';
import { API_BASE_URL, WS_BASE_URL } from '../../config';

export default function AlertsFeed({ onAlertCountChange }) {
  const [alerts, setAlerts] = useState([]);
  const [cleared, setCleared] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.announcements || []).map(a => {
          const isDelay = a.title.toLowerCase().includes('delay') || a.message.toLowerCase().includes('late');
          const isResolved = a.title.toLowerCase().includes('back') || a.title.toLowerCase().includes('resolved');
          return {
            id: a.id,
            icon: isDelay ? "⚠️" : isResolved ? "✅" : "📢",
            pillType: isDelay ? "warning" : isResolved ? "success" : "info",
            title: a.title,
            desc: `${a.message} · ${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          };
        });
        setAlerts(mapped);
        if (onAlertCountChange) onAlertCountChange(mapped.length);
      }
    } catch (err) {
      console.error("Error fetching announcements in AlertsFeed:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Live update on new announcement via WebSocket
    const ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_announcement' && msg.announcement) {
          const a = msg.announcement;
          const isDelay = a.title.toLowerCase().includes('delay') || a.message.toLowerCase().includes('late');
          const isResolved = a.title.toLowerCase().includes('back') || a.title.toLowerCase().includes('resolved');
          
          setAlerts(prev => [
            {
              id: a.id,
              icon: isDelay ? "⚠️" : isResolved ? "✅" : "📢",
              pillType: isDelay ? "warning" : isResolved ? "success" : "info",
              title: a.title,
              desc: `${a.message} · Just now`
            },
            ...prev
          ]);
          setCleared(false);
        }
      } catch (e) {
        console.error("Alerts WS error:", e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const handleClearAll = () => {
    setCleared(true);
  };

  if (cleared || alerts.length === 0) {
    return (
      <div className="card p-5 text-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)]">
        <p className="text-xs text-[var(--text-muted)] font-semibold">
          {cleared ? "All alerts cleared for this session." : "No active alerts at this moment."}
        </p>
        {cleared && (
          <button 
            onClick={() => setCleared(false)} 
            className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider mt-2 hover:underline"
          >
            Show Dismissed Alerts
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <h3 className="font-headline font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span>🔔</span> Alerts
        </h3>
        <button 
          onClick={handleClearAll}
          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>
      
      <div className="flex flex-col">
        {alerts.map((alert, idx) => (
          <div key={alert.id} className={`px-4 sm:px-5 py-3.5 sm:py-4 flex gap-3 min-w-0 ${idx !== alerts.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
            <span className={`pill pill-${alert.pillType} self-start shrink-0 text-sm py-1`}>
              {alert.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-body text-sm font-semibold text-[var(--text-primary)] break-words">{alert.title}</h4>
              <p className="font-body text-xs text-[var(--text-muted)] mt-1 break-words">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
