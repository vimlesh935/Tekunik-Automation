const RAW_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).trim();

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");

const LOCAL_BACKEND_FALLBACK = "http://localhost:8787";

const headers = {
  "Content-Type": "application/json",
};

let globalLogoutCallback = null;

export const setGlobalLogoutCallback = (callback) => {
  globalLogoutCallback = callback;
};

const getAuthToken = () => localStorage.getItem("authToken");

const triggerAuthClear = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("auth_data");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("auth_data");
  if (globalLogoutCallback) {
    globalLogoutCallback();
  }
};

const normalizeEndpoint = (endpoint) => {
  const normalized = `/${String(endpoint || "").replace(/^\/+/, "")}`;
  return /\/api$/i.test(API_BASE_URL) && normalized.startsWith("/api/")
    ? normalized.slice(4)
    : normalized;
};

export const getApiUrl = (endpoint, baseUrl = API_BASE_URL) =>
  `${baseUrl}${normalizeEndpoint(endpoint)}`;

const buildApiBaseCandidates = () => {
  const candidates = [];
  const addCandidate = (value) => {
    const normalized = String(value || "")
      .trim()
      .replace(/\/$/, "");
    if (!normalized && normalized !== "") return;
    if (!candidates.includes(normalized)) candidates.push(normalized);
  };

  addCandidate(API_BASE_URL);

  if (typeof window !== "undefined") {
    const isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalHost) {
      // Vite dev proxy fallback (/api -> backend) when env URL is wrong/unreachable.
      addCandidate("");
      // Direct local backend fallback when proxy isn't active.
      addCandidate(LOCAL_BACKEND_FALLBACK);
    }
  }

  return candidates.length > 0 ? candidates : [""];
};

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
    triggerAuthClear();
  }
  return error;
};

const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const requestHeaders = { ...headers, ...options.headers };
  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    delete requestHeaders["Content-Type"];
  }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  // Prevent browser from serving stale cached GET responses
  if (!options.method || options.method === "GET") {
    requestHeaders["Cache-Control"] = "no-cache, no-store, must-revalidate";
    requestHeaders["Pragma"] = "no-cache";
  }

  const baseCandidates = buildApiBaseCandidates();
  let lastNetworkError = null;

  for (const baseUrl of baseCandidates) {
    const requestUrl = getApiUrl(endpoint, baseUrl);

    try {
      const response = await fetch(requestUrl, {
        ...options,
        headers: requestHeaders,
        credentials: "include",
      });
      const payload = await readResponseBody(response);

      if (!response.ok) {
        const apiError = await normalizeApiError(response, payload || {});
        apiError.requestUrl = requestUrl;
        throw apiError;
      }

      if (baseUrl !== API_BASE_URL) {
        console.warn(
          `[API] Recovered using fallback base URL: ${baseUrl || "(same-origin /api proxy)"}`,
        );
      }

      return payload || { success: true, data: null };
    } catch (error) {
      const isNetworkError =
        error?.message === "Failed to fetch" || error?.name === "TypeError";

      if (!isNetworkError) {
        if (error?.status === 401) {
          triggerAuthClear();
        }
        throw error;
      }

      lastNetworkError = { ...error, requestUrl };
      console.warn(
        `[API] Network error for ${requestUrl}: ${error.message || error.name}`,
      );
    }
  }

  throw {
    status: 0,
    message:
      "Unable to connect to the server. Please refresh the page or try again later.",
    code: "NETWORK_ERROR",
    requestUrl: lastNetworkError?.requestUrl || getApiUrl(endpoint),
    details: {
      attemptedBaseUrls: buildApiBaseCandidates().map(
        (baseUrl) => baseUrl || "(same-origin /api proxy)",
      ),
    },
  };
};

// ─────────────────────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────────────────────

export const authService = {
  login: (email, password) =>
    apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload) =>
    apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendOtp: (email) =>
    apiCall("/api/auth/login/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email, otp) =>
    apiCall("/api/auth/login/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

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
    apiCall("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    apiCall(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    apiCall(`/api/admin/categories/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
// PRODUCT SERVICES
// ─────────────────────────────────────────────────────────────

export const productService = {
  getAllProducts: (page = 1, limit = 12, search = "", categoryId = "") => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (categoryId) params.set("category_id", categoryId);
    const endpoint = `/api/products?${params.toString()}`;
    console.log("[PRODUCT API] API URL:", getApiUrl(endpoint));
    return apiCall(endpoint);
  },
  getFeaturedProducts: (limit = 8) =>
    apiCall(`/api/products/featured?limit=${Math.max(1, Number(limit) || 8)}`),
  getProductById: (id) => apiCall(`/api/products/${id}`),
  searchProducts: (query, limit = 20) => {
    const params = new URLSearchParams();
    params.set("search", query || "");
    params.set("limit", limit);
    return apiCall(`/api/products?${params.toString()}`);
  },
  getProductsByCategory: (categoryId, page = 1, limit = 12) =>
    apiCall(
      `/api/products?category_id=${categoryId}&page=${page}&limit=${limit}`,
    ),
  getProductsByApplication: (application, page = 1, limit = 12) =>
    apiCall(`/api/products/application/${encodeURIComponent(application)}?page=${page}&limit=${limit}`),
  getApplicationCounts: () =>
    apiCall("/api/products/applications/counts"),
};

export const adminProductService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.search) query.set("search", params.search);
    if (params.category_id) query.set("category_id", params.category_id);
    return apiCall(`/api/admin/products?${query.toString()}`);
  },
  get: (id) => apiCall(`/api/admin/products/${id}`),
  create: (data) =>
    apiCall("/api/admin/products", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? {} : { "Content-Type": "application/json" },
    }),
  update: (id, data) =>
    apiCall(`/api/admin/products/${id}`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? {} : { "Content-Type": "application/json" },
    }),
  delete: (id) =>
    apiCall(`/api/admin/products/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
// CART SERVICES
// ─────────────────────────────────────────────────────────────

export const cartService = {
  getCart: () => apiCall("/api/cart"),
  addToCart: (productId, quantity = 1) =>
    apiCall("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  removeFromCart: (cartItemId) =>
    apiCall(`/api/cart/item/${cartItemId}`, { method: "DELETE" }),
  updateCartItem: (cartItemId, quantity) =>
    apiCall(`/api/cart/item/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  clearCart: () => apiCall("/api/cart/clear", { method: "DELETE" }),
  checkout: (orderData) =>
    apiCall("/api/orders", { method: "POST", body: JSON.stringify(orderData) }),
};

