import React, { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import apiCall from "../services/api";
import LoadingSpinner from "./LoadingSpinner.jsx";

const ComingSoon = React.lazy(() => import("../pages/ComingSoon.jsx"));

// The last-known mode is cached locally so returning visitors render the
// correct page instantly instead of waiting on a network round-trip first.
// The cache is only used as a paint-now hint: it is refreshed/revalidated on
// every mount, on a 20s interval, and when the tab regains focus, so an admin
// mode switch takes effect within seconds.
const CACHE_KEY = "tekunik_website_mode_v1";
const CACHE_TTL_MS = 60_000;

const readCachedMode = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const mode = parsed?.mode;
    if (mode !== "live" && mode !== "coming_soon") return null;
    const age = Date.now() - (Number(parsed.timestamp) || 0);
    return age >= 0 && age <= CACHE_TTL_MS ? mode : null;
  } catch {
    return null;
  }
};

const writeCachedMode = (mode) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ mode, timestamp: Date.now() }));
  } catch {
    // storage unavailable (private mode / quota) — the in-memory state is enough
  }
};

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
  const [mode, setMode] = useState(readCachedMode);

  useEffect(() => {
    let cancelled = false;

    const applyMode = (nextMode) => {
      const normalized =
        nextMode === "coming_soon" ? "coming_soon" : "live";
      writeCachedMode(normalized);
      if (!cancelled) setMode(normalized);
    };

    const check = () => {
      apiCall("/api/settings/website-mode")
        .then((res) =>
          applyMode(res?.data?.mode === "coming_soon" ? "coming_soon" : "live"),
        )
        .catch(() => applyMode("live"));
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

  // Loading state: never flash the wrong page while checking the mode.
  // Only applies to first-time visitors — returning visitors have a cache.
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