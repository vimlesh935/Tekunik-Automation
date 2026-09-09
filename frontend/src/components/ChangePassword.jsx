import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Send, KeyRound, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { passwordService } from "../services/api";
import { useTranslation } from "react-i18next";

/* ============================================================================
   Change Password — Profile / Settings
   Two independent methods:
     1) Current Password  — verify current, set new
     2) Email OTP         — send → verify → set new
   All verification happens server-side; this view only orchestrates the flows.
   ========================================================================== */

const RESEND_SECONDS = 60;

function PasswordField({ label, value, onChange, show, onToggle, autoFocus = false, autoComplete }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={show ? "text" : "password"}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          onChange={onChange}
          className="w-full pl-9 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? t("password.hidePassword") : t("password.showPassword")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors flex items-center w-8 h-8 rounded-md hover:bg-slate-800/60"
        >
          {show ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>
    </div>
  );
}

function PasswordRequirements({ password, currentPassword }) {
  const { t } = useTranslation();
  const checks = {
    length: password.length >= 8,
    different: currentPassword.length === 0 || password !== currentPassword,
  };
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
          checks.length ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
        }`}
      >
        {checks.length ? <CheckCircle size={10} /> : <AlertCircle size={10} />} {t("password.hint")}
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
          checks.different ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
        }`}
      >
        {checks.different ? <CheckCircle size={10} /> : <AlertCircle size={10} />} {t("password.differentFromCurrent")}
      </span>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-2.5 text-rose-300 text-xs leading-relaxed">
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function PrimaryButton({ children, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 justify-center px-5 py-2.5 bg-cyan-600 enabled:hover:bg-cyan-500 enabled:active:bg-cyan-700 text-white text-sm font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}

function GhostButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

/* ── maskEmail for the OTP input label ── */
const maskEmailForDisplay = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  const masked = visible + "*".repeat(Math.max(0, name.length - 2));
  return `${masked}@${domain}`;
};

const OTP_DIGITS = 6;
const MAX_OTP_ATTEMPTS = 5;

/* ==========================================================================
   ChangePassword — main component
   Props: email, onPasswordChanged(newToken), onNotice(message, type)
   ========================================================================== */
