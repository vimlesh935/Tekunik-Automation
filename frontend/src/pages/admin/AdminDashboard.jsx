import React from "react";
import DashboardAnalytics from "../../admin/components/dashboard/DashboardAnalytics.jsx";
import RecentProposals from "../../admin/components/dashboard/RecentProposals.jsx";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <DashboardAnalytics refreshInterval={30000} />
      <RecentProposals />
    </div>
  );
}
