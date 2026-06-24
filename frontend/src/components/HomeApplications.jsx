import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Home as HomeIcon,
  Building2,
  Hotel,
  Stethoscope,
  GraduationCap,
  Factory,
} from "lucide-react";

const applications = [
  {
    key: "Smart Home",
    icon: HomeIcon,
    title: "Smart Home",
    desc: "Smart switches, digital locks, gateways, sensors and automation devices designed for modern homes.",
    border: "border-indigo-500/20 hover:border-indigo-500/50",
    iconBg: "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20",
    glow: "shadow-indigo-500/10",
  },
  {
    key: "Office Automation",
    icon: Building2,
    title: "Office Automation",
    desc: "Improve productivity and control lighting, access, and energy usage efficiently.",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    iconBg: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  {
    key: "Hotel Solutions",
    icon: Hotel,
    title: "Hotel Solutions",
    desc: "Smart room control, access management and guest convenience automation systems.",
    border: "border-amber-500/20 hover:border-amber-500/50",
    iconBg: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  {
    key: "Hospital Automation",
    icon: Stethoscope,
    title: "Hospital Automation",
    desc: "Reliable automation solutions for healthcare facilities and smart infrastructure management.",
    border: "border-rose-500/20 hover:border-rose-500/50",
    iconBg: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20",
    glow: "shadow-rose-500/10",
  },
  {
    key: "School & College Solutions",
    icon: GraduationCap,
    title: "School & College Solutions",
    desc: "Smart classrooms, energy-efficient control systems and secure access management.",
    border: "border-cyan-500/20 hover:border-cyan-500/50",
    iconBg: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
    glow: "shadow-cyan-500/10",
  },
  {
    key: "Industrial Automation",
    icon: Factory,
    title: "Industrial Automation",
    desc: "Advanced control systems, monitoring devices and automation solutions for industrial environments.",
    border: "border-violet-500/20 hover:border-violet-500/50",
    iconBg: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20",
    glow: "shadow-violet-500/10",
  },
];

export default function HomeApplications({ applicationCounts, loadingApps }) {
  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
            Applications
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Where Can You Use Tek Node?
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
            Explore smart automation solutions designed for homes, offices, hotels, healthcare facilities, educational institutions, and industrial environments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, i) => {
            const count = applicationCounts?.[app.key];
            return (
              <Link
                key={i}
                to={`/shop?application=${encodeURIComponent(app.key)}`}
                className={`group relative bg-slate-900 border ${app.border} rounded-2xl p-8 transition-all duration-300 hover:shadow-xl ${app.glow} hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/0 via-slate-800/0 to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-xl ${app.iconBg} border border-current/20 flex items-center justify-center mb-6 shadow-lg transition-all duration-300`}>
                    <app.icon size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors duration-200 mb-3">
                    {app.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow">
                    {app.desc}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    {count !== undefined && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                        {count} {count === 1 ? "Product" : "Products"} Available
                      </span>
                    )}
                    {loadingApps && (
                      <span className="text-xs text-slate-500 animate-pulse">Loading...</span>
                    )}
                    <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-700/60 bg-slate-800/40 text-xs font-bold text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-300 uppercase tracking-wider ml-auto">
                      Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}