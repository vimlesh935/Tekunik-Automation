// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   User, Package, MapPin, LogOut, ShoppingBag, Clock,
//   CheckCircle, XCircle, Truck, Loader, Settings, Mail,
//   Phone, Home, ArrowLeft, ChevronRight, ShoppingCart,
//   Sparkles, Eye, UserCircle, Calendar, CreditCard,
// } from "lucide-react";
// import apiCall, { productService } from "../services/api";
// import SafeImage from "../components/SafeImage.jsx";
// import { useCart } from "../context/CartContext.jsx";

// export default function Dashboard({ token, onLogout }) {
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [activeTab, setActiveTab] = useState("profile");
//   const [profile, setProfile] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [form, setForm] = useState({
//     first_name: "", last_name: "", phone: "", address: "", city: "",
//   });
//   const [notification, setNotification] = useState("");
//   const [recommendedProducts, setRecommendedProducts] = useState([]);
//   const [notifType, setNotifType] = useState("success");

//   useEffect(() => {
//     loadDashboardData();
//     loadRecommendedProducts();
//   }, []);

//   const loadDashboardData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const [profileRes, ordersRes] = await Promise.all([
//         apiCall("/api/user/profile", {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//         apiCall("/api/user/orders", {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//       ]);

//       const userData = profileRes.data?.user || profileRes.data;
//       setProfile(userData);

//       const orderData = ordersRes.data?.orders || ordersRes.data || [];
//       // Parse order items if stored as JSON string
//       const parsedOrders = (Array.isArray(orderData) ? orderData : []).map(o => ({
//         ...o,
//         items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
//       }));
//       setOrders(parsedOrders);

//       setForm({
//         first_name: userData?.first_name || "",
//         last_name: userData?.last_name || "",
//         phone: userData?.phone || "",
//         address: userData?.address || "",
//         city: userData?.city || "",
//       });
//     } catch (err) {
//       console.warn("Dashboard load error:", err);
//       setError(err.message || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadRecommendedProducts = async () => {
//     try {
//       const response = await productService.getAllProducts(1, 4);
//       const products = response.data?.products || [];
//       setRecommendedProducts(products.slice(0, 4));
//     } catch (err) {
//       console.warn("Failed to load recommended products:", err);
//     }
//   };

//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     setError("");
//     try {
//       const res = await apiCall("/api/user/profile", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(form),
//       });
//       const updatedUser = res.data?.user || res.data;
//       setProfile(updatedUser);
//       setEditMode(false);
//       showNotification("Profile updated successfully!", "success");
//     } catch (err) {
//       setError(err.message || "Failed to update profile");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const showNotification = (message, type = "success") => {
//     setNotification(message);
//     setNotifType(type);
//     setTimeout(() => setNotification(""), 3000);
//   };

//   const handleAddToCart = async (product, e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     addToCart(product, 1);
//     showNotification(`${product.name} added to cart!`, "success");
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "pending": return <Clock size={16} className="text-yellow-400" />;
//       case "processing": return <Loader size={16} className="text-blue-400" />;
//       case "shipped": return <Truck size={16} className="text-cyan-400" />;
//       case "delivered": return <CheckCircle size={16} className="text-emerald-400" />;
//       case "cancelled": return <XCircle size={16} className="text-red-400" />;
//       default: return <Clock size={16} className="text-gray-400" />;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
//       case "processing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
//       case "shipped": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
//       case "delivered": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
//       case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20";
//       default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#080c18] flex items-center justify-center">
//         <div className="relative w-12 h-12">
//           <div className="absolute inset-0 rounded-full border-2 border-white/[0.06] border-t-cyan-400 animate-spin" />
//         </div>
//       </div>
//     );
//   }

//   const recentOrders = orders.slice(0, 3);

