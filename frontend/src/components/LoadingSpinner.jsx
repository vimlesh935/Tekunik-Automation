import React from "react";

function Spinner() {
  return (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-slate-700/30" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-800/60 ${className}`}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-16 h-16 rounded-2xl" />
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>
      <SkeletonBlock className="h-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="w-16 h-16 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-64" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
        </div>
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <div className="space-y-2">
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
          </div>
          <SkeletonBlock className="h-96" />
        </div>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="admin-shell min-h-screen flex flex-col lg:flex-row bg-[#0a0a0c]">
      <div className="w-full lg:w-64 bg-black border-r border-gray-800 p-6 space-y-3">
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10 mt-auto" />
      </div>
      <div className="flex-1 p-8 space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
        <SkeletonBlock className="h-96" />
      </div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-3">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <SkeletonBlock className="h-96" />
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-6 w-1/4" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-12 w-48" />
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-4">
      <SkeletonBlock className="h-8 w-32" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4">
          <SkeletonBlock className="w-24 h-24 rounded-lg" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-6">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-12" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSpinner({ fullPage = true, type = "page" }) {
  if (type === "admin") return <AdminSkeleton />;
  if (type === "dashboard") return <DashboardSkeleton />;
  if (type === "shop") return <ShopSkeleton />;
  if (type === "product") return <ProductDetailSkeleton />;
  if (type === "cart") return <CartSkeleton />;
  if (type === "checkout") return <CheckoutSkeleton />;
  if (type === "page" || type === "default") {
    if (fullPage) {
      return (
        <div className="flex items-center justify-center min-h-[70vh] w-full">
          <PageSkeleton />
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[40vh]">
      <Spinner />
      <p className="text-sm text-slate-500 font-medium tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
}

export { Spinner, PageSkeleton, DashboardSkeleton, AdminSkeleton, ShopSkeleton, ProductDetailSkeleton, CartSkeleton, CheckoutSkeleton };
