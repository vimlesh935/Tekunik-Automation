"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Thermometer, Blinds, Lock, Video, CalendarClock } from "lucide-react";

/**
 * Signature concept
 * ------------------
 * The left panel is framed as a live device readout — not just a photo, but
 * a HUD: corner viewfinder brackets, a scanning sweep, and a status line
 * that updates with real values per control (78% brightness, 24°C, etc).
 * On the right, a shared layoutId accent bar physically slides between
 * whichever control is active, so selection feels like routing power on a
 * panel rather than a CSS hover state.
 */

const controlsData = [
  {
    id: "lights",
    label: "Control Lights",
    icon: Lightbulb,
    image:
      "https://i.pinimg.com/1200x/75/3b/61/753b619c49e1b03e2ed4fab126353551.jpg",
    status: "ON",
    meta: "78% brightness",
    accent: "251, 191, 36", // amber
  },
  {
    id: "ac",
    label: "Control AC",
    icon: Thermometer,
    image: "https://i.pinimg.com/736x/f1/fc/71/f1fc7139c996e652d8653a0f926dfcad.jpg",
    status: "24°C",
    meta: "Auto mode",
    accent: "56, 189, 248", // sky
  },
  {
    id: "curtains",
    label: "Control Curtains",
    icon: Blinds,
    image: "https://i.pinimg.com/736x/a5/66/6a/a5666a9b5716d120a688f2a81534215f.jpg",
    status: "60%",
    meta: "Open · east side",
    accent: "139, 92, 246", // violet
  },
  {
    id: "doors",
    label: "Control Door Locks",
    icon: Lock,
    image: "https://i.pinimg.com/736x/8e/cd/1c/8ecd1c9f6d479fd2627a65bae3ba9921.jpg",
    status: "LOCKED",
    meta: "Front door secure",
    accent: "34, 197, 94", // emerald
  },
  {
    id: "cameras",
    label: "Monitor Cameras",
    icon: Video,
    image: "https://i.pinimg.com/736x/ef/7e/75/ef7e75094f49be1ca257ba4b2b92eef7.jpg",
    status: "LIVE",
    meta: "4 cameras streaming",
    accent: "244, 63, 94", // rose
  },
  {
    id: "schedule",
    label: "Schedule Automation",
    icon: CalendarClock,
    image:
      "https://i.pinimg.com/1200x/9a/0c/ad/9a0cad3b73d108da0795a4ee72803fb5.jpg",
    status: "3",
    meta: "Automations active",
    accent: "217, 70, 239", // fuchsia
  },
];

export default function ExperienceSection() {
  const [activeTab, setActiveTab] = useState(controlsData[0]);
  const isCam = activeTab.id === "cameras";

  return (
    <section className="overflow-hidden border-y border-border-color bg-background-secondary py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left: live HUD device frame */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative h-[380px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 sm:h-[460px] md:h-[560px]"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeTab.id}
              src={activeTab.image}
              alt={activeTab.label}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent" />

          {/* scanning sweep */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-24 opacity-30"
            style={{
              background: `linear-gradient(180deg, transparent, rgba(${activeTab.accent},0.5), transparent)`,
            }}
            initial={{ top: "-10%" }}
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
          />

          {/* viewfinder corner brackets */}
          {[
            "top-5 left-5 border-t-2 border-l-2 rounded-tl-lg",
            "top-5 right-5 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-5 left-5 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-5 right-5 border-b-2 border-r-2 rounded-br-lg",
          ].map((pos, i) => (
            <span
              key={i}
              className={`absolute h-5 w-5 ${pos}`}
              style={{ borderColor: `rgba(${activeTab.accent}, 0.7)` }}
            />
          ))}

          {/* eyebrow tag */}
          <div className="absolute left-5 top-5 flex items-center gap-2 sm:left-8 sm:top-8">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: `rgb(${activeTab.accent})`,
                boxShadow: `0 0 8px 1px rgba(${activeTab.accent},0.8)`,
              }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
              {isCam ? "Live feed" : "Live status"}
            </span>
          </div>

          {/* readout panel */}
          <div className="absolute inset-x-4 bottom-4 z-10 sm:inset-x-8 sm:bottom-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="glass flex items-center justify-between rounded-2xl border border-white/15 p-4 sm:p-6"
              >
                <div className="min-w-0">
                  <h4 className="mb-0.5 truncate text-base font-bold sm:mb-1 sm:text-xl">
                    {activeTab.label}
                  </h4>
                  <p className="truncate text-xs text-text-secondary sm:text-sm">
                    {activeTab.meta}
                  </p>
                </div>
                <div
                  className="ml-3 flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm"
                  style={{
                    borderColor: `rgba(${activeTab.accent}, 0.4)`,
                    color: `rgb(${activeTab.accent})`,
                    background: `rgba(${activeTab.accent}, 0.08)`,
                  }}
                >
                  {isCam && (
                    <span
                      className="h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: `rgb(${activeTab.accent})` }}
                    />
                  )}
                  {activeTab.status}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: copy + control grid */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-text-secondary/70">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            The Automate App
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">
            Smart Home Experience
          </h2>
          <p className="mb-8 text-base text-text-secondary sm:mb-10 sm:text-lg">
            Manage your entire home from a single intuitive interface. The
            Automate app gives you unprecedented control and insight into
            your living space.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {controlsData.map((item, idx) => {
              const isActive = activeTab.id === item.id;

              return (
                <motion.button
                  type="button"
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setActiveTab(item)}
                  onFocus={() => setActiveTab(item)}
                  onClick={() => setActiveTab(item)}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 text-left transition-colors ${
                    isActive
                      ? "border-transparent text-white"
                      : "glass border-transparent text-text-secondary hover:text-white hover:border-white/20"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-control-bg"
                      transition={{ type: "spring", stiffness: 350, damping: 32 }}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `rgba(${item.accent}, 0.12)`,
                        boxShadow: `0 0 0 1px rgba(${item.accent}, 0.5), 0 0 18px -4px rgba(${item.accent},0.5)`,
                      }}
                    />
                  )}

                  <span
                    className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{
                      background: isActive
                        ? `rgba(${item.accent}, 0.15)`
                        : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <item.icon
                      className="h-5 w-5"
                      style={{ color: isActive ? `rgb(${item.accent})` : undefined }}
                    />
                  </span>

                  <span className="relative z-10 truncate font-medium">
                    {item.label}
                  </span>

                  {isActive && (
                    <motion.span
                      layoutId="active-control-dot"
                      className="relative z-10 ml-auto h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        background: `rgb(${item.accent})`,
                        boxShadow: `0 0 8px 1px rgba(${item.accent},0.8)`,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}