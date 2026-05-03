import React from "react";
import PageHeader from "../components/PageHeader";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="My Profile" />
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Profile Settings</h2>
        <p className="text-[var(--text-muted)]">Building profile soon...</p>
      </div>
    </div>
  );
}
