import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getApiUrl } from "../../services/api";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users,
  Package, AlertTriangle, Clock, Zap,
  RefreshCw
} from "lucide-react";

// ─── Pro‑Level SVG Sparkline ───────────────────────────────────────────
function Sparkline({ data, width = 120, height = 32, color = "#06b6d4", strokeWidth = 2 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`glow-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        className="drop-shadow-[0_0_4px_currentColor]"
        style={{ color }} />
      <path d={`M${pts} L${width},${height} L0,${height} Z`}
        fill={`url(#glow-${color.replace("#","")})`} opacity="0.5" />
    </svg>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);
  const from = useRef(display);

  useEffect(() => {
    const duration = 800;
    const startVal = from.current;
    const endVal = Number(value);
    if (startVal === endVal) return;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(startVal + (endVal - startVal) * ease);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else { start.current = null; from.current = endVal; }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const formatted = Number(display).toLocaleString("en-IN", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals
  });
  return <span>{prefix}{formatted}{suffix}</span>;
}

// ─── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, change, changeLabel, icon: Icon, color, chartData, subtitle }) {
  const isUp = change >= 0;
  return (
    <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 rounded-[1.75rem] p-6 overflow-hidden transition-all duration-500 hover:border-gray-700/60 hover:shadow-[0_8px_40px_-12px_rgba(6,182,212,0.15)]">
      {/* Ambient glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.08] group-hover:opacity-[0.12] transition-opacity duration-700 blur-3xl`}
        style={{ backgroundColor: color }} />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
          {subtitle && <p className="text-[9px] text-gray-600 tracking-wide">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-700/40"
          style={{ color }}>
          <Icon size={18} />
        </div>
      </div>

      <div className="flex items-end gap-3 relative z-10">
        <h3 className="text-3xl font-black tracking-tight text-white font-mono">
          <AnimatedNumber value={value} decimals={0} />
        </h3>
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold
            ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {chartData && chartData.length > 0 && (
        <div className="mt-4 relative z-10">
          <Sparkline data={chartData} color={color} width={280} height={36} />
        </div>
      )}

      {changeLabel && (
        <p className="text-[10px] text-gray-600 mt-2 relative z-10">{changeLabel}</p>
      )}
    </div>
  );
}

// ─── Pro‑Level Bar Chart (Pure SVG) ────────────────────────────────────
function BarChart({ data, height = 200, color = "#06b6d4", gradient = true, showGrid = true }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-[200px] text-gray-600 text-xs">No data available</div>
  );

  const max = Math.max(...data.map(d => d.value), 1);
  const padW = 24;
  const padH = 20;
  const w = 600;
  const h = height;
  const chartW = w - padW * 2;
  const chartH = h - padH * 2;
  const barW = Math.min(32, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`bar-fill-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
        <filter id="bar-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <g key={i}>
          <line x1={padW} y1={padH + chartH * (1 - ratio)} x2={w - padW} y2={padH + chartH * (1 - ratio)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,4" />
          <text x={padW - 6} y={padH + chartH * (1 - ratio) + 3}
            textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">
            {Math.round(max * ratio)}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = padW + gap * i + (gap - barW) / 2;
        const y = padH + chartH - barH;
        const label = d.label?.length > 5 ? d.label.slice(0, 5) : d.label;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} ry={4}
              fill={`url(#bar-fill-${color.replace("#","")})`}
              filter="url(#bar-glow)" className="transition-all duration-500">
              <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
              <animate attributeName="y" from={padH + chartH} to={y} dur="0.6s" fill="freeze" />
            </rect>
            <text x={x + barW / 2} y={padH + chartH + 14}
              textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">
              {label}
            </text>
            <text x={x + barW / 2} y={y - 6}
              textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace"
              fontWeight="bold">
              {typeof d.value === 'number' ? (d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value) : d.value}
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      <line x1={padW} y1={padH + chartH} x2={w - padW} y2={padH + chartH}
        stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    </svg>
  );
}

// ─── Pro‑Level Area Chart (Curved SVG) ─────────────────────────────────
function AreaChart({ data, height = 200, color = "#06b6d4", showDots = true }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-[200px] text-gray-600 text-xs">Insufficient data</div>
  );

  const max = Math.max(...data.map(d => d.value), 1);
  const pad = 32;
  const w = 600;
  const h = height;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + chartH - (d.value / max) * chartH,
    value: d.value,
    label: d.label
  }));

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${lineD} L${points[points.length-1].x},${pad + chartH} L${points[0].x},${pad + chartH} Z`;

  // Smooth curve using cubic beziers
  const smoothD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.4;
    const cpx2 = prev.x + (p.x - prev.x) * 0.6;
    return `${acc} C${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaSmoothD = `${smoothD} L${points[points.length-1].x},${pad + chartH} L${points[0].x},${pad + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`area-fill-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`glow-${color.replace("#","")}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <g key={i}>
          <line x1={pad} y1={pad + chartH * ratio} x2={w - pad} y2={pad + chartH * ratio}
            stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,4" />
          <text x={pad - 8} y={pad + chartH * ratio + 3}
            textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="monospace">
            {Math.round(max * (1 - ratio) * 10) / 10}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaSmoothD} fill={`url(#area-fill-${color.replace("#","")})`}
        opacity="0.8">
        <animate attributeName="opacity" from="0" to="0.8" dur="0.8s" fill="freeze" />
      </path>

      {/* Line */}
      <path d={smoothD} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        filter={`url(#glow-${color.replace("#","")})`}
        className="drop-shadow-[0_0_6px_currentColor]" style={{ color }}>
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1s" fill="freeze" />
      </path>

      {/* Dots */}
      {showDots && points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} className="drop-shadow-[0_0_6px_currentColor]"
            style={{ color }}>
            <animate attributeName="r" from="0" to="3" dur="0.3s" begin={`${i * 0.05}s`} fill="freeze" />
          </circle>
          <circle cx={p.x} cy={p.y} r="5" fill={color} opacity="0.2">
            <animate attributeName="r" from="0" to="5" dur="0.3s" begin={`${i * 0.05}s`} fill="freeze" />
          </circle>
          {i % Math.ceil(data.length / 6) === 0 && (
            <text x={p.x} y={pad + chartH + 18}
              textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Mini Pie Chart (SVG Donut) ────────────────────────────────────────
function DonutChart({ segments, size = 100, thickness = 20, showLabel = true }) {
  if (!segments || segments.length === 0) return null;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const p = seg.value / total;
    const len = p * circ;
    const a = { ...seg, len, offset, p };
    offset += len;
    return a;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
      {arcs.map((seg, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={thickness}
          strokeDasharray={`${seg.len} ${circ - seg.len}`}
          strokeDashoffset={-seg.offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="drop-shadow-[0_0_4px_currentColor]" style={{ color: seg.color }}>
          <animate attributeName="stroke-dashoffset" from={circ} to={-seg.offset} dur="0.6s" fill="freeze" />
        </circle>
      ))}
      {showLabel && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="11" fontFamily="monospace" fontWeight="bold">
          {total}
        </text>
      )}
    </svg>
  );
}

// ─── Low Stock Alert Item ──────────────────────────────────────────────
function LowStockAlert({ product }) {
  const severity = product.stock_quantity === 0 ? "critical" :
    product.stock_quantity <= (product.low_stock_limit || 5) ? "warning" : "notice";
  const colors = {
    critical: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-500" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-500" },
    notice: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-500" },
  };
  const c = colors[severity];

  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-xl ${c.bg} ${c.border} border transition-all hover:brightness-110`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0 animate-pulse`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {product.category_name && <>{product.category_name} · </>}
          SKU: {product.sku || "—"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-lg font-black font-mono ${c.text}`}>{product.stock_quantity}</p>
        <p className="text-[9px] uppercase tracking-wider text-gray-600">in stock</p>
      </div>
      <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
        {severity === "critical" ? "Out" : severity === "warning" ? "Low" : "Alert"}
      </div>
    </div>
  );
}

// ─── Active User Activity ──────────────────────────────────────────────
function ActiveUserCard({ user }) {
  const lastActive = user.last_order_date ? new Date(user.last_order_date) : null;
  const daysSince = lastActive ? Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/40 hover:border-gray-700/60 transition-all">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-black shrink-0">
        {user.first_name?.[0] || "U"}{user.last_name?.[0] || ""}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-cyan-400 font-mono">{user.order_count || 0}</p>
        <p className="text-[9px] text-gray-600">orders</p>
      </div>
      {daysSince !== null && daysSince <= 30 && (
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active recently" />
      )}
    </div>
  );
}

// ─── MAIN Dashboard Component ──────────────────────────────────────────
export default function DashboardAnalytics({ toast, fetchData, refreshInterval = 30000 }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: null,
    revenueAnalytics: null,
    orderAnalytics: null,
    inventoryAlerts: [],
    activeUsers: [],
    recentOrders: []
  });
  const [timeRange, setTimeRange] = useState("month");
  const [expandedSection, setExpandedSection] = useState(null);
  const intervalRef = useRef(null);

  const apiCall = useCallback(async (endpoint) => {
    const res = await fetch(getApiUrl(endpoint), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
    if (!res.ok) throw new Error(json.message || "API Error");
    return json.data || json;
  }, [token]);

  const loadAllData = useCallback(async (range) => {
    try {
      setError(null);
      const rangeParam = range || timeRange;
      const queryStr = rangeParam !== "all" ? `?range=${rangeParam}` : "";
      const [analytics, invDash] = await Promise.all([
        apiCall(`/api/admin/dashboard/analytics${queryStr}`).catch(() => ({
          stats: null, summary: null, dailyRevenue: [], last30Days: null,
          recentOrders: [], recentUsers: [], topProducts: []
        })),
        apiCall("/api/admin/inventory/dashboard").catch(() => ({ alertProducts: [], recentUpdates: [] })),
      ]);

      setData({
        stats: analytics?.stats || null,
        revenueAnalytics: {
          dailyRevenue: analytics?.dailyRevenue || [],
          summary: analytics?.summary || null,
        },
        orderAnalytics: analytics?.stats ? {
          deliveredOrders: analytics.stats.deliveredOrders || 0,
          pendingOrders: analytics.stats.pendingOrders || 0,
          cancelledOrders: analytics.stats.cancelledOrders || 0,
          outForDelivery: analytics.stats.outForDelivery || 0,
          revenue: analytics.stats.revenue || 0,
          last30Days: analytics?.last30Days || { deliveredOrders: 0, cancelledOrders: 0, revenue: 0 },
        } : null,
        inventoryAlerts: invDash?.alertProducts || [],
        activeUsers: analytics?.recentUsers || [],
        recentOrders: analytics?.recentOrders || [],
      });
    } catch (err) {
      setError(err.message);
      console.error("Dashboard analytics error:", err);
    }
    setLoading(false);
  }, [apiCall, timeRange]);

  useEffect(() => {
    setLoading(true);
    loadAllData();
    intervalRef.current = setInterval(() => loadAllData(), refreshInterval);
    return () => clearInterval(intervalRef.current);
  }, [loadAllData, refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    loadAllData().then(() => setLoading(false));
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setLoading(true);
    loadAllData(range);
  };

  const stats = data.stats;
  const revenueAnalytics = data.revenueAnalytics;
  const orderAnalytics = data.orderAnalytics;

  // Prep chart data
  const dailyRevenue = (revenueAnalytics?.dailyRevenue || []).map(d => ({
    label: d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
    value: parseFloat(d.revenue || 0)
  }));

  const orderStatusSegments = orderAnalytics ? [
    { label: "Delivered", value: orderAnalytics.deliveredOrders || 0, color: "#10b981" },
    { label: "Pending", value: orderAnalytics.pendingOrders || 0, color: "#f59e0b" },
    { label: "Cancelled", value: orderAnalytics.cancelledOrders || 0, color: "#ef4444" },
    { label: "Out for Delivery", value: orderAnalytics.outForDelivery || 0, color: "#8b5cf6" },
  ] : [];

  const revenueHistory = revenueAnalytics?.summary ? [
    { label: "Total Rev", value: parseFloat(revenueAnalytics.summary.total_revenue || 0) },
    { label: "Avg Order", value: parseFloat(revenueAnalytics.summary.avg_order_value || 0) },
    { label: "Orders", value: revenueAnalytics.summary.total_orders || 0 },
    { label: "Active Days", value: revenueAnalytics.summary.active_days || 0 },
  ] : [];

  const revenueChange = stats?.revenue ? ((parseFloat(revenueAnalytics?.summary?.total_revenue || 0) / stats.revenue) - 1) * 100 : 0;
  const orderChange = orderAnalytics?.last30Days?.deliveredOrders
    ? ((orderAnalytics.last30Days.deliveredOrders / Math.max(stats?.totalOrders || 1, 1)) * 100) : 0;

  const activeUserCount = data.activeUsers?.filter(u => {
    const lastDate = u.last_order_date ? new Date(u.last_order_date) : null;
    return lastDate && (Date.now() - lastDate) < 30 * 24 * 60 * 60 * 1000;
  }).length || data.activeUsers?.length || 0;

  const RevenueSparkline = dailyRevenue.map(d => d.value);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-t-2 border-cyan-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4 p-8 rounded-2xl bg-red-500/5 border border-red-500/10">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-400">Failed to load dashboard</p>
          <p className="text-xs text-gray-500">{error}</p>
          <button onClick={handleRefresh}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with time range and refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Analytics Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <Clock size={12} />
            Live auto-refresh every {refreshInterval / 1000}s
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-gray-900/80 border border-gray-800 overflow-hidden">
            {["today", "week", "month", "all"].map((range) => (
              <button key={range} onClick={() => handleTimeRangeChange(range)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition
                  ${timeRange === range ? 'bg-cyan-500/10 text-cyan-400 border-r border-gray-800' : 'text-gray-500 hover:text-gray-300 border-r border-gray-800 last:border-r-0'}`}>
                {range === "all" ? "All" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Row 1: Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Total Revenue" value={stats?.revenue || 0} prefix="₹"
          change={revenueChange}
          changeLabel="vs total revenue"
          icon={DollarSign} color="#06b6d4"
          chartData={RevenueSparkline}
          subtitle="Lifetime delivered orders" />

        <StatCard label="Active Users" value={activeUserCount}
          change={data.activeUsers?.length ? ((activeUserCount / data.activeUsers.length) * 100) : 0}
          changeLabel="of total users active"
          icon={Users} color="#8b5cf6"
          subtitle="Active in last 30 days" />

        <StatCard label="Total Orders" value={stats?.totalOrders || 0}
          change={orderChange}
          changeLabel="delivered rate"
          icon={ShoppingCart} color="#f59e0b"
          chartData={(data.recentOrders || []).map((_, i, arr) => (i / Math.max(arr.length - 1, 1)) * 100)}
          subtitle="All time" />
      </div>

      {/* Row 2: Order Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Distribution Donut */}
        <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
                Order Distribution
              </h3>
              <p className="text-[10px] text-gray-600 mt-1">By status</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-36 h-36">
              <DonutChart segments={orderStatusSegments} size={144} thickness={22} showLabel={true} />
            </div>
            <div className="w-full space-y-2">
              {orderStatusSegments.filter(s => s.value > 0).map((seg, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-gray-400">{seg.label}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue Trend + Order Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Revenue Trend
              </h3>
              <p className="text-[10px] text-gray-600 mt-1">Revenue flow over time</p>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Orders
              </span>
            </div>
          </div>
          <div className="h-56">
            {dailyRevenue.length > 1 ? (
              <AreaChart data={dailyRevenue} height={220} color="#10b981" showDots={true} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">Collecting trend data...</div>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign size={16} className="text-amber-400" />
                Revenue Summary
              </h3>
              <p className="text-[10px] text-gray-600 mt-1">Key metrics</p>
            </div>
          </div>
          <div className="space-y-4">
            {revenueHistory.length > 0 && revenueHistory.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-800/40">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-black text-white font-mono">
                  {item.label === "Avg Order" || item.label === "Total Rev"
                    ? `₹${item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    : item.value.toLocaleString("en-IN")
                  }
                </p>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-800/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Daily Avg</span>
                <span className="font-bold text-cyan-400 font-mono">
                  ₹{dailyRevenue.length > 0
                    ? (dailyRevenue.reduce((s, d) => s + d.value, 0) / dailyRevenue.length).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                    : "0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Low Stock Alerts + Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Low Stock Alerts</h3>
                <p className="text-[10px] text-gray-600">Products needing attention</p>
              </div>
            </div>
            {data.inventoryAlerts.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                {data.inventoryAlerts.length} alerts
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {data.inventoryAlerts.length > 0 ? (
              data.inventoryAlerts.slice(0, 8).map((product, i) => (
                <LowStockAlert key={product.id || i} product={product} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Package size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">All products well-stocked</p>
                <p className="text-[10px] mt-1">No low stock alerts at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Users size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Users</h3>
                <p className="text-[10px] text-gray-600">Latest registrations & activity</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
              {data.activeUsers.length} users
            </span>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {data.activeUsers.length > 0 ? (
              data.activeUsers.map((user, i) => (
                <ActiveUserCard key={user.id || i} user={user} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Users size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No user data yet</p>
                <p className="text-[10px] mt-1">Users will appear here as they register</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Orders Mini Timeline */}
      {data.recentOrders.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Clock size={18} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                <p className="text-[10px] text-gray-600">Latest 8 transactions</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
              {data.recentOrders.length} orders
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-gray-600 border-b border-gray-800/40">
                  <th className="pb-3 pr-4 font-semibold">Order</th>
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold text-right">Amount</th>
                  <th className="pb-3 pr-4 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/20">
                {data.recentOrders.map((order) => {
                  const statusColors = {
                    delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    confirmed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                    processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                    out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                    pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
                  };
                  const sc = statusColors[order.status] || "text-gray-400 bg-gray-500/10 border-gray-500/20";
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-xs font-mono font-bold text-cyan-400">{order.order_number}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-gray-300">{order.customer_name}</span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-xs font-bold font-mono text-emerald-400">₹{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${sc}`}>
                          {order.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-[10px] text-gray-600 font-mono">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-[9px] text-gray-700 uppercase tracking-widest pb-4">
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        Auto-refreshing every {refreshInterval / 1000}s
        <span className="w-1 h-1 rounded-full bg-gray-700" />
      </div>
    </div>
  );
}