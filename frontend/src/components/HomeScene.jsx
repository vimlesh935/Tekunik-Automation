"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, MoonStar, Plane, Film, Play, Check, Zap } from "lucide-react";

const scenes = [
  {
    title: "Morning Mode",
    desc: "Curtains open, coffee machine starts, and gentle lights turn on.",
    icon: Sunrise,
    gradient: "from-orange-500 to-yellow-500",
    accent: "249, 115, 22",   // orange-500
    accent2: "234, 179, 8",   // yellow-500
    steps: ["Curtains open", "Coffee brews", "Lights fade in"],
  },
  {
    title: "Good Night",
    desc: "Doors lock, lights dim, and AC sets to optimal sleep temperature.",
    icon: MoonStar,
    gradient: "from-indigo-500 to-purple-500",
    accent: "99, 102, 241",   // indigo-500
    accent2: "168, 85, 247",  // purple-500
    steps: ["Doors lock", "Lights dim", "AC sets to sleep temp"],
  },
  {
    title: "Vacation Mode",
    desc: "Randomized lighting and active security cameras for peace of mind.",
    icon: Plane,
    gradient: "from-emerald-500 to-teal-500",
    accent: "16, 185, 129",   // emerald-500
    accent2: "20, 184, 166",  // teal-500
    steps: ["Lighting randomizes", "Cameras arm", "Alerts enabled"],
  },
  {
    title: "Movie Mode",
    desc: "Curtains close, lights dim to 10%, and TV turns on instantly.",
    icon: Film,
    gradient: "from-rose-500 to-red-500",
    accent: "244, 63, 94",    // rose-500
    accent2: "239, 68, 68",   // red-500
    steps: ["Curtains close", "Lights dim to 10%", "TV powers on"],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.55 } },
};

// Fixed network topology for the background "running nodes" layer.
// Coordinates live in a 1000x420 space (see viewBox below).
const NODES = [
  { x: 70, y: 60 }, { x: 230, y: 110 }, { x: 400, y: 50 }, { x: 560, y: 130 },
  { x: 720, y: 70 }, { x: 900, y: 120 }, { x: 120, y: 220 }, { x: 300, y: 260 },
  { x: 480, y: 210 }, { x: 650, y: 270 }, { x: 820, y: 230 }, { x: 960, y: 280 },
  { x: 80, y: 360 }, { x: 260, y: 340 }, { x: 440, y: 380 }, { x: 620, y: 350 },
  { x: 780, y: 390 }, { x: 940, y: 355 },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [1, 6], [1, 7], [2, 7], [2, 8], [3, 8], [3, 9], [4, 9], [4, 10], [5, 10], [5, 11],
  [6, 7], [7, 8], [8, 9], [9, 10], [10, 11],
  [6, 12], [7, 13], [8, 14], [9, 15], [10, 16], [11, 17],
  [12, 13], [13, 14], [14, 15], [15, 16], [16, 17],
];

const PACKET_PATHS = [
  `M ${NODES[0].x} ${NODES[0].y} L ${NODES[6].x} ${NODES[6].y} L ${NODES[12].x} ${NODES[12].y}`,
  `M ${NODES[5].x} ${NODES[5].y} L ${NODES[11].x} ${NODES[11].y} L ${NODES[17].x} ${NODES[17].y}`,
  `M ${NODES[3].x} ${NODES[3].y} L ${NODES[9].x} ${NODES[9].y} L ${NODES[15].x} ${NODES[15].y}`,
  `M ${NODES[2].x} ${NODES[2].y} L ${NODES[8].x} ${NODES[8].y} L ${NODES[14].x} ${NODES[14].y}`,
];