export default function ChangePassword({ email, onPasswordChanged, onNotice }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState("current");

  /* ── Method 1: Current Password form state ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Method 2: Email OTP form state ── */
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState("idle");
  const [stepUpToken, setStepUpToken] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpExpirySecs, setOtpExpirySecs] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  /* ── Countdown timer for resend cooldown ── */
  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  /* ── Live OTP expiry countdown → moves the step to "expired" at 0 ── */
  useEffect(() => {
    if (!otpExpiresAt || otpStage === "idle" || otpStage === "expired" || stepUpToken) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpExpirySecs(left);
      if (left <= 0) setOtpStage("expired");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [otpExpiresAt, otpStage, stepUpToken]);

  /* ── Reset OTP stage when switching method ── */
  const otpFailureMessage = (code, message) => {
    switch (code) {
      case "OTP_EXPIRED":
        return t("password.otpFailure");
      case "OTP_RATE_LIMITED":
      case "OTP_COOLDOWN":
        return message || t("password.otpWait");
      default:
        return message || t("password.invalidOtp");
    }
  };

  const switchMethod = (next) => {
    setOtpStage("idle");
    setStepUpToken(null);
    setOtp("");
    setOtpError("");
    setOtpAttempts(0);
    setResendCountdown(0);
    setOtpExpiresAt(0);
    setOtpExpirySecs(0);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setMethod(next);
  };

  /* ── METHOD 1: Change with Current Password ── */
  const handleCurrentPasswordSubmit = async () => {
    const cp = String(currentPassword || "");
    const pw = String(newPassword || "");

    if (cp.length < 8) {
      onNotice(t("password.currentShort"), "error");
      return;
    }
    if (pw !== confirmPassword) {
      onNotice(t("password.mismatch"), "error");
      return;
    }
    if (pw.length < 8) {
      onNotice(t("password.newMin8"), "error");
      return;
    }
    if (pw === cp) {
      onNotice(t("password.sameAsCurrent"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await passwordService.changeWithCurrentPassword(cp, pw, confirmPassword);
      if (res?.data?.token) {
        onPasswordChanged(res.data.token);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        onNotice(t("password.changed"), "success");
      }
    } catch (err) {
      onNotice(err?.message || t("password.changeFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── METHOD 2: OTP flow handlers ── */
  const handleSendOtp = async () => {
    setOtpStage("sending");
    setOtpError("");
    try {
      const res = await passwordService.sendOtp();
      const lifeMinutes = Number(res?.data?.expiresInMinutes) || 5;
      setOtpExpiresAt(Date.now() + lifeMinutes * 60 * 1000);
      setOtpExpirySecs(lifeMinutes * 60);
      setOtpStage("ready");
      setResendCountdown(RESEND_SECONDS);
      setOtpAttempts(0);
      onNotice(t("password.otpSent"), "success");
    } catch (err) {
      setOtpError(err?.message || t("password.otpSendFailed"));
      setOtpStage("idle");
      onNotice(err?.message || t("password.otpSendFailed"), "error");
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = String(otp || "").replace(/\D/g, "");
    if (cleanOtp.length !== OTP_DIGITS) {
      setOtpError(t("password.enter6Digit"));
      return;
    }
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setOtpError(t("password.tooManyAttempts"));
      return;
    }

    setOtpStage("verifying");
    setOtpError("");
    try {
      const res = await passwordService.verifyOtp(cleanOtp);
      const stepUp = res?.data?.stepUpToken;
      if (stepUp) {
        setStepUpToken(stepUp);
        setOtpExpiresAt(0);
        setOtpExpirySecs(0);
        setOtpStage("verified");
        onNotice(t("password.otpVerifiedSuccess"), "success");
      } else {
        throw new Error(t("password.verifyFailed"));
      }
    } catch (err) {
      const next = otpAttempts + 1;
      setOtpAttempts(next);
      setOtpError(otpFailureMessage(err?.code, err?.message));
      onNotice(otpFailureMessage(err?.code, err?.message), "error");
      setOtpStage(next >= MAX_OTP_ATTEMPTS ? "idle" : "ready");
    }
  };

  const handleOtpReset = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, OTP_DIGITS);
    setOtp(digits);
    setOtpError("");
  };

  const handleOtpPasswordSubmit = async () => {
const pw = String(newPassword || "");
    if (pw !== confirmPassword) {
      onNotice(t("password.mismatch"), "error");
      return;
    }
    if (pw.length < 8) {
      onNotice(t("password.newMin8"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await passwordService.resetAfterOtp(stepUpToken, pw, confirmPassword);
      if (res?.data?.token) {
        onPasswordChanged(res.data.token);
      } else {
        onNotice(t("password.changed"), "success");
      }
    } catch (err) {
      onNotice(err?.message || t("password.changeFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Tab selector ── */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => switchMethod("current")}
          className={`flex-1 text-center py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
            method === "current"
              ? "bg-cyan-600 text-white shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t("password.tabCurrent")}
        </button>
        <button
          type="button"
          onClick={() => switchMethod("otp")}
          className={`flex-1 text-center py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
            method === "otp"
              ? "bg-cyan-600 text-white shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t("password.tabOtp")}
        </button>
      </div>

      <ErrorBanner message={otpError} />

      {/* ── METHOD 1: Current Password ── */}
      {method === "current" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t("password.tabCurrent")}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                autoComplete="current-password"
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("password.currentPlaceholder")}
                className="w-full pl-9 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? t("password.hidePassword") : t("password.showPassword")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors flex items-center w-8 h-8 rounded-md hover:bg-slate-800/60"
              >
                {showCurrent ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
            </div>
          </div>

          <PasswordField
            label={t("password.newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            autoComplete="new-password"
          />

          <PasswordField
            label={t("password.confirmNew")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            autoComplete="new-password"
          />

          <PasswordRequirements password={newPassword} currentPassword={currentPassword} />

          <div className="text-xs text-slate-500">
            {t("password.hint")}. {t("password.mustDiffer")}
          </div>

          <PrimaryButton
            loading={submitting}
            disabled={submitting || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
            onClick={handleCurrentPasswordSubmit}
          >
            {submitting ? t("password.changing") : t("password.changePasswordBtn")}
          </PrimaryButton>
        </motion.div>
      )}

      {/* ── METHOD 2: Email OTP ── */}
      {method === "otp" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-4"
        >
          {/* Step: Send OTP */}
          {(otpStage === "idle" || otpStage === "sending") && !stepUpToken && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail size={14} />
                <span>
                  {t("password.otpWillBeSentTo")}{" "}
                  <span className="text-slate-300 font-medium">
                    {email ? maskEmailForDisplay(email) : t("password.yourRegisteredEmail")}
                  </span>
                </span>
              </div>

              <PrimaryButton
                loading={otpStage === "sending"}
                disabled={otpStage === "sending"}
                onClick={handleSendOtp}
              >
                {otpStage === "sending" ? t("password.sending") : t("password.sendOtpBtn")}
              </PrimaryButton>

              <div className="text-xs text-slate-500">
                {t("password.otpExpiryNote")}
              </div>
            </div>
          )}

          {/* Step: Verify OTP */}
          {otpStage !== "idle" &&
            otpStage !== "sending" &&
            otpStage !== "expired" &&
            !stepUpToken && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t("password.enterOtpSentTo", { email: email ? maskEmailForDisplay(email) : t("password.yourEmail") })}
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_DIGITS}
                  value={otp}
                  onChange={handleOtpReset}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleVerifyOtp();
                    }
                  }}
                  placeholder="• • • • • •"
                  className="w-full pl-9 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm text-center tracking-widest focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                />
              </div>

              {/* Live OTP expiry + resend cooldown */}
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className={otpExpirySecs <= 30 ? "text-amber-400" : "text-slate-500"}>
                  {t("password.expiresIn")}{" "}
                  <span className="tabular-nums">
                    {Math.floor(otpExpirySecs / 60)}m {otpExpirySecs % 60}s
                  </span>
                </span>
                <span className="text-slate-500">
                  {t("password.resendAvailableIn", { seconds: resendCountdown })}
                </span>
              </div>

              {otpAttempts > 0 && (
                <div className="text-xs text-amber-400">
                  {t("password.incorrectOtp")}{" "}
                  {MAX_OTP_ATTEMPTS - otpAttempts === 1
                    ? t("password.attemptRemaining", { count: MAX_OTP_ATTEMPTS - otpAttempts })
                    : t("password.attemptsRemaining", { count: MAX_OTP_ATTEMPTS - otpAttempts })}
                </div>
              )}

              <PrimaryButton
                loading={otpStage === "verifying"}
                disabled={otpStage === "verifying" || otp.length !== 6 || otpAttempts >= MAX_OTP_ATTEMPTS}
                onClick={handleVerifyOtp}
              >
                {otpStage === "verifying" ? t("password.verifying") : t("password.verifyOtpBtn")}
              </PrimaryButton>

              {/* Resend section */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t("password.didntReceiveOtp")}</span>
                {resendCountdown > 0 ? (
                  <span className="text-slate-400 font-medium">
                    {t("password.resendIn", { seconds: resendCountdown })}
                  </span>
                ) : (
                  <PrimaryButton
                    loading={otpStage === "sending"}
                    disabled={otpStage === "sending"}
                    onClick={handleSendOtp}
                  >
                    {t("password.resendBtn")}
                  </PrimaryButton>
                )}
              </div>

              {otpStage === "ready" && (
                <GhostButton onClick={() => switchMethod("current")}>
                  {t("password.backToCurrent")}
                </GhostButton>
              )}
            </div>
          )}

          {/* Step: OTP Expired — require a fresh OTP */}
          {otpStage === "expired" && !stepUpToken && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 text-amber-300 text-xs leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  {t("password.otpExpiredBanner")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t("password.freshOtp")}</span>
                {resendCountdown > 0 ? (
                  <span className="text-slate-400 font-medium">
                    {t("password.resendIn", { seconds: resendCountdown })}
                  </span>
                ) : (
                  <PrimaryButton
                    loading={otpStage === "sending"}
                    disabled={otpStage === "sending"}
                    onClick={handleSendOtp}
                  >
                    {otpStage === "sending" ? t("password.sending") : t("password.requestNewOtp")}
                  </PrimaryButton>
                )}
              </div>
            </div>
          )}

          {/* Step: OTP Verified — show new password form */}
          {stepUpToken && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle size={14} />
                <span>{t("password.otpVerifiedSet")}</span>
              </div>

              <PasswordField
                label={t("password.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                autoComplete="new-password"
              />

              <PasswordField
                label={t("password.confirmNew")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                autoComplete="new-password"
              />

              <PasswordRequirements password={newPassword} currentPassword="" />

              <div className="text-xs text-slate-500">{t("password.hint")}</div>

              <PrimaryButton
                loading={submitting}
                disabled={submitting || !newPassword || !confirmPassword || newPassword.length < 8}
                onClick={handleOtpPasswordSubmit}
              >
                {submitting ? t("password.changing") : t("password.changePasswordBtn")}
              </PrimaryButton>

              <GhostButton onClick={() => switchMethod("otp")}>
                {t("password.startOver")}
              </GhostButton>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}