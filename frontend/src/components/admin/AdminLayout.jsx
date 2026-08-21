import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminPageLoader from "./AdminPageLoader.jsx";
import AdminRouteErrorBoundary from "./AdminRouteErrorBoundary.jsx";

export default function AdminLayout() {
  return (
    <div className="admin-shell min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-slate-200">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <AdminRouteErrorBoundary>
              <Suspense fallback={<AdminPageLoader />}>
                <Outlet />
              </Suspense>
            </AdminRouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
