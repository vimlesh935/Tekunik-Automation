import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Play, X } from "lucide-react";

const DEMO_VIDEO_SRC = "/videos/finalvid.mp4";
const DEMO_VIDEO_POSTER = "/videos/demo-poster.jpg";

const DemoVideoModal = memo(function DemoVideoModal({ onClose }) {
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

  const showLoader = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      setIsLoading(false);
    });
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
        className="relative w-full max-w-4xl aspect-video glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
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

export default function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const openVideo = useCallback(() => setIsVideoOpen(true), []);
  const closeVideo = useCallback(() => setIsVideoOpen(false), []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0"></div>

      {/* Animated glowing blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary mb-8"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">New: Automate Hub Pro Available</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Smart Living <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-highlight">
              Starts Here
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto lg:mx-0">
            Control your lights, security, doors, curtains, cameras, and appliances from anywhere. Experience the future of home automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <a href="/shop" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-background font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group cursor-pointer">
              Explore Products
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              type="button"
              onClick={openVideo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
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
            className="absolute inset-0 glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <img
              src="/assest/hero-dashboard.png"
              alt="Automate Dashboard Mockup"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -left-12 bottom-1/4 w-40 p-4 glass rounded-2xl border border-white/20 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm font-semibold">Security</span>
            </div>
            <p className="text-xs text-text-secondary">All systems armed & secure.</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {isVideoOpen && <DemoVideoModal onClose={closeVideo} />}
      </AnimatePresence>
    </section>
  );
}
