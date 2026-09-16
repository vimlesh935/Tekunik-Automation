import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";
import { localizedField } from "../utils/i18nContent.js";
import { useTranslation } from "react-i18next";
import {
  Zap, Shield, Headphones, Award, Users, Package,
  Truck, Clock, ChevronLeft, ChevronRight, Star,
  Building2, Home, Hotel, GraduationCap, Factory, Wifi,
  Lock, Cpu, SlidersHorizontal, Thermometer, ArrowRight, Quote,
  Plus, Minus
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Rajesh Mehta",
    roleKey: "about.t1Role",
    textKey: "about.t1Text",
    rating: 5,
    avatar: "RM",
  },
  {
    name: "Priya Sharma",
    roleKey: "about.t2Role",
    textKey: "about.t2Text",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Aditya Kulkarni",
    roleKey: "about.t3Role",
    textKey: "about.t3Text",
    rating: 5,
    avatar: "AK",
  },
  {
    name: "Sneha Iyer",
    roleKey: "about.t4Role",
    textKey: "about.t4Text",
    rating: 5,
    avatar: "SI",
  },
  {
    name: "Vikram Nair",
    roleKey: "about.t5Role",
    textKey: "about.t5Text",
    rating: 5,
    avatar: "VN",
  },
];

const PRODUCTS = [
  { icon: Zap, labelKey: "about.prodSmartSwitches", descKey: "about.prodSmartSwitchesDesc" },
  { icon: Lock, labelKey: "about.prodDigitalLocks", descKey: "about.prodDigitalLocksDesc" },
  { icon: Wifi, labelKey: "about.prodGateways", descKey: "about.prodGatewaysDesc" },
  { icon: Thermometer, labelKey: "about.prodSensors", descKey: "about.prodSensorsDesc" },
  { icon: SlidersHorizontal, labelKey: "about.prodSmartKnobs", descKey: "about.prodSmartKnobsDesc" },
  { icon: Cpu, labelKey: "about.prodControlSystems", descKey: "about.prodControlSystemsDesc" },
];

const MARKETS = [
  { icon: Home, labelKey: "about.marketHomes" },
  { icon: Building2, labelKey: "about.marketOffices" },
  { icon: Hotel, labelKey: "about.marketHotels" },
  { icon: GraduationCap, labelKey: "about.marketEducation" },
  { icon: Factory, labelKey: "about.marketIndustrial" },
  { icon: Shield, labelKey: "about.marketHealthcare" },
];

const WHY_US = [
  { icon: Package, titleKey: "about.whyPremiumQuality", descKey: "about.whyPremiumQualityDesc" },
  { icon: Zap, titleKey: "about.whyAdvancedAutomation", descKey: "about.whyAdvancedAutomationDesc" },
  { icon: Shield, titleKey: "about.whyEnterpriseSecurity", descKey: "about.whyEnterpriseSecurityDesc" },
  { icon: Headphones, titleKey: "about.whyAlwaysOnSupport", descKey: "about.whyAlwaysOnSupportDesc" },
  { icon: Award, titleKey: "about.whyExpertGuidance", descKey: "about.whyExpertGuidanceDesc" },
  { icon: Users, titleKey: "about.whyCommunity", descKey: "about.whyCommunityDesc" },
];

const STATS = [
  { icon: Package, value: "500+", labelKey: "about.statProducts" },
  { icon: Users, value: "10K+", labelKey: "about.statCustomers" },
  { icon: Truck, value: "25K+", labelKey: "about.statDeliveries" },
  { icon: Clock, value: "24/7", labelKey: "about.statSupport" },
];

const TIMELINE = [
  { year: "2018", titleKey: "about.timelineFounded", descKey: "about.timelineFoundedDesc" },
  { year: "2020", titleKey: "about.timelineExpanded", descKey: "about.timelineExpandedDesc" },
  { year: "2022", titleKey: "about.timeline10K", descKey: "about.timeline10KDesc" },
  { year: "2024", titleKey: "about.timelineNextGen", descKey: "about.timelineNextGenDesc" },
];

// ─── TESTIMONIAL CAROUSEL ─────────────────────────────────────────────────────

