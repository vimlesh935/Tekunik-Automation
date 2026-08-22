import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { productService, recentlyViewedService } from "../services/api";

export const RECENTLY_VIEWED_KEY = "teknode_recently_viewed";
const MAX_ITEMS = 10;

const readGuestHistory = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ productId: Number(item.productId), viewedAt: Number(item.viewedAt) }))
      .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && Number.isFinite(item.viewedAt))
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
};

const writeGuestHistory = (history) => {
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
};

const productFromResponse = (response) => response?.data?.product || response?.data || response?.product || null;

export default function useRecentlyViewed() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGuestProducts = useCallback(async () => {
    const history = readGuestHistory();
    const loaded = await Promise.all(history.map(async ({ productId }) => {
      try {
        const product = productFromResponse(await productService.getProductById(productId));
        return product?.id ? product : null;
      } catch {
        return null;
      }
    }));
    setProducts(loaded.filter(Boolean));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await recentlyViewedService.getAll();
        setProducts(response?.data?.products || response?.products || []);
      } else {
        await loadGuestProducts();
      }
    } catch (error) {
      console.warn("Recently viewed load failed:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadGuestProducts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const guestHistory = readGuestHistory();
    if (!guestHistory.length) return;
    let cancelled = false;
    guestHistory
      .slice()
      .reverse()
      .reduce((chain, { productId }) => chain.then(() => recentlyViewedService.add(productId)), Promise.resolve())
      .then(() => {
        if (!cancelled) {
          localStorage.removeItem(RECENTLY_VIEWED_KEY);
          refresh();
        }
      })
      .catch((error) => console.warn("Recently viewed guest sync failed:", error));
    return () => { cancelled = true; };
  }, [isAuthenticated, refresh]);

  const track = useCallback(async (productId) => {
    const normalizedId = Number(productId);
    if (!Number.isInteger(normalizedId) || normalizedId < 1) return;
    if (isAuthenticated) {
      try { await recentlyViewedService.add(normalizedId); } catch (error) { console.warn("Recently viewed tracking failed:", error); }
      return;
    }
    const next = readGuestHistory().filter((item) => item.productId !== normalizedId);
    next.unshift({ productId: normalizedId, viewedAt: Date.now() });
    writeGuestHistory(next);
  }, [isAuthenticated]);

  const remove = useCallback(async (productId) => {
    setProducts((current) => current.filter((product) => String(product.id) !== String(productId)));
    if (isAuthenticated) {
      try { await recentlyViewedService.remove(productId); } catch (error) { console.warn("Recently viewed removal failed:", error); refresh(); }
    } else {
      writeGuestHistory(readGuestHistory().filter((item) => String(item.productId) !== String(productId)));
    }
  }, [isAuthenticated, refresh]);

  const clear = useCallback(async () => {
    setProducts([]);
    if (isAuthenticated) {
      try { await recentlyViewedService.clear(); } catch (error) { console.warn("Recently viewed clear failed:", error); refresh(); }
    } else {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    }
  }, [isAuthenticated, refresh]);

  return { products, loading, refresh, track, remove, clear };
}