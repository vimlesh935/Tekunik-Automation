/**
 * Helpers for rendering database-driven content in the active language.
 *
 * Tables (settings, categories, discounts) store base English values plus
 * per-language columns like `hero_heading_hi`, `title_mr`, `description_hi`.
 * These helpers pick the localized column when the active language is hindi/
 * marathi and fall back to the base (English) value otherwise.
 */

export const getLocaleSuffix = (lang) => {
  if (lang === "hi" || lang === "mr") return `_${lang}`;
  return "";
};

export const localizedField = (obj, baseField, lang) => {
  if (!obj) return undefined;
  const suffix = getLocaleSuffix(lang);
  if (!suffix) return obj[baseField];
  const localized = obj[`${baseField}${suffix}`];
  return localized != null && String(localized).trim() !== ""
    ? localized
    : obj[baseField];
};

export const localizedTitle = (obj, lang) => localizedField(obj, "title", lang);
export const localizedName = (obj, lang) => localizedField(obj, "name", lang);
export const localizedDescription = (obj, lang) =>
  localizedField(obj, "description", lang);