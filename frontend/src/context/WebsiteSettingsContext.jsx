import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const WebsiteSettingsContext = createContext({
  websiteName: "Tekunik Automation",
  websiteMode: "live",
  setWebsiteMode: () => {},
  loading: true,
});

export function WebsiteSettingsProvider({ children }) {
  const [websiteMode, setWebsiteModeState] = useState("live");
  const [loading, setLoading] = useState(true);

  const fetchMode = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/website-mode`);
      const json = await res.json();
      if (json.success && json.data?.mode) {
        setWebsiteModeState(json.data.mode);
      }
    } catch (err) {
      // default to live
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMode();
  }, [fetchMode]);

  const setWebsiteMode = useCallback(async (mode) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/api/settings/website-mode`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (json.success) {
        setWebsiteModeState(mode);
      }
    } catch (err) {
      console.error("Failed to update website mode", err);
    }
  }, []);

  const value = useMemo(() => ({ websiteName: "Tekunik Automation", websiteMode, setWebsiteMode, loading }), [websiteMode, loading, setWebsiteMode]);

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}
