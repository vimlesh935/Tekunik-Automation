import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Headphones, Award, Users, Package,
  Truck, Clock, ChevronLeft, ChevronRight, Star,
  Building2, Home, Hotel, GraduationCap, Factory, Wifi,
  Lock, Cpu, SlidersHorizontal, Thermometer, ArrowRight, Quote
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Rajesh Mehta",
    role: "Facility Manager, ITC Hotels",
    text: "Tek Node transformed our hotel's energy management. Smart switches and sensors cut our electricity costs by 32% in the first quarter.",
    rating: 5,
    avatar: "RM",
  },
  {
    name: "Priya Sharma",
    role: "Homeowner, Pune",
    text: "The digital locks and smart knobs gave our home a premium feel at a very reasonable price. Installation was seamless with their guidance.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Aditya Kulkarni",
    role: "IT Head, Symbiosis University",
    text: "We deployed Tek Node's gateway systems across 3 campuses. Reliability and support have been outstanding — zero downtime in 18 months.",
    rating: 5,
    avatar: "AK",
  },
  {
    name: "Sneha Iyer",
    role: "Interior Designer, Mumbai",
    text: "My clients love the smart knobs and switches. The sleek design integrates perfectly with modern interiors. My go-to automation partner.",
    rating: 5,
    avatar: "SI",
  },
  {
    name: "Vikram Nair",
    role: "Operations Director, Motherson Group",
    text: "Industrial-grade reliability with consumer-friendly controls. Tek Node's automation solutions streamlined our factory floor operations remarkably.",
    rating: 5,
    avatar: "VN",
  },
];

const PRODUCTS = [
  { icon: Zap, label: "Smart Switches", desc: "Touch-enabled, app-controlled" },
  { icon: Lock, label: "Digital Locks", desc: "Fingerprint, PIN & card access" },
  { icon: Wifi, label: "Gateways", desc: "Unified home network hubs" },
  { icon: Thermometer, label: "Sensors", desc: "Motion, temp & humidity" },
  { icon: SlidersHorizontal, label: "Smart Knobs", desc: "Rotary dimmer controls" },
  { icon: Cpu, label: "Control Systems", desc: "Central intelligence units" },
];

const MARKETS = [
  { icon: Home, label: "Homes" },
  { icon: Building2, label: "Offices" },
  { icon: Hotel, label: "Hotels" },
  { icon: GraduationCap, label: "Education" },
  { icon: Factory, label: "Industrial" },
  { icon: Shield, label: "Healthcare" },
];

const WHY_US = [
  { icon: Package, title: "Premium Quality", desc: "Rigorously tested components engineered to outlast industry standards." },
  { icon: Zap, title: "Advanced Automation", desc: "Cutting-edge AI-ready tech that evolves with your space." },
  { icon: Shield, title: "Enterprise Security", desc: "Military-grade encryption on every connected device." },
  { icon: Headphones, title: "Always-On Support", desc: "Dedicated engineers available around the clock, every day." },
  { icon: Award, title: "Expert Guidance", desc: "White-glove installation and post-setup maintenance support." },
  { icon: Users, title: "10K+ Community", desc: "A growing family of homes and businesses that trust Tek Node." },
];

const STATS = [
  { icon: Package, value: "500+", label: "Products" },
  { icon: Users, value: "10K+", label: "Customers" },
  { icon: Truck, value: "25K+", label: "Deliveries" },
  { icon: Clock, value: "24/7", label: "Support" },
];

const TIMELINE = [
  { year: "2018", title: "Founded", desc: "Started with a vision to make smart homes accessible to every Indian household." },
  { year: "2020", title: "Expanded", desc: "Launched B2B vertical serving hotels, hospitals, and campuses across India." },
  { year: "2022", title: "10K Milestone", desc: "Crossed 10,000 happy customers and 25,000 successful deployments." },
  { year: "2024", title: "Next Gen", desc: "Introduced AI-powered control systems and entered international markets." },
];

// ─── TESTIMONIAL CAROUSEL ─────────────────────────────────────────────────────

function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const total = TESTIMONIALS.length;

  const go = (next) => {
    setDir(next > active ? 1 : -1);
    setActive((next + total) % total);
  };

  useEffect(() => {
    const id = setInterval(() => go(active + 1), 5000);
    return () => clearInterval(id);
  }, [active]);

  const variants = {
    enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const t = TESTIMONIALS[active];

  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">What Our Clients Say</h2>
        </div>

        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* decorative glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <Quote size={48} className="text-indigo-500/20 absolute top-8 right-8" />

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={active}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 italic">
                "{t.text}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-black text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => go(active - 1)}
              className="w-10 h-10 rounded-full border border-slate-700 hover:border-indigo-500/50 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`rounded-full transition-all duration-300 ${i === active ? "w-6 h-2 bg-indigo-500" : "w-2 h-2 bg-slate-700 hover:bg-slate-500"}`}
                />
              ))}
            </div>
            <button
              onClick={() => go(active + 1)}
              className="w-10 h-10 rounded-full border border-slate-700 hover:border-indigo-500/50 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PRODUCT CAROUSEL ─────────────────────────────────────────────────────────

