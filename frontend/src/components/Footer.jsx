// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   Zap, Mail, Phone, MapPin, Shield, Settings,
//   ArrowRight,
// } from "lucide-react";

// const footerLinks = {
//   Product: [
//     { label: "Home", to: "/" },
//     { label: "Shop", to: "/shop" },
//     { label: "Cart", to: "/cart" },
//   ],
//   Account: [
//     { label: "Login", to: "/login" },
//     { label: "Register", to: "/register" },
//     { label: "Dashboard", to: "/dashboard" },
//     { label: "Forgot Password", to: "/forgot-password" },
//   ],
// };

// export default function Footer() {
//   const navigate = useNavigate();

//   return (
//     <footer className="relative mt-auto border-t border-surface-border bg-surface overflow-hidden">
//       {/* Ambient glow */}
//       <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
//       <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

//           {/* Brand */}
//           <div className="lg:col-span-1 space-y-5">
//             <Link to="/" className="flex items-center gap-2.5 group w-fit">
//               <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
//                 <Zap size={18} className="text-black" />
//               </div>
//               <span className="text-xl font-bold">Teku<span className="text-cyan-400">nik</span></span>
//             </Link>
//             <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
//               Premium smart home automation products for modern living. Secure, reliable, and innovative technology.
//             </p>
//             <div className="flex items-center gap-3">
//               {[Zap, Shield, Settings].map((Icon, i) => (
//                 <button key={i}
//                   className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/8 transition-all">
//                   <Icon size={15} />
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Links */}
//           {Object.entries(footerLinks).map(([title, links]) => (
//             <div key={title} className="space-y-4">
//               <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h4>
//               <ul className="space-y-2.5">
//                 {links.map((link) => (
//                   <li key={link.to}>
//                     <Link to={link.to}
//                       className="text-sm text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group">
//                       <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-cyan-400" />
//                       {link.label}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}

//           {/* Contact + Newsletter */}
//           <div className="space-y-5">
//             <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Contact</h4>
//             <ul className="space-y-3">
//               {[
//                 { Icon: Mail, text: "support@tekunik.com" },
//                 { Icon: Phone, text: "+1 (555) 123-4567" },
//                 { Icon: MapPin, text: "San Francisco, CA" },
//               ].map(({ Icon, text }, i) => (
//                 <li key={i} className="flex items-center gap-3 text-sm text-gray-500">
//                   <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
//                     <Icon size={13} className="text-cyan-400" />
//                   </div>
//                   {text}
//                 </li>
//               ))}
//             </ul>

//             <div className="pt-2">
//               <p className="text-xs text-gray-500 mb-3">Get latest offers & updates</p>
//               <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
//                 <input
//                   type="email"
//                   placeholder="your@email.com"
//                   className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition"
//                 />
//                 <button type="submit"
//                   className="btn-shimmer flex-shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
//                   Go
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>

//         {/* Bottom bar */}
//         <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-2 text-xs text-gray-600">
//             <Shield size={12} className="text-cyan-500/50" />
//             <span>SSL Secured &middot; &copy; {new Date().getFullYear()} Tekunik Automation. All rights reserved.</span>
//           </div>

//           <button
//             onClick={() => navigate("/admin-login")}
//             title="Admin Panel"
//             className="group flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:border-cyan-500/20 hover:text-cyan-500/70 transition-all"
//           >
//             <Settings size={11} className="group-hover:rotate-45 transition-transform duration-300" />
//             Admin
//           </button>
//         </div>
//       </div>
//     </footer>
//   );
// }

///
///
///
///
///
///
///
///
///
///
///
///
///
///

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Phone, MapPin, Shield, Settings,
  ArrowRight, Heart
} from "lucide-react";

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

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="relative mt-auto border-t border-indigo-900 bg-indigo-950 text-slate-300 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand & Corporate Bio */}
          <div className="lg:col-span-1 space-y-5">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <Zap size={16} className="text-indigo-950 fill-indigo-950" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Teku<span className="text-amber-400">nik</span>
              </span>
            </Link>
            <p className="text-sm text-indigo-200/70 leading-relaxed max-w-xs">
              Premium consumer electronics and hardware solutions tailored for high-performance ecosystems. Secure, reliable, and expertly engineered.
            </p>
            
            {/* Minimal Social/Trust Badges */}
            <div className="flex items-center gap-2.5">
              {[Zap, Shield, Settings].map((Icon, i) => (
                <div key={i}
                  className="w-8 h-8 rounded border border-indigo-800 bg-indigo-900/50 flex items-center justify-center text-indigo-300">
                  <Icon size={14} />
                </div>
              ))}
            </div>
          </div>

          {/* Structured Navigation Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}
                      className="text-sm text-indigo-100/80 hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                      <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-400 flex-shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Support & Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Contact Support</h4>
            <ul className="space-y-3">
              {[
                { Icon: Mail, text: "support@tekunik.com" },
                { Icon: Phone, text: "+91 (555) 123-4567" },
                { Icon: MapPin, text: "Mumbai, Maharashtra" },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-indigo-100/80">
                  <div className="w-6 h-6 rounded bg-indigo-900 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-800">
                    <Icon size={12} className="text-amber-400" />
                  </div>
                  <span className="break-all">{text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <p className="text-xs text-indigo-200/60 mb-2">Subscribe to premium updates</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 min-w-0 rounded border border-indigo-800 bg-indigo-900/60 px-3 py-2 text-sm text-white placeholder:text-indigo-300/40 focus:border-amber-500 focus:outline-none transition"
                />
                <button type="submit"
                  className="flex-shrink-0 rounded bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-slate-950 transition-colors shadow-sm">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Trust, Copyright and Author Attributions */}
        <div className="pt-8 border-t border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-indigo-200/50 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-amber-500/80" />
              <span>SSL Encrypted &amp; Secured Connection</span>
            </div>
            <span className="hidden sm:inline text-indigo-800">|</span>
            <span>&copy; {new Date().getFullYear()} Tekunik. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Added "Designed by Tekunik" text token */}
            <span className="text-xs text-indigo-200/40 flex items-center gap-1">
              Designed by <span className="font-semibold text-indigo-200/60">Tekunik</span>
            </span>
            
            <button
              onClick={() => navigate("/admin-login")}
              title="Admin Panel"
              className="group flex items-center gap-1.5 rounded border border-indigo-800 bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-200/60 hover:border-amber-500/40 hover:text-amber-400 transition-all"
            >
              <Settings size={11} className="group-hover:rotate-45 transition-transform duration-300" />
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}