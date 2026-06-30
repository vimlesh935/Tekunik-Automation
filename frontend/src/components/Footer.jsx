import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
  Product: [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Cart", to: "/cart" },
  ],
  Account: [
    { label: "Login", to: "/login" },
    { label: "Register", to: "/register" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Forgot Password", to: "/forgot-password" },
  ],
};

// Orchestration variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 25 },
  },
};

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="relative mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 overflow-hidden">
      {/* Signature element: a slow-traveling signal line along the top edge,
          echoing a circuit trace / data pulse — the brand's "always-on" motif */}
      <div className="absolute top-0 inset-x-0 h-px bg-slate-900 overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Ambient glow field */}
      <motion.div
        className="absolute -bottom-32 -left-24 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-10 -right-24 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/10 rounded-full blur-[130px] pointer-events-none"
        animate={{ opacity: [0.9, 0.5, 0.9] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 sm:pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-10 lg:gap-8 mb-14 sm:mb-16"
        >
          {/* Brand panel */}
          <motion.div
            variants={itemVariants}
            className="sm:col-span-2 lg:col-span-4 space-y-6"
          >
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                <Zap size={16} className="text-white fill-white" />
              </motion.div>
              <span className="text-xl font-black text-white tracking-tight">
                Tek<span className="text-indigo-400">Node</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Premium consumer electronics and hardware modules tailored for
              ultra high-performance ecosystems. Secure, scalable, and
              expertly engineered.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              {[
                { Icon: Zap, label: "Core" },
                { Icon: Shield, label: "Vault" },
                { Icon: Settings, label: "Config" },
              ].map(({ Icon, label }, i) => (
                <motion.div
                  key={i}
                  whileHover={{
                    y: -3,
                    borderColor: "rgba(99,102,241,0.4)",
                    color: "rgb(129 140 248)",
                  }}
                  className="w-9 h-9 rounded-xl border border-slate-900 bg-slate-900/40 flex items-center justify-center text-slate-400 transition-colors duration-300 cursor-help"
                  title={label}
                >
                  <Icon size={14} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <motion.div
              variants={itemVariants}
              key={title}
              className="lg:col-span-2 space-y-5"
            >
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200 bg-slate-900/60 w-fit px-2.5 py-1 rounded-md border border-slate-800/40">
                {title}
              </h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 group w-fit"
                    >
                      <ArrowRight
                        size={12}
                        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0"
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact + newsletter */}
          <motion.div
            variants={itemVariants}
            className="sm:col-span-2 lg:col-span-4 space-y-5"
          >
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200 bg-slate-900/60 w-fit px-2.5 py-1 rounded-md border border-slate-800/40">
              Ecosystem Support
            </h4>

            <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { Icon: Mail, text: "support@teknode.com" },
                { Icon: Phone, text: "+91 (555) 123-4567" },
                { Icon: MapPin, text: "Mumbai, Maharashtra" },
              ].map(({ Icon, text }, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-slate-300 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                    <Icon size={12} className="text-indigo-400" />
                  </div>
                  <span className="truncate">{text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 space-y-2.5">
              <p className="text-xs font-bold text-slate-500 tracking-wide">
                Subscribe to technical deployments
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col xs:flex-row sm:flex-col md:flex-row gap-2 w-full max-w-sm"
              >
                <input
                  type="email"
                  placeholder="Enter administrator email..."
                  className="flex-1 min-w-0 rounded-xl border border-slate-900 bg-slate-900/30 px-3.5 py-2.5 xs:py-2 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-slate-900/80 focus:outline-none transition-all duration-300"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 xs:py-2 text-xs font-bold text-white transition-colors duration-300 shadow-md shadow-indigo-600/20"
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-900 px-3 py-1 rounded-full text-emerald-400/90 shadow-sm">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex"
              >
                <Shield size={12} className="text-emerald-400" />
              </motion.span>
              <span className="text-[10px] uppercase tracking-wider font-bold">
                SSL 256-Bit Encrypted
              </span>
            </div>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span>
              &copy; {new Date().getFullYear()} Tek Node. All operational
              rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
            <span className="hidden xs:flex text-xs text-slate-600 items-center gap-1 font-medium">
              Designed by{" "}
              <span className="font-extrabold text-slate-400 bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                Tek Node
              </span>
            </span>

            <motion.button
              whileHover={{ borderColor: "rgba(245,158,11,0.3)" }}
              onClick={() => navigate("/admin-login")}
              title="Secure Admin Access"
              className="group flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-900/20 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-amber-400 transition-colors duration-300"
            >
              <Settings
                size={11}
                className="group-hover:rotate-90 transition-transform duration-500 text-slate-600 group-hover:text-amber-400"
              />
              <span>Admin Portal</span>
              <ArrowUpRight
                size={10}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-500/70"
              />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}