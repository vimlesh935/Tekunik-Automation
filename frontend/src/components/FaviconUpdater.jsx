import React, { useEffect } from "react";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";

/**
 * Dynamically keeps the browser tab favicon in sync with the
 * favicon uploaded by the admin (company_favicon), shown to all users.
 *
 * Falls back to the default logo when no favicon is configured.
 */
export default function FaviconUpdater() {
  const { settings } = useWebsiteSettings();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const href = getImageUrl(settings.company_favicon) || "/assest/logowhite.png";

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = href.toLowerCase().endsWith(".ico") ? "image/x-icon" : "image/png";
    link.href = href;
  }, [settings.company_favicon]);

  return null;
}
