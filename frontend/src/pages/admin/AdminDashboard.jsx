import React from "react";
import DashboardAnalytics from "../../admin/components/dashboard/DashboardAnalytics.jsx";
import RecentProposals from "../../admin/components/dashboard/RecentProposals.jsx";
import {
  LiveActivityWidget,
  TodaySummaryWidget,
  NeedsAttentionWidget,
  PriceDropAnalyticsWidget,
} from "../../admin/components/dashboard/ActivityWidgets.jsx";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LiveActivityWidget refreshInterval={20000} />
        <TodaySummaryWidget />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PriceDropAnalyticsWidget />
        <NeedsAttentionWidget />
      </div>
      <DashboardAnalytics refreshInterval={30000} />
      <RecentProposals />
    </div>
  );
}
