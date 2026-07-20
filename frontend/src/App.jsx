import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomeTopOffers from "./components/HomeTopOffers.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { WebsiteSettingsProvider } from "./context/WebsiteSettingsContext.jsx";

const Home = React.lazy(() => import("./pages/Home.jsx"));
const ComingSoon = React.lazy(() => import("./pages/ComingSoon.jsx"));
const Shop = React.lazy(() => import("./pages/Shop.jsx"));
const Login = React.lazy(() => import("./pages/Login.jsx"));
const Register = React.lazy(() => import("./pages/Register.jsx"));
const Cart = React.lazy(() => import("./pages/Cart.jsx"));
const Checkout = React.lazy(() => import("./pages/Checkout.jsx"));
const OrderConfirmation = React.lazy(() => import("./pages/OrderConfirmation.jsx"));
const OrderHistory = React.lazy(() => import("./pages/OrderHistory.jsx"));
const OrderDetails = React.lazy(() => import("./pages/OrderDetails.jsx"));
const TrackOrder = React.lazy(() => import("./pages/TrackOrder.jsx"));
const ProductDetails = React.lazy(() => import("./pages/ProductDetails.jsx"));
const SearchResults = React.lazy(() => import("./pages/SearchResults.jsx"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword.jsx"));
const ThankYou = React.lazy(() => import("./pages/ThankYou.jsx"));
const Enquiry = React.lazy(() => import("./pages/Enquiry.jsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel.jsx"));
const AboutUs = React.lazy(() => import("./pages/AboutUs.jsx"));
const ContactUs = React.lazy(() => import("./pages/ContactUs.jsx"));
const SmartHomePlanner = React.lazy(() => import("./pages/SmartHomePlanner.jsx"));
const SmartHomeProposals = React.lazy(() => import("./pages/SmartHomeProposals.jsx"));
const SmartHomeProposalDetail = React.lazy(() => import("./pages/SmartHomeProposalDetail.jsx"));

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
            <WebsiteSettingsProvider>
              <AppContent />
            </WebsiteSettingsProvider>
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
  const showHomeTopOffers = location.pathname === "/home";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <Suspense fallback={<LoadingSpinner type="admin" />}>
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
          >
            <Route path="smart-home-proposals" element={<SmartHomeProposals />} />
            <Route path="smart-home-proposals/:id" element={<SmartHomeProposalDetail />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // Root path shows standalone Coming Soon page
  if (location.pathname === "/") {
    return (
      <Suspense fallback={<LoadingSpinner type="page" />}>
        <ComingSoon />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-page text-primary transition-colors duration-300">
      {showHomeTopOffers && <HomeTopOffers />}
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner type="page" />}>
          <Routes>
            <Route path="/home" element={<Home />} />
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
            <Route path="/smart-home-planner" element={<SmartHomePlanner />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
