import React from "react";
import { useLocation } from "react-router-dom";
import AdminNotificationBell from "./AdminNotificationBell.jsx";

const TITLES = {
  "/admin": "Dashboard",
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/reviews": "Reviews",
  "/admin/inventory": "Inventory",
"/admin/offers": "Offers & Promotions",
  "/admin/settings": "Settings",
  "/admin/settings/frontend": "Settings / Frontend",
  "/admin/settings/backend": "Settings / Backend",
  "/admin/smart-home-requests": "Smart Home Requests",
  "/admin/demobooking": "Demo Bookings",
  "/admin/notifications": "Activity Center",
};

function fallbackTitle(pathname) {
  const seg = pathname.split("/").filter(Boolean).pop() || "dashboard";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminHeader() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || fallbackTitle(pathname);

  return (
    <header className="h-20 border-b border-gray-800/50 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <AdminNotificationBell />
      </div>
    </header>
  );
}
