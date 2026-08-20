import React, { useEffect, useState } from "react";
import { CheckCircle, RefreshCw, Save, Upload, X } from "lucide-react";
import { useWebsiteSettings } from "../../context/WebsiteSettingsContext.jsx";
import apiCall, { frontendSettingsService } from "../../services/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import Toast from "../../admin/components/common/Toast.jsx";

const TEXT_FIELDS = [
  { key: "company_name", label: "Company Name" },
  { key: "company_tagline", label: "Tagline" },
  { key: "company_email", label: "Company Email", type: "email" },
  { key: "support_email", label: "Support Email", type: "email" },
  { key: "sales_email", label: "Sales Email", type: "email" },
  { key: "company_phone", label: "Phone" },
  { key: "company_whatsapp", label: "WhatsApp" },
  { key: "website_url", label: "Website URL" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "postal_code", label: "Postal Code" },
  { key: "google_maps_url", label: "Google Maps URL" },
  { key: "google_maps_link", label: "Google Maps Link" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "twitter_url", label: "Twitter URL" },
  { key: "business_hours", label: "Business Hours" },
  { key: "copyright_text", label: "Copyright Text" },
  { key: "privacy_policy_url", label: "Privacy Policy URL" },
  { key: "terms_conditions_url", label: "Terms Conditions URL" },
  { key: "refund_policy_url", label: "Refund Policy URL" },
  { key: "shipping_policy_url", label: "Shipping Policy URL" },
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
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-cyan-400 rounded-full" />{label}</h3>
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

export default function AdminWebsiteInformation() {
  const { settings: currentSettings, refreshSettings } = useWebsiteSettings();
  const [frontendSettings, setFrontendSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (currentSettings) {
      setFrontendSettings((prev) => Object.keys(prev).length === 0 ? { ...currentSettings } : prev);
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
  }, [currentSettings]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => setToast({ message, type });
  const updateField = (field, value) => setFrontendSettings((prev) => ({ ...prev, [field]: value }));

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

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Website Information</h2>
        <p className="text-xs text-gray-500">Manage frontend company, contact, branding, address, social, and policy information.</p>
      </div>
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        {saved && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-2"><CheckCircle size={16} />Website information saved successfully. Changes are now live.</div>}
        <form onSubmit={saveSettings} className="space-y-8">
          <ImageField label="Company Logo" field="company_logo" value={frontendSettings.company_logo || ""} onChange={updateField} onToast={showToast} />
          <ImageField label="Favicon" field="company_favicon" value={frontendSettings.company_favicon || ""} onChange={updateField} onToast={showToast} />

          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-emerald-400 rounded-full" />Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEXT_FIELDS.map((field) => <label key={field.key} className="block"><span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{field.label}</span><input type={field.type || "text"} value={frontendSettings[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition" /></label>)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-amber-400 rounded-full" />Long Text</h3>
            <div className="grid grid-cols-1 gap-4 max-w-4xl">
              <label className="block"><span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company Description</span><textarea rows={4} value={frontendSettings.company_description || ""} onChange={(e) => updateField("company_description", e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition resize-none" /></label>
              <label className="block"><span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company Address</span><textarea rows={3} value={frontendSettings.company_address || ""} onChange={(e) => updateField("company_address", e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition resize-none" /></label>
              <label className="block"><span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Footer About</span><textarea rows={3} value={frontendSettings.footer_about || ""} onChange={(e) => updateField("footer_about", e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition resize-none" /></label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition text-sm shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1"><CheckCircle size={14} />Saved successfully</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
