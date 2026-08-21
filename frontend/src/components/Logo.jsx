import React, { useState } from "react";

/**
 * Logo image with a graceful fallback.
 *
 * - Shows the custom (uploaded) logo when provided.
 * - If the custom image fails to load, falls back to the default logo
 *   instead of rendering a broken image icon.
 * - The fallback is applied at most once; if even the default fails, the
 *   browser shows nothing rather than looping.
 */
export default function Logo({ src, fallbackSrc, alt = "Logo", className }) {
  const [useFallback, setUseFallback] = useState(false);

  const resolved = src && !useFallback ? src : fallbackSrc;

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => {
        if (src && src !== fallbackSrc) setUseFallback(true);
      }}
    />
  );
}