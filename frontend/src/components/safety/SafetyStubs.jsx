

export function JourneySharePanel() {
  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">📡 Share Journey</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Let trusted contacts follow your trip in real time.</p>
      <button className="btn-secondary w-full">+ Share with New Contact</button>
    </div>
  );
}

export function VirtualEscortRequest() {
  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">🛡️ Virtual Escort</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Request a digital walk-along from campus dispatch.</p>
      <button className="btn-secondary w-full">Request Escort Now</button>
    </div>
  );
}

export function IncidentReportForm() {
  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">📋 Report an Incident</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="pill pill-danger border border-[var(--danger)] cursor-pointer">Accident</span>
        <span className="pill pill-danger border border-[var(--danger)] cursor-pointer">Breakdown</span>
        <span className="pill pill-warning border border-[var(--warning)] cursor-pointer">Suspicious</span>
      </div>
      <button className="btn-primary w-full">Submit Report</button>
    </div>
  );
}