//   return (
//     <div className="min-h-screen bg-[#080c18] text-white transition-colors duration-300">
//       {/* Notification */}
//       {notification && (
//         <div className={`fixed top-20 right-4 z-50 bg-[#0d1525]/95 backdrop-blur-xl border rounded-2xl px-6 py-4 text-sm shadow-2xl animate-slide-down max-w-sm ${
//           notifType === "success" ? "border-emerald-500/20" : "border-red-500/20"
//         }`}>
//           <div className="flex items-center gap-3">
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
//               notifType === "success" ? "bg-emerald-500/20" : "bg-red-500/20"
//             }`}>
//               {notifType === "success" ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
//             </div>
//             <span className="text-gray-200">{notification}</span>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="relative border-b border-white/[0.04] bg-gradient-to-b from-[#0a0e1a] to-[#080c18]">
//         <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-500/25 border border-cyan-500/15 flex items-center justify-center">
//                 <UserCircle size={28} className="text-cyan-400" />
//               </div>
//               <div>
//                 <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
//                   Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
//                 </h1>
//                 <p className="text-gray-500 text-sm mt-1">{profile?.email || "Manage your account"}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <Link to="/shop"
//                 className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all">
//                 <ShoppingBag size={16} /> Shop
//               </Link>
//               <button onClick={onLogout}
//                 className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
//                 <LogOut size={16} /> Sign Out
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Error banner */}
//       {error && (
//         <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6">
//           <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
//             {error}
//           </div>
//         </div>
//       )}

//       <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
//         <div className="grid lg:grid-cols-[280px_1fr] gap-8">

//           {/* Sidebar Navigation */}
//           <div className="space-y-1">
//             <button onClick={() => setActiveTab("profile")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
//                 activeTab === "profile"
//                   ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
//                   : "text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
//               }`}>
//               <User size={18} />
//               <span className="font-medium text-sm">My Profile</span>
//             </button>
//             <button onClick={() => setActiveTab("orders")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
//                 activeTab === "orders"
//                   ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
//                   : "text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
//               }`}>
//               <Package size={18} />
//               <span className="font-medium text-sm">Order History</span>
//             </button>
//             <button onClick={() => setActiveTab("addresses")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
//                 activeTab === "addresses"
//                   ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
//                   : "text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
//               }`}>
//               <MapPin size={18} />
//               <span className="font-medium text-sm">Saved Address</span>
//             </button>
            
//             {/* Quick links */}
//             <div className="pt-6 space-y-1">
//               <Link to="/track-order"
//                 className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 transition-all text-sm font-medium">
//                 <Truck size={18} /> Track Order
//               </Link>
//               <Link to="/orders"
//                 className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 transition-all text-sm font-medium">
//                 <Eye size={18} /> All Orders
//               </Link>
//             </div>
//           </div>

//           {/* Main Content */}
//           <div className="space-y-6">

//             {/* ═══ PROFILE TAB ═══ */}
//             {activeTab === "profile" && (
//               <div className="rounded-2xl bg-[#0d1525]/60 border border-white/[0.04] p-6 sm:p-8">
//                 <div className="flex items-center justify-between mb-8">
//                   <div>
//                     <h2 className="text-2xl font-bold text-white">Personal Information</h2>
//                     <p className="text-gray-500 text-sm mt-1">Update your personal details</p>
//                   </div>
//                   {!editMode && (
//                     <button onClick={() => setEditMode(true)}
//                       className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all">
//                       <Settings size={16} /> Edit
//                     </button>
//                   )}
//                 </div>

//                 {editMode ? (
//                   <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-2xl">
//                     <div className="grid sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-300 mb-2">First Name</label>
//                         <input type="text" value={form.first_name}
//                           onChange={(e) => setForm({ ...form, first_name: e.target.value })}
//                           className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" required />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-300 mb-2">Last Name</label>
//                         <input type="text" value={form.last_name}
//                           onChange={(e) => setForm({ ...form, last_name: e.target.value })}
//                           className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" required />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
//                       <input type="text" value={form.phone}
//                         onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                         className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-semibold text-gray-300 mb-2">Address</label>
//                       <textarea value={form.address}
//                         onChange={(e) => setForm({ ...form, address: e.target.value })}
//                         rows={3}
//                         className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" />
//                     </div>

//                     <div className="grid sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
//                         <input type="text" value={form.city}
//                           onChange={(e) => setForm({ ...form, city: e.target.value })}
//                           className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all" />
//                       </div>
//                     </div>

