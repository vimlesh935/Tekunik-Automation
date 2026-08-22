import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { notificationService } from "../services/api";

export default function useNotifications({ page = 1, limit = 20, unreadOnly = false, type = "" } = {}) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setNotifications([]); setUnreadCount(0); return; }
    setLoading(true); setError("");
    try {
      const [listResponse, countResponse] = await Promise.all([
        notificationService.list({ page, limit, unreadOnly, type }),
        notificationService.unreadCount(),
      ]);
      const data = listResponse?.data || {};
      setNotifications(data.notifications || []);
      setPagination(data.pagination || null);
      setUnreadCount(Number(countResponse?.data?.count || 0));
    } catch (requestError) {
      setError(requestError?.message || "Notifications couldn't be loaded.");
    } finally { setLoading(false); }
  }, [isAuthenticated, limit, page, type, unreadOnly]);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try { setUnreadCount(Number((await notificationService.unreadCount())?.data?.count || 0)); } catch { /* bell remains usable when count is unavailable */ }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const poll = () => { if (document.visibilityState === "visible") refreshCount(); };
    const timer = window.setInterval(poll, 30000);
    document.addEventListener("visibilitychange", poll);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", poll); };
  }, [isAuthenticated, refreshCount]);

  const markRead = useCallback(async (id) => {
    const previous = notifications;
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: 1 } : item));
    setUnreadCount((count) => Math.max(0, count - (previous.find((item) => item.id === id && !item.is_read) ? 1 : 0)));
    try { await notificationService.markRead(id); } catch (requestError) { setNotifications(previous); refreshCount(); throw requestError; }
  }, [notifications, refreshCount]);

  const markAllRead = useCallback(async () => {
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, is_read: 1 })));
    setUnreadCount(0);
    try { await notificationService.markAllRead(); } catch (requestError) { setNotifications(previous); refreshCount(); throw requestError; }
  }, [notifications, refreshCount]);

  const remove = useCallback(async (id) => {
    const previous = notifications;
    const removed = previous.find((item) => item.id === id);
    setNotifications((items) => items.filter((item) => item.id !== id));
    if (removed && !removed.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    try { await notificationService.remove(id); } catch (requestError) { setNotifications(previous); refreshCount(); throw requestError; }
  }, [notifications, refreshCount]);

  const clear = useCallback(async () => {
    const previous = notifications;
    setNotifications([]); setUnreadCount(0);
    try { await notificationService.clear(); } catch (requestError) { setNotifications(previous); refreshCount(); throw requestError; }
  }, [notifications, refreshCount]);

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !pagination || pagination.page >= pagination.pages) return;
    try {
      const response = await notificationService.list({ page: pagination.page + 1, limit, unreadOnly, type });
      const data = response?.data || {};
      setNotifications((current) => [...current, ...(data.notifications || [])]);
      setPagination(data.pagination || pagination);
    } catch (requestError) { setError(requestError?.message || "Unable to load more notifications."); }
  }, [isAuthenticated, limit, pagination, type, unreadOnly]);

  return { notifications, unreadCount, pagination, loading, error, refresh, loadMore, markRead, markAllRead, remove, clear };
}