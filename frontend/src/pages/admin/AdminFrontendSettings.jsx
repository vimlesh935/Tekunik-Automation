import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle,
  Globe,
  RefreshCw,
  Save,
  Share2,
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
    id: "company-information",
    title: "Company Information",
    icon: Building2,
    accent: "bg-emerald-400",
    iconText: "text-emerald-400",
    description: "Contact details shown in the website footer.",
    images: [
      { key: "hero_image", label: "Hero Background Image" },
    ],
    labels: [
      { key: "hero_heading", label: "Hero Heading" },
      { key: "company_email", label: "Company Email", type: "email" },
      { key: "company_phone", label: "Company Phone Number", type: "tel" },
      { key: "company_whatsapp", label: "WhatsApp Number", type: "tel" },
      { key: "business_hours", label: "Business Hours" },
    ],
    textareas: [
      { key: "company_address", label: "Company Address" },
      { key: "footer_about", label: "Footer Description" },
    ],
  },
  {
    id: "social-media",
    title: "Social Media",
    icon: Share2,
    accent: "bg-violet-400",
    iconText: "text-violet-400",
    description: "Links displayed in the website footer.",
    labels: [
      { key: "instagram_url", label: "Instagram URL", type: "url" },
      { key: "facebook_url", label: "Facebook URL", type: "url" },
      { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
      { key: "youtube_url", label: "YouTube URL", type: "url" },
      { key: "twitter_url", label: "X / Twitter URL", type: "url" },
    ],
    textareas: [],
  },
  {
    id: "branding",
    title: "Branding",
    icon: BadgeCheck,
    accent: "bg-cyan-400",
    iconText: "text-cyan-400",
    description: "Logo and favicon used across the website.",
    images: [
      { key: "company_logo", label: "Company Logo" },
      { key: "company_favicon", label: "Favicon" },
    ],
    labels: [],
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
  const { settings: currentSettings, refreshSettings } = useWebsiteSettings();
  const [frontendSettings, setFrontendSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const adminLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const loadAdminSettings = async () => {
      try {
        const res = await frontendSettingsService.adminGet();
        if (mounted && res.data) {
          setFrontendSettings(res.data);
          adminLoadedRef.current = true;
        }
      } catch {
        if (mounted && currentSettings) {
          setFrontendSettings(currentSettings);
          adminLoadedRef.current = true;
        }
      }
    };
    loadAdminSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!adminLoadedRef.current && currentSettings) {
      setFrontendSettings((prev) =>
        Object.keys(prev).length === 0 ? { ...currentSettings } : prev,
      );
    }
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
      const payload = {
        ...frontendSettings,
        hero_heading: String(frontendSettings.hero_heading || "").trim(),
      };
      const res = await frontendSettingsService.update(payload);
      if (res.success) {
        setFrontendSettings(res.data || payload);
        setSaved(true);
        await refreshSettings();
        showToast("Website information saved successfully.");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      showToast(err.message || "Failed to save website information", "error");
    } finally {
      setSaving(false);
    }
  };

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

    </div>
  );
}