//                     <div className="flex gap-3 pt-2">
//                       <button type="submit" disabled={saving}
//                         className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50">
//                         {saving ? "Saving..." : "Save Changes"}
//                       </button>
//                       <button type="button" onClick={() => setEditMode(false)}
//                         className="px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-gray-300 font-semibold rounded-xl hover:bg-white/[0.08] transition-all">
//                         Cancel
//                       </button>
//                     </div>
//                   </form>
//                 ) : (
//                   <div className="space-y-5 max-w-2xl">
//                     <div className="grid sm:grid-cols-2 gap-4">
//                       <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
//                         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
//                           <User size={14} /> Name
//                         </div>
//                         <p className="text-white font-semibold">
//                           {profile?.first_name} {profile?.last_name}
//                         </p>
//                       </div>
//                       <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
//                         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
//                           <Mail size={14} /> Email
//                         </div>
//                         <p className="text-white font-semibold">{profile?.email}</p>
//                       </div>
//                       <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
//                         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
//                           <Phone size={14} /> Phone
//                         </div>
//                         <p className="text-white font-semibold">{profile?.phone || "Not set"}</p>
//                       </div>
//                       <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
//                         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
//                           <Home size={14} /> City
//                         </div>
//                         <p className="text-white font-semibold">{profile?.city || "Not set"}</p>
//                       </div>
//                     </div>
//                     <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
//                       <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
//                         <MapPin size={14} /> Address
//                       </div>
//                       <p className="text-white">{profile?.address || "Not set"}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* ═══ ORDERS TAB ═══ */}
//             {activeTab === "orders" && (
//               <div className="rounded-2xl bg-[#0d1525]/60 border border-white/[0.04] p-6 sm:p-8">
//                 <div className="flex items-center justify-between mb-8">
//                   <div>
//                     <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
//                     <p className="text-gray-500 text-sm mt-1">View and track all your orders</p>
//                   </div>
//                   <Link to="/orders"
//                     className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all">
//                     View All <ChevronRight size={16} />
//                   </Link>
//                 </div>

//                 {orders.length > 0 ? (
//                   <div className="space-y-4">
//                     {recentOrders.map((order) => (
//                       <div key={order.id}
//                         className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5 hover:bg-white/[0.04] hover:border-white/[0.06] transition-all cursor-pointer"
//                         onClick={() => navigate(`/orders/${order.id}`)}>
//                         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                           <div className="space-y-1">
//                             <div className="flex items-center gap-3">
//                               <span className="font-mono text-cyan-400 text-sm font-semibold">
//                                 {order.order_number}
//                               </span>
//                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
//                                 {getStatusIcon(order.status)}
//                                 {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace(/_/g, " ")}
//                               </span>
//                             </div>
//                             <p className="text-sm text-gray-500 flex items-center gap-1.5">
//                               <Calendar size={12} className="text-cyan-400" />
//                               {order.created_at ? new Date(order.created_at).toLocaleDateString("en-US", {
//                                 year: "numeric", month: "long", day: "numeric",
//                               }) : "N/A"}
//                             </p>
//                             {order.items && order.items.length > 0 && (
//                               <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
//                             )}
//                           </div>
//                           <div className="text-right">
//                             <p className="text-xl font-bold text-cyan-400">
//                               ₹{parseFloat(order.total_amount || 0).toFixed(2)}
//                             </p>
//                             <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
//                               order.payment_status === "paid" 
//                                 ? "text-emerald-400 bg-emerald-500/10" 
//                                 : "text-yellow-400 bg-yellow-500/10"
//                             }`}>
//                               {order.payment_status === "paid" ? "Paid" : "Pending"}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="rounded-xl border border-dashed border-white/[0.06] p-12 text-center">
//                     <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
//                       <ShoppingBag size={28} className="text-cyan-400" />
//                     </div>
//                     <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders yet</h3>
//                     <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
//                     <Link to="/shop"
//                       className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all">
//                       Browse Products
//                     </Link>
//                   </div>
//                 )}

