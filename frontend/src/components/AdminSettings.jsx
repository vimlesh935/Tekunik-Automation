import React, { useState, useEffect, useCallback } from "react";
import { adminSettingsService, getApiUrl } from "../services/api";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext.jsx";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social Media" },
  { id: "business", label: "Business" },
  { id: "currency", label: "Currency" },
  { id: "localization", label: "Localization" },
  { id: "seo", label: "SEO" },
  { id: "email", label: "Email" },
  { id: "security", label: "Security" },
  { id: "maintenance", label: "Maintenance" },
];

const DEFAULT_SETTINGS = {
  website_name: "",
  website_tagline: "",
  company_name: "",
  company_description: "",
  company_logo: "",
  favicon: "",
  phone: "",
  whatsapp: "",
  support_email: "",
  sales_email: "",
  address: "",
  google_maps_link: "",
  primary_logo: "",
  dark_logo: "",
  footer_logo: "",
  login_logo: "",
  browser_favicon: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  twitter: "",
  whatsapp_social: "",
  gst_number: "",
  pan_number: "",
  cin_number: "",
  currency_symbol: "\u20B9",
  currency_code: "INR",
  timezone: "Asia/Kolkata",
  date_format: "d/m/Y",
  language: "en",
  website_title: "",
  meta_description: "",
  meta_keywords: "",
  og_image: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  smtp_sender_name: "",
  smtp_sender_email: "",
  session_timeout: "60",
  password_policy: "medium",
  login_attempt_limit: "5",
  maintenance_mode: "false",
  maintenance_message: "We are currently undergoing scheduled maintenance. Please check back soon.",
};

