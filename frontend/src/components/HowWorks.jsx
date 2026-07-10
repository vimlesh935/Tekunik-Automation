"use client";

import { motion } from "framer-motion";
import { PackageSearch, Wrench, SmartphoneNfc, Sparkles } from "lucide-react";

/**
 * Signature concept
 * ------------------
 * This is an electronics-install service, so the "how it works" path is drawn
 * as a signal trace on a circuit board rather than a generic gradient line:
 * square solder-pad nodes, right-angle ticks, a blinking status LED per
 * module, and corner brackets on each card like a schematic viewfinder.
 * The accent color runs cool -> warm across the four pads, mirroring the
 * emotional arc of the copy itself: technical setup cooling down into a
 * warm, "enjoy smart living" finish.
 */

const steps = [
  {
    id: 1,
    code: "P01",
    title: "Choose Device",
    desc: "Select from our premium range.",
    icon: PackageSearch,
    accent: "56, 189, 248", // sky
  },
  {
    id: 2,
    code: "P02",
    title: "Professional Installation",
    desc: "Expert setup with zero damage.",
    icon: Wrench,
    accent: "139, 92, 246", // violet
  },
  {
    id: 3,
    code: "P03",
    title: "Connect Mobile App",
    desc: "Sync devices seamlessly.",
    icon: SmartphoneNfc,
    accent: "217, 70, 239", // fuchsia
  },
  {
    id: 4,
    code: "P04",
    title: "Enjoy Smart Living",
    desc: "Experience true automation.",
    icon: Sparkles,
    accent: "251, 191, 36", // amber
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Ambient board glow, sweeping cool to warm behind the trace */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 h-64 opacity-[0.08] blur-[100px] sm:h-80 sm:blur-[130px]"
        style={{
          background:
            "linear-gradient(90deg, rgb(56,189,248), rgb(139,92,246), rgb(217,70,239), rgb(251,191,36))",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center sm:mb-20"
        >
          <span className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-text-secondary/70">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Installation Path
          </span>
          <h2 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl">How It Works</h2>
          <p className="px-4 text-sm text-text-secondary sm:text-base">
            Four simple steps to transform your home.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="relative"
        >
          {/* Vertical trace: default (mobile through tablet, single column) */}
          <div
            className="absolute left-6 top-4 bottom-4 w-px bg-border-color/50 lg:hidden"
            aria-hidden="true"
          >
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.15 }}
              style={{
                transformOrigin: "top",
                background:
                  "linear-gradient(180deg, rgb(56,189,248), rgb(139,92,246), rgb(217,70,239), rgb(251,191,36))",
              }}
              className="h-full w-full"
            />
          </div>

          {/* Horizontal trace: desktop, four across */}
          <div
            className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px -translate-y-1/2 bg-border-color/40 lg:block"
            aria-hidden="true"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.15 }}
              style={{
                transformOrigin: "left",
                background:
                  "linear-gradient(90deg, rgb(56,189,248), rgb(139,92,246), rgb(217,70,239), rgb(251,191,36))",
              }}
              className="h-full w-full"
            />
            {/* travelling current pulse */}
            <motion.span
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{
                background: "white",
                boxShadow: "0 0 10px rgba(255,255,255,0.9), 0 0 22px rgba(139,92,246,0.7)",
              }}
              initial={{ left: "0%", opacity: 0 }}
              whileInView={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.15, times: [0, 0.08, 0.92, 1] }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-4 lg:gap-6">
            {steps.map((step) => (
              <motion.div
                key={step.id}
                variants={item}
                whileHover={{ y: -6 }}
                className="group relative flex items-start gap-5 pl-0 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
              >
                {/* solder-pad node on the trace */}
                <div className="relative z-10 flex-shrink-0 lg:mb-6">
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl border bg-background transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 lg:h-20 lg:w-20 lg:rounded-2xl"
                    style={{ borderColor: `rgba(${step.accent}, 0.35)` }}
                  >
                    {/* corner brackets, schematic-style */}
                    <span className="pad-corner pad-corner-tl" style={{ "--pc": step.accent }} />
                    <span className="pad-corner pad-corner-br" style={{ "--pc": step.accent }} />

                    {/* hover wash */}
                    <div
                      className="absolute -inset-2 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30 lg:-inset-3 lg:rounded-3xl"
                      style={{ background: `rgb(${step.accent})` }}
                      aria-hidden="true"
                    />

                    <step.icon
                      className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6 lg:h-8 lg:w-8"
                      style={{ color: `rgb(${step.accent})` }}
                      strokeWidth={1.75}
                    />

                    {/* status LED */}
                    <span
                      className="led absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full lg:h-3 lg:w-3"
                      style={{
                        "--led": step.accent,
                        background: `rgb(${step.accent})`,
                        animationDelay: `${step.id * 0.4}s`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="min-w-0 pt-0.5 lg:pt-0">
                  <div
                    className="mb-1 font-mono text-[10px] font-semibold tracking-[0.2em] sm:mb-1.5 sm:text-[11px]"
                    style={{ color: `rgb(${step.accent})` }}
                  >
                    {step.code}
                  </div>
                  <h3 className="mb-1 text-base font-bold sm:mb-2 sm:text-lg lg:text-xl">
                    {step.title}
                  </h3>
                  <p className="max-w-[240px] text-xs text-text-secondary sm:text-sm lg:mx-auto">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .pad-corner {
          position: absolute;
          width: 9px;
          height: 9px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .group:hover .pad-corner {
          opacity: 0.9;
        }
        .pad-corner-tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid rgba(var(--pc), 1);
          border-left: 2px solid rgba(var(--pc), 1);
          border-top-left-radius: 4px;
        }
        .pad-corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid rgba(var(--pc), 1);
          border-right: 2px solid rgba(var(--pc), 1);
          border-bottom-right-radius: 4px;
        }
        .led {
          box-shadow: 0 0 0 0 rgba(var(--led), 0.6);
          animation: led-blink 2.6s ease-in-out infinite;
        }
        @keyframes led-blink {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(var(--led), 0.55), 0 0 6px 1px rgba(var(--led), 0.8);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(var(--led), 0), 0 0 3px 0px rgba(var(--led), 0.4);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .led {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}