function ProductCarousel() {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  return (
    <section className="py-24 bg-slate-900/30 border-y border-slate-800/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Product Range</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Built for Every Space</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canLeft}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${canLeft ? "border-slate-600 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400" : "border-slate-800 text-slate-700 cursor-not-allowed"}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canRight}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${canRight ? "border-slate-600 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400" : "border-slate-800 text-slate-700 cursor-not-allowed"}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="min-w-[220px] bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col gap-4 cursor-pointer group flex-shrink-0"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                <p.icon size={24} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm mb-1">{p.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PARALLAX HERO ────────────────────────────────────────────────────────────

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/25 via-slate-950 to-slate-950" />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]"
        />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-10"
        >
          <Zap size={14} />
          <span className="text-xs font-black uppercase tracking-widest">Smart Automation</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none"
        >
          About{" "}
          <span className="relative inline-block">
            <span className="text-indigo-400">Tek Node</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-indigo-500/50 rounded-full origin-left"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12"
        >
          Empowering Homes and Businesses with Smart Automation Solutions across India and beyond.
        </motion.p>

        {/* Mini stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="inline-flex flex-wrap justify-center gap-6 sm:gap-10 bg-slate-900/60 border border-slate-800 rounded-2xl px-8 py-5 backdrop-blur-sm"
        >
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
      </motion.div>
    </section>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

function Timeline() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">Our Journey</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">How We Got Here</h2>
        </div>

        <div className="relative">
          {/* vertical line — desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2" />

          <div className="flex flex-col gap-10">
            {TIMELINE.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                {/* Card */}
                <div className={`w-full md:w-5/12 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 transition-all ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">{item.year}</p>
                  <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>

                {/* Dot */}
                <div className="hidden md:flex w-2/12 justify-center">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 shrink-0" />
                </div>

                <div className="hidden md:block w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WHO WE ARE ───────────────────────────────────────────────────────────────

function WhoWeAre() {
  return (
    <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
              Innovating the Future<br />of Smart Living
            </h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              Tek Node specializes in smart automation products — smart switches, digital locks, gateways, sensors, smart knobs, and intelligent control systems — designed for homes, offices, hotels, hospitals, educational institutions, and industrial environments.
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              Our commitment to quality and innovation has made us a trusted name in the automation industry, delivering solutions that genuinely transform how people live and work.
            </p>

            {/* Market tags */}
            <div className="flex flex-wrap gap-3">
              {MARKETS.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs text-slate-400 font-semibold"
                >
                  <m.icon size={13} className="text-indigo-400" />
                  {m.label}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: Zap, label: "Smart Tech", desc: "Advanced automation at every layer" },
              { icon: Shield, label: "Secure", desc: "Encrypted, tamper-proof protection" },
              { icon: Award, label: "Premium", desc: "Built to outlast the competition" },
              { icon: Headphones, label: "Support", desc: "Engineers on call 24/7" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-center transition-all"
              >
                <item.icon size={28} className="text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-black text-white mb-1">{item.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── MISSION ──────────────────────────────────────────────────────────────────

function Mission() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/8 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Our Mission</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
            Making Smart Living<br />Accessible to All
          </h2>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            To provide innovative, secure, energy-efficient, and user-friendly automation solutions that improve everyday life for homes and businesses across India and beyond.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── WHY CHOOSE US ────────────────────────────────────────────────────────────

function WhyChooseUs() {
  return (
    <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Why Choose Us</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">The Tek Node Advantage</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_US.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.18 } }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-all">
                <item.icon size={22} className="text-indigo-400" />
              </div>
              <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── STATS BAND ───────────────────────────────────────────────────────────────

function StatsBand() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-7 text-center hover:border-indigo-500/30 transition-all"
            >
              <s.icon size={28} className="text-indigo-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Get Started</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
            Ready to Automate Your Space?
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Join 10,000+ customers who've made the switch to smarter living. Our team is ready to help you design the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group text-sm">
              Explore Products
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white font-black rounded-2xl transition-all text-sm">
              Contact Us
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Hero />
      <WhoWeAre />
      <Mission />
      <ProductCarousel />
      <WhyChooseUs />
      <Timeline />
      <StatsBand />
      <TestimonialCarousel />
      <CTA />
    </div>
  );
}