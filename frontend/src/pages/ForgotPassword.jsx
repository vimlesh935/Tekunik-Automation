import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../services/api";

/* ── Brand tokens (matches Login / Register) ── */
const V = "#7C3AED";       // violet
const C = "#06B6D4";       // cyan
const VL = "#A78BFA";      // violet-light
const CL = "#67E8F9";      // cyan-light
const BG = "#080B14";
const CARD = "#0D1120";
const BORDER = "#1E2640";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";
const SUCCESS = "#34D399";
const DANGER = "#F87171";

/* ── Tiny animation helpers ── */
function useMounted(delay = 0) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return vis;
}

function Appear({ children, delay = 0, y = 24, style = {} }) {
  const vis = useMounted(delay);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Animated circuit SVG panel (matches Login / Register, swapped icon = key/lock theme) ── */
function CircuitPanel() {
  const nodes = [
    { cx: 80,  cy: 100 }, { cx: 200, cy: 60  },
    { cx: 300, cy: 160 }, { cx: 160, cy: 240 },
    { cx: 320, cy: 300 }, { cx: 80,  cy: 340 },
    { cx: 240, cy: 400 }, { cx: 360, cy: 440 },
    { cx: 100, cy: 480 }, { cx: 280, cy: 520 },
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[6,7],[5,8],[7,9],[8,9],[0,3],[2,4]
  ];

  return (
    <svg
      viewBox="0 0 440 600"
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={VL} stopOpacity="0.3" />
          <stop offset="100%" stopColor={VL} stopOpacity="0" />
        </radialGradient>
        <filter id="blur4c">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="edgeGrad3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={V} stopOpacity="0.15" />
          <stop offset="50%" stopColor={C} stopOpacity="0.5" />
          <stop offset="100%" stopColor={V} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="url(#edgeGrad3)"
          strokeWidth="1"
          style={{ animation: `edgePulse ${2.5 + (i % 3) * 0.8}s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}

      {nodes.slice(0, 3).map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={60} fill="url(#glow3)" filter="url(#blur4c)"
          style={{ animation: `blobPulse ${4 + i}s ease-in-out ${i * 1.2}s infinite` }}
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i} style={{ animation: `nodePop ${2 + (i % 4) * 0.7}s ease-in-out ${i * 0.35}s infinite` }}>
          <circle cx={n.cx} cy={n.cy} r={10} fill={CARD} stroke={i % 3 === 0 ? VL : CL} strokeWidth="1.5" />
          <circle cx={n.cx} cy={n.cy} r={4} fill={i % 3 === 0 ? VL : CL} />
        </g>
      ))}

      {/* central lock glyph — the one swapped "image" for this page */}
      <g transform="translate(220,300)" opacity="0.9">
        <rect x="-26" y="-6" width="52" height="44" rx="8" fill={CARD} stroke={VL} strokeWidth="1.5" />
        <path d="M-16 -6 V-22 a16 16 0 0 1 32 0 V-6" fill="none" stroke={CL} strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="16" r="5" fill={VL} />
        <rect x="-2" y="16" width="4" height="12" fill={VL} />
        <animateTransform attributeName="transform" type="translate"
          values="220,300; 220,290; 220,300" dur="3.5s" repeatCount="indefinite" additive="sum" />
      </g>
    </svg>
  );
}

/* ── Floating label input ── */
function Field({ label, name, type = "text", value, onChange, placeholder, icon, right, autoFocus }) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div style={{ position: "relative" }}>
      <label style={{
        position: "absolute",
        top: active ? 7 : 16,
        left: 44,
        fontFamily: "'DM Mono', monospace",
        fontSize: active ? 9 : 13,
        letterSpacing: active ? "0.18em" : 0,
        textTransform: active ? "uppercase" : "none",
        color: focused ? VL : MUTED,
        pointerEvents: "none",
        transition: "all 0.22s cubic-bezier(.22,1,.36,1)",
        zIndex: 1,
      }}>
        {label}
      </label>

      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: focused ? VL : MUTED, transition: "color 0.25s",
        display: "flex", alignItems: "center",
        fontSize: 16,
      }}>{icon}</div>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={name}
        autoFocus={autoFocus}
        placeholder={focused ? placeholder : ""}
        style={{ ...inputStyle(focused), paddingRight: right ? 44 : 16 }}
      />

      {right && (
        <div style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          color: MUTED, cursor: "pointer", userSelect: "none",
          transition: "color 0.25s",
          fontSize: 16,
        }}>{right}</div>
      )}
    </div>
  );
}

function inputStyle(focused) {
  return {
    width: "100%",
    boxSizing: "border-box",
    height: 56,
    paddingTop: 18,
    paddingBottom: 6,
    paddingLeft: 44,
    background: focused ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.025)",
    border: `1px solid ${focused ? V : BORDER}`,
    borderRadius: 14,
    color: TEXT,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    outline: "none",
    transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
    boxShadow: focused ? `0 0 0 3px rgba(124,58,237,0.12)` : "none",
  };
}

/* ── Eye icon ── */
function EyeIcon({ open, onClick }) {
  return (
    <span onClick={onClick} style={{ display: "flex", alignItems: "center" }}>
      {open
        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </span>
  );
}

const MailIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4 12 13 2 4"/></svg>
);
const LockIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

/* ── Step progress dots ── */
function StepDots({ step }) {
  const steps = ["email", "otp", "reset"];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 2 ? 1 : "none" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600,
            flexShrink: 0,
            background: i <= idx ? `linear-gradient(135deg,${V},${C})` : "rgba(255,255,255,0.04)",
            color: i <= idx ? "#fff" : MUTED,
            border: i <= idx ? "none" : `1px solid ${BORDER}`,
            transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
            boxShadow: i === idx ? `0 0 14px rgba(124,58,237,0.45)` : "none",
          }}>
            {i < idx ? "✓" : i + 1}
          </div>
          {i < 2 && (
            <div style={{
              flex: 1, height: 2, borderRadius: 1,
              background: i < idx ? `linear-gradient(90deg,${V},${C})` : BORDER,
              transition: "background 0.4s ease",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const otpRefs = useRef([]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Please enter your email.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setMaskedEmail(data.data?.email || email);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Make sure the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpBackspace = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return setError("Please enter all 6 digits.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      if (!data.data?.resetToken) throw new Error("No reset token received");
      setResetToken(data.data.resetToken);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepEyebrow = { email: "Account Recovery", otp: "Verification", reset: "New Credentials" }[step];
  const stepTitle = { email: "Forgot password?", otp: "Check your inbox.", reset: "Set a new password." }[step];
  const stepSubtitle = {
    email: "Enter your registered email and we'll send you a one-time code.",
    otp: "Enter the 6-digit code we just sent you.",
    reset: "Create a new secure password for your account.",
  }[step];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; }
        ::selection { background: rgba(124,58,237,0.45); color: #fff; }
        input::placeholder, textarea::placeholder { color: ${MUTED}; font-family: 'Space Grotesk',sans-serif; }
        @keyframes edgePulse { 0%,100%{opacity:.15} 50%{opacity:.55} }
        @keyframes blobPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes nodePop  { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes shimmer  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes breathe  { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} 50%{box-shadow:0 0 0 6px rgba(124,58,237,0.12)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .otp-row { display: flex; gap: 10px; justify-content: center; }
        .otp-box {
          width: 52px; height: 60px; text-align: center;
          font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px;
          border-radius: 14px; color: ${TEXT};
          background: rgba(255,255,255,0.025); border: 1px solid ${BORDER};
          outline: none; transition: all 0.25s cubic-bezier(.22,1,.36,1);
        }
        .otp-box:focus { border-color: ${V}; background: rgba(124,58,237,0.06); box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }

        @media(max-width:768px){ .left-panel{ display:none !important; } .right-panel{ border-radius:0 !important; } .page-wrap{ flex-direction:column !important; min-height:100dvh; } }
        @media(max-width:480px){ .otp-box{ width: 13.5vw; max-width: 48px; height: 54px; font-size: 18px; } .otp-row{ gap: 8px; } }
      `}</style>

      <div
        className="page-wrap"
        style={{
          display: "flex",
          minHeight: "100vh",
          background: BG,
          fontFamily: "'Space Grotesk', sans-serif",
          color: TEXT,
          overflowX: "hidden",
        }}
      >
        {/* ── LEFT PANEL: brand story ── */}
        <div
          className="left-panel"
          style={{
            flex: "0 0 45%",
            position: "relative",
            overflow: "hidden",
            background: CARD,
            borderRight: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 48px 40px",
          }}
        >
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse 60% 50% at 30% 30%, rgba(124,58,237,0.12) 0%, transparent 70%),
                         radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 70%)`,
          }} />

          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
                              linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)`,
            backgroundSize: "48px 48px",
          }} />

          <CircuitPanel />

          {/* Brand mark */}
          <Appear delay={200} style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${V}, ${C})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: `0 0 20px rgba(124,58,237,0.4)`,
              }}>⚡</div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: 22,
                letterSpacing: "-0.02em", color: "#fff",
              }}>
                Tek<span style={{
                  background: `linear-gradient(90deg,${VL},${CL})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Node</span>
              </span>
            </div>
          </Appear>

          {/* Taglines */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <Appear delay={400}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: "0.25em",
                textTransform: "uppercase", color: VL,
                marginBottom: 16,
              }}>
                Automation Studio · v2.0
              </div>
            </Appear>
            <Appear delay={550}>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: "clamp(1.6rem,3vw,2.4rem)",
                lineHeight: 1.15, letterSpacing: "-0.03em",
                color: "#fff", marginBottom: 16,
              }}>
                Your account,<br />
                <span style={{
                  background: `linear-gradient(135deg,${VL},${CL},${VL})`,
                  backgroundSize: "200%",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  animation: "shimmer 5s linear infinite",
                }}>securely recovered.</span>
              </h2>
            </Appear>
            <Appear delay={700}>
              <p style={{
                fontSize: 13, color: MUTED, lineHeight: 1.7, maxWidth: 320,
                marginBottom: 32,
              }}>
                We'll verify it's really you with a one-time code, then get you straight back into your automation dashboard.
              </p>
            </Appear>

            <Appear delay={850}>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {[["256-bit","Encryption"],["<60s","Recovery"],["24/7","Support"]].map(([v, l]) => (
                  <div key={l}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: 20,
                      background: `linear-gradient(90deg,${VL},${CL})`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>{v}</div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: MUTED, marginTop: 2,
                    }}>{l}</div>
                  </div>
                ))}
              </div>
            </Appear>
          </div>
        </div>

        {/* ── RIGHT PANEL: form ── */}
        <div
          className="right-panel"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", width: 400, height: 400,
            borderRadius: "50%", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: V, opacity: 0.04, filter: "blur(80px)",
            pointerEvents: "none",
          }} />

          <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>

            {/* Back button */}
            <Appear delay={100}>
              <button
                onClick={() => navigate(-1)}
                onMouseEnter={() => setBackHover(true)}
                onMouseLeave={() => setBackHover(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", marginBottom: 36,
                  background: backHover ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${backHover ? V : BORDER}`,
                  borderRadius: 10, color: backHover ? VL : MUTED,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, letterSpacing: "0.12em",
                  cursor: "pointer", transition: "all 0.25s ease",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  style={{ transform: backHover ? "translateX(-3px)" : "none", transition: "transform 0.2s" }}>
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            </Appear>

            {/* Mobile brand */}
            <Appear delay={150} style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: `linear-gradient(135deg,${V},${C})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>⚡</div>
              <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
                Tek<span style={{
                  background: `linear-gradient(90deg,${VL},${CL})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Node</span>
              </span>
            </Appear>

            {!success && (
              <Appear delay={180}>
                <StepDots step={step} />
              </Appear>
            )}

            {/* Heading */}
            <Appear delay={200}>
              <div style={{ marginBottom: 36 }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: VL, marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{
                    width: 24, height: 1,
                    background: `linear-gradient(90deg,${V},${C})`,
                    display: "inline-block",
                  }} />
                  {success ? "All Set" : stepEyebrow}
                </div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.4rem)",
                  letterSpacing: "-0.03em", lineHeight: 1.1,
                  color: "#fff", marginBottom: 8,
                }}>
                  {success ? "Password reset." : stepTitle}
                </h1>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                  {success ? "You can now sign in with your new password." : stepSubtitle}
                </p>
              </div>
            </Appear>

            {success ? (
              <Appear delay={0}>
                <div style={{
                  padding: "36px 28px", textAlign: "center",
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 20,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: 28,
                    animation: "float 2.5s ease-in-out infinite",
                  }}>✓</div>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700, fontSize: 20,
                    color: SUCCESS, marginBottom: 6,
                  }}>Password reset successfully!</div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12, color: "rgba(52,211,153,0.6)",
                    letterSpacing: "0.05em",
                  }}>
                    Redirecting to sign in
                    <span style={{ animation: "dotBlink 1s ease-in-out infinite" }}>…</span>
                  </div>
                </div>
              </Appear>
            ) : (
              <>
                {/* STEP: email */}
                {step === "email" && (
                  <form onSubmit={handleSendOtp}>
                    <Appear delay={320} style={{ marginBottom: 8 }}>
                      <Field
                        label="Registered email" name="email" type="email" value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@example.com" icon={MailIcon} autoFocus
                      />
                    </Appear>

                    {error && (
                      <Appear delay={0} style={{ marginTop: 16, marginBottom: 8 }}>
                        <ErrorBox text={error} />
                      </Appear>
                    )}

                    <Appear delay={420} style={{ marginTop: 24 }}>
                      <SubmitButton loading={loading} hover={btnHover} setHover={setBtnHover} label="Send code" loadingLabel="Sending code…" />
                    </Appear>

                    <Appear delay={500}>
                      <FooterLink text="Remember your password?" cta="Sign in →" onClick={() => navigate("/login")} />
                    </Appear>
                  </form>
                )}

                {/* STEP: otp */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp}>
                    {maskedEmail && (
                      <Appear delay={300} style={{ marginBottom: 24 }}>
                        <div style={{
                          textAlign: "center", fontSize: 12,
                          fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                          color: VL, background: "rgba(124,58,237,0.08)",
                          border: `1px solid rgba(124,58,237,0.2)`,
                          borderRadius: 12, padding: "12px 16px",
                        }}>
                          Code sent to {maskedEmail}
                        </div>
                      </Appear>
                    )}

                    <Appear delay={360} style={{ marginBottom: 8 }}>
                      <div className="otp-row">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpBackspace(index, e)}
                            placeholder="·"
                            className="otp-box"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                    </Appear>

                    {error && (
                      <Appear delay={0} style={{ marginTop: 20, marginBottom: 8 }}>
                        <ErrorBox text={error} />
                      </Appear>
                    )}

                    <Appear delay={420} style={{ marginTop: 24 }}>
                      <SubmitButton loading={loading} hover={btnHover} setHover={setBtnHover} label="Verify code" loadingLabel="Verifying…" />
                    </Appear>

                    <Appear delay={480}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                        marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.05em",
                      }}>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          style={{
                            background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                            color: VL, opacity: loading ? 0.4 : 1,
                          }}
                        >
                          Resend code
                        </button>
                        <span style={{ color: BORDER }}>|</span>
                        <button
                          type="button"
                          onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
                        >
                          Change email
                        </button>
                      </div>
                    </Appear>
                  </form>
                )}

                {/* STEP: reset */}
                {step === "reset" && (
                  <form onSubmit={handleResetPassword}>
                    <Appear delay={320} style={{ marginBottom: 16 }}>
                      <Field
                        label="New password" name="new_password" type={showPassword ? "text" : "password"} value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                        placeholder="Min 8 characters" icon={LockIcon} autoFocus
                        right={<EyeIcon open={showPassword} onClick={() => setShowPassword((p) => !p)} />}
                      />
                    </Appear>

                    <Appear delay={380} style={{ marginBottom: 8 }}>
                      <Field
                        label="Confirm new password" name="confirm_password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        placeholder="Re-enter password" icon={LockIcon}
                        right={<EyeIcon open={showConfirmPassword} onClick={() => setShowConfirmPassword((p) => !p)} />}
                      />
                    </Appear>

                    {error && (
                      <Appear delay={0} style={{ marginTop: 16, marginBottom: 8 }}>
                        <ErrorBox text={error} />
                      </Appear>
                    )}

                    <Appear delay={440} style={{ marginTop: 24 }}>
                      <SubmitButton loading={loading} hover={btnHover} setHover={setBtnHover} label="Reset password" loadingLabel="Resetting…" />
                    </Appear>
                  </form>
                )}
              </>
            )}

            {/* Footer */}
            <Appear delay={750}>
              <div style={{
                marginTop: 36,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: "0.12em",
                color: "rgba(100,116,139,0.6)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: SUCCESS, boxShadow: `0 0 6px ${SUCCESS}`,
                  display: "inline-block", flexShrink: 0,
                  animation: "dotBlink 2s ease-in-out infinite",
                }} />
                © {new Date().getFullYear()} Tek Node · Secure Core Architecture
              </div>
            </Appear>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared small pieces ── */
