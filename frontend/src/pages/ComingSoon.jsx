import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const V = "#7C3AED";
const C = "#06B6D4";
const VL = "#A78BFA";
const CL = "#67E8F9";
const BG = "#080B14";
const CARD = "#0D1120";
const BORDER = "#1E2640";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";

function AppearingSquares() {
  const squares = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 24,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {squares.map((s) => (
        <motion.div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size > 16 ? 4 : "50%",
            border: `1px solid ${s.id % 2 === 0 ? V : C}`,
            opacity: 0.15,
          }}
          animate={{
            opacity: [0, 0.25, 0],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function Countdown() {
  const target = new Date("2026-09-01T00:00:00");
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
      {[
        { label: "Days", value: time.days },
        { label: "Hours", value: time.hours },
        { label: "Minutes", value: time.minutes },
        { label: "Seconds", value: time.seconds },
      ].map((unit) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: `linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.08))`,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "16px 24px",
            minWidth: 90,
            textAlign: "center",
          }}
        >
          <div style={{
            fontSize: 36, fontWeight: 700, color: "#fff",
            fontFamily: "'DM Mono', monospace",
            background: `linear-gradient(135deg, ${VL}, ${CL})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {String(unit.value).padStart(2, "0")}
          </div>
          <div style={{
            fontSize: 11, color: MUTED, marginTop: 4,
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {unit.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ComingSoon() {
  return (
    <div style={{
      minHeight: "100vh", background: BG, fontFamily: "'Space Grotesk', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${BG}; }
      `}</style>

      <AppearingSquares />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 680, width: "100%" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 48 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            padding: "10px 24px",
            background: `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))`,
            border: `1px solid ${BORDER}`,
            borderRadius: 100, marginBottom: 32,
          }}>
            <Zap size={16} style={{ color: CL }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, letterSpacing: "0.12em" }}>
              Next-gen automation platform
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <img src="/assest/logowhite.png" alt="TekNode" className="w-auto" style={{ height: "clamp(80px, 15vw, 200px)", width: "auto" }} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 700,
            letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fff",
            marginBottom: 16,
          }}
        >
          Something{" "}
          <span style={{
            background: `linear-gradient(135deg, ${VL}, ${CL})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>extraordinary</span>
          {" "}is coming
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            fontSize: 15, color: MUTED, lineHeight: 1.7,
            maxWidth: 500, margin: "0 auto 48px",
          }}
        >
          We're crafting a powerful automation platform that will transform how you work.
          Stay tuned for the launch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          style={{ marginBottom: 64 }}
        >
          <Countdown />
        </motion.div>



        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          style={{
            marginTop: 64,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em",
            color: "rgba(100,116,139,0.5)",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#34D399", boxShadow: "0 0 6px #34D399",
            display: "inline-block",
          }} />
          © {new Date().getFullYear()} Tek Node · Launching Soon
        </motion.div>
      </div>
    </div>
  );
}
