import React, { Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomeTopOffers from "./components/HomeTopOffers.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import WebsiteModeGuard from "./components/WebsiteModeGuard.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ComparisonProvider } from "./context/ComparisonContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { WebsiteSettingsProvider } from "./context/WebsiteSettingsContext.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import ComparisonBar from "./components/ComparisonBar.jsx";

const Home = React.lazy(() => import("./pages/Home.jsx"));
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
const Offers = React.lazy(() => import("./pages/Offers.jsx"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword.jsx"));
const ThankYou = React.lazy(() => import("./pages/ThankYou.jsx"));
const Enquiry = React.lazy(() => import("./pages/Enquiry.jsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminProducts = React.lazy(() => import("./pages/admin/AdminProducts.jsx"));
const AdminCategories = React.lazy(() => import("./pages/admin/AdminCategories.jsx"));
const AdminOrders = React.lazy(() => import("./pages/admin/AdminOrders.jsx"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminReviews = React.lazy(() => import("./pages/admin/AdminReviews.jsx"));
const AdminInventory = React.lazy(() => import("./pages/admin/AdminInventory.jsx"));
const AdminOffers = React.lazy(() => import("./pages/admin/AdminOffers.jsx"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings.jsx"));
const AdminFrontendSettings = React.lazy(() => import("./pages/admin/AdminFrontendSettings.jsx"));
const AdminBackendSettings = React.lazy(() => import("./pages/admin/AdminBackendSettings.jsx"));
const AdminSmartHomeRequests = React.lazy(() => import("./pages/admin/AdminSmartHomeRequests.jsx"));
const AdminSmartHomeRequestDetail = React.lazy(() => import("./pages/admin/AdminSmartHomeRequestDetail.jsx"));
const AdminDemoBookings = React.lazy(() => import("./pages/admin/AdminDemoBookings.jsx"));
const AdminActivityCenter = React.lazy(() => import("./pages/admin/AdminActivityCenter.jsx"));
const AboutUs = React.lazy(() => import("./pages/AboutUs.jsx"));
const ContactUs = React.lazy(() => import("./pages/ContactUs.jsx"));
const SmartHomePlanner = React.lazy(() => import("./pages/SmartHomePlanner.jsx"));
const Compare = React.lazy(() => import("./pages/Compare.jsx"));
const Notifications = React.lazy(() => import("./pages/Notifications.jsx"));

function SmartHomeProposalDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/smart-home-requests/${id}`} replace />;
}

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

/**
 * Customer-facing layout: Navbar -> offer banner -> page -> Footer.
 * Used only for storefront routes (inside the WebsiteModeGuard).
 */
function SiteLayout() {
  const location = useLocation();
  const showHomeTopOffers = location.pathname === "/" || location.pathname === "/home";

  return (
    <div className="flex flex-col min-h-screen bg-page text-primary transition-colors duration-300">
      <Navbar />
      {showHomeTopOffers && <HomeTopOffers />}
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner type="page" />}>
          <Outlet />
        </Suspense>
      </main>
      <ComparisonBar />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <ComparisonProvider>
          <ToastProvider>
          <WebsiteSettingsProvider>
            <AppContent />
          </WebsiteSettingsProvider>
          </ToastProvider>
        </ComparisonProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner type="page" />}>
      <Routes>
        {/* Admin panel — always accessible, bypasses the website mode guard */}
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
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="discounts" element={<Navigate to="/admin/offers" replace />} />
          <Route path="website-information" element={<Navigate to="/admin/settings/frontend" replace />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="settings/frontend" element={<AdminFrontendSettings />} />
          <Route path="settings/backend" element={<AdminBackendSettings />} />
          <Route path="frontend-information" element={<Navigate to="/admin/settings/frontend" replace />} />
          <Route path="smart-home-requests" element={<AdminSmartHomeRequests />} />
          <Route path="smart-home-requests/:id" element={<AdminSmartHomeRequestDetail />} />
          <Route path="smart-home-proposals" element={<Navigate to="/admin/smart-home-requests" replace />} />
          <Route path="smart-home-proposals/:id" element={<SmartHomeProposalDetailRedirect />} />
          <Route path="installation-requests" element={<Navigate to="/admin/smart-home-requests" replace />} />
          <Route path="installations" element={<Navigate to="/admin/smart-home-requests" replace />} />
          <Route path="demobooking" element={<AdminDemoBookings />} />
          <Route path="notifications" element={<AdminActivityCenter />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Customer-facing routes — guarded by the centralized website mode check */}
        <Route element={<WebsiteModeGuard />}>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/offers" element={<Offers />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;