function ErrorBox({ text }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px",
      background: "rgba(248,113,113,0.08)",
      border: "1px solid rgba(248,113,113,0.2)",
      borderRadius: 12,
      fontFamily: "'DM Mono', monospace",
      fontSize: 12, color: DANGER,
      lineHeight: 1.5,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
      {text}
    </div>
  );
}

function SubmitButton({ loading, hover, setHover, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        height: 54,
        border: "none",
        borderRadius: 14,
        cursor: loading ? "not-allowed" : "pointer",
        background: loading
          ? BORDER
          : hover
          ? `linear-gradient(135deg, #6D28D9, #0891B2)`
          : `linear-gradient(135deg, ${V}, ${C})`,
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700, fontSize: 15,
        letterSpacing: "0.03em",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "all 0.3s ease",
        transform: hover && !loading ? "translateY(-1px)" : "none",
        boxShadow: hover && !loading
          ? `0 8px 32px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.2)`
          : `0 4px 16px rgba(124,58,237,0.25)`,
        animation: !loading && !hover ? "breathe 3s ease-in-out infinite" : "none",
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 18, height: 18,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTop: "2px solid #fff",
            borderRadius: "50%",
            animation: "spin 0.75s linear infinite",
            display: "inline-block",
          }} />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <span style={{ opacity: 0.8, fontSize: 18 }}>→</span>
        </>
      )}
    </button>
  );
}

function FooterLink({ text, cta, onClick }) {
  const VL_ = VL, CL_ = CL;
  return (
    <div style={{
      marginTop: 24,
      padding: "18px",
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      textAlign: "center",
      fontSize: 14, color: MUTED,
    }}>
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "none", border: "none",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 14,
          cursor: "pointer",
          backgroundImage: `linear-gradient(90deg,${VL_},${CL_})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {cta}
      </button>
    </div>
  );
}