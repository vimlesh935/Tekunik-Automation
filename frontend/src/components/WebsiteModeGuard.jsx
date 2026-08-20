import React, { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import apiCall from "../services/api";
import LoadingSpinner from "./LoadingSpinner.jsx";

const ComingSoon = React.lazy(() => import("../pages/ComingSoon.jsx"));

/**
 * Centralized website mode guard.
 *
 * Reads the LIVE / COMING SOON switch from the existing settings API
 * (/api/settings/website-mode) and:
 *  - "coming_soon" -> renders the Coming Soon page for the whole storefront
 *  - otherwise     -> renders the customer-facing website
 *
 * Admin routes are declared OUTSIDE this guard and stay unaffected.
 */
export default function WebsiteModeGuard() {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      apiCall("/api/settings/website-mode")
        .then((res) => {
          if (!cancelled) setMode(res?.data?.mode || "live");
        })
        .catch(() => {
          if (!cancelled) setMode("live");
        });
    };

    check();
    // Keep the mode in sync so admin switches take effect without a refresh
    const timer = window.setInterval(check, 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Loading state: never flash the wrong page while checking the mode
  if (mode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm font-medium text-text-secondary">Checking website status...</p>
        </div>
      </div>
    );
  }

  if (mode === "coming_soon") {
    return (
      <Suspense fallback={<LoadingSpinner type="page" />}>
        <ComingSoon />
      </Suspense>
    );
  }

  return <Outlet />;
}