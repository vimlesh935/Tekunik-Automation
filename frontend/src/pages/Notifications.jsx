import React, { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useToast } from "../components/Toast.jsx";
import { useTranslation } from "react-i18next";
import NotificationList from "../components/NotificationList.jsx";
import useNotifications from "../hooks/useNotifications.js";
import { notificationFilterTypes } from "../utils/notificationTypes.js";

export default function Notifications() {
  const [filter, setFilter] = useState("");
  const { addToast } = useToast();
  const { t } = useTranslation();
  const unreadOnly = filter === "unread";
  const type = ["", "unread"].includes(filter) ? "" : filter;
  const state = useNotifications({ unreadOnly, type });
  const run = async (operation) => { try { await operation(); } catch (error) { addToast(error?.message || t("nav.updateNotificationFailed"), "error"); } };

  return <div className="min-h-screen bg-page py-14 text-primary"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400"><Bell size={15} /> {t("nav.notifications")}</div><h1 className="text-4xl font-black text-white">{t("nav.stayInTheLoop")}</h1><p className="mt-2 text-sm text-slate-400">{t("nav.stayUpdated")}</p></div>{state.notifications.some((item) => !item.is_read) && <button type="button" onClick={() => run(state.markAllRead)} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"><CheckCheck size={14} /> {t("nav.markAllAsRead")}</button>}</div>
    <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">{notificationFilterTypes.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${filter === item.value ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{item.label}</button>)}</div>
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5"><NotificationList notifications={state.notifications} loading={state.loading} error={state.error} onRetry={state.refresh} onRead={(id) => run(() => state.markRead(id))} onRemove={(id) => run(() => state.remove(id))} />{state.pagination?.pages > state.pagination?.page && <button type="button" onClick={state.loadMore} className="mx-auto mt-5 block rounded-lg border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300">{t("nav.loadMore")}</button>}</div>
    {state.notifications.length > 0 && <button type="button" onClick={() => run(state.clear)} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-300"><Trash2 size={13} /> {t("nav.clearAllNotifications")}</button>}
  </div></div>;
}