import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import {
  Mail,
  Lock,
  Loader,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
=======
>>>>>>> 2f71973bf81d6d0c50f58dc20361e240c2e0c829
import { useAuth } from "../context/AuthContext.jsx";
import { authService } from "../services/api";
import AuthInput from "../components/AuthInput.jsx";

/* ── Brand tokens (matches ContactUs) ── */
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

/* ── Tiny animation helpers (no framer-motion dep, pure CSS transitions) ── */
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

/* ── Animated circuit SVG panel ── */
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
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={VL} stopOpacity="0.3" />
          <stop offset="100%" stopColor={VL} stopOpacity="0" />
        </radialGradient>
        <filter id="blur4">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={V} stopOpacity="0.15" />
          <stop offset="50%" stopColor={C} stopOpacity="0.5" />
          <stop offset="100%" stopColor={V} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="url(#edgeGrad)"
          strokeWidth="1"
          style={{
            animation: `edgePulse ${2.5 + (i % 3) * 0.8}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      {/* Glow blobs */}
      {nodes.slice(0, 3).map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={60} fill="url(#glow)" filter="url(#blur4)"
          style={{ animation: `blobPulse ${4 + i}s ease-in-out ${i * 1.2}s infinite` }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i} style={{ animation: `nodePop ${2 + (i % 4) * 0.7}s ease-in-out ${i * 0.35}s infinite` }}>
          <circle cx={n.cx} cy={n.cy} r={10} fill={CARD} stroke={i % 3 === 0 ? VL : CL} strokeWidth="1.5" />
          <circle cx={n.cx} cy={n.cy} r={4} fill={i % 3 === 0 ? VL : CL} />
        </g>
      ))}

      {/* Data packets moving along edges */}
      {edges.slice(0, 4).map(([a, b], i) => (
        <circle key={i} r={3} fill={i % 2 === 0 ? VL : CL}
          style={{ opacity: 0.9, filter: `drop-shadow(0 0 4px ${i % 2 === 0 ? VL : CL})` }}
        >
          <animateMotion dur={`${2.5 + i * 0.6}s`} repeatCount="indefinite">
            <mpath href={`#edge-${i}`} />
          </animateMotion>
        </circle>
      ))}
    </svg>
  );
}

/* ── Floating label input ── */
function Field({ label, name, type = "text", value, onChange, placeholder, icon, right }) {
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

      {/* left icon */}
      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: focused ? VL : MUTED, transition: "color 0.25s",
        display: "flex", alignItems: "center",
        fontSize: 16,
      }}>{icon}</div>

      {type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          style={inputStyle(focused)}
          placeholder={focused ? placeholder : ""}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={name}
          placeholder={focused ? placeholder : ""}
          style={{ ...inputStyle(focused), paddingRight: right ? 44 : 16 }}
        />
      )}

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

/* ── Eye icon (inline SVG, no lucide dep needed) ── */
function EyeIcon({ open, onClick }) {
  return (
    <span onClick={onClick} style={{ display: "flex", alignItems: "center" }}>
      {open
        ?  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        :<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
    </span>
  );
}

/* ── Main component ── */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
<<<<<<< HEAD
=======
  const [success, setSuccess] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
>>>>>>> 2f71973bf81d6d0c50f58dc20361e240c2e0c829

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Enter your email address.");
    if (!password)    return setError("Enter your password.");
    setLoading(true); setError("");
    try {
      const data = await authService.login(email.trim(), password);
      const token = data.data?.token;
      if (!token) throw new Error("No token received.");
      login(token);
<<<<<<< HEAD
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
=======
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
>>>>>>> 2f71973bf81d6d0c50f58dc20361e240c2e0c829
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-page text-primary font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 shadow-xl rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-600 hover:bg-slate-800 transition-all duration-300 group z-10"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300 text-blue-600" />
        Back
      </button>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] transform hover:rotate-12 transition-transform duration-300">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Tek
            <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]">Node</span>
          </span>
        </div>

        <div className="card card-body">
          <div className="text-center mb-8">
            <h1 className="section-heading text-2xl">Welcome Back</h1>
            <p className="section-subheading">Sign in to secure your sessions</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              icon={Mail}
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-400 transition-colors duration-300"
                >
                  Forgot Password?
                </button>
              </div>
              <AuthInput
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••••••"
                icon={Lock}
                showPasswordToggle
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="badge-danger rounded-xl p-3.5 text-sm font-medium">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Account"
              )}
            </button>

            <p className="text-center text-sm text-slate-400 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-400 font-bold transition-colors duration-300 underline underline-offset-4 decoration-blue-600/30"
              >
                Register Here
              </button>
            </p>
          </form>
