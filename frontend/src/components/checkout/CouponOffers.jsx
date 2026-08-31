import React, { useMemo, useState } from "react";
import { BadgePercent, Check, ChevronDown, Copy, Loader2, Ticket, Lock } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
const headline = (c) =>
  c.discountType === "percentage"
    ? `${Math.round(Number(c.discountValue))}% OFF`
    : `${formatCurrency(c.discountValue)} OFF`

export default function CouponOffers({
  coupons = [],
  loading = false,
  subtotal = 0,
  appliedCode = null,
  busyCode = null,
  onApply,
  onPrefill,
}) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const visible = useMemo(() => coupons.filter((c) => c.code !== appliedCode), [coupons, appliedCode]);
  const toggleDetails = (code) => {
    setExpandedItems((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    );
  };
  const isExpanded = (code) => (expandedItems || []).includes(code);
  const minOrder = (c) => Number(c.minOrder || 0);
  const shortfallOf = (c) => {
    if (Number(c.shortfall) > 0) return Number(c.shortfall);
    return Math.max(0, minOrder(c) - Number(subtotal || 0));
  };
  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard blocked — prefill still helps the user */
    }
    setCopiedCode(code);
    if (typeof onPrefill === "function") onPrefill(code);
    window.setTimeout(() => setCopiedCode((cur) => (cur === code ? null : cur)), 2000);
  };
  return (
    <div className="mt-4 space-y-3" aria-label="Available coupons and offers">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={14} className="text-indigo-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available Offers
          </p>
        </div>
        {loading && <Loader2 size={13} className="animate-spin text-slate-500" />}
      </div>

      {!loading && visible.length === 0 && (
        <p className="text-xs text-slate-500">No coupons available right now.</p>
      )}
{visible.map((c) => {
        const locked = !!c.locked;
        return (
          <div
            key={c.code}
            className={`relative rounded-xl border p-3 transition-colors ${
              locked ? "border-slate-800 bg-slate-950/40" : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    locked ? "bg-slate-800 text-slate-400" : "bg-indigo-500/15 text-indigo-300"
                  }`}
                >
                  {locked ? <Lock size={15} /> : <BadgePercent size={15} />}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-white">{c.code}</p>
                  <p className="max-w-[220px] truncate text-[11px] text-slate-400">
                    {c.title || c.description || "Coupon"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-extrabold ${locked ? "text-slate-300" : "text-emerald-300"}`}>
                  {headline(c)}
                </p>
                {minOrder(c) > 0 && (
                  <p className="text-[10px] text-slate-500">Min. {formatCurrency(minOrder(c))}</p>
                )}
              </div>
            </div>

            {locked ? (
              <div className="mt-2 rounded-lg bg-slate-900/70 px-2.5 py-2 text-[11px] text-amber-300/90">
                🔒 Locked{c.lockMessage ? ` — ${c.lockMessage}` : ""}
                {c.reasonCode === "MIN_CART_NOT_REACHED" && shortfallOf(c) > 0 && (
                  <>
                    <span className="mx-1 text-slate-500">·</span>
                    <span data-testid={`shortfall-${c.code}`}>
                      Add {formatCurrency(shortfallOf(c))} more to unlock
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">
                {c.description || "Valid on this order."}
              </p>
            )}

            {c.description && locked && !isExpanded(c.code) && (
              <button
                type="button"
                onClick={() => toggleDetails(c.code)}
                className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300"
              >
                Show details
                <ChevronDown size={11} />
              </button>
            )}
            {isExpanded(c.code) && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{c.description}</p>
            )}

            {c.maxDiscount > 0 && (
              <p className="mt-1.5 text-[10px] text-slate-500">
                Up to {formatCurrency(c.maxDiscount)} off
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              {locked ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[11px] font-bold text-slate-500"
                >
                  <Lock size={12} /> Locked
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`Apply coupon ${c.code}`}
                  onClick={() => onApply && onApply(c.code)}
                  disabled={busyCode === c.code}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {busyCode === c.code ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Applying...
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Apply
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                aria-label={`Copy coupon code ${c.code}`}
                onClick={() => handleCopy(c.code)}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
              >
                {copiedCode === c.code ? (
                  <>
                    <Check size={12} className="text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
