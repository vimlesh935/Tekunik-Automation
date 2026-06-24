import React, { useEffect, useState } from "react";
import { getImageUrl } from "../utils/imageUrl";

export default function SafeImage({ src, alt, className = "", fallback = null, ...props }) {
  const resolvedSrc = getImageUrl(src);
  // Debug log to trace resolved image URLs during development
  if (process.env.NODE_ENV !== 'production') {
    try { console.debug(`[SafeImage] resolved src for`, src, '→', resolvedSrc); } catch (e) {}
  }
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return fallback;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
