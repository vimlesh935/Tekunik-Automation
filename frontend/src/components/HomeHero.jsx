import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Play, X, Sun, Moon, Shield, Lightbulb, Thermometer, Camera, Zap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const DEMO_VIDEO_SRC = "/videos/finalvid.mp4";
const DEMO_VIDEO_POSTER = "/videos/demo-poster.jpg";

/* ------------------------------------------------------------------ */
/*  Demo video modal (unchanged behavior, colors adapt to theme)       */
/* ------------------------------------------------------------------ */
const DemoVideoModal = memo(function DemoVideoModal({ onClose, isDark }) {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setVideoSrc(DEMO_VIDEO_SRC);
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, []);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setIsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl aspect-video rounded-2xl border overflow-hidden shadow-2xl ${
          isDark ? "glass border-white/10" : "bg-white border-black/10"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors border border-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        <video
          ref={videoRef}
          src={videoSrc || undefined}
          poster={DEMO_VIDEO_POSTER}
          controls
          muted
          playsInline
          preload="metadata"
          onLoadStart={showLoader}
          onWaiting={showLoader}
          onStalled={showLoader}
          onLoadedMetadata={startPlayback}
          onCanPlay={hideLoader}
          onPlaying={hideLoader}
          className="w-full h-full object-cover"
        />
      </motion.div>
    </motion.div>
  );
});

/* ------------------------------------------------------------------ */
/*  Day / Night switch — styled like a real wall light-switch plate    */
/* ------------------------------------------------------------------ */
function DayNightSwitch({ isDark, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      onClick={onToggle}
      title={isDark ? "Flip to day mode" : "Flip to night mode"}
      className="relative w-11 h-[74px] rounded-2xl shrink-0 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      style={{
        background: "linear-gradient(180deg, #e8e9ec 0%, #cfd1d6 100%)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 2px rgba(0,0,0,0.15) inset, 0 3px 6px rgba(0,0,0,0.35)",
      }}
    >
      {/* top screw */}
      <span
        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #f4f4f4, #9a9a9a 70%)",
          boxShadow: "0 0.5px 1px rgba(0,0,0,0.5)",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-1.5 h-[1px] bg-black/40 rotate-45" />
        </span>
      </span>

      {/* recessed track */}
      <span
        className="absolute inset-x-1.5 top-5 bottom-5 rounded-lg"
        style={{
          background: "linear-gradient(180deg, #b9bbc0 0%, #dcdde0 50%, #b9bbc0 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35) inset",
        }}
      >
        {/* rocker cap */}
        <motion.span
          animate={{ top: isDark ? "calc(100% - 30px)" : "2px" }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          whileTap={{ scaleY: 0.92 }}
          className="absolute left-0.5 right-0.5 h-[30px] rounded-md flex items-center justify-center"
          style={{
            background: isDark
              ? "linear-gradient(180deg, #4b5566 0%, #262c37 55%, #1b1f27 100%)"
              : "linear-gradient(180deg, #fff6df 0%, #ffd873 55%, #f5b942 100%)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.5) inset, 0 -2px 3px rgba(0,0,0,0.25) inset, 0 2px 3px rgba(0,0,0,0.4)",
          }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-200" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-700" />
          )}
        </motion.span>
      </span>

      {/* bottom screw */}
      <span
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #f4f4f4, #9a9a9a 70%)",
          boxShadow: "0 0.5px 1px rgba(0,0,0,0.5)",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-1.5 h-[1px] bg-black/40 -rotate-45" />
        </span>
      </span>

      {/* glow indicator under the plate, reflects live state */}
      <motion.span
        aria-hidden
        animate={{
          backgroundColor: isDark ? "rgba(129,140,248,0.55)" : "rgba(245,185,66,0.7)",
          boxShadow: isDark
            ? "0 0 8px 2px rgba(129,140,248,0.55)"
            : "0 0 10px 3px rgba(245,185,66,0.7)",
        }}
        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Rotating "room" carousel — cycles through what Automate controls   */
/* ------------------------------------------------------------------ */
const ROOM_STATES = [
  { key: "security", label: "Security", detail: "All systems armed & secure.", icon: Shield, dot: "bg-green-500" },
  { key: "lighting", label: "Lighting", detail: "12 fixtures dimmed to 40%.", icon: Lightbulb, dot: "bg-amber-400" },
  { key: "climate", label: "Climate", detail: "Living room holding at 72°F.", icon: Thermometer, dot: "bg-sky-400" },
  { key: "cameras", label: "Cameras", detail: "4 feeds live, no motion.", icon: Camera, dot: "bg-violet-400" },
];

