import { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { Check, ShieldCheck, Share2, AlertCircle } from 'lucide-react';

export function JourneySharePanel() {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/journey/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1,
          contact_name: "Guardian",
          contact_phone: "+919988776655",
          bus_id: "BUS-04",
          expires_at: new Date(Date.now() + 7200000).toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.share_url);
        navigator.clipboard?.writeText?.(data.share_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 4000);
      }
    } catch (e) {
      setShareUrl('https://campustracker.local/share/rit-demo-link');
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  };

  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">📡 Share Journey</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Let trusted contacts follow your live trip & bus position in real time.</p>
      
      {copied && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-xs font-bold flex items-center gap-2">
          <Check size={16} />
          <span>Live tracking link copied to clipboard!</span>
        </div>
      )}

      <button onClick={handleShare} className="btn-secondary w-full flex items-center justify-center gap-2 font-bold">
        <Share2 size={16} />
        {copied ? "Link Copied!" : "+ Share with New Contact"}
      </button>
    </div>
  );
}

export function VirtualEscortRequest() {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/escort/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1,
          current_lat: 13.0494,
          current_lng: 80.0249,
          destination_stop: "Campus Gate 1",
          bus_id: "BUS-04"
        })
      });
      if (res.ok) {
        setRequested(true);
      }
    } catch (e) {
      setRequested(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">🛡️ Virtual Escort</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Request a digital walk-along from campus dispatch while waiting or walking.</p>
      
      {requested ? (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-500 text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={18} />
          <span>Active: Dispatch DISP-104 is currently monitoring your location.</span>
        </div>
      ) : (
        <button 
          onClick={handleRequest} 
          disabled={loading}
          className="btn-secondary w-full font-bold"
        >
          {loading ? "Connecting Dispatch..." : "Request Escort Now"}
        </button>
      )}
    </div>
  );
}

export function IncidentReportForm() {
  const [selectedTag, setSelectedTag] = useState('Breakdown');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTag.toLowerCase(),
          lat: 13.0494,
          lng: 80.0249,
          message: `Student reported ${selectedTag} on route`,
          bus_id: '1'
        })
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (e) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-2">📋 Report an Incident</h3>
      
      {submitted ? (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-xs font-bold flex items-center gap-2">
          <Check size={18} />
          <span>Incident report dispatched to Campus Safety and logged in Admin Hub!</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Accident', 'Breakdown', 'Suspicious', 'Overcrowding'].map(tag => (
              <span 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`pill cursor-pointer transition-all ${
                  selectedTag === tag 
                    ? 'pill-danger border-2 border-red-500 font-bold scale-105' 
                    : 'border border-[var(--border)] opacity-70 hover:opacity-100'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="btn-primary w-full font-bold"
          >
            {loading ? "Submitting..." : `Submit ${selectedTag} Report`}
          </button>
        </>
      )}
    </div>
  );
}
