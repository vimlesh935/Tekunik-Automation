import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import apiCall from "../../services/api.js";
import Toast from "../../admin/components/common/Toast.jsx";

const EMPTY_SNAPSHOT = {
  admin: { email: "" },
  smtp: {
    host: "",
    port: 465,
    user: "",
    from: "",
    secure: true,
    tlsRejectUnauthorized: true,
    allowSelfSignedFallback: false,
    passwordConfigured: false,
  },
  jwt: { expiresIn: "1d" },
  status: {
    api: "offline",
    database: "disconnected",
    smtp: { connected: false, configured: false, message: null },
  },
};

function StatusChip({ ok, label, failLabel, extra }) {
  const pending = ok === null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
        pending
          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
          : ok
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            : "bg-red-500/10 text-red-400 border-red-500/30"
      }`}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {pending ? "Checking…" : ok ? label : failLabel}
      {extra && <span className="text-gray-500 font-normal">· {extra}</span>}
    </span>
  );
}

function SectionCard({ icon: Icon, iconText, title, description, children, actions }) {
  return (
    <section className="bg-black/40 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className={`w-1.5 h-8 ${iconText.replace("text-", "bg-")} rounded-full`} />
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Icon size={18} className={iconText} /> {title}
            </h3>
          </div>
          {description && <p className="text-gray-500 text-sm mt-1.5 ml-4">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-600 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition";

function SecretIndicator({ configured }) {
  return configured ? (
    <StatusChip ok label="Configured" failLabel="Not configured" />
  ) : (
    <StatusChip ok={false} label="Configured" failLabel="Not configured" />
  );
}

function SaveButton({ saving, label = "Save Changes" }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition text-sm disabled:opacity-50"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      {saving ? "Saving..." : label}
    </button>
  );
}

function TestButton({ icon: Icon, label, testing, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      disabled={testing}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition border disabled:opacity-50 ${
        tone === "danger"
          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
      }`}
    >
      {testing ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {testing ? "Testing..." : label}
    </button>
  );
}

