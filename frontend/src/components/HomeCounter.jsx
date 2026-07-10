"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Home, Layers, PackageCheck, ShieldCheck } from "lucide-react";

/**
 * Signature concept
 * ------------------
 * These numbers are the output of an automation pipeline, so the section is
 * built as a live flow: four metric nodes sit on a single continuous line,
 * with small "data packets" animating through it forever (not once), the
 * same way telemetry would stream across a real system dashboard. Each node
 * carries its own accent + icon, matching the circuit/HUD language used
 * elsewhere on the page (corner brackets, mono eyebrow tags, status dots).
 */

const stats = [
  {
    value: 10000,
    label: "Homes Automated",
    suffix: "+",
    icon: Home,
    accent: "56, 189, 248", // sky
  },
  {
    value: 500,
    label: "Projects",
    suffix: "+",
    icon: Layers,
    accent: "139, 92, 246", // violet
  },
  {
    value: 25,
    label: "Products",
    suffix: "+",
    icon: PackageCheck,
    accent: "217, 70, 239", // fuchsia
  },
  {
    value: 99,
    label: "Customer Satisfaction",
    suffix: "%",
    icon: ShieldCheck,
    accent: "251, 191, 36", // amber
  },
];

function Counter({ from, to, suffix }) {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (inView) {
      let startTimestamp = null;
      const duration = 2000;

      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * (to - from) + from));
        if (progress < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    }
  }, [inView, from, to]);

  return (
    <span ref={nodeRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[220px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[120px] sm:h-[300px] sm:blur-[150px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-center justify-center gap-2 sm:mb-16"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-secondary/70">
            Live automation output
          </span>
        </motion.div>

        <div className="relative">
          {/* Flow line: desktop only, connecting all four nodes */}
          <div
            className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px overflow-hidden bg-border-color/40 md:block"
            aria-hidden="true"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{
                transformOrigin: "left",
                background:
                  "linear-gradient(90deg, rgb(56,189,248), rgb(139,92,246), rgb(217,70,239), rgb(251,191,36))",
              }}
              className="h-full w-full"
            />

            {/* continuous data packets streaming through the pipeline */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white"
                style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.7)" }}
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 3,
                  ease: "linear",
                  repeat: Infinity,
                  delay: i * 1,
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 md:gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.5, type: "spring" }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col items-center text-center"
              >
                {/* node icon on the pipeline */}
                <div
                  className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-background sm:h-14 sm:w-14"
                  style={{ borderColor: `rgba(${stat.accent}, 0.35)` }}
                >
                  <span
                    className="corner corner-tl"
                    style={{ "--c": stat.accent }}
                  />
                  <span
                    className="corner corner-br"
                    style={{ "--c": stat.accent }}
                  />
                  <div
                    className="absolute -inset-2 rounded-2xl opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-30"
                    style={{ background: `rgb(${stat.accent})` }}
                    aria-hidden="true"
                  />
                  <stat.icon
                    className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6"
                    style={{ color: `rgb(${stat.accent})` }}
                    strokeWidth={1.75}
                  />
                </div>

                <div
                  className="mb-2 text-3xl font-bold sm:mb-3 sm:text-5xl md:text-6xl"
                  style={{
                    color: `rgb(${stat.accent})`,
                    filter: `drop-shadow(0 0 16px rgba(${stat.accent}, 0.35))`,
                  }}
                >
                  <Counter from={0} to={stat.value} suffix={stat.suffix} />
                </div>

                <p className="max-w-[120px] text-[11px] font-medium uppercase tracking-wider text-text-secondary sm:max-w-none sm:text-sm">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .corner {
          position: absolute;
          width: 8px;
          height: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .group:hover .corner {
          opacity: 0.9;
        }
        .corner-tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid rgba(var(--c), 1);
          border-left: 2px solid rgba(var(--c), 1);
          border-top-left-radius: 4px;
        }
        .corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid rgba(var(--c), 1);
          border-right: 2px solid rgba(var(--c), 1);
          border-bottom-right-radius: 4px;
        }
      `}</style>
    </section>
  );
}
