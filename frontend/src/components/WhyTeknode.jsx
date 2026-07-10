"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Mic, Smartphone, Globe, Cloud, Leaf, Wrench, ShieldCheck, X, Expand, Snowflake, Sun, Flame, Radio } from "lucide-react";

const features = [
  { 
    title: "24x7 Support", 
    desc: "Always here when you need us.", 
    icon: HeadphonesIcon, 
    longDesc: "Our dedicated global support team is available round-the-clock to assist you with any questions, troubleshooting, or configuration support. You can reach us via live chat, phone, or email anytime." 
  },
  { 
    title: "Voice Assistant", 
    desc: "Works with Alexa & Google.", 
    icon: Mic, 
    longDesc: "Seamlessly connect your smart ecosystem with leading voice controllers. Issue voice commands to adjust illumination levels, arm your property, or manage daily multi-device automation routines." 
  },
  { 
    title: "Mobile App Control", 
    desc: "Manage everything from your phone.", 
    icon: Smartphone, 
    longDesc: "Take complete control of your environment with our intuitive native iOS and Android application. Customize dashboard shortcuts, monitor system parameters, and modify settings in a unified UI." 
  },
  { 
    title: "Remote Access", 
    desc: "Control devices from anywhere.", 
    icon: Globe, 
    longDesc: "Whether you are at the office or travelling abroad, securely check real-time device logs, toggle power grids, and receive critical push alerts instantly over encrypted network tunnels." 
  },
  { 
    title: "Cloud Connectivity", 
    desc: "Secure & fast data sync.", 
    icon: Cloud, 
    longDesc: "Powered by edge computing cluster arrays, device states synchronize instantly with millisecond latency. All cloud metrics are mirrored across decentralized node systems for continuous uptime." 
  },
  { 
    title: "Energy Saving", 
    desc: "Reduce electricity bills easily.", 
    icon: Leaf, 
    longDesc: "Gain exhaustive historical utility metrics. Our smart algorithms isolate high-consumption nodes and recommend automated custom schedules to minimize waste and utility expenses." 
  },
  { 
    title: "Easy Installation", 
    desc: "Zero damage, quick setup.", 
    icon: Wrench, 
    longDesc: "Engineered around zero-invasive mounting interfaces. Our plug-and-play architectural components fit straight cleanly into existing wall matrices without expensive rewiring overhauls." 
  },
  { 
    title: "Advanced Security", 
    desc: "Bank-level encryption standards.", 
    icon: ShieldCheck, 
    longDesc: "Equipped with AES-256 bit end-to-end data transport cryptography. Local authentication handshakes ensure external network intrusions cannot compromise the perimeter integrity of your home." 
  },
];

// Temperature stops: 0 = winter blue, 50 = amber, 100 = ember red
const TEMP_STOPS = [
  { pos: 0, rgb: [56, 189, 248] },   // sky-400
  { pos: 50, rgb: [250, 204, 21] },  // amber-400
  { pos: 100, rgb: [239, 68, 68] },  // red-500
];

function getTempRGB(temp) {
  const t = Math.min(100, Math.max(0, temp));
  const [start, end] = t <= 50 ? [TEMP_STOPS[0], TEMP_STOPS[1]] : [TEMP_STOPS[1], TEMP_STOPS[2]];
  const range = end.pos - start.pos;
  const ratio = range === 0 ? 0 : (t - start.pos) / range;
  return [0, 1, 2].map((i) => Math.round(start.rgb[i] + (end.rgb[i] - start.rgb[i]) * ratio));
}

