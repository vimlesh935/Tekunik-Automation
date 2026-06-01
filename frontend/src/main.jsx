import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import HomeTopOffers from "./components/HomeTopOffers.jsx";
import Shop from "./pages/Shop.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import "./index.css";

console.log("[Tekunik] App initializing...");

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("authToken");
      if (savedToken) setToken(savedToken);
    } catch (e) {
      console.warn("[Tekunik] localStorage read failed:", e);
    }
    setLoading(false);
  }, []);

  const handleLogin = (newToken) => {
    try {
      localStorage.setItem("authToken", newToken);
    } catch (e) {
      console.warn("[Tekunik] localStorage write failed:", e);
    }
    setToken(newToken);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("authToken");
    } catch (e) {
      console.warn("[Tekunik] localStorage remove failed:", e);
    }
    setToken(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <AppContent token={token} onLogout={handleLogout} onLogin={handleLogin} />
          </Router>
        </ToastProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

function AppContent({ token, onLogout, onLogin }) {
  const location = useLocation();

  // All admin routes — no storefront UI rendered here
  const isAdminRoute = location.pathname === "/admin-login" ||
    location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            token
              ? <AdminPanel token={token} onLogout={onLogout} />
              : <Navigate to="/admin-login" replace />
          }
        />
        <Route
          path="/admin/*"
          element={
            token
              ? <AdminPanel token={token} onLogout={onLogout} />
              : <Navigate to="/admin-login" replace />
          }
        />
      </Routes>
    );
  }

  // User / storefront layout
  const showHomeTopOffers = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen bg-page text-primary transition-colors duration-300">
      {showHomeTopOffers && <HomeTopOffers />}
      <Navbar token={token} onLogout={onLogout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route path="/shop" element={<Shop token={token} />} />
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onLogin={onLogin} />} />
          <Route path="/product/:id" element={<ProductDetails token={token} />} />
          <Route path="/search" element={<SearchResults token={token} />} />
          <Route path="/cart" element={<Cart token={token} />} />
          <Route path="/checkout" element={<Checkout token={token} />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route
            path="/orders"
            element={token ? <OrderHistory token={token} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/orders/:id"
            element={token ? <OrderDetails token={token} /> : <Navigate to="/login" replace />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={token ? <Dashboard token={token} onLogout={onLogout} /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[Tekunik] Root element not found!");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("[Tekunik] App mounted successfully");
}