//                 {/* Order timeline hint */}
//                 {orders.length > 0 && (
//                   <div className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-400/10 p-4">
//                     <div className="flex items-center gap-3">
//                       <Truck size={18} className="text-cyan-400" />
//                       <p className="text-sm text-gray-300">
//                         Track your order status in real-time.{' '}
//                         <Link to="/track-order" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
//                           Track now <ChevronRight size={12} className="inline" />
//                         </Link>
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* ═══ ADDRESS TAB ═══ */}
//             {activeTab === "addresses" && (
//               <div className="rounded-2xl bg-[#0d1525]/60 border border-white/[0.04] p-6 sm:p-8">
//                 <div className="mb-8">
//                   <h2 className="text-2xl font-bold text-white">Saved Address</h2>
//                   <p className="text-gray-500 text-sm mt-1">Your default delivery address</p>
//                 </div>
//                 <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-6">
//                   <div className="flex items-start gap-4">
//                     <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
//                       <MapPin size={20} className="text-cyan-400" />
//                     </div>
//                     <div>
//                       <p className="font-semibold text-white mb-1">Default Address</p>
//                       <p className="text-gray-400 text-sm">
//                         {profile?.address ? (
//                           <>
//                             {profile.address}<br />
//                             {profile.city && `${profile.city}`}
//                           </>
//                         ) : (
//                           <span className="text-gray-500">No address saved yet. Update your profile to add one.</span>
//                         )}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* ═══ RECOMMENDED PRODUCTS (shown on all tabs) ═══ */}
//             {/* {recommendedProducts.length > 0 && (
//               <div className="rounded-2xl bg-[#0d1525]/60 border border-white/[0.04] p-6 sm:p-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/5 border border-cyan-400/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300 mb-3">
//                       <Sparkles size={12} /> Recommended
//                     </div>
//                     <h2 className="text-2xl font-bold text-white">Products You Might Like</h2>
//                   </div>
//                   <Link to="/shop"
//                     className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/[0.08] transition-all">
//                     View All <ChevronRight size={16} />
//                   </Link>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                   {recommendedProducts.map((product) => (
//                     <div key={product.id}
//                       className="group rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 hover:bg-white/[0.04] hover:border-cyan-400/10 transition-all">
//                       <Link to={`/product/${product.id}`} className="block">
//                         <div className="relative h-36 overflow-hidden rounded-lg bg-[#0a0e1a] mb-3">
//                           {product.image_url ? (
//                             <SafeImage src={product.image_url} alt={product.name}
//                               className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
//                               fallback={<div className="flex h-full items-center justify-center text-gray-600"><Package size={32} className="opacity-20" /></div>} />
//                           ) : (
//                             <div className="flex h-full items-center justify-center text-gray-600">
//                               <Package size={32} className="opacity-20" />
//                             </div>
//                           )}
//                         </div>
//                         <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{product.name}</h3>
//                         <p className="text-lg font-bold text-cyan-400 mt-1">₹{parseFloat(product.price || 0).toFixed(2)}</p>
//                       </Link>
//                       <button onClick={(e) => handleAddToCart(product, e)}
//                         disabled={product.stock_quantity <= 0}
//                         className="mt-3 w-full rounded-lg bg-cyan-500/10 border border-cyan-400/15 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
//                         <ShoppingCart size={14} /> Add to Cart
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )} */}

//           </div>
//         </div>
//       </div>

//       {/* Quick checkout access - floating button */}
//       <Link to="/checkout"
//         className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:scale-110 transition-all duration-300 group">
//         <ShoppingCart size={22} className="group-hover:rotate-[-8deg] transition-transform" />
//       </Link>
//     </div>
//   );
// }

/////
/////
/////
/////
/////
/////
/////
/////
/////
/////
/////


import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, MapPin, LogOut, ShoppingBag, Clock,
  CheckCircle, XCircle, Truck, Loader, Settings, Mail,
  Phone, Home, ChevronRight, ShoppingCart, Sparkles,
  Eye, UserCircle, Calendar, CreditCard,
} from "lucide-react";
import apiCall, { productService } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";
import { useCart } from "../context/CartContext.jsx";

// Animation Configurations
const fadeInContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const fadeInUpItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
};

