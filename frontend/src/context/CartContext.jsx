import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { cartService } from "../services/api.js";

const CART_STORAGE_KEY = "teknode_guest_cart";
const CartContext = createContext(null);

const loadCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Failed to load cart from storage:", error);
    return [];
  }
};

const saveCartItems = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save cart to storage:", error);
  }
};

const DISCOUNT_ENABLED = true;

/**
 * Calculate discount price fields for a product.
 * Returns: { original_price, discount_percent, discount_amount, final_price }
 */
const calculateDiscountPrice = (product) => {
  if (!DISCOUNT_ENABLED) {
    const price = parseFloat(product.price) || 0;
    return {
      original_price: price,
      discount_percent: 0,
      discount_amount: 0,
      final_price: price,
    };
  }

  const originalPrice = parseFloat(product.price) || 0;
  let discountPercent = 0;
  
  if (product.discount_percent !== null && product.discount_percent !== undefined) {
    discountPercent = Math.max(0, Math.min(100, parseFloat(product.discount_percent) || 0));
  }
  
  const discountAmount = Math.max(0, originalPrice * discountPercent / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount);
  
  return {
    original_price: originalPrice,
    discount_percent: discountPercent,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_price: Math.round(finalPrice * 100) / 100,
  };
};

const calculateCart = (items) => {
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );
  // Use final_price if available (from API), otherwise use price
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.final_price || item.price) * Number(item.quantity),
    0,
  );
  return {
    itemCount: items.length,
    totalQuantity,
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

const normalizeCartItem = (product, quantity = 1) => {
  const discountFields = calculateDiscountPrice(product);
  return {
    product_id: product.id,
    name: product.name || "Untitled product",
    image_url: product.image_url || "",
    // Store original_price for display
    original_price: discountFields.original_price,
    // Store final_price for calculations (includes discount)
    price: discountFields.final_price,
    // Store discount fields for display
    discount_percent: discountFields.discount_percent,
    discount_amount: discountFields.discount_amount,
    final_price: discountFields.final_price,
    quantity: Math.max(1, Number(quantity) || 1),
    max_quantity: Number(product.stock_quantity ?? 99),
    product_status: product.status || "active",
    stock_quantity: Number(product.stock_quantity ?? 0),
  };
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartItems());
  const { isAuthenticated } = useAuth();

  const itemsRef = useRef(items);
  const syncingRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    saveCartItems(items);
  }, [items]);

  const updateState = (nextItems) => {
    setItems(nextItems);
    itemsRef.current = nextItems;
  };

  const adoptServerCart = (serverItems) => {
    const mapped = (serverItems || []).map((it) => {
      const finalPrice = Number(it.price ?? it.final_price ?? 0);
      const originalPrice = Number(it.original_price ?? finalPrice);
      return {
        cart_item_id: it.cart_item_id,
        product_id: it.product_id,
        name: it.name || "Untitled product",
        image_url: it.image_url || "",
        price: finalPrice,
        final_price: finalPrice,
        original_price: originalPrice,
        discount_percent: Number(it.discount_percent ?? 0),
        discount_amount: Math.max(0, originalPrice - finalPrice),
        quantity: Number(it.quantity || 0),
        max_quantity: Number(
          it.max_quantity ?? it.stock_quantity ?? it.maxQuantity ?? 99,
        ),
        stock_quantity: Number(it.stock_quantity ?? 0),
        product_status: it.product_status || "active",
        is_available: it.is_available !== false,
      };
    });
    updateState(mapped);
    return mapped;
  };

  const fetchServerCart = async () => {
    try {
      const res = await cartService.getCart();
      const c = res?.data?.cart || res?.data || {};
      return c?.items && c.items.length > 0 ? c.items : [];
    } catch (error) {
      console.warn("[CART] fetch server cart failed:", error.message);
      return null;
    }
  };

  const resolveServerItemId = async (productId) => {
    const local = itemsRef.current.find((i) => i.product_id === productId);
    if (local && local.cart_item_id) return local.cart_item_id;
    const serverItems = await fetchServerCart();
    if (serverItems === null) return null;
    const hit = serverItems.find((i) => i.product_id === productId);
    return hit ? hit.cart_item_id : null;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current || syncingRef.current) return;
    hydratedRef.current = true;
    syncingRef.current = true;
    (async () => {
      try {
        const serverItems = await fetchServerCart();
        if (serverItems === null) return;
        if (serverItems.length > 0) {
          adoptServerCart(serverItems);
        } else {
          const localItems = itemsRef.current;
          if (localItems && localItems.length > 0) {
            for (const it of localItems) {
              try {
                await cartService.addToCart(it.product_id, it.quantity || 1);
              } catch (error) {
                console.warn("[CART] sync local to server failed:", error.message);
              }
            }
            const synced = await fetchServerCart();
            if (synced !== null && synced.length > 0) {
              adoptServerCart(synced);
            }
          }
        }
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [isAuthenticated]);

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) return;

    const normalizedItem = normalizeCartItem(product, quantity);
    const existingIndex = items.findIndex(
      (item) => item.product_id === normalizedItem.product_id,
    );
    const nextItems = [...items];

    if (existingIndex >= 0) {
      const existingItem = nextItems[existingIndex];
      const newQuantity = Math.min(
        existingItem.max_quantity,
        existingItem.quantity + normalizedItem.quantity,
      );
      nextItems[existingIndex] = { ...existingItem, quantity: newQuantity };
    } else {
      const quantityToAdd = Math.min(
        normalizedItem.max_quantity,
        normalizedItem.quantity,
      );
      nextItems.push({ ...normalizedItem, quantity: quantityToAdd });
    }

    updateState(nextItems);

    if (isAuthenticated) {
      (async () => {
        try {
          const res = await cartService.addToCart(
            normalizedItem.product_id,
            normalizedItem.quantity,
          );
          const c = res?.data?.cart || res?.data || {};
          if (c?.items) adoptServerCart(c.items);
        } catch (error) {
          console.warn("[CART] server add failed:", error.message);
        }
      })();
    }
  };

  const updateCartItem = (product_id, quantity) => {
    const nextQuantity = Number(quantity);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0) return;

    const nextItems = items
      .map((item) => {
        if (item.product_id !== product_id) return item;
        if (nextQuantity === 0) return null;
        return { ...item, quantity: Math.min(item.max_quantity, nextQuantity) };
      })
      .filter(Boolean);

    updateState(nextItems);

    if (isAuthenticated) {
      (async () => {
        try {
          if (nextQuantity === 0) {
            const itemId = await resolveServerItemId(product_id);
            if (itemId) await cartService.removeFromCart(itemId);
          } else {
            const itemId = await resolveServerItemId(product_id);
            if (itemId) {
              const res = await cartService.updateCartItem(itemId, nextQuantity);
              const c = res?.data?.cart || res?.data || {};
              if (c?.items) adoptServerCart(c.items);
            }
          }
        } catch (error) {
          console.warn("[CART] server update failed:", error.message);
        }
      })();
    }
  };

  const removeItem = (product_id) => {
    updateState(items.filter((item) => item.product_id !== product_id));

    if (isAuthenticated) {
      (async () => {
        try {
          const itemId = await resolveServerItemId(product_id);
          if (itemId) await cartService.removeFromCart(itemId);
        } catch (error) {
          console.warn("[CART] server remove failed:", error.message);
        }
      })();
    }
  };

  const clearCart = () => {
    updateState([]);

    if (isAuthenticated) {
      cartService.clearCart().catch((error) => {
        console.warn("[CART] server clear failed:", error.message);
      });
    }
  };

  const totals = useMemo(() => calculateCart(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...totals,
        addToCart,
        updateCartItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
