"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Lock, Unlock, Video, VideoOff } from "lucide-react";

/**
 * Signature concept
 * ------------------
 * "Your Home In Your Pocket" is a claim, not a demo — so this version makes
 * it one, entirely on the phone screen itself. Every card inside the mockup
 * IS the button — tapping it updates its own state, fires a push-style
 * notification that slides down the phone's screen, and sends a colored
 * shockwave pulse out through the section background, as if the action just
 * physically travelled from the device into the room.
 */

const controls = [
  {
    id: "lights",
    label: "Lights",
    onIcon: Lightbulb,
    offIcon: Lightbulb,
    accent: "251, 191, 36", // amber
    onText: "Lights turned on",
    offText: "Lights turned off",
  },
  {
    id: "doors",
    label: "Front Door",
    onIcon: Lock,
    offIcon: Unlock,
    accent: "34, 197, 94", // emerald
    onText: "Front door locked",
    offText: "Front door unlocked",
  },
  {
    id: "camera",
    label: "Living Room Cam",
    onIcon: Video,
    offIcon: VideoOff,
    accent: "244, 63, 94", // rose
    onText: "Camera feed resumed",
    offText: "Camera feed paused",
  },
];

export default function AppDownloadSection() {
  const [state, setState] = useState({ lights: true, doors: true, camera: true });
  const [toast, setToast] = useState(null);
  const [pulse, setPulse] = useState(null);
  const toastTimeoutRef = useRef(null);
  const pulseTimeoutRef = useRef(null);

  const toggle = (control) => {
    setState((prev) => {
      const next = !prev[control.id];
      const message = next ? control.onText : control.offText;
      const pulseId = `${control.id}-${Date.now()}`;

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ id: pulseId, message, accent: control.accent });
      toastTimeoutRef.current = setTimeout(() => setToast(null), 2200);

      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      setPulse({ id: pulseId, accent: control.accent });
      pulseTimeoutRef.current = setTimeout(() => setPulse(null), 1100);

      return { ...prev, [control.id]: next };
    });
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[150px] lg:right-1/4"
        aria-hidden="true"
      />

      {/* Shockwave: fires from the phone into the background on every tap */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
        <AnimatePresence>
          {pulse && (
            <motion.div
              key={pulse.id}
              initial={{ scale: 0, opacity: 0.55 }}
              animate={{ scale: 3.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="h-[280px] w-[280px] rounded-full blur-[60px] sm:h-[380px] sm:w-[380px]"
              style={{ background: `rgba(${pulse.accent}, 0.5)` }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + interactive controls */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-text-secondary/70">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Try it live
          </span>
          <h2 className="mb-5 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-5xl">
            Your Home In Your Pocket
          </h2>
         
          <p className="max-w-lg font-mono text-xs uppercase tracking-wide text-text-secondary/60">
            Tap the cards on the phone — every action here is live.
          </p>
        </motion.div>

        {/* Right: floating phone mockup, reactive to controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative flex h-[460px] items-center justify-center sm:h-[540px] lg:h-[600px] lg:justify-end"
        >
          <motion.div
            animate={{ y: [-12, 12, -12] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-[440px] w-[220px] flex-col overflow-hidden rounded-[2.5rem] border-[6px] border-white/10 bg-black shadow-[0_0_50px_rgba(59,130,246,0.3)] sm:h-[520px] sm:w-[260px] sm:rounded-[3rem] sm:border-[8px] lg:h-[580px] lg:w-[280px]"
          >
            {/* Notch */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-5 justify-center sm:h-6">
              <div className="h-full w-1/3 rounded-b-xl bg-black" />
            </div>

            {/* Notification toast, slides down inside the screen */}
            <div className="absolute inset-x-2 top-7 z-30 sm:inset-x-3 sm:top-8">
              <AnimatePresence>
                {toast && (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="glass flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2"
                  >
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: `rgb(${toast.accent})` }}
                    />
                    <p className="truncate text-[11px] font-medium text-white sm:text-xs">
                      {toast.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Screen UI */}
            <div className="flex-1 bg-gradient-to-b from-background to-background-secondary p-4 pt-10 sm:p-6 sm:pt-12">
              <div className="mb-6 flex items-center justify-between sm:mb-8">
                <div>
                  <p className="text-[10px] text-text-secondary sm:text-xs">Welcome home,</p>
                  <p className="text-sm font-bold sm:text-base">Sarah</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 sm:h-10 sm:w-10">
                  <div className="h-3 w-3 rounded-full bg-primary sm:h-4 sm:w-4" />
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4">
                {/* Lights card — tappable */}
                <motion.button
                  type="button"
                  onClick={() => toggle(controls[0])}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    borderColor: state.lights
                      ? `rgba(${controls[0].accent}, 0.4)`
                      : "rgba(255,255,255,0.05)",
                    background: state.lights
                      ? `rgba(${controls[0].accent}, 0.08)`
                      : "rgba(255,255,255,0.03)",
                  }}
                  className="flex h-20 flex-col justify-between rounded-2xl border p-2.5 text-left sm:h-24 sm:p-3"
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8"
                    style={{
                      background: state.lights
                        ? `rgba(${controls[0].accent}, 0.25)`
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Lightbulb
                      className="h-3 w-3 sm:h-4 sm:w-4"
                      style={{ color: state.lights ? `rgb(${controls[0].accent})` : "#64748b" }}
                    />
                  </div>
                  <p className="text-xs font-medium sm:text-sm">
                    Lights {state.lights ? "On" : "Off"}
                  </p>
                </motion.button>

                {/* Doors card — tappable */}
                <motion.button
                  type="button"
                  onClick={() => toggle(controls[1])}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    borderColor: state.doors
                      ? `rgba(${controls[1].accent}, 0.4)`
                      : "rgba(239, 68, 68, 0.35)",
                    background: state.doors
                      ? `rgba(${controls[1].accent}, 0.08)`
                      : "rgba(239, 68, 68, 0.08)",
                  }}
                  className="flex h-20 flex-col justify-between rounded-2xl border p-2.5 text-left sm:h-24 sm:p-3"
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8"
                    style={{
                      background: state.doors
                        ? `rgba(${controls[1].accent}, 0.25)`
                        : "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    {state.doors ? (
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: `rgb(${controls[1].accent})` }} />
                    ) : (
                      <Unlock className="h-3 w-3 text-red-400 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <p className="text-xs font-medium sm:text-sm">
                    Doors {state.doors ? "Locked" : "Unlocked"}
                  </p>
                </motion.button>
              </div>

              {/* Camera panel — tappable */}
              <motion.button
                type="button"
                onClick={() => toggle(controls[2])}
                whileTap={{ scale: 0.97 }}
                animate={{
                  borderColor: state.camera
                    ? `rgba(${controls[2].accent}, 0.3)`
                    : "rgba(255,255,255,0.08)",
                }}
                className="relative block h-32 w-full overflow-hidden rounded-2xl border p-3.5 text-left sm:h-40 sm:p-4"
                style={{
                  background: state.camera
                    ? `linear-gradient(135deg, rgba(${controls[2].accent},0.18), transparent)`
                    : "rgba(255,255,255,0.02)",
                }}
              >
                {state.camera && (
                  <div
                    className="absolute inset-0 bg-cover mix-blend-overlay opacity-40"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')",
                    }}
                  />
                )}
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium sm:text-sm">Living Room Cam</p>
                    {state.camera ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-300 sm:text-[10px]">
                          Live
                        </span>
                      </span>
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-text-secondary" />
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary sm:text-xs">
                    {state.camera ? "4K · Streaming" : "Feed paused"}
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Decorative floating orbs */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -right-6 top-1/4 h-16 w-16 rounded-full bg-primary/20 blur-2xl sm:-right-10 sm:h-24 sm:w-24"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute -left-6 bottom-1/4 h-20 w-20 rounded-full bg-secondary/20 blur-2xl sm:-left-10 sm:h-32 sm:w-32"
          />
        </motion.div>
      </div>
    </section>
  );
}