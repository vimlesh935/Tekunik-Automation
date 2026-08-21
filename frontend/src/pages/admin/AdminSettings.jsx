import React from "react";
import { ArrowRight, Globe, Settings2, Server } from "lucide-react";
import { Link } from "react-router-dom";

const SETTING_GROUPS = [
  {
    to: "/admin/settings/frontend",
    title: "Frontend Settings",
    icon: Globe,
    accent: "bg-cyan-400",
    iconRing: "bg-cyan-500/10 border-cyan-500/30",
    iconText: "text-cyan-400",
    shadow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]",
    description:
      "Website information, branding, contact details, social links, policy links and site availability.",
    items: [
      "Logo & favicon upload",
      "Company name, tagline & description",
      "Contact info, address & maps",
      "Social media & policy links",
      "Live / maintenance mode toggle",
    ],
  },
  {
    to: "/admin/settings/backend",
    title: "Backend Settings",
    icon: Server,
    accent: "bg-violet-400",
    iconRing: "bg-violet-500/10 border-violet-500/30",
    iconText: "text-violet-400",
    shadow: "hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
    description:
      "Admin account, email/SMTP and live system status — database-backed and applied at runtime.",
    items: [
      "Admin email & password (hashed)",
      "Session token expiry",
      "SMTP host, port, security & from email",
      "Live system status with real checks",
    ],
  },
];

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings2 className="text-cyan-400" size={24} /> Settings
        </h2>
        <p className="text-gray-400 mt-1">
          Manage your website and system configuration. Choose a section to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SETTING_GROUPS.map((group) => (
          <Link
            key={group.to}
            to={group.to}
            className={`group bg-black/40 border border-gray-800 rounded-2xl p-6 transition hover:border-gray-700 hover:bg-black/60 ${group.shadow}`}
          >
            <div className={`w-14 h-14 rounded-2xl ${group.iconRing} border flex items-center justify-center mb-5`}>
              <group.icon size={26} className={group.iconText} />
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {group.title}
              <ArrowRight
                size={18}
                className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-cyan-400"
              />
            </h3>
            <p className="text-gray-400 text-sm mt-2">{group.description}</p>
            <ul className="mt-4 space-y-2">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${group.accent} mt-1.5 shrink-0`} />
                  {item}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}