export default function AdminBackendSettings() {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [jwtExpiry, setJwtExpiry] = useState("1d");
  const [savingAccount, setSavingAccount] = useState(false);

  const [smtp, setSmtp] = useState(EMPTY_SNAPSHOT.smtp);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  const [refreshingStatus, setRefreshingStatus] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSettings = async (silent = false) => {
    if (!silent) setLoading(true);
    let loadedStatus = null;
    try {
      const json = await apiCall("/api/admin/settings/backend");
      if (json.success) {
        const data = { ...EMPTY_SNAPSHOT, ...json.data, status: { ...EMPTY_SNAPSHOT.status, ...(json.data.status || {}) } };
        loadedStatus = data.status.smtp;
        setSnapshot(data);
        setAdminEmail(data.admin.email || "");
        setJwtExpiry(data.jwt.expiresIn || "1d");
        setSmtp({ ...EMPTY_SNAPSHOT.smtp, ...(data.smtp || {}) });
        setError(null);
      } else {
        setError(json.message || "Failed to load backend settings");
      }
    } catch (err) {
      setError(err.message || "Failed to load backend settings");
    } finally {
      setLoading(false);
      setRefreshingStatus(false);
      if (loadedStatus && loadedStatus.connected === null) {
        setTimeout(() => { loadSettings(true); }, 2500);
      }
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAccount = async (event) => {
    event.preventDefault();
    setSavingAccount(true);
    try {
      const payload = { currentPassword: adminCurrentPassword };
      if (adminEmail.trim().toLowerCase() !== (snapshot.admin.email || "").toLowerCase()) {
        payload.email = adminEmail.trim();
      }
      if (adminNewPassword) payload.password = adminNewPassword;
      const body = { admin: payload };
      if (jwtExpiry.trim() !== (snapshot.jwt.expiresIn || "1d").trim()) {
        body.jwt = { expiresIn: jwtExpiry.trim() };
      }
      if (!payload.email && !payload.password && !body.jwt) {
        showToast("No changes to save", "error");
        return;
      }
      const json = await apiCall("/api/admin/settings/backend", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (json.success) {
        showToast("Admin account updated. Use the new credentials on next login.");
        setAdminCurrentPassword("");
        setAdminNewPassword("");
        setSnapshot((prev) => ({
          ...prev,
          admin: { email: payload.email || prev.admin.email },
          jwt: { ...prev.jwt, expiresIn: body.jwt ? body.jwt.expiresIn : prev.jwt.expiresIn },
        }));
      } else {
        showToast(json.message || "Failed to update admin account", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update admin account", "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const saveSmtp = async (event) => {
    event.preventDefault();
    setSavingSmtp(true);
    try {
      const body = {
        smtp: {
          host: smtp.host,
          port: Number(smtp.port),
          user: smtp.user,
          from: smtp.from,
          secure: smtp.secure,
          tlsRejectUnauthorized: smtp.tlsRejectUnauthorized,
        },
      };
      if (smtpPassword) body.smtp.password = smtpPassword;
      const json = await apiCall("/api/admin/settings/backend", { method: "PUT", body: JSON.stringify(body) });
      if (json.success) {
        showToast("SMTP configuration saved and mail service reinitialized.");
        setSmtpPassword("");
        setSmtpTestResult(null);
        setSmtp({ ...smtp, ...json.data.smtp });
        setTimeout(() => { loadSettings(true); }, 400);
      } else {
        showToast(json.message || "Failed to save SMTP configuration", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save SMTP configuration", "error");
    } finally {
      setSavingSmtp(false);
    }
  };

  const testSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const json = await apiCall("/api/admin/settings/backend/test-smtp", { method: "POST" });
      setSmtpTestResult(json.data);
      showToast(
        json.data.connected ? "SMTP connection successful" : "SMTP connection failed",
        json.data.connected ? "success" : "error"
      );
    } catch (err) {
      showToast(err.message || "SMTP test failed", "error");
    } finally {
      setTestingSmtp(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const json = await apiCall("/api/admin/settings/backend/send-test-email", { method: "POST" });
      showToast(
        json.data.sent
          ? `Test email delivered to ${json.data.to} (from ${json.data.from})`
          : `Test email failed: ${json.data.message || "unknown error"}`,
        json.data.sent ? "success" : "error"
      );
    } catch (err) {
      showToast(err.message || "Test email failed", "error");
    } finally {
      setSendingTest(false);
    }
  };

  const status = snapshot.status || EMPTY_SNAPSHOT.status;
  const smtpStatus = status.smtp || { connected: false, configured: false };

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
          Settings / Backend
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="text-violet-400" size={24} /> Backend Settings
            </h2>
            <p className="text-gray-400 mt-1">
              Admin account and email/SMTP — saved to the database and applied at runtime.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 bg-gray-800/50 text-gray-400">
              <Sparkles size={13} className="text-violet-400" /> DB-preferred, .env fallback
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshingStatus(true);
                loadSettings(true);
              }}
              disabled={refreshingStatus}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshingStatus ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-black/40 border border-gray-800 rounded-2xl p-10 text-center text-gray-500 text-sm">
          Loading backend settings...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm font-semibold flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Application */}
          <SectionCard
            icon={ShieldCheck}
            iconText="text-emerald-400"
            title="Application"
            description="Admin login identity and session token lifetime. Changing these affects future logins."
          >
            <form onSubmit={saveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Admin Email">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Session Token Expiry" hint="e.g. 30m, 12h, 1d — applied to newly issued tokens">
                <input
                  type="text"
                  value={jwtExpiry}
                  onChange={(e) => setJwtExpiry(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Current Password" hint="Required to confirm admin account changes">
                <input
                  type="password"
                  value={adminCurrentPassword}
                  onChange={(e) => setAdminCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className={inputCls}
                />
              </Field>
              <Field label="New Admin Password" hint="Leave blank to keep the current password">
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="•••••••• (leave blank to keep)"
                  className={inputCls}
                />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <SaveButton saving={savingAccount} label="Save Application" />
              </div>
            </form>
          </SectionCard>

          {/* Email / SMTP */}
          <SectionCard
            icon={Mail}
            iconText="text-cyan-400"
            title="Email / SMTP"
            description="Mail service configuration — saved to the database and the transporter is reinitialized immediately without a server restart."
            actions={<StatusChip ok={smtpStatus.connected === null ? null : Boolean(smtpStatus.connected)} label="Connected" failLabel="Disconnected" extra={smtpStatus.label || undefined} />}
          >
            <form onSubmit={saveSmtp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <input type="text" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} className={inputCls} />
                </Field>
                <Field label="SMTP Port">
                  <input type="number" min="1" max="65535" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="SMTP Username">
                  <input type="text" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} className={inputCls} />
                </Field>
                <Field label="From Email" hint="Used as the sender for OTP and notification emails">
                  <input type="email" value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Security Mode">
                  <select
                    value={smtp.secure ? "ssl" : "starttls"}
                    onChange={(e) => setSmtp({ ...smtp, secure: e.target.value === "ssl" })}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="ssl">SSL / TLS (secure, e.g. port 465)</option>
                    <option value="starttls">STARTTLS (e.g. port 587)</option>
                  </select>
                </Field>
                <Field label="SMTP Password" hint={smtp.passwordConfigured ? "Configured — leave blank to keep it" : "Not configured — enter a password to enable sending"}>
                  <div className="flex items-center gap-3">
                    <input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="•••••••••• (leave blank to keep)"
                      className={inputCls}
                    />
                    <SecretIndicator configured={smtp.passwordConfigured} />
                  </div>
                </Field>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-gray-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={smtp.tlsRejectUnauthorized}
                  onChange={(e) => setSmtp({ ...smtp, tlsRejectUnauthorized: e.target.checked })}
                  className="accent-cyan-500 h-4 w-4"
                />
                Verify the SMTP server TLS certificate (recommended)
              </label>
              {smtpTestResult && (
                <div
                  className={`p-3 rounded-xl text-sm border ${
                    smtpTestResult.connected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {smtpTestResult.connected
                    ? `SMTP connected via ${smtpTestResult.label}`
                    : `SMTP failed: ${smtpTestResult.message}`}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-800/60">
                <SaveButton saving={savingSmtp} label="Save SMTP" />
                <TestButton icon={PlugIcon} label="Test SMTP Connection" testing={testingSmtp} onClick={testSmtp} />
                <TestButton icon={Send} label="Send Test Email" testing={sendingTest} onClick={sendTestEmail} />
              </div>
            </form>
          </SectionCard>

          {/* Live System Status */}
          <section className="bg-black/40 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-1.5 h-8 bg-sky-400 rounded-full" />
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Server size={18} className="text-sky-400" /> Live System Status
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Real-time checks against the running backend — not stored values.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">API</p>
                <StatusChip ok={status.api === "online"} label="Online" failLabel={status.api === "degraded" ? "Degraded" : "Offline"} />
                {status.api === "degraded" && <p className="text-gray-600 text-xs mt-2">API responding but database is unreachable</p>}
              </div>
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Database</p>
                <StatusChip ok={status.database === "connected"} label="Connected" failLabel="Disconnected" />
              </div>
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">SMTP</p>
                <StatusChip ok={smtpStatus.connected === null ? null : Boolean(smtpStatus.connected)} label="Connected" failLabel="Disconnected" extra={smtpStatus.label || undefined} />
                {!smtpStatus.connected && smtpStatus.message && (
                  <p className="text-gray-600 text-xs mt-2">{smtpStatus.message}</p>
                )}
              </div>
            </div>
          </section>

          <p className="text-xs text-gray-600">
            Server-level values (environment, port, database connection, JWT secret) remain in{" "}
            <code className="bg-black/60 border border-gray-800 rounded px-1.5 py-0.5">backend/.env</code>{" "}
            and are intentionally not editable from this page. Database settings take precedence; an{" "}
            empty database value falls back to the .env default.
          </p>
        </div>
      )}
    </div>
  );
}

function PlugIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...props}>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  );
}