function TestimonialCarousel() {
  const { t } = useTranslation();
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

  const testimonial = TESTIMONIALS[active];

  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">{t("about.testimonials")}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t("about.whatClientsSay")}</h2>
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
                {Array(testimonial.rating).fill(0).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 italic">
                "{t(testimonial.textKey)}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-black text-white text-sm">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">{t(testimonial.roleKey)}</p>
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
  const { t } = useTranslation();
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
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">{t("about.productRange")}</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t("about.builtForEverySpace")}</h2>
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
                <h3 className="font-black text-white text-sm mb-1">{t(p.labelKey)}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t(p.descKey)}</p>
              </div>
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {t("about.learnMore")} <ArrowRight size={12} />
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
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const { settings } = useWebsiteSettings();

  const companyName = settings.company_name || "Tekunik Automation";
  const companyLogo = settings.company_logo ? getImageUrl(settings.company_logo) : "/assest/logo.png";
  const tagline = settings.company_tagline || t("about.taglineFallback");

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
          className="flex justify-center mb-10"
        >
          <img src={companyLogo} alt={companyName} style={{
            height: "clamp(50px, 10vw, 85px)",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
          }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assest/logo.png"; }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none"
        >
          <span className="relative inline-block">
            <span className="text-indigo-400">{t("about.heroAbout", { name: companyName })}</span>
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
          {tagline}
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
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t(s.labelKey)}</p>
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
        <span className="text-xs uppercase tracking-widest">{t("about.scroll")}</span>
        <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
      </motion.div>
    </section>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

function Timeline() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-3">{t("about.ourJourney")}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t("about.howWeGotHere")}</h2>
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
                  <h3 className="text-base font-black text-white mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{t(item.descKey)}</p>
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
  const { t, i18n } = useTranslation();
  const { settings } = useWebsiteSettings();
  const companyName = settings.company_name || "Tekunik Automation";
  const description = localizedField(settings, "company_description", i18n.language) || t("about.descriptionFallback", { name: companyName });

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
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">{t("about.whoWeAre")}</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
              {t("about.innovatingFuture")}<br />{t("about.ofSmartLiving")}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              {description}
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              {t("about.commitment")}
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
                  {t(m.labelKey)}
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
              { icon: Zap, labelKey: "about.smartTech", descKey: "about.smartTechDesc" },
              { icon: Shield, labelKey: "about.secure", descKey: "about.secureDesc" },
              { icon: Award, labelKey: "about.premium", descKey: "about.premiumDesc" },
              { icon: Headphones, labelKey: "about.support", descKey: "about.supportDesc" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-center transition-all"
              >
                <item.icon size={28} className="text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-black text-white mb-1">{t(item.labelKey)}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t(item.descKey)}</p>
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
  const { t } = useTranslation();
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
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">{t("about.ourMission")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
            {t("about.makingSmartLiving")}<br />{t("about.accessibleToAll")}
          </h2>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t("about.missionDesc")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── WHY CHOOSE US ────────────────────────────────────────────────────────────

function WhyChooseUs() {
  const { t } = useTranslation();
  const { settings } = useWebsiteSettings();
  const companyName = settings.company_name || "Tekunik Automation";
  return (
    <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">{t("about.whyChooseUs")}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t("about.advantage", { name: companyName })}</h2>
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
              <h3 className="text-base font-black text-white mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t(item.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── STATS BAND ───────────────────────────────────────────────────────────────

function StatsBand() {
  const { t } = useTranslation();
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
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t(s.labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_DATA = [
  {
    qKey: "about.faqQ1",
    aKey: "about.faqA1",
  },
  {
    qKey: "about.faqQ2",
    aKey: "about.faqA2",
  },
  {
    qKey: "about.faqQ3",
    aKey: "about.faqA3",
  },
  {
    qKey: "about.faqQ4",
    aKey: "about.faqA4",
  },
  {
    qKey: "about.faqQ5",
    aKey: "about.faqA5",
  },
  {
    qKey: "about.faqQ6",
    aKey: "about.faqA6",
  },
  {
    qKey: "about.faqQ7",
    aKey: "about.faqA7",
  },
  {
    qKey: "about.faqQ8",
    aKey: "about.faqA8",
  },
];

function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">{t("about.faq")}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t("about.frequentlyAsked")}</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto leading-relaxed">
            {t("about.faqDesc")}
          </p>
        </div>
        <div className="space-y-4">
          {FAQ_DATA.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-shadow duration-300"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left cursor-pointer"
                >
                  <span className="text-white font-bold text-sm sm:text-base leading-snug flex-1">{t(item.qKey)}</span>
                  <span className="shrink-0 text-indigo-400 transition-transform duration-300">
                    {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-slate-400 text-sm leading-relaxed">{t(item.aKey)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  const { t } = useTranslation();
  const { settings } = useWebsiteSettings();
  const companyName = settings.company_name || "Tekunik Automation";
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
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">{t("about.getStarted")}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
            {t("about.readyToAutomate")}
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            {t("about.joinThousands")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group text-sm">
              {t("about.exploreProducts")}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white font-black rounded-2xl transition-all text-sm">
              {t("about.contactUs")}
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
    <>
      <style>{`
      `}</style>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <Hero />
      <WhoWeAre />
      <Mission />
      <ProductCarousel />
      <WhyChooseUs />
      <Timeline />
      <StatsBand />
      <TestimonialCarousel />
      <FAQ />
      <CTA />
      </div>
    </>
  );
}
