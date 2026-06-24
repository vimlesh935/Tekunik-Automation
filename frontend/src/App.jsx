import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import ThankYou from "./pages/ThankYou.jsx";
import Enquiry from "./pages/Enquiry.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const isAdminRoute =
    location.pathname === "/admin-login" ||
    location.pathname.startsWith("/admin");
  const showHomeTopOffers = location.pathname === "/";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <AdminPanel onLogout={logout} />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />
        <Route
          path="/admin/*"
          element={
            isAuthenticated ? (
              <AdminPanel onLogout={logout} />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-page text-primary transition-colors duration-300">
      {showHomeTopOffers && <HomeTopOffers />}
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/enquiry" element={<Enquiry />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