function getTempMeta(temp) {
  if (temp < 34) return { label: "Cold", Icon: Snowflake, zone: "ZONE-B COOLING" };
  if (temp < 67) return { label: "Mild", Icon: Sun, zone: "ZONE-A BALANCED" };
  return { label: "Hot", Icon: Flame, zone: "ZONE-C HEATING" };
}

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [temp, setTemp] = useState(50);

  const [r, g, b] = useMemo(() => getTempRGB(temp), [temp]);
  const c = `${r}, ${g}, ${b}`;
  const themeColor = `rgb(${c})`;
  const themeSoft = `rgba(${c}, 0.14)`;
  const themeMid = `rgba(${c}, 0.35)`;
  const themeGlow = `rgba(${c}, 0.55)`;
  const { label, Icon: TempIcon, zone } = getTempMeta(temp);

  return (
    <section
      className="py-16 sm:py-24 relative overflow-hidden border-y border-border-color bg-background-secondary"
      style={{ "--theme-c": c }}
    >
      {/* Circuit-grid backdrop — the "network" this panel is broadcasting into */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="none">
        <defs>
          <pattern id="automate-grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#automate-grid)" />
      </svg>

      {/* Ambient atmosphere synced to temperature */}
      <div
        className="pointer-events-none absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[700px] sm:h-[700px] rounded-full blur-[90px] sm:blur-[120px] transition-colors duration-700 ease-out"
        style={{ background: `radial-gradient(circle, ${themeSoft}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[220px] h-[220px] sm:w-[420px] sm:h-[420px] rounded-full blur-[80px] sm:blur-[100px] opacity-60 transition-colors duration-700 ease-out"
        style={{ background: `radial-gradient(circle, ${themeSoft}, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Why Choose Automate?</h2>
          <p className="text-text-secondary text-sm sm:text-base px-4">Engineered for reliability, security, and elegance.</p>
        </motion.div>

        {/* Climate Engine Module */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-lg mx-auto rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl bg-white/[0.03] transition-[border-color,box-shadow] duration-500"
          style={{
            border: `1px solid ${themeMid}`,
            boxShadow: `0 0 40px -12px ${themeSoft}`,
          }}
        >
          {/* Module header strip */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b"
            style={{ borderColor: themeSoft, background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 animate-pulse" style={{ color: themeColor }} />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase text-text-secondary truncate">
                Climate Engine
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full led-blink"
                  style={{ background: themeColor, animationDelay: `${i * 0.25}s` }}
                />
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between mb-1 gap-3">
              <div className="min-w-0">
                <div className="flex items-end gap-1.5 sm:gap-2 flex-wrap">
                  <span
                    className="text-4xl sm:text-5xl font-bold tabular-nums leading-none transition-colors duration-500"
                    style={{ color: themeColor }}
                  >
                    {temp}
                  </span>
                  <span className="text-base sm:text-lg font-medium text-text-secondary mb-1">° {label}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={zone}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.25 }}
                    className="text-[9px] sm:text-[10px] font-medium tracking-[0.14em] mt-1.5"
                    style={{ color: themeColor }}
                  >
                    {zone}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div
                className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors duration-500"
                style={{
                  background: `linear-gradient(135deg, ${themeSoft}, transparent)`,
                  border: `1px solid ${themeMid}`,
                  boxShadow: `0 0 24px -6px ${themeGlow}`,
                }}
              >
                <span className="absolute inset-0 rounded-xl sm:rounded-2xl ring-pulse" style={{ boxShadow: `0 0 0 0 ${themeMid}` }} />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <TempIcon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: themeColor }} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Slider */}
            <div className="relative py-3 mt-4">
              <div
                className="relative h-2.5 rounded-full overflow-hidden shadow-inner"
                style={{ background: "linear-gradient(90deg, #38bdf8 0%, #facc15 50%, #ef4444 100%)" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25), transparent 60%)" }}
                />
                <div
                  className="absolute inset-y-0 right-0 transition-[width] duration-150"
                  style={{ width: `${100 - temp}%`, background: "rgba(2,6,23,0.45)" }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="absolute inset-x-0 top-0 w-full h-8 sm:h-9 appearance-none bg-transparent cursor-pointer temp-slider touch-none"
                aria-label="Temperature"
              />

              <motion.div
                className="absolute top-1/2 rounded-full pointer-events-none flex items-center justify-center"
                style={{
                  left: `calc(${temp}% - 13px)`,
                  width: 26,
                  height: 26,
                  y: "-50%",
                  background: "white",
                  boxShadow: `0 0 0 4px ${themeSoft}, 0 0 18px ${themeGlow}, 0 2px 6px rgba(0,0,0,0.35)`,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: themeColor }} />
              </motion.div>
            </div>

            <div className="flex justify-between text-[9px] sm:text-[10px] font-medium text-text-secondary/70 mt-2 uppercase tracking-[0.1em] sm:tracking-[0.15em]">
              <span>Winter</span>
              <span>Mild</span>
              <span>Ember</span>
            </div>
          </div>
        </motion.div>

        {/* Signal broadcast connector — theme flows down to the device grid */}
        <div className="relative w-px h-10 sm:h-14 mx-auto" style={{ background: `linear-gradient(180deg, ${themeMid}, transparent)` }}>
          <span className="signal-dot absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: themeColor, boxShadow: `0 0 8px ${themeGlow}` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFeature(feature)}
              className="glass p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center group hover:bg-white/5 cursor-pointer relative overflow-hidden transition-[box-shadow,border-color] duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 12px 30px -10px ${themeGlow}`;
                e.currentTarget.style.borderColor = themeMid;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.borderColor = "";
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)` }}
              />

              {/* Connected-device indicator */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 led-blink" style={{ background: themeColor }} />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: themeColor }} />
                </span>
              </div>

              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-50 group-hover:opacity-100 transition-all duration-300" style={{ color: themeColor }}>
                <Expand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner"
                style={{ boxShadow: `inset 0 0 0 1px ${themeSoft}` }}
              >
                <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-300" style={{ color: themeColor }} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-text-secondary">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeFeature !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveFeature(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="glass max-w-md w-full p-6 sm:p-8 rounded-3xl relative shadow-2xl bg-slate-900/90 text-center flex flex-col items-center overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ border: `1px solid ${themeMid}` }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, #38bdf8, #facc15, #ef4444)` }}
              />

              <button
                onClick={() => setActiveFeature(null)}
                className="absolute top-5 right-4 p-2 rounded-full text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-5 sm:mb-6 transition-colors duration-300"
                style={{
                  background: `linear-gradient(135deg, ${themeSoft}, rgba(255,255,255,0.05))`,
                  border: `1px solid ${themeMid}`,
                  boxShadow: `0 0 24px ${themeSoft}`,
                }}
              >
                <activeFeature.icon className="w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300" style={{ color: themeColor }} />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5 sm:mb-3 tracking-tight">
                {activeFeature.title}
              </h3>

              <p
                className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 uppercase tracking-widest transition-colors duration-300"
                style={{ color: themeColor }}
              >
                {activeFeature.desc}
              </p>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                {activeFeature.longDesc}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .temp-slider::-webkit-slider-thumb {
          appearance: none;
          width: 26px;
          height: 26px;
          opacity: 0;
          cursor: pointer;
        }
        .temp-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          opacity: 0;
          border: none;
          cursor: pointer;
        }

        @keyframes led-blink {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .led-blink {
          animation: led-blink 1.8s ease-in-out infinite;
        }

        @keyframes ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--theme-c), 0.45); }
          70% { box-shadow: 0 0 0 10px rgba(var(--theme-c), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--theme-c), 0); }
        }
        .ring-pulse {
          animation: ring-pulse 2.4s ease-out infinite;
        }

        @keyframes signal-flow {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .signal-dot {
          animation: signal-flow 1.8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}