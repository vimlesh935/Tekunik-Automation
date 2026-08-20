import React from "react";
import { useLocation } from "react-router-dom";

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
  "/admin/website-information": "Website Information",
  "/admin/settings": "Settings",
  "/admin/smart-home-proposals": "Smart Home Proposals",
  "/admin/installation-requests": "Installation Requests",
  "/admin/installations": "Installation Requests",
  "/admin/demobooking": "Demo Bookings",
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
    </header>
  );
}
