const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const headers = {
  "Content-Type": "application/json",
};

const getAuthToken = () => localStorage.getItem("authToken");

const normalizeEndpoint = (endpoint) => {
  const normalized = `/${String(endpoint || "").replace(/^\/+/, "")}`;
  return /\/api$/i.test(API_BASE_URL) && normalized.startsWith("/api/")
    ? normalized.slice(4)
    : normalized;
};

export const getApiUrl = (endpoint) => `${API_BASE_URL}${normalizeEndpoint(endpoint)}`;

const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const normalizeApiError = async (response, payload) => {
  const details = payload?.data || payload?.details || null;
  const error = {
    status: response.status,
    message: payload?.message || "Something went wrong. Please try again.",
    code: payload?.code || "API_ERROR",
    details,
  };
  if (response.status === 401) {
    localStorage.removeItem("authToken");
  }
  return error;
};

const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const requestHeaders = { ...headers, ...options.headers };
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  const requestUrl = getApiUrl(endpoint);
  try {
    const response = await fetch(requestUrl, {
      ...options,
      headers: requestHeaders,
      credentials: "include",
    });
    const payload = await readResponseBody(response);
    if (!response.ok) {
      throw await normalizeApiError(response, payload || {});
    }
    return payload || { success: true, data: null };
  } catch (error) {
    if (error?.status === 401) {
      localStorage.removeItem("authToken");
    }
    if (error?.message === "Failed to fetch" || error?.name === "TypeError") {
      throw {
        status: 0,
        message: "Unable to connect to the server. Please refresh the page or try again later.",
        code: "NETWORK_ERROR",
      };
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────────────────────

export const authService = {
  login: (email, password) =>
    apiCall("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (payload) =>
    apiCall("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  sendOtp: (email) =>
    apiCall("/api/auth/login/send-otp", { method: "POST", body: JSON.stringify({ email }) }),

  verifyOtp: (email, otp) =>
    apiCall("/api/auth/login/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),

  logout: () => {
    localStorage.removeItem("authToken");
    return apiCall("/api/auth/logout", { method: "POST" });
  },
};

// ─────────────────────────────────────────────────────────────
// CATEGORY SERVICES
// ─────────────────────────────────────────────────────────────

export const categoryService = {
  getAllCategories: () => apiCall("/api/categories"),
  getAdminCategories: () => apiCall("/api/admin/categories"),
  createCategory: (data) =>
    apiCall("/api/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    apiCall(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) =>
    apiCall(`/api/admin/categories/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
// PRODUCT SERVICES
// ─────────────────────────────────────────────────────────────

export const productService = {
  getAllProducts: (page = 1, limit = 12, search = "") => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (search) params.set("search", search);
    return apiCall(`/api/products?${params.toString()}`);
  },
  getProductById: (id) => apiCall(`/api/products/${id}`),
  searchProducts: (query, limit = 20) => {
    const params = new URLSearchParams();
    params.set("search", query || "");
    params.set("limit", limit);
    return apiCall(`/api/products?${params.toString()}`);
  },
  getProductsByCategory: (categoryId, page = 1, limit = 12) =>
    apiCall(`/api/products?category=${categoryId}&page=${page}&limit=${limit}`),
};

// ─────────────────────────────────────────────────────────────
// CART SERVICES
// ─────────────────────────────────────────────────────────────

export const cartService = {
  getCart: () => apiCall("/api/cart"),
  addToCart: (productId, quantity = 1) =>
    apiCall("/api/cart/add", { method: "POST", body: JSON.stringify({ product_id: productId, quantity }) }),
  removeFromCart: (cartItemId) =>
    apiCall(`/api/cart/item/${cartItemId}`, { method: "DELETE" }),
  updateCartItem: (cartItemId, quantity) =>
    apiCall(`/api/cart/item/${cartItemId}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  clearCart: () =>
    apiCall("/api/cart/clear", { method: "DELETE" }),
  checkout: (orderData) =>
    apiCall("/api/orders", { method: "POST", body: JSON.stringify(orderData) }),
};

// ─────────────────────────────────────────────────────────────
// USER SERVICES
// ─────────────────────────────────────────────────────────────

export const userService = {
  getCurrentUser: () => apiCall("/api/user/profile"),
  updateProfile: (userData) =>
    apiCall("/api/user/profile", { method: "PUT", body: JSON.stringify(userData) }),
  getOrders: (page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    return apiCall(`/api/user/orders?${params.toString()}`);
  },
  getOrder: (orderId) => apiCall(`/api/user/orders/${orderId}`),
};

// ─────────────────────────────────────────────────────────────
// GUEST ORDER SERVICES
// ─────────────────────────────────────────────────────────────

export const guestOrderService = {
  createOrder: (orderData) =>
    apiCall("/api/guest/orders", { method: "POST", body: JSON.stringify(orderData) }),
  trackOrder: (trackData) =>
    apiCall("/api/guest/orders/track", { method: "POST", body: JSON.stringify(trackData) }),
};

export const orderService = {
  trackOrder: (trackData) =>
    apiCall("/api/guest/orders/track", { method: "POST", body: JSON.stringify(trackData) }),
  getOrders: (page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    return apiCall(`/api/user/orders?${params.toString()}`);
  },
  getOrder: (orderId) => apiCall(`/api/user/orders/${orderId}`),
};

// ─────────────────────────────────────────────────────────────
// ADMIN USER SERVICES
// ─────────────────────────────────────────────────────────────

export const adminUserService = {
  getUser: (userId) => apiCall(`/api/admin/users/${userId}`),
  toggleUser: (userId) => apiCall(`/api/admin/users/${userId}/toggle`, { method: "PATCH" }),
};

// ─────────────────────────────────────────────────────────────
// ADMIN ORDER SERVICES
// ─────────────────────────────────────────────────────────────

export const adminOrderService = {
  getAllOrders: (page = 1, limit = 20, status = "", search = "") => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiCall(`/api/admin/orders?${params.toString()}`);
  },
  getOrder: (orderId) => apiCall(`/api/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, data) =>
    apiCall(`/api/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  getOrderStats: () => apiCall("/api/admin/orders/stats"),
  downloadInvoice: (orderId) => apiCall(`/api/admin/orders/${orderId}/invoice`),
  regenerateInvoice: (orderId) =>
    apiCall(`/api/admin/orders/${orderId}/invoice`, { method: "POST" }),
};

export default apiCall;
