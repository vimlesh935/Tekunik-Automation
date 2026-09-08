// Test the getImageUrl logic
const apiOrigin = 'http://localhost:8787';

function normalizeSlashes(value) {
  if (typeof value !== "string") return value;
  const protocolMatch = value.match(/^([a-zA-Z]+:)(\/\/+)/);
  if (!protocolMatch) return value.replace(/\/\/+/g, "/");
  const [, protocol, separator] = protocolMatch;
  const rest = value.slice(protocolMatch[0].length).replace(/\/\/+/g, "/");
  return `${protocol}${separator}${rest}`;
}

function getImageUrl(value) {
  if (!value || typeof value !== "string") return "";
  const cleaned = normalizeSlashes(value.trim().replace(/\\/g, "/"));
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
  const ext = cleaned.split('.').pop()?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (ext && validExts.includes(ext) && !cleaned.includes('/')) {
    return `${apiOrigin}/uploads/${cleaned}`;
  }
  return cleaned;
}

// Test cases
const tests = [
  "/uploads/products/1788344239867-414334183-test-logo.png",
  "",
  null,
  "null",
  "undefined",
  "http://example.com/logo.png",
  "C:\\uploads\\products\\logo.png",
];

for (const t of tests) {
  console.log(`Input: ${JSON.stringify(t)} -> Output: ${JSON.stringify(getImageUrl(t))}`);
}
