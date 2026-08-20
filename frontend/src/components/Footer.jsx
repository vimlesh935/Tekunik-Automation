import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  ArrowRight,
  ArrowUpRight,
  Globe,
  Camera,
  Video,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

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
  const { theme } = useTheme();
  const { settings } = useWebsiteSettings();

  const logo = settings.company_logo
    ? getImageUrl(settings.company_logo)
    : theme === "dark"
    ? "/assest/logowhite.png"
    : "/assest/logo.png";

  const socialLinks = [
    { url: settings.facebook_url, icon: Globe, label: "Facebook" },
    { url: settings.instagram_url, icon: Camera, label: "Instagram" },
    { url: settings.linkedin_url, icon: ExternalLink, label: "LinkedIn" },
    { url: settings.youtube_url, icon: Video, label: "YouTube" },
    { url: settings.twitter_url, icon: MessageCircle, label: "Twitter" },
  ].filter(s => s.url);

  return (
    <footer className="relative mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-slate-900 overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>

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

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-16 sm:mb-20"
        >
          {/* Column 1: Brand */}
          <motion.div variants={itemVariants} className="space-y-5">
            <Link to="/home" className="flex items-center gap-2.5 group w-fit">
              <img src={logo} alt={settings.company_name || "Logo"} className="h-[55px] md:h-[70px] w-auto object-contain" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.footer_about || settings.company_description || `${settings.company_name || "Tekunik Automation"} — Premium automation solutions for modern living and working spaces.`}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socialLinks.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-300"
                    title={label}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div variants={itemVariants} className="space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Quick Links
            </h4>
            <ul className="space-y-3.5">
              {[
                { label: "Home", to: "/home" },
                { label: "Shop", to: "/shop" },
                { label: "About Us", to: "/about" },
                { label: "Contact Us", to: "/contact" },
                { label: "Track Order", to: "/track-order" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 group w-fit"
                  >
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Contact Info */}
          <motion.div variants={itemVariants} className="space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Contact
            </h4>
            <ul className="space-y-4">
              {(settings.company_email || settings.support_email) && (
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 mt-0.5">
                    <Mail size={13} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                    <a href={`mailto:${settings.support_email || settings.company_email}`} className="text-slate-300 hover:text-indigo-400 transition-colors break-all">
                      {settings.support_email || settings.company_email}
                    </a>
                  </div>
                </li>
              )}
              {(settings.company_phone || settings.company_whatsapp) && (
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 mt-0.5">
                    <Phone size={13} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Phone</p>
                    <a href={`tel:${settings.company_phone}`} className="text-slate-300 hover:text-indigo-400 transition-colors">
                      {settings.company_phone}
                    </a>
                    {settings.company_whatsapp && (
                      <a href={`https://wa.me/${settings.company_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="block text-emerald-400 hover:text-emerald-300 transition-colors text-xs mt-0.5 flex items-center gap-1">
                        <MessageCircle size={11} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              )}
              {settings.company_address && (
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 mt-0.5">
                    <MapPin size={13} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Address</p>
                    <p className="text-slate-300 leading-relaxed">
                      {settings.company_address}
                      {settings.city && `, ${settings.city}`}
                      {settings.state && `, ${settings.state}`}
                      {settings.postal_code && ` - ${settings.postal_code}`}
                    </p>
                  </div>
                </li>
              )}
              {settings.business_hours && (
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 mt-0.5">
                    <Clock size={13} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Hours</p>
                    <p className="text-slate-300">{settings.business_hours}</p>
                  </div>
                </li>
              )}
            </ul>
          </motion.div>

          {/* Column 4: Policies & Subscribe */}
          <motion.div variants={itemVariants} className="space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Policies
            </h4>
            <ul className="space-y-3.5">
              {settings.privacy_policy_url && (
                <li>
                  <a href={settings.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group w-fit">
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0" />
                    Privacy Policy
                  </a>
                </li>
              )}
              {settings.terms_url && (
                <li>
                  <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group w-fit">
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0" />
                    Terms & Conditions
                  </a>
                </li>
              )}
              {settings.refund_policy_url && (
                <li>
                  <a href={settings.refund_policy_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group w-fit">
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0" />
                    Refund Policy
                  </a>
                </li>
              )}
              {settings.shipping_policy_url && (
                <li>
                  <a href={settings.shipping_policy_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group w-fit">
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0" />
                    Shipping Policy
                  </a>
                </li>
              )}
            </ul>

            <div className="pt-2 space-y-3">
              <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                Subscribe
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <input
                  type="email"
                  placeholder="Your email..."
                  className="flex-1 min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-slate-900/80 focus:outline-none transition-all duration-300"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white transition-colors duration-300 shadow-md shadow-indigo-600/20 whitespace-nowrap"
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
              {settings.copyright_text
                ? settings.copyright_text.replace("{year}", new Date().getFullYear())
                : `\u00A9 ${new Date().getFullYear()} ${settings.company_name || "Tekunik Automation"}. All rights reserved.`
              }
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
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
