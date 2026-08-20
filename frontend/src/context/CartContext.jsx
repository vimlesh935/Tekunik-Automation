import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(loadCartItems());
  }, []);

  useEffect(() => {
    saveCartItems(items);
  }, [items]);

  const updateState = (nextItems) => {
    setItems(nextItems);
  };

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
  };

  const removeItem = (product_id) => {
    updateState(items.filter((item) => item.product_id !== product_id));
  };

  const clearCart = () => {
    updateState([]);
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
