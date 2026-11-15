import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import SOSHoldButton from "../components/safety/SOSHoldButton";
import EmergencyDirectory from "../components/safety/EmergencyDirectory";
import { JourneySharePanel, VirtualEscortRequest, IncidentReportForm } from "../components/safety/SafetyStubs";

export default function SafetyHub() {
  const [sosAlert, setSOSAlert] = useState(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-[var(--bg-primary)] min-h-screen"
    >
      <PageHeader title="Safety Hub" />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-6 max-w-[800px] mx-auto">
        
        {/* 1. SOS Button - the main focal point */}
        <section>
          <h2 className="sr-only">Emergency SOS</h2>
          <SOSHoldButton onSuccess={(alert) => setSOSAlert(alert)} />
        </section>

        {/* 2. Journey Share */}
        <section>
          <JourneySharePanel />
        </section>

        {/* 3. Virtual Escort */}
        <section>
          <VirtualEscortRequest />
        </section>

        {/* 4. Incident Report */}
        <section>
          <IncidentReportForm />
        </section>

        {/* 5. Emergency Directory */}
        <section>
          <EmergencyDirectory />
        </section>

      </div>

      {/* Basic mock modal for SOS confirmation */}
      {sosAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] w-full max-w-sm p-6 shadow-[var(--shadow-modal)] text-center border border-[var(--danger)]/20">
            <div className="w-16 h-16 rounded-full bg-[var(--danger-bg)] flex items-center justify-center mx-auto mb-4 text-3xl">
              🚨
            </div>
            <h3 className="font-headline font-bold text-xl text-[var(--text-primary)] mb-2">Emergency Alert Sent</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Your location ({sosAlert.lat.toFixed(4)}, {sosAlert.lng.toFixed(4)}) has been shared with Campus Security. Help is on the way.
            </p>
            <div className="flex gap-3">
               <button className="btn-secondary flex-1" onClick={() => setSOSAlert(null)}>Close</button>
               <a href="tel:+914423456789" className="btn-primary flex-1 bg-[var(--danger)] text-white text-center flex items-center justify-center">Call Campus Police</a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