// ─────────────────────────────────────────────────────────────
// USER SERVICES
// ─────────────────────────────────────────────────────────────

export const userService = {
  getCurrentUser: () => apiCall("/api/user/profile"),
  updateProfile: (userData) =>
    apiCall("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
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
    apiCall("/api/guest/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),
  trackOrder: (trackData) =>
    apiCall("/api/guest/orders/track", {
      method: "POST",
      body: JSON.stringify(trackData),
    }),
};

export const orderService = {
  trackOrder: (trackData) =>
    apiCall("/api/guest/orders/track", {
      method: "POST",
      body: JSON.stringify(trackData),
    }),
  getOrders: (page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    return apiCall(`/api/user/orders?${params.toString()}`);
  },
  getOrder: (orderId) => apiCall(`/api/user/orders/${orderId}`),
  cancelOrder: (orderId) =>
    apiCall(`/api/user/orders/${orderId}/cancel`, { method: "POST" }),
  downloadUserInvoice: (orderId) =>
    fetch(getApiUrl(`/api/user/orders/${orderId}/download-invoice`), {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: "include",
    }),
  downloadGuestInvoice: (orderNumber, email) => {
    const params = new URLSearchParams();
    params.set("order_number", orderNumber || "");
    params.set("email", email || "");
    return fetch(
      getApiUrl(`/api/guest/orders/download-invoice?${params.toString()}`),
      {
        credentials: "include",
      },
    );
  },
};

// ─────────────────────────────────────────────────────────────
// ADMIN USER SERVICES
// ─────────────────────────────────────────────────────────────

export const adminUserService = {
  getUser: (userId) => apiCall(`/api/admin/users/${userId}`),
  toggleUser: (userId) =>
    apiCall(`/api/admin/users/${userId}/toggle`, { method: "PATCH" }),
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
    apiCall(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getOrderStats: () => apiCall("/api/admin/orders/stats"),
  downloadInvoice: (orderId) => apiCall(`/api/admin/orders/${orderId}/invoice`),
  regenerateInvoice: (orderId) =>
    apiCall(`/api/admin/orders/${orderId}/invoice`, { method: "POST" }),
};

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD SERVICES
// ─────────────────────────────────────────────────────────────

export const adminDashboardService = {
  getOrderAnalytics: () => apiCall("/api/admin/dashboard/order-analytics"),
};

// ─────────────────────────────────────────────────────────────
// REVIEW SERVICES
// ─────────────────────────────────────────────────────────────

export const reviewService = {
  // Product Reviews
  createReview: (data) =>
    apiCall("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProductReviews: (productId, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    return apiCall(`/api/products/${productId}/reviews?${params.toString()}`);
  },
  getUserReviewForOrder: (orderId, productId) =>
    apiCall(`/api/user/orders/${orderId}/products/${productId}/review`),
  getAdminReviews: (page = 1, limit = 20, status = "") => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) params.set("status", status);
    return apiCall(`/api/admin/reviews?${params.toString()}`);
  },

  // Website Reviews
  createWebsiteReview: (data) =>
    apiCall("/api/website-reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyWebsiteReview: () =>
    apiCall("/api/website-reviews/my"),
  getWebsiteReviews: () =>
    apiCall("/api/website-reviews"),
  getAdminWebsiteReviews: (page = 1, limit = 20, status = "") => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) params.set("status", status);
    return apiCall(`/api/admin/website-reviews?${params.toString()}`);
  },
};

// ─────────────────────────────────────────────────────────────
// DEMO ENQUIRY SERVICES
// ─────────────────────────────────────────────────────────────

export const demoEnquiryService = {
  submit: async (data) => {
    // First try the primary endpoint
    try {
      return await apiCall("/api/demo-enquiry", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (primaryError) {
      // If primary endpoint returns 404/ROUTE_NOT_FOUND, try legacy
      if (primaryError?.status === 404 || primaryError?.code === "ROUTE_NOT_FOUND") {
        console.warn("[DEMO] Primary endpoint failed, trying legacy route");
        return await apiCall("/api/enquiry/demo", {
          method: "POST",
          body: JSON.stringify({
            ...data,
            name: data.full_name,
            preferredDate: data.preferred_date,
            preferredTime: data.preferred_time,
          }),
        });
      }
      // Re-throw all other errors
      throw primaryError;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// ADMIN DEMO ENQUIRY SERVICES
// ─────────────────────────────────────────────────────────────

export const adminDemoEnquiryService = {
  list: (page = 1, limit = 50) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    return apiCall(`/api/admin/demo-enquiries?${params.toString()}`);
  },
  updateStatus: (id, status) =>
    apiCall(`/api/admin/demo-enquiries/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (id) =>
    apiCall(`/api/admin/demo-enquiries/${id}`, { method: "DELETE" }),
};

export default apiCall;