export default function AdminSettings({ token }) {
  const { websiteMode, setWebsiteMode } = useWebsiteSettings();
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSettingsService.getAll();
      if (res.success && res.data) {
        const merged = { ...DEFAULT_SETTINGS, ...res.data.flat };
        setSettings(merged);
        setImagePreviews({
          company_logo: merged.company_logo || null,
          favicon: merged.favicon || null,
          primary_logo: merged.primary_logo || null,
          dark_logo: merged.dark_logo || null,
          footer_logo: merged.footer_logo || null,
          login_logo: merged.login_logo || null,
          browser_favicon: merged.browser_favicon || null,
          og_image: merged.og_image || null,
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (field) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
    fileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(field);
      try {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(getApiUrl("/api/admin/upload"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        const url = data.data?.url || data.url;
        if (url) {
          handleChange(field, url);
          setImagePreviews((prev) => ({ ...prev, [field]: url }));
        }
      } catch (err) {
        setMessage({ type: "error", text: `Upload failed: ${err.message}` });
      } finally {
        setUploading(null);
      }
    };
    fileInput.click();
  };

  const removeImage = (field) => {
    handleChange(field, "");
    setImagePreviews((prev) => ({ ...prev, [field]: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminSettingsService.save(settings);
      if (res.success) {
        setMessage({ type: "success", text: "Settings saved successfully" });
        await loadSettings();
      } else {
        throw new Error(res.message || "Failed to save settings");
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const renderImageField = (field, label) => (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {imagePreviews[field] ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 flex-shrink-0">
            <img
              src={imagePreviews[field]}
              alt={label}
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => removeImage(field)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-gray-700 bg-gray-800/50 flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-gray-600" />
          </div>
        )}
        <button
          type="button"
          onClick={() => handleImageUpload(field)}
          disabled={uploading === field}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition disabled:opacity-50"
        >
          {uploading === field ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {uploading === field ? "Uploading..." : "Upload"}
        </button>
        {settings[field] && (
          <span className="text-[10px] text-gray-600 truncate max-w-[120px]">
            {settings[field].split("/").pop()}
          </span>
        )}
      </div>
    </div>
  );

  const renderInput = (key, label, opts = {}) => (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        {label}
      </label>
      {opts.type === "textarea" ? (
        <textarea
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          rows={opts.rows || 3}
          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-white focus:border-cyan-500 outline-none resize-none transition"
        />
      ) : opts.type === "select" ? (
        <select
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-white focus:border-cyan-500 outline-none transition"
        >
          {opts.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : opts.type === "toggle" ? (
        <button
          type="button"
          onClick={() => handleChange(key, settings[key] === "true" ? "false" : "true")}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            settings[key] === "true" ? "bg-cyan-500" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              settings[key] === "true" ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      ) : (
        <input
          type={opts.inputType || "text"}
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={opts.placeholder || ""}
          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-white focus:border-cyan-500 outline-none transition"
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-48 flex-shrink-0 space-y-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeSection === s.id
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          {/* ═══ GENERAL ═══ */}
          {activeSection === "general" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">General Settings</h3>
              {renderInput("website_name", "Website Name")}
              {renderInput("website_tagline", "Website Tagline")}
              {renderInput("company_name", "Company Name")}
              {renderInput("company_description", "Company Description", {
                type: "textarea",
                rows: 3,
              })}
              {renderImageField("company_logo", "Company Logo")}
              {renderImageField("favicon", "Favicon")}
            </div>
          )}

          {/* ═══ BRANDING ═══ */}
          {activeSection === "branding" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Website Branding</h3>
              {renderImageField("primary_logo", "Primary Logo")}
              {renderImageField("dark_logo", "Dark Logo")}
              {renderImageField("footer_logo", "Footer Logo")}
              {renderImageField("login_logo", "Login Logo")}
              {renderImageField("browser_favicon", "Browser Favicon")}
            </div>
          )}

          {/* ═══ CONTACT ═══ */}
          {activeSection === "contact" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
              {renderInput("phone", "Phone Number", { placeholder: "+91 98765 43210" })}
              {renderInput("whatsapp", "WhatsApp Number", {
                placeholder: "+91 98765 43210",
              })}
              {renderInput("support_email", "Support Email", {
                inputType: "email",
                placeholder: "support@example.com",
              })}
              {renderInput("sales_email", "Sales Email", {
                inputType: "email",
                placeholder: "sales@example.com",
              })}
              {renderInput("address", "Company Address", { type: "textarea", rows: 3 })}
              {renderInput("google_maps_link", "Google Maps Link", {
                placeholder: "https://maps.google.com/...",
              })}
            </div>
          )}

          {/* ═══ SOCIAL MEDIA ═══ */}
          {activeSection === "social" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Social Media</h3>
              {renderInput("facebook", "Facebook", {
                placeholder: "https://facebook.com/...",
              })}
              {renderInput("instagram", "Instagram", {
                placeholder: "https://instagram.com/...",
              })}
              {renderInput("linkedin", "LinkedIn", {
                placeholder: "https://linkedin.com/company/...",
              })}
              {renderInput("youtube", "YouTube", {
                placeholder: "https://youtube.com/@...",
              })}
              {renderInput("twitter", "X (Twitter)", {
                placeholder: "https://x.com/...",
              })}
              {renderInput("whatsapp_social", "WhatsApp", {
                placeholder: "https://wa.me/...",
              })}
            </div>
          )}

          {/* ═══ BUSINESS ═══ */}
          {activeSection === "business" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Business Information</h3>
              {renderInput("gst_number", "GST Number", {
                placeholder: "22AAAAA0000A1Z5",
              })}
              {renderInput("pan_number", "PAN Number", {
                placeholder: "ABCDE1234F",
              })}
              {renderInput("cin_number", "CIN Number (Optional)", {
                placeholder: "U12345DL2020PTC123456",
              })}
            </div>
          )}

          {/* ═══ CURRENCY ═══ */}
          {activeSection === "currency" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Currency</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderInput("currency_symbol", "Currency Symbol", {
                  placeholder: "\u20B9",
                })}
                {renderInput("currency_code", "Currency Code", {
                  placeholder: "INR",
                })}
              </div>
            </div>
          )}

          {/* ═══ LOCALIZATION ═══ */}
          {activeSection === "localization" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Localization</h3>
              {renderInput("timezone", "Time Zone", {
                placeholder: "Asia/Kolkata",
              })}
              {renderInput("date_format", "Date Format", {
                placeholder: "d/m/Y",
              })}
              {renderInput("language", "Language", {
                type: "select",
                options: [
                  { value: "en", label: "English" },
                  { value: "hi", label: "Hindi" },
                  { value: "gu", label: "Gujarati" },
                  { value: "mr", label: "Marathi" },
                ],
              })}
            </div>
          )}

          {/* ═══ SEO ═══ */}
          {activeSection === "seo" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">SEO</h3>
              {renderInput("website_title", "Website Title")}
              {renderInput("meta_description", "Meta Description", {
                type: "textarea",
                rows: 3,
              })}
              {renderInput("meta_keywords", "Meta Keywords", {
                placeholder: "keyword1, keyword2, keyword3",
              })}
              {renderImageField("og_image", "Open Graph Image")}
            </div>
          )}

          {/* ═══ EMAIL ═══ */}
          {activeSection === "email" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Email Settings</h3>
              {renderInput("smtp_host", "SMTP Host", {
                placeholder: "smtp.gmail.com",
              })}
              {renderInput("smtp_port", "SMTP Port", {
                placeholder: "587",
              })}
              {renderInput("smtp_username", "SMTP Username")}
              {renderInput("smtp_password", "SMTP Password", {
                inputType: "password",
              })}
              {renderInput("smtp_sender_name", "Sender Name", {
                placeholder: "Tekunik Automation",
              })}
              {renderInput("smtp_sender_email", "Sender Email", {
                inputType: "email",
                placeholder: "noreply@example.com",
              })}
            </div>
          )}

          {/* ═══ SECURITY ═══ */}
          {activeSection === "security" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Security</h3>
              {renderInput("session_timeout", "Admin Session Timeout (minutes)", {
                placeholder: "60",
              })}
              {renderInput("password_policy", "Password Policy", {
                type: "select",
                options: [
                  { value: "low", label: "Low (min 6 chars)" },
                  { value: "medium", label: "Medium (min 8 chars, letters + numbers)" },
                  { value: "high", label: "High (min 12 chars, mixed case + numbers + special)" },
                ],
              })}
              {renderInput("login_attempt_limit", "Login Attempt Limit", {
                placeholder: "5",
              })}
            </div>
          )}

          {/* ═══ MAINTENANCE ═══ */}
          {activeSection === "maintenance" && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Maintenance</h3>
              <div className="flex items-center justify-between p-4 bg-black/30 border border-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">Enable Maintenance Mode</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    When enabled, only admins can access the website. Visitors will see the
                    maintenance message.
                  </p>
                </div>
                {renderInput("maintenance_mode", "", { type: "toggle" })}
              </div>
              {renderInput("maintenance_message", "Maintenance Message", {
                type: "textarea",
                rows: 3,
              })}
            </div>
          )}
        </div>

        {/* Save & Footer */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
