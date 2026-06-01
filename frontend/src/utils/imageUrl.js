const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/api\/?$/i, "")
  .replace(/\/$/, "");

export const getImageUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  const cleaned = value.trim().replace(/\\/g, "/");
  // Handle literal "null" string from database
  if (!cleaned || cleaned === "null" || cleaned === "undefined") return "";
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;

  const uploadsIndex = cleaned.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `${apiOrigin}${cleaned.slice(uploadsIndex)}`;
  }

  if (cleaned.toLowerCase().startsWith("uploads/")) {
    return `${apiOrigin}/${cleaned}`;
  }

  if (cleaned.startsWith("/uploads/")) {
    return `${apiOrigin}${cleaned}`;
  }

  // If it's a plain filename, construct full upload URL
  const ext = cleaned.split('.').pop()?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (ext && validExts.includes(ext) && !cleaned.includes('/')) {
    return `${apiOrigin}/uploads/${cleaned}`;
  }

  return cleaned;
};
