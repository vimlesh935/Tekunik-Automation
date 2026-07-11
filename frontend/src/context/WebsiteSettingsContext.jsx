import React, { createContext, useContext, useMemo } from "react";

const WebsiteSettingsContext = createContext({
  websiteName: "Tekunik Automation",
});

export function WebsiteSettingsProvider({ children }) {
  const value = useMemo(() => ({ websiteName: "Tekunik Automation" }), []);

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}