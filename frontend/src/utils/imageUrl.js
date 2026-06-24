const apiOrigin = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/?$/i, "")
  .replace(/\/$/, "");

const normalizeSlashes = (value) => {
  if (typeof value !== "string") return value;
  const protocolMatch = value.match(/^([a-zA-Z]+:)(\/\/+)/);
  if (!protocolMatch) return value.replace(/\/\/+/g, "/");
  const [, protocol, separator] = protocolMatch;
  const rest = value.slice(protocolMatch[0].length).replace(/\/\/+/g, "/");
  return `${protocol}${separator}${rest}`;
};

export const getImageUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  const cleaned = normalizeSlashes(value.trim().replace(/\\/g, "/"));
  // Handle literal "null" string from database
  if (!cleaned || cleaned === "null" || cleaned === "undefined") return "";
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;

  const uploadsIndex = cleaned.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    const resolved = `${apiOrigin}${cleaned.slice(uploadsIndex)}`;
    if (process.env.NODE_ENV !== 'production') console.debug('[getImageUrl] resolved upload path', value, '→', resolved);
    return resolved;
  }

  if (cleaned.toLowerCase().startsWith("uploads/")) {
    const resolved = `${apiOrigin}/${cleaned}`;
    if (process.env.NODE_ENV !== 'production') console.debug('[getImageUrl] resolved upload path', value, '→', resolved);
    return resolved;
  }

  if (cleaned.startsWith("/uploads/")) {
    const resolved = `${apiOrigin}${cleaned}`;
    if (process.env.NODE_ENV !== 'production') console.debug('[getImageUrl] resolved upload path', value, '→', resolved);
    return resolved;
  }

  // If it's a plain filename, construct full upload URL
  const ext = cleaned.split('.').pop()?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (ext && validExts.includes(ext) && !cleaned.includes('/')) {
    const resolved = `${apiOrigin}/uploads/${cleaned}`;
    if (process.env.NODE_ENV !== 'production') console.debug('[getImageUrl] resolved upload path', value, '→', resolved);
    return resolved;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[getImageUrl] passed through value', value, '→', cleaned);
  }

  return cleaned;
};
