import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { frontendSettingsService } from "../services/api";
import { getImageUrl } from "../utils/imageUrl.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const defaultSettings = {
  hero_heading: "Smart Living Starts Here",
  hero_image: "",
  company_logo: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  company_favicon: "",
  instagram_url: "",
  facebook_url: "",
  linkedin_url: "",
  youtube_url: "",
};

const WebsiteSettingsContext = createContext({
  settings: defaultSettings,
  websiteName: "Tekunik Automation",
  websiteMode: "live",
  setWebsiteMode: () => {},
  refreshSettings: () => {},
  loading: true,
});

export function WebsiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [websiteMode, setWebsiteModeState] = useState("live");
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await frontendSettingsService.get();
      if (res.success && res.data) {
        setSettings({ ...defaultSettings, ...res.data });
      }
    } catch (err) {
      // use defaults
    }
  }, []);

  const fetchMode = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/website-mode`);
      const json = await res.json();
      if (json.success && json.data?.mode) {
        setWebsiteModeState(json.data.mode);
      }
    } catch (err) {
      // default to live
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchSettings(), fetchMode()]);
      setLoading(false);
    };
    init();
  }, [fetchSettings, fetchMode]);

  useEffect(() => {
    if (!settings.company_favicon || typeof document === "undefined") return;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = getImageUrl(settings.company_favicon);
  }, [settings.company_favicon]);

  const setWebsiteMode = useCallback(async (mode) => {
    try {
      const token = localStorage.getItem("authToken");
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

  const refreshSettings = useCallback(() => {
    return fetchSettings();
  }, [fetchSettings]);

  const websiteName = settings.company_name || "Tekunik Automation";

  const value = useMemo(() => ({
    settings,
    websiteName,
    websiteMode,
    setWebsiteMode,
    refreshSettings,
    loading,
  }), [settings, websiteName, websiteMode, loading, setWebsiteMode, refreshSettings]);

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}
