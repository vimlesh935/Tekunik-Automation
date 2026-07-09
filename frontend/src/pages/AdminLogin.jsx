import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Mail, Loader, ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { getApiUrl } from "../services/api";

/* ── Brand tokens (shared with user Login page) ── */
const V = "#7C3AED";
const C = "#06B6D4";
const VL = "#A78BFA";
const CL = "#67E8F9";
const BG = "#080B14";
const CARD = "#0D1120";
const BORDER = "#1E2640";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";
const SUCCESS = "#34D399";
const DANGER = "#F87171";

/* ── Motion presets ── */
const appear = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] },
});

/* ── Ambient circuit / node background, same language as user login ── */
function CircuitPanel() {
  const nodes = [
    { cx: 80, cy: 100 }, { cx: 200, cy: 60 },
    { cx: 300, cy: 160 }, { cx: 160, cy: 240 },
    { cx: 320, cy: 300 }, { cx: 80, cy: 340 },
    { cx: 240, cy: 400 }, { cx: 360, cy: 440 },
    { cx: 100, cy: 480 }, { cx: 280, cy: 520 },
  ];
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[6,7],[5,8],[7,9],[8,9],[0,3],[2,4]];
  return (
    <svg viewBox="0 0 440 600" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} aria-hidden="true">
      <defs>
        <radialGradient id="admin-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={VL} stopOpacity="0.3" />
          <stop offset="100%" stopColor={VL} stopOpacity="0" />
        </radialGradient>
        <filter id="admin-blur4"><feGaussianBlur stdDeviation="4" /></filter>
        <linearGradient id="admin-edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={V} stopOpacity="0.15" />
          <stop offset="50%" stopColor={C} stopOpacity="0.5" />
          <stop offset="100%" stopColor={V} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="url(#admin-edgeGrad)" strokeWidth="1"
          style={{ animation: `edgePulse ${2.5 + (i % 3) * 0.8}s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      {nodes.slice(0, 3).map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={60} fill="url(#admin-glow)" filter="url(#admin-blur4)"
          style={{ animation: `blobPulse ${4 + i}s ease-in-out ${i * 1.2}s infinite` }} />
      ))}
      {nodes.map((n, i) => (
        <g key={i} style={{ animation: `nodePop ${2 + (i % 4) * 0.7}s ease-in-out ${i * 0.35}s infinite` }}>
          <circle cx={n.cx} cy={n.cy} r={10} fill={CARD} stroke={i % 3 === 0 ? VL : CL} strokeWidth="1.5" />
          <circle cx={n.cx} cy={n.cy} r={4} fill={i % 3 === 0 ? VL : CL} />
        </g>
      ))}
    </svg>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [success, setSuccess] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !secretKey.trim()) {
      setError("Please enter both email and secret key.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), secretKey: secretKey.trim() }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server is offline or unreachable.");
      }
      if (!res.ok) {
        if (res.status === 0 || res.status === 502 || res.status === 503)
          throw new Error("Server is offline. Please ensure the backend server is running on port 8787.");
        throw new Error(data.message || "Invalid credentials.");
      }
      const adminToken = data.data?.token;
      if (!adminToken) throw new Error("No token received from server.");
      localStorage.setItem("authToken", adminToken);
      setSuccess(true);
      setTimeout(() => { window.location.href = "/admin/dashboard"; }, 1600);
    } catch (err) {
      setError(
        err.message === "Failed to fetch" || err.name === "TypeError"
          ? "Cannot connect to server. Make sure the backend is running on port 8787."
          : err.message || "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; }
        ::selection { background: rgba(124,58,237,0.45); color: #fff; }
        input::placeholder { color: ${MUTED}; font-family: 'Space Grotesk',sans-serif; }
        @keyframes edgePulse { 0%,100%{opacity:.15} 50%{opacity:.55} }
        @keyframes blobPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes nodePop  { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes shimmer  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes breathe  { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} 50%{box-shadow:0 0 0 6px rgba(124,58,237,0.12)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .admin-input:focus { border-color: ${V} !important; box-shadow: 0 0 0 4px rgba(124,58,237,0.12); }
        @media(max-width:768px){
          .admin-left-panel{ display:none !important; }
          .admin-right-panel{ border-radius:0 !important; padding: 32px 20px !important; }
          .admin-page-wrap{ flex-direction:column !important; min-height:100dvh; }
        }
        @media(max-width:420px){
          .admin-card{ padding: 24px 18px !important; }
        }
      `}</style>

      <div className="admin-page-wrap" style={{
        display: "flex", minHeight: "100vh", background: BG,
        fontFamily: "'Space Grotesk', sans-serif", color: TEXT, overflowX: "hidden",
      }}>
        {/* LEFT PANEL */}
        <div className="admin-left-panel" style={{
          flex: "0 0 45%", position: "relative", overflow: "hidden",
          background: CARD, borderRight: `1px solid ${BORDER}`,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "48px 48px 40px",
        }}>
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

          <motion.div {...appear(200)} style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${V}, ${C})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: `0 0 20px rgba(124,58,237,0.4)`,
              }}>⚡</div>
              <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#fff" }}>
                Tek<span style={{
                  background: `linear-gradient(90deg,${VL},${CL})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Node</span>
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.18em",
                textTransform: "uppercase", color: VL, border: `1px solid rgba(167,139,250,0.3)`,
                padding: "3px 8px", borderRadius: 6, marginLeft: 4,
              }}>Admin Node</span>
            </div>
          </motion.div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div {...appear(400)}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em",
                textTransform: "uppercase", color: VL, marginBottom: 16,
              }}>Restricted Access · Root Only</div>
            </motion.div>
            <motion.div {...appear(550)}>
              <h2 style={{
                fontWeight: 700, fontSize: "clamp(1.6rem,3vw,2.4rem)", lineHeight: 1.15,
                letterSpacing: "-0.03em", color: "#fff", marginBottom: 16,
              }}>
                Command the<br />
                <span style={{
                  background: `linear-gradient(135deg,${VL},${CL},${VL})`,
                  backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  animation: "shimmer 5s linear infinite",
                }}>core systems.</span>
              </h2>
            </motion.div>
            <motion.div {...appear(700)}>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
                This gateway is for authorized operators only. Every session is logged and monitored for security.
              </p>
            </motion.div>
            <motion.div {...appear(850)}>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {[["256-bit","Encryption"],["24/7","Monitoring"]].map(([v, l]) => (
                  <div key={l}>
                    <div style={{
                      fontWeight: 700, fontSize: 20,
                      background: `linear-gradient(90deg,${VL},${CL})`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>{v}</div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: MUTED, marginTop: 2,
                    }}>{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="admin-right-panel" style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 24px", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 400, height: 400, borderRadius: "50%",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: V, opacity: 0.04, filter: "blur(80px)", pointerEvents: "none",
          }} />

          <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
            <motion.div {...appear(100)}>
              <button
                onClick={() => navigate("/")}
                onMouseEnter={() => setBackHover(true)}
                onMouseLeave={() => setBackHover(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", marginBottom: 36,
                  background: backHover ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${backHover ? V : BORDER}`,
                  borderRadius: 10, color: backHover ? VL : MUTED,
                  fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em",
                  cursor: "pointer", transition: "all 0.25s ease",
                }}>
                <ArrowLeft size={14} style={{ transform: backHover ? "translateX(-3px)" : "none", transition: "transform 0.2s" }} />
                Back
              </button>
            </motion.div>

            <motion.div {...appear(150)} style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
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
            </motion.div>

            <motion.div {...appear(200)}>
              <div style={{ marginBottom: 36 }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: VL, marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 24, height: 1, background: `linear-gradient(90deg,${V},${C})`, display: "inline-block" }} />
                  Restricted Access
                </div>
                <h1 style={{
                  fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.4rem)", letterSpacing: "-0.03em",
                  lineHeight: 1.1, color: "#fff", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <Shield size={26} style={{ color: VL, flexShrink: 0 }} />
                  Terminal Gateway
                </h1>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                  Sign in with your operator credentials to continue.
                </p>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    padding: "36px 28px", textAlign: "center",
                    background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: 20,
                  }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px", fontSize: 28, animation: "float 2.5s ease-in-out infinite",
                  }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: SUCCESS, marginBottom: 6 }}>
                    Access Authorized!
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 12,
                    color: "rgba(52,211,153,0.6)", letterSpacing: "0.05em",
                  }}>
                    Redirecting to admin dashboard
                    <span style={{ animation: "dotBlink 1s ease-in-out infinite" }}>…</span>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="admin-card"
                >
                  <motion.div {...appear(320)} style={{ marginBottom: 16 }}>
                    <label style={{
                      display: "block", fontFamily: "'DM Mono', monospace", fontSize: 10,
                      letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: 8,
                    }}>Operator Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="admin@teknode.com"
                        autoComplete="off"
                        className="admin-input"
                        style={{
                          width: "100%", height: 52, borderRadius: 12,
                          background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
                          paddingLeft: 44, paddingRight: 16, fontSize: 14, color: TEXT,
                          fontFamily: "'Space Grotesk', sans-serif", outline: "none",
                          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div {...appear(420)} style={{ marginBottom: 8 }}>
                    <label style={{
                      display: "block", fontFamily: "'DM Mono', monospace", fontSize: 10,
                      letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: 8,
                    }}>System Secret Key</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
                      <input
                        type={showKey ? "text" : "password"}
                        value={secretKey}
                        onChange={(e) => { setSecretKey(e.target.value); setError(""); }}
                        placeholder="Enter production access key"
                        autoComplete="off"
                        className="admin-input"
                        style={{
                          width: "100%", height: 52, borderRadius: 12,
                          background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
                          paddingLeft: 44, paddingRight: 44, fontSize: 14, color: TEXT,
                          fontFamily: "'Space Grotesk', sans-serif", outline: "none",
                          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((s) => !s)}
                        style={{
                          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", color: MUTED, cursor: "pointer",
                          display: "flex", alignItems: "center",
                        }}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>

                  <div style={{ height: 20 }} />

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "12px 16px", background: "rgba(248,113,113,0.08)",
                          border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12,
                          fontFamily: "'DM Mono', monospace", fontSize: 12, color: DANGER, lineHeight: 1.5,
                        }}>
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div {...appear(520)}>
                    <button type="submit" disabled={loading}
                      onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
                      style={{
                        width: "100%", height: 54, border: "none", borderRadius: 14,
                        cursor: loading ? "not-allowed" : "pointer",
                        background: loading ? BORDER : btnHover ? `linear-gradient(135deg, #6D28D9, #0891B2)` : `linear-gradient(135deg, ${V}, ${C})`,
                        color: "#fff", fontWeight: 700, fontSize: 15,
                        letterSpacing: "0.03em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        transition: "all 0.3s ease",
                        transform: btnHover && !loading ? "translateY(-1px)" : "none",
                        boxShadow: btnHover && !loading ? `0 8px 32px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.2)` : `0 4px 16px rgba(124,58,237,0.25)`,
                        animation: !loading && !btnHover ? "breathe 3s ease-in-out infinite" : "none",
                      }}>
                      {loading ? (
                        <>
                          <span style={{
                            width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)",
                            borderTop: "2px solid #fff", borderRadius: "50%",
                            animation: "spin 0.75s linear infinite", display: "inline-block",
                          }} />
                          Verifying credentials…
                        </>
                      ) : (
                        <>
                          <Shield size={17} />
                          Authorize Secure Access
                        </>
                      )}
                    </button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            <motion.div {...appear(750)}>
              <div style={{
                marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em",
                color: "rgba(100,116,139,0.6)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: SUCCESS, boxShadow: `0 0 6px ${SUCCESS}`,
                  display: "inline-block", flexShrink: 0, animation: "dotBlink 2s ease-in-out infinite",
                }} />
                © {new Date().getFullYear()} Tek Node · Secure Core Architecture
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}