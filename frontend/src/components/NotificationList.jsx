import React from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { notificationTypes } from "../utils/notificationTypes.js";

const ago = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function NotificationList({ notifications, loading, error, onRetry, onRead, onRemove, compact = false }) {
  if (loading) return <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading notifications...</div>;
  if (error) return <div className="p-6 text-center"><p className="text-xs text-rose-300">Notifications couldn't be loaded.</p><button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"><RefreshCw size={13} /> Retry</button></div>;
  if (!notifications.length) return <div className="p-8 text-center"><p className="text-sm font-bold text-slate-200">You're all caught up</p><p className="mt-1 text-xs text-slate-500">We'll let you know when something important happens.</p>{!compact && <Link to="/shop" className="mt-4 inline-block rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500">Continue Shopping</Link>}</div>;

  return <div className={compact ? "max-h-[380px] overflow-y-auto" : "space-y-2"}>
    {notifications.map((notification) => {
      const meta = notificationTypes[notification.type] || notificationTypes.SYSTEM;
      const Icon = meta.icon;
      const action = notification.action_url || "";
      const content = <><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 ${meta.color}`}><Icon size={15} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`text-xs ${notification.is_read ? "font-semibold text-slate-300" : "font-black text-white"}`}>{notification.title}</p>{!notification.is_read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-label="Unread" />}</div><p className="mt-1 text-xs leading-relaxed text-slate-500">{notification.message}</p><p className="mt-1 text-[10px] text-slate-600">{ago(notification.created_at)}</p></div>{onRemove && <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRemove(notification.id); }} aria-label={`Delete ${notification.title}`} className="shrink-0 rounded p-1 text-slate-600 hover:text-rose-300"><Trash2 size={13} /></button>}</>;
      return action ? <Link key={notification.id} to={action} onClick={() => !notification.is_read && onRead(notification.id)} className={`flex gap-3 rounded-xl border p-3 transition ${notification.is_read ? "border-transparent" : "border-cyan-500/15 bg-cyan-500/5"} hover:border-slate-700`}>{content}</Link> : <button key={notification.id} type="button" onClick={() => !notification.is_read && onRead(notification.id)} className={`flex w-full gap-3 rounded-xl border p-3 text-left transition ${notification.is_read ? "border-transparent" : "border-cyan-500/15 bg-cyan-500/5"} hover:border-slate-700`}>{content}</button>;
    })}
  </div>;
}