import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWebsiteSettings } from "../../context/WebsiteSettingsContext.jsx";
import { getImageUrl } from "../../utils/imageUrl.js";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Calendar,
  Star,
  Warehouse,
  Percent,
  Info,
  Wrench,
  LogOut,
  ClipboardList,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/demobooking", label: "Demo Bookings", icon: Calendar },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/smart-home-proposals", label: "Smart Home Proposals", icon: ClipboardList },
  { to: "/admin/installation-requests", label: "Installation Requests", icon: Wrench },
  { to: "/admin/website-information", label: "Website Information", icon: Info },
  { to: "/admin/offers", label: "Offers & Promotions", icon: Percent },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const { settings } = useWebsiteSettings();

  return (
    <div className="w-full lg:w-64 bg-black border-b lg:border-b-0 lg:border-r border-gray-800 p-6 flex flex-col z-20 min-h-screen">
      <div className="flex items-center justify-center py-5">
        <img
          src={settings?.company_logo ? getImageUrl(settings.company_logo) : "/assest/logowhite.png"}
          alt={settings?.company_name || "Logo"}
          className="h-[70px] w-auto max-w-full object-contain block"
        />
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition font-semibold text-sm border border-red-500/20"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
