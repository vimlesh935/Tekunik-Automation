import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle,
  FileText,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Share2,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useWebsiteSettings } from "../../context/WebsiteSettingsContext.jsx";
import apiCall, { frontendSettingsService } from "../../services/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import Toast from "../../admin/components/common/Toast.jsx";

const SECTION_GROUPS = [
  {
    id: "website-information",
    title: "Website Information",
    icon: Building2,
    accent: "bg-cyan-400",
    iconText: "text-cyan-400",
    description:
      "Branding and general details shown across the site.",
    images: [
      { key: "company_logo", label: "Company Logo" },
      { key: "company_favicon", label: "Favicon" },
    ],
    labels: [
      { key: "company_name", label: "Company Name" },
      { key: "company_tagline", label: "Tagline" },
      { key: "website_url", label: "Website URL", type: "url" },
      { key: "copyright_text", label: "Copyright Text" },
    ],
    textareas: [
      { key: "company_description", label: "Company Description" },
      { key: "footer_about", label: "Footer About" },
    ],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    icon: Phone,
    accent: "bg-emerald-400",
    iconText: "text-emerald-400",
    description: "Email addresses and phone numbers used across the site.",
    labels: [
      { key: "company_email", label: "Company Email", type: "email" },
      { key: "support_email", label: "Support Email", type: "email" },
      { key: "sales_email", label: "Sales Email", type: "email" },
      { key: "company_phone", label: "Phone" },
      { key: "company_whatsapp", label: "WhatsApp" },
      { key: "business_hours", label: "Business Hours" },
    ],
    textareas: [],
  },
  {
    id: "address",
    title: "Address",
    icon: MapPin,
    accent: "bg-amber-400",
    iconText: "text-amber-400",
    description: "Location details and map links for visitors.",
    labels: [
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
      { key: "postal_code", label: "Postal Code" },
      { key: "google_maps_url", label: "Google Maps URL", type: "url" },
      { key: "google_maps_link", label: "Google Maps Link", type: "url" },
    ],
    textareas: [{ key: "company_address", label: "Company Address" }],
  },
  {
    id: "social-media",
    title: "Social Media",
    icon: Share2,
    accent: "bg-violet-400",
    iconText: "text-violet-400",
    description: "Links to your profiles on social platforms.",
    labels: [
      { key: "facebook_url", label: "Facebook URL", type: "url" },
      { key: "instagram_url", label: "Instagram URL", type: "url" },
      { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
      { key: "youtube_url", label: "YouTube URL", type: "url" },
      { key: "twitter_url", label: "Twitter URL", type: "url" },
    ],
    textareas: [],
  },
  {
    id: "policies",
    title: "Policy Links",
    icon: FileText,
    accent: "bg-sky-400",
    iconText: "text-sky-400",
    description: "Links to your site's legal and policy pages.",
    labels: [
      { key: "privacy_policy_url", label: "Privacy Policy URL", type: "url" },
      { key: "terms_conditions_url", label: "Terms & Conditions URL", type: "url" },
      { key: "refund_policy_url", label: "Refund Policy URL", type: "url" },
      { key: "shipping_policy_url", label: "Shipping Policy URL", type: "url" },
    ],
    textareas: [],
  },
];

function ImageField({ label, field, value, onChange, onToast }) {
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      const json = await apiCall("/api/admin/upload", { method: "POST", body: formData });
      if (json.success) {
        onChange(field, json.data.url);
        onToast(`${label} uploaded successfully`);
      } else {
        onToast(json.message || "Upload failed", "error");
      }
    } catch (err) {
      onToast(err.message || "Upload failed", "error");
    }
    event.target.value = "";
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{label}</p>
      <div className="flex items-start gap-6">
        <div className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-700 bg-black/50 flex items-center justify-center overflow-hidden">
          {value ? <img src={getImageUrl(value)} alt={label} className="w-full h-full object-contain p-2" /> : <div className="text-gray-500 text-xs text-center px-2"><Upload size={24} className="mx-auto mb-2 opacity-50" />No image</div>}
        </div>
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg cursor-pointer hover:bg-cyan-500/20 transition text-sm">
            <Upload size={14} /> {value ? `Replace ${label}` : `Upload ${label}`}
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.ico" className="hidden" onChange={upload} />
          </label>
          {value && <button type="button" onClick={() => onChange(field, "")} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition text-sm"><X size={14} />Remove {label}</button>}
          <p className="text-xs text-gray-500">JPG, JPEG, PNG, WEBP, ICO</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, accent, iconText, description, children }) {
  return (
    <section id={id} className="bg-black/40 border border-gray-800 rounded-2xl p-6 scroll-mt-6">
      <div className="flex items-center gap-3 mb-5">
        <span className={`w-1.5 h-8 ${accent} rounded-full`} />
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Icon size={18} className={iconText} />{title}</h3>
          {description && <p className="text-gray-500 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdminFrontendSettings() {
  const { settings: currentSettings, refreshSettings, websiteMode, setWebsiteMode } = useWebsiteSettings();
  const [frontendSettings, setFrontendSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (currentSettings) {
      setFrontendSettings((prev) =>
        Object.keys(prev).length === 0 ? { ...currentSettings } : prev,
      );
    }
  }, [currentSettings]);

  useEffect(() => {
    const loadAdminSettings = async () => {
      try {
        const res = await frontendSettingsService.adminGet();
        if (res.data) setFrontendSettings(res.data);
      } catch {
        if (currentSettings) setFrontendSettings(currentSettings);
      }
    };
    loadAdminSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSettings]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => setToast({ message, type });
  const updateField = (field, value) =>
    setFrontendSettings((prev) => ({ ...prev, [field]: value }));

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await frontendSettingsService.update(frontendSettings);
      if (res.success) {
        setFrontendSettings(res.data || frontendSettings);
        setSaved(true);
        refreshSettings();
        showToast("Website information saved successfully.");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      showToast(err.message || "Failed to save website information", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMode = async (mode) => {
    if (mode === websiteMode) return;
    setSavingMode(true);
    try {
      await setWebsiteMode(mode);
      showToast(`Website mode switched to "${mode === "live" ? "Live" : "Coming Soon"}".`);
    } catch (err) {
      showToast(err.message || "Failed to update website mode", "error");
    } finally {
      setSavingMode(false);
    }
  };

  const modeBadge =
    websiteMode === "live"
      ? { label: "Live", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
      : { label: "Coming Soon", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <Link
          to="/admin/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-cyan-400 transition mb-3"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Settings / Frontend
        </p>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Globe className="text-cyan-400" size={24} /> Frontend Settings
        </h2>
        <p className="text-gray-400 mt-1">
          Website information, contact details, social links and site availability in one place.
        </p>
      </div>

      <SectionCard
        id="general"
        icon={BadgeCheck}
        title="General"
        accent="bg-emerald-400"
        iconText="text-emerald-400"
        description="Quick overview of your store identity and current site status."
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-24 h-24 rounded-xl border border-gray-800 bg-black/50 flex items-center justify-center overflow-hidden shrink-0">
            {frontendSettings.company_logo ? (
              <img src={getImageUrl(frontendSettings.company_logo)} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 size={28} className="text-gray-600" />
            )}
          </div>
          <div className="space-y-1.5 min-w-0">
            <p className="text-lg font-bold text-white truncate">
              {frontendSettings.company_name || "Tekunik Automation"}
            </p>
            <p className="text-gray-400 text-sm truncate">
              {frontendSettings.company_tagline || "No tagline set yet"}
            </p>
            {frontendSettings.website_url && (
              <p className="text-cyan-400 text-xs truncate">{frontendSettings.website_url}</p>
            )}
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${modeBadge.cls}`}>
              Site status: {modeBadge.label}
            </span>
          </div>
        </div>
      </SectionCard>

      <form onSubmit={saveSettings} className="space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle size={16} /> Website information saved successfully. Changes are now live.
          </div>
        )}

        {SECTION_GROUPS.map((group) => (
          <SectionCard
            key={group.id}
            id={group.id}
            icon={group.icon}
            title={group.title}
            accent={group.accent}
            iconText={group.iconText}
            description={group.description}
          >
            <div className="space-y-8">
              {group.images?.length > 0 && (
                <div className="flex flex-wrap gap-10">
                  {group.images.map((img) => (
                    <ImageField
                      key={img.key}
                      label={img.label}
                      field={img.key}
                      value={frontendSettings[img.key] || ""}
                      onChange={updateField}
                      onToast={showToast}
                    />
                  ))}
                </div>
              )}

              {group.textareas?.length > 0 && (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {group.textareas.map((ta) => (
                    <label key={ta.key} className="block">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{ta.label}</span>
                      <textarea
                        rows={3}
                        value={frontendSettings[ta.key] || ""}
                        onChange={(e) => updateField(ta.key, e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition resize-none"
                      />
                    </label>
                  ))}
                </div>
              )}

              {group.labels?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.labels.map((field) => (
                    <label key={field.key} className="block">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{field.label}</span>
                      <input
                        type={field.type || "text"}
                        value={frontendSettings[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        ))}

        <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition text-sm shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <CheckCircle size={14} /> Saved successfully
            </span>
          )}
        </div>
      </form>

      <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Website Mode</h3>
            <p className="text-gray-400 text-sm mt-1">
              {websiteMode === "live"
                ? "Your website is currently live and visible to all visitors."
                : "Your website is currently in maintenance mode. Visitors will see the Coming Soon page."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleToggleMode("live")}
              disabled={savingMode || websiteMode === "live"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                websiteMode === "live"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default"
                  : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50"
              }`}
            >
              <ToggleRight size={18} /> Live
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("coming_soon")}
              disabled={savingMode || websiteMode === "coming_soon"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                websiteMode === "coming_soon"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-default"
                  : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50"
              }`}
            >
              <ToggleLeft size={18} /> Maintenance Mode
            </button>
          </div>
        </div>
        {savingMode && <p className="text-gray-500 text-xs mt-4">Saving...</p>}
      </div>
    </div>
  );
}