// Gentle quadratic-bezier curve between two points instead of a hard straight line.
function curvedPath(x1, y1, x2, y2, bend) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function NodeNetwork({ accent }) {
  const gradId = "nodeGlow";
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 1000 420"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(${accent}, 0.95)`} />
          <stop offset="55%" stopColor={`rgba(${accent}, 0.35)`} />
          <stop offset="100%" stopColor={`rgba(${accent}, 0)`} />
        </radialGradient>
        <filter id="softBlur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="packetBlur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* soft curved connections */}
      <g style={{ transition: "stroke 0.8s ease" }}>
        {EDGES.map(([a, b], i) => (
          <path
            key={i}
            d={curvedPath(NODES[a].x, NODES[a].y, NODES[b].x, NODES[b].y, i % 2 === 0 ? 16 : -16)}
            fill="none"
            strokeLinecap="round"
            style={{ stroke: `rgba(${accent}, 0.16)`, transition: "stroke 0.8s ease" }}
            strokeWidth="1"
          />
        ))}
      </g>

      {/* nodes: soft blurred halo + crisp core, breathing gently */}
      {NODES.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={10}
            fill={`url(#${gradId})`}
            filter="url(#softBlur)"
            className="network-glow"
            style={{ animationDelay: `${(i % 7) * 0.4}s` }}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={i % 3 === 0 ? 2.2 : 1.5}
            style={{
              fill: `rgba(${accent}, 0.9)`,
              transition: "fill 0.8s ease",
            }}
          />
        </g>
      ))}

      {/* traveling packets — soft glow, eased motion */}
      {PACKET_PATHS.map((path, i) => (
        <g key={i}>
          <circle
            r="7"
            filter="url(#packetBlur)"
            style={{ fill: `rgba(${accent}, 0.55)`, transition: "fill 0.6s ease" }}
          >
            <animateMotion
              dur={`${5 + i * 0.9}s`}
              repeatCount="indefinite"
              path={path}
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            />
          </circle>
          <circle
            r="2.2"
            style={{ fill: `rgb(${accent})`, transition: "fill 0.6s ease" }}
          >
            <animateMotion
              dur={`${5 + i * 0.9}s`}
              repeatCount="indefinite"
              path={path}
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}


export default function ScenesSection() {
  const [activeIdx, setActiveIdx] = useState(1); // "Good Night" active by default
  const active = scenes[activeIdx];

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Ambient glow crossfades to the active scene's palette */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] blur-[100px] sm:blur-[150px] rounded-full"
          style={{ background: `rgba(${active.accent}, 0.16)` }}
        />
      </AnimatePresence>
      <div className="absolute bottom-0 left-0 w-[220px] h-[220px] sm:w-[400px] sm:h-[400px] bg-primary/10 blur-[100px] sm:blur-[130px] rounded-full" />

      {/* Running node network — reacts to the selected scene */}
      <NodeNetwork accent={active.accent} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Automation Scenes</h2>
          <p className="text-text-secondary text-sm sm:text-base max-w-2xl mx-auto px-2">
            Create custom scenes to trigger multiple actions with a single tap or voice command.
          </p>

          {/* Live active-scene readout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 mt-5 sm:mt-6 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-medium"
              style={{
                borderColor: `rgba(${active.accent}, 0.35)`,
                background: `rgba(${active.accent}, 0.08)`,
                color: `rgb(${active.accent})`,
              }}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="uppercase tracking-wide">Active — {active.title}</span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {scenes.map((scene, idx) => {
            const isActive = idx === activeIdx;
            return (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveIdx(idx)}
                className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden group border transition-colors cursor-pointer"
                style={{
                  borderColor: isActive ? `rgba(${scene.accent}, 0.45)` : "rgba(255,255,255,0.08)",
                }}
              >
                {/* Layout-animated highlight ring — glides between cards on selection */}
                {isActive && (
                  <motion.div
                    layoutId="scene-active-ring"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{ boxShadow: `0 0 0 1.5px rgba(${scene.accent}, 0.55), 0 12px 32px -12px rgba(${scene.accent}, 0.45)` }}
                  />
                )}

                <div
                  className={`absolute top-0 right-0 w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br ${scene.gradient} blur-3xl transition-opacity`}
                  style={{ opacity: isActive ? 0.4 : 0.15 }}
                />

                <div className="relative flex items-center justify-between mb-6 sm:mb-8">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${scene.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <scene.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ color: `rgb(${scene.accent})`, background: `rgba(${scene.accent}, 0.12)` }}
                      >
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Active
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <h3 className="relative text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  {scene.title}
                </h3>
                <p className="relative text-xs sm:text-sm text-text-secondary leading-relaxed mb-5 sm:mb-6">
                  {scene.desc}
                </p>

                {/* Automation execution chain */}
                <div className="relative flex flex-col gap-2 mb-6 sm:mb-7">
                  {scene.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-center gap-2.5">
                      <span
                        className="flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full shrink-0 transition-all duration-300"
                        style={{
                          background: isActive ? `rgb(${scene.accent})` : "transparent",
                          border: `1.5px solid ${isActive ? `rgb(${scene.accent})` : "rgba(255,255,255,0.2)"}`,
                          transitionDelay: isActive ? `${stepIdx * 0.18}s` : "0s",
                        }}
                      >
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: stepIdx * 0.18 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </motion.span>
                        )}
                      </span>
                      <span
                        className={`text-[11px] sm:text-xs transition-colors duration-300 ${isActive ? "text-text-primary" : "text-text-secondary/70"}`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(idx);
                  }}
                  className="relative w-full flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-xl border transition-colors"
                  style={
                    isActive
                      ? { background: `rgb(${scene.accent})`, borderColor: `rgb(${scene.accent})`, color: "white" }
                      : { borderColor: "rgba(255,255,255,0.15)", color: "var(--text-secondary, #94a3b8)" }
                  }
                >
                  {isActive ? (
                    <>
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Running
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Activate
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 0.85; transform: scale(1.3); }
        }
        :global(.network-glow) {
          animation: glow-breathe 3.6s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
      `}</style>
    </section>
  );
}