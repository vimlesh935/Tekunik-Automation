const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { withNormalizedImageUrl } = require("../utils/uploadPaths");

const findOrCreateCart = async (userId) => {
  const [existingCart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (existingCart) return existingCart;

  const result = await query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
  const [newCart] = await query("SELECT * FROM carts WHERE id = ?", [result.insertId]);
  return newCart;
};

const getCartDetails = async (cartId) => {
  const items = await query(
    `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.slug, p.price, p.image_url,
            p.stock_quantity, p.stock_status, p.status AS product_status
     FROM cart_items ci
     LEFT JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cartId]
  );

  const validItems = items.map((item) => ({
    ...withNormalizedImageUrl(item),
    max_quantity: item.stock_quantity,
    is_available: item.product_status === "active" && item.stock_quantity > 0,
    total_price: Number(item.price) * Number(item.quantity),
  }));

  const totalAmount = validItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalQuantity = validItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return {
    items: validItems,
    totalQuantity,
    totalAmount: Number(totalAmount.toFixed(2)),
    itemCount: validItems.length,
  };
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user.id);
  const details = await getCartDetails(cart.id);
  return success(res, "Cart fetched successfully", {
    cart: {
      id: cart.id,
      user_id: cart.user_id,
      ...details,
    },
  });
});

const addToCart = asyncHandler(async (req, res) => {
  console.log("[DEBUG addToCart]", {
    user: req.user,
    body: req.body,
    headersAuth: req.headers.authorization,
  });

  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id || quantity < 1) {
    throw new AppError("product_id and quantity are required", 400, "VALIDATION_ERROR");
  }

  const [product] = await query("SELECT * FROM products WHERE id = ? AND status = 'active'", [product_id]);
  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  if (product.stock_quantity < 1) {
    throw new AppError("Product is out of stock", 400, "OUT_OF_STOCK");
  }

  const cart = await findOrCreateCart(userId);
  const [existingItem] = await query(
    "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
    [cart.id, product_id]
  );

  const requestedQuantity = parseInt(quantity, 10);
  const newQuantity = existingItem ? existingItem.quantity + requestedQuantity : requestedQuantity;

  if (newQuantity > product.stock_quantity) {
    throw new AppError(
      `Cannot add ${requestedQuantity} item(s). Only ${product.stock_quantity} available`,
      400,
      "INSUFFICIENT_STOCK"
    );
  }

  if (existingItem) {
    await query(
      "UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newQuantity, existingItem.id]
    );
  } else {
    await query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
      [cart.id, product_id, requestedQuantity]
    );
  }

  const details = await getCartDetails(cart.id);
  return success(res, "Item added to cart", {
    cart: {
      id: cart.id,
      user_id: cart.user_id,
      ...details,
    },
  }, 201);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await findOrCreateCart(userId);
  const { item_id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null || quantity < 0) {
    throw new AppError("quantity is required and must be 0 or greater", 400, "VALIDATION_ERROR");
  }

  const [item] = await query("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?", [item_id, cart.id]);
  if (!item) {
    throw new AppError("Cart item not found", 404, "NOT_FOUND");
  }

  if (quantity === 0) {
    await query("DELETE FROM cart_items WHERE id = ?", [item_id]);
    const details = await getCartDetails(cart.id);
    return success(res, "Cart item removed", {
      cart: {
        id: cart.id,
        user_id: cart.user_id,
        ...details,
      },
    });
  }

  const [product] = await query("SELECT * FROM products WHERE id = ?", [item.product_id]);
  if (!product || product.status !== "active") {
    throw new AppError("Product is no longer available", 400, "PRODUCT_UNAVAILABLE");
  }

  if (quantity > product.stock_quantity) {
    throw new AppError(
      `Cannot set quantity to ${quantity}. Only ${product.stock_quantity} available`,
      400,
      "INSUFFICIENT_STOCK"
    );
  }

  await query("UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [quantity, item_id]);
  const details = await getCartDetails(cart.id);
  return success(res, "Cart item updated", {
    cart: {
      id: cart.id,
      user_id: cart.user_id,
      ...details,
    },
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await findOrCreateCart(userId);
  const { item_id } = req.params;

  const [item] = await query("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?", [item_id, cart.id]);
  if (!item) {
    throw new AppError("Cart item not found", 404, "NOT_FOUND");
  }

  await query("DELETE FROM cart_items WHERE id = ?", [item_id]);
  const details = await getCartDetails(cart.id);
  return success(res, "Cart item removed", {
    cart: {
      id: cart.id,
      user_id: cart.user_id,
      ...details,
    },
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await findOrCreateCart(userId);
  await query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
  return success(res, "Cart cleared", {
    cart: {
      id: cart.id,
      user_id: cart.user_id,
      items: [],
      itemCount: 0,
      totalQuantity: 0,
      totalAmount: 0,
    },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