export default function Dashboard({ token, onLogout }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", address: "", city: "",
  });
  const [notification, setNotification] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [notifType, setNotifType] = useState("success");

  useEffect(() => {
    loadDashboardData();
    loadRecommendedProducts();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, ordersRes] = await Promise.all([
        apiCall("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiCall("/api/user/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const userData = profileRes.data?.user || profileRes.data;
      setProfile(userData);

      const orderData = ordersRes.data?.orders || ordersRes.data || [];
      const parsedOrders = (Array.isArray(orderData) ? orderData : []).map(o => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
      }));
      setOrders(parsedOrders);

      setForm({
        first_name: userData?.first_name || "",
        last_name: userData?.last_name || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
        city: userData?.city || "",
      });
    } catch (err) {
      console.warn("Dashboard load error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      const response = await productService.getAllProducts(1, 4);
      const products = response.data?.products || [];
      setRecommendedProducts(products.slice(0, 4));
    } catch (err) {
      console.warn("Failed to load recommended products:", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiCall("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const updatedUser = res.data?.user || res.data;
      setProfile(updatedUser);
      setEditMode(false);
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotifType(type);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showNotification(`${product.name} added to cart!`, "success");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock size={14} className="text-amber-400" />;
      case "processing": return <Loader size={14} className="text-blue-400 animate-spin" />;
      case "shipped": return <Truck size={14} className="text-indigo-400" />;
      case "delivered": return <CheckCircle size={14} className="text-emerald-400" />;
      case "cancelled": return <XCircle size={14} className="text-rose-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "processing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "shipped": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "delivered": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cancelled": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070f1e] flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification Layer */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 bg-slate-900/95 shadow-2xl backdrop-blur-xl border rounded-xl px-5 py-3.5 text-sm max-w-sm ${
              notifType === "success" ? "border-emerald-500/30" : "border-rose-500/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                notifType === "success" ? "bg-emerald-500/10" : "bg-rose-500/10"
              }`}>
                {notifType === "success" ? <CheckCircle size={15} className="text-emerald-400" /> : <XCircle size={15} className="text-rose-400" />}
              </div>
              <span className="text-slate-200 font-medium">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Professional Header Row */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shadow-inner">
                <UserCircle size={32} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
                </h1>
                {/* <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{profile?.email || "Customer Account Panel"}</p> */}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/shop" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition-colors">
                  <ShoppingBag size={16} /> Continue Shopping
                </Link>
              </motion.div>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-slate-700/50 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Error dynamic block */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3.5 text-sm text-rose-400 font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Primary Workspace Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">

          {/* Navigation Controls Wrapper */}
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-3 lg:pb-0 border-b border-slate-800 lg:border-none whitespace-nowrap scrollbar-none">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <User size={16} /> Profile Information
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Package size={16} /> Order Portfolio
            </button>
            <button 
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "addresses"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <MapPin size={16} /> Delivery Address
            </button>
            
            <div className="hidden lg:block my-4 border-t border-slate-800/60" />
            
            <Link to="/track-order" className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
              <Truck size={14} /> Quick Tracker
            </Link>
            <Link to="/orders" className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
              <Eye size={14} /> General Archives
            </Link>
          </nav>

          {/* Interactive Screen Dynamic Layer */}
          <div className="space-y-8 min-w-0">
            <AnimatePresence mode="wait">
              
              {/* PROFILE CONTROL VIEW */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Account Framework</h2>
                      <p className="text-slate-400 text-xs mt-0.5">Control your primary contact settings and global identities.</p>
                    </div>
                    {!editMode && (
                      <button 
                        onClick={() => setEditMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all"
                      >
                        <Settings size={14} /> Modify Data
                      </button>
                    )}
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                          <input type="text" value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                          <input type="text" value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" required />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone System</label>
                        <input type="text" value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Street Terminal</label>
                        <textarea value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none" />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Regional City</label>
                          <input type="text" value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-slate-800 mt-6">
                        <button type="submit" disabled={saving}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md disabled:opacity-50 transition-colors">
                          {saving ? "Saving Changes..." : "Update Profile"}
                        </button>
                        <button type="button" onClick={() => setEditMode(false)}
                          className="px-5 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <User size={12} className="text-amber-400" /> Full Signature
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.first_name} {profile?.last_name || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Mail size={12} className="text-amber-400" /> Communications
                        </div>
                        <p className="text-white text-sm font-semibold break-all">{profile?.email}</p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Phone size={12} className="text-amber-400" /> Mobile Hub
                        </div>
                        <p className="text-white text-sm font-semibold">{profile?.phone || "No terminal set"}</p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Home size={12} className="text-amber-400" /> City Hub
                        </div>
                        <p className="text-white text-sm font-semibold">{profile?.city || "No hub set"}</p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4 sm:col-span-2">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <MapPin size={12} className="text-amber-400" /> Dispatch Pipeline Address
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{profile?.address || "No target address mapped to profile configuration"}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* RECENT ORDERS CONTROL VIEW */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Recent Statements</h2>
                      <p className="text-slate-400 text-xs mt-0.5">Real-time analytical summary of latest purchase contracts.</p>
                    </div>
                    <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                      Complete History <ChevronRight size={14} />
                    </Link>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-3.5">
                      {recentOrders.map((order) => (
                        <motion.div 
                          key={order.id}
                          whileHover={{ y: -2, backgroundColor: "rgba(30, 41, 59, 0.4)" }}
                          className="rounded-lg bg-slate-950 border border-slate-800 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer transition-colors"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 text-slate-300">
                                {order.order_number}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="uppercase tracking-wider">{order.status}</span>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                              <span className="flex items-center gap-1"><Calendar size={13} /> {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span>{order.items?.length || 0} Unified Component Units</span>
                            </div>
                          </div>

                          <div className="md:text-right flex md:flex-col items-center md:items-end justify-between border-t md:border-none border-slate-800 pt-3 md:pt-0">
                            <p className="text-base font-black text-amber-400">
                              ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                            </p>
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 ${
                              order.payment_status === "paid" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                            }`}>
                              {order.payment_status === "paid" ? "Cleared" : "Escrow Pending"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                        <ShoppingBag size={20} className="text-slate-500" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-300 mb-1">No transaction matrices discovered</h3>
                      <p className="text-xs text-slate-500 mb-4">Initialize item procurement to capture analytical pipelines here.</p>
                      <Link to="/shop" className="inline-flex items-center justify-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white shadow-md transition-colors">
                        Inspect Inventory
                      </Link>
                    </div>
                  )}

                  {orders.length > 0 && (
                    <div className="mt-5 rounded-lg bg-slate-950 border border-slate-800 p-3.5 flex items-center gap-3">
                      <Truck size={16} className="text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-slate-400 font-medium">
                        Realtime spatial tracking configuration active.{" "}
                        <Link to="/track-order" className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5">
                          Track Metrics <ChevronRight size={12} />
                        </Link>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ADDRESS CONTROL VIEW */}
              {activeTab === "addresses" && (
                <motion.div
                  key="addresses-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="border-b border-slate-800 pb-5 mb-6">
                    <h2 className="text-lg font-bold text-white">Default Terminal</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Primary geographical fulfillment endpoints.</p>
                  </div>
                  
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-white">Primary Delivery Node</p>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          {profile?.address ? (
                            <>
                              {profile.address}
                              {profile.city && `, ${profile.city}`}
                            </>
                          ) : (
                            <span className="text-slate-500 italic">No spatial metrics loaded. Reconfigure user account fields to initialize routing targets.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HIGH END RECOMMENDED DECK GRID (Always Visible for E-com retention) */}
            {/* {recommendedProducts.length > 0 && (
              <motion.div 
                variants={fadeInContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/5 border border-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <Sparkles size={10} /> Algorithmic Alignment
                    </div>
                    <h2 className="text-base font-bold text-white">Suggested Curations</h2>
                  </div>
                  <Link to="/shop" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-0.5">
                    All Catalogs <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedProducts.map((product) => (
                    <motion.div 
                      key={product.id}
                      variants={fadeInUpItem}
                      className="group relative rounded-lg bg-slate-950 border border-slate-800 p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-all"
                    >
                      <Link to={`/product/${product.id}`} className="block space-y-3">
                        <div className="relative h-32 w-full overflow-hidden rounded bg-slate-900 border border-slate-800/40">
                          {product.image_url ? (
                            <SafeImage 
                              src={product.image_url} 
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              fallback={<div className="flex h-full items-center justify-center text-slate-700"><Package size={24} className="opacity-40" /></div>} 
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-700">
                              <Package size={24} className="opacity-40" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h3>
                          <p className="text-sm font-black text-amber-400 mt-1">₹{parseFloat(product.price || 0).toFixed(2)}</p>
                        </div>
                      </Link>

                      <motion.button 
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock_quantity <= 0}
                        className="mt-3.5 w-full rounded-md bg-blue-600 hover:bg-blue-700 py-2 text-[11px] font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ShoppingCart size={12} /> Procure Unit
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )} */}

          </div>
        </div>
      </div>

      {/* Floating Tactical Checkout Gateway Anchor */}
      <motion.div 
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link to="/checkout" className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 border border-blue-500/30 transition-colors group">
          <ShoppingCart size={20} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
}