=======
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

        /* left panel hidden on mobile */
        @media(max-width:768px){ .left-panel{ display:none !important; } .right-panel{ border-radius:0 !important; } .page-wrap{ flex-direction:column !important; min-height:100dvh; } }
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
          {/* Gradient mesh */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse 60% 50% at 30% 30%, rgba(124,58,237,0.12) 0%, transparent 70%),
                         radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 70%)`,
          }} />

          {/* Grid lines */}
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
                Automate the<br />
                <span style={{
                  background: `linear-gradient(135deg,${VL},${CL},${VL})`,
                  backgroundSize: "200%",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  animation: "shimmer 5s linear infinite",
                }}>future of work.</span>
              </h2>
            </Appear>
            <Appear delay={700}>
              <p style={{
                fontSize: 13, color: MUTED, lineHeight: 1.7, maxWidth: 320,
                marginBottom: 32,
              }}>
                Intelligent workflows, zero friction. Sign in to access your automation dashboard and take control of your processes.
              </p>
            </Appear>

            {/* Stats row */}
            <Appear delay={850}>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {[["99.9%","Uptime"],["10x","Faster"],["500+","Automations"]].map(([v, l]) => (
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
          {/* Subtle bg orb */}
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

            {/* Mobile brand (only visible on small screens) */}
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
                  Secure Sign In
                </div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.4rem)",
                  letterSpacing: "-0.03em", lineHeight: 1.1,
                  color: "#fff", marginBottom: 8,
                }}>
                  Welcome back.
                </h1>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                  Sign in to your automation workspace.
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
                  }}>Authenticated!</div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12, color: "rgba(52,211,153,0.6)",
                    letterSpacing: "0.05em",
                  }}>
                    Redirecting to dashboard
                    <span style={{ animation: "dotBlink 1s ease-in-out infinite" }}>…</span>
                  </div>
                </div>
              </Appear>
            ) : (
              <form onSubmit={handleLogin}>
                <Appear delay={320} style={{ marginBottom: 16 }}>
                  <Field
                    label="Email address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    icon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4 12 13 2 4"/>
                      </svg>
                    }
                  />
                </Appear>

                <Appear delay={420} style={{ marginBottom: 8 }}>
                  <Field
                    label="Password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="Your password"
                    icon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      
                    }
                    right={<EyeIcon open={showPwd} onClick={() => setShowPwd(p => !p)} />}
                  />
                </Appear>

                {/* Forgot password */}
                <Appear delay={480}>
                  <div style={{ textAlign: "right", marginBottom: 20 }}>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      style={{
                        background: "none", border: "none",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11, letterSpacing: "0.1em",
                        color: VL, cursor: "pointer",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(167,139,250,0.3)",
                        textUnderlineOffset: 3,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </Appear>

                {/* Error */}
                {error && (
                  <Appear delay={0} style={{ marginBottom: 16 }}>
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
                      {error}
                    </div>
                  </Appear>
                )}

                {/* Submit */}
                <Appear delay={520}>
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                    style={{
                      width: "100%",
                      height: 54,
                      border: "none",
                      borderRadius: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                      background: loading
                        ? BORDER
                        : btnHover
                        ? `linear-gradient(135deg, #6D28D9, #0891B2)`
                        : `linear-gradient(135deg, ${V}, ${C})`,
                      color: "#fff",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: 15,
                      letterSpacing: "0.03em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "all 0.3s ease",
                      transform: btnHover && !loading ? "translateY(-1px)" : "none",
                      boxShadow: btnHover && !loading
                        ? `0 8px 32px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.2)`
                        : `0 4px 16px rgba(124,58,237,0.25)`,
                      animation: !loading && !btnHover ? "breathe 3s ease-in-out infinite" : "none",
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
                        Authenticating…
                      </>
                    ) : (
                      <>
                        Sign In
                        <span style={{ opacity: 0.8, fontSize: 18 }}>→</span>
                      </>
                    )}
                  </button>
                </Appear>

                {/* Divider */}
                <Appear delay={600}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    margin: "24px 0",
                  }}>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: MUTED,
                    }}>or</span>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                  </div>
                </Appear>

                {/* Register link */}
                <Appear delay={680}>
                  <div style={{
                    padding: "18px",
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    textAlign: "center",
                    fontSize: 14, color: MUTED,
                  }}>
                    New to Tek Node?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      style={{
                        background: "none", border: "none",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700, fontSize: 14,
                        cursor: "pointer",
                        background: `linear-gradient(90deg,${VL},${CL})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Create an account →
                    </button>
                  </div>
                </Appear>
              </form>
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
>>>>>>> 2f71973bf81d6d0c50f58dc20361e240c2e0c829
        </div>
      </div>
    </>
  );
}