function RoomCarousel({ isDark }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROOM_STATES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const current = ROOM_STATES[index];
  const Icon = current.icon;

  return (
    <motion.div
      animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className={`absolute -left-12 bottom-1/4 w-44 p-4 rounded-2xl border shadow-xl overflow-hidden ${
        isDark ? "glass border-white/20" : "bg-white/90 border-black/10"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? "bg-white/10" : "bg-black/5"
            }`}>
              <Icon className={`w-4 h-4 ${isDark ? "text-white" : "text-slate-700"}`} />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${current.dot}`} />
            </div>
            <span className="text-sm font-semibold">{current.label}</span>
          </div>
          <p className={`text-xs ${isDark ? "text-text-secondary" : "text-slate-500"}`}>
            {current.detail}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-1.5 mt-3">
        {ROOM_STATES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Show ${s.label}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index
                ? "w-5 bg-primary"
                : isDark
                ? "w-1.5 bg-white/25"
                : "w-1.5 bg-black/15"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signature CTA — animated conic-gradient border, orbiting spark     */
/* ------------------------------------------------------------------ */
function AutomateButton() {
  return (
    <Link
      to="/smart-home-planner"
      className="group relative w-full sm:w-auto p-[2px] rounded-xl overflow-hidden cursor-pointer inline-block"
    >
      <motion.span
        aria-hidden
        className="absolute inset-[-40%]"
        style={{
          background:
            "conic-gradient(from 0deg, var(--tw-color-primary, #6366f1), var(--tw-color-highlight, #f472b6), var(--tw-color-secondary, #22d3ee), var(--tw-color-primary, #6366f1))",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative flex items-center justify-center gap-2 w-full h-full px-8 py-4 rounded-[10px] bg-background text-white font-semibold transition-transform duration-300 group-hover:-translate-y-0.5">
        <Zap className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
        Automate My Home
        <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                       */
/* ------------------------------------------------------------------ */
export default function HeroSection() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const openVideo = useCallback(() => setIsVideoOpen(true), []);
  const closeVideo = useCallback(() => setIsVideoOpen(false), []);

  return (
    <section
      className={`relative min-h-screen flex items-center justify-center overflow-hidden pt-20 transition-colors duration-500 ${
        isDark ? "bg-background text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Background gradients */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${
          isDark ? "from-primary/20 via-background to-background opacity-100" : "from-primary/10 via-slate-50 to-slate-50 opacity-100"
        }`}
      />

      {/* Animated glowing blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: isDark ? [0.3, 0.5, 0.3] : [0.15, 0.25, 0.15],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: isDark ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1],
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/30 rounded-full blur-[120px] z-0"
      />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          {/* Badge row + day/night switch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8"
          >
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                isDark ? "glass border-primary/30 text-primary" : "bg-white border-primary/30 shadow-sm"
              }`}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className={`text-sm font-medium ${isDark ? "" : "text-slate-900"}`}>
                New: Automate Hub Pro Available
              </span>
            </div>

            <DayNightSwitch isDark={isDark} onToggle={toggleTheme} />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Smart Living <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-highlight">
              Starts Here
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 ${
              isDark ? "text-text-secondary" : "text-slate-600"
            }`}
          >
            Control your lights, security, doors, curtains, cameras, and appliances from anywhere. Experience the future of home automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <AutomateButton />
            <button
              type="button"
              onClick={openVideo}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isDark
                  ? "glass text-white border-white/20 hover:bg-white/10"
                  : "bg-white text-slate-900 border-black/10 hover:bg-slate-100"
              }`}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="relative h-[600px] hidden lg:block"
        >
          {/* Dashboard Image */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? "glass border-white/10" : "bg-white border-black/10"
            }`}
          >
            <img
              src="/assest/hero-dashboard.png"
              alt="Automate Dashboard Mockup"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            {!isDark && (
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            )}
          </motion.div>

          <RoomCarousel isDark={isDark} />
        </motion.div>
      </div>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {isVideoOpen && <DemoVideoModal onClose={closeVideo} isDark={isDark} />}
      </AnimatePresence>
    </section>
  );
}