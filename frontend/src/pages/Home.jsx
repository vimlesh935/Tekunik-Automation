// old code 
// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   ShoppingCart, ChevronRight, Star, Cpu, Home as HomeIcon,
//   Camera, Wifi, Thermometer, Lock, Lightbulb, CheckCircle,
//   ArrowRight, Sparkles, CircuitBoard,
// } from "lucide-react";
// import { useCart } from "../context/CartContext.jsx";
// import { productService, cartService, categoryService } from "../services/api";
// import SafeImage from "../components/SafeImage.jsx";
// import heroBg from "../assest/Variant_ IoT sensor product family.png";

// const reviews = [
//   { id: 1, name: "Sarah Chen", role: "Homeowner", avatar: "SC", rating: 5, text: "Transformed my house into a smart home! The automation products are top-notch and easy to install." },
//   { id: 2, name: "Marcus Johnson", role: "Tech Enthusiast", avatar: "MJ", rating: 5, text: "Incredible selection of robotics and IoT devices. Fast shipping and great customer support." },
//   { id: 3, name: "Priya Sharma", role: "Business Owner", avatar: "PS", rating: 5, text: "Industrial automation solutions helped streamline our factory. Highly recommend Tekunik!" },
//   { id: 4, name: "Alex Rodriguez", role: "Security Expert", avatar: "AR", rating: 4, text: "Smart security systems are professional grade. Easy integration with existing infrastructure." },
// ];

// export default function Home({ token }) {
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [featuredProducts, setFeaturedProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState("");
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const [prodRes, catRes] = await Promise.all([
//           productService.getAllProducts(1, 6).catch(err => {
//             console.warn("Failed to load products:", err);
//             return { data: { products: [] } };
//           }),
//           categoryService.getAllCategories().catch(err => {
//             console.warn("Failed to load categories:", err);
//             return { data: { categories: [] } };
//           })
//         ]);
        
//         setFeaturedProducts(prodRes.data?.products?.slice(0, 6) || []);
        
//         const colors = [
//           "from-cyan-500 to-blue-500",
//           "from-emerald-500 to-teal-500",
//           "from-violet-500 to-purple-500",
//           "from-rose-500 to-pink-500",
//           "from-amber-500 to-orange-500",
//           "from-fuchsia-500 to-pink-500",
//           "from-indigo-500 to-purple-500",
//           "from-teal-500 to-cyan-500",
//         ];
        
//         const iconMap = [HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer];
        
//         const dynamicCategories = (catRes.data?.categories || []).map((cat, i) => ({
//           ...cat,
//           icon: iconMap[i % iconMap.length],
//           color: colors[i % colors.length],
//           desc: cat.description || `Browse our ${cat.name} collection`
//         }));
        
//         setCategories(dynamicCategories);
//       } catch (error) {
//         console.error("Failed to load home data:", error);
//         setError("Failed to load content. Please refresh the page.");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     loadData();
//   }, []);

//   const handleAddToCart = async (product, e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (!token) {
//       addToCart(product, 1);
//       setNotification(`${product.name} added to cart!`);
//       setTimeout(() => setNotification(""), 3000);
//       return;
//     }

//     try {
//       await cartService.addToCart(product.id, 1);
//       setNotification(`${product.name} added to cart!`);
//       setTimeout(() => setNotification(""), 3000);
//     } catch (error) {
//       console.error("Add to cart failed:", error);
//       setNotification(error.message || "Failed to add to cart");
//       setTimeout(() => setNotification(""), 3000);
//     }
//   };

//   if (error) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center p-4"
//        style={{
//         backgroundImage: `url(${heroBg})`,
//       }}>
//         <div className="text-center space-y-4">
//           <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
//             <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-bold text-white">Failed to Load</h2>
//           <p className="text-gray-400">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black hover:bg-cyan-400 transition"
//           >
//             Reload Page
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-primary text-primary transition-colors duration-300">
//       {/* Notification */}
//       {notification && (
//         <div className="fixed top-20 right-4 z-50 glass-strong rounded-2xl px-6 py-4 text-sm shadow-2xl animate-slide-down max-w-sm">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
//               <CheckCircle size={16} className="text-emerald-400" />
//             </div>
//             <span className="text-gray-200">{notification}</span>
//           </div>
//         </div>
//       )}
//       {/* ═══ HERO SECTION ═══ */}
//       <section className="relative min-h-[90vh] flex items-center overflow-hidden">
//         {/* Background image */}
//         <div
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//           style={{
//             backgroundImage: `url(${heroBg})`,
//           }}
//         />
        
//         {/* Dark gradient overlay - improves readability while keeping image visible */}
//         <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/40 to-gray-950/75" />
        
//         {/* Cinematic vignette overlay */}
//         <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/30" />
        
//         {/* Refined glow blobs - positioned for better visual balance behind content */}
//         <div className="absolute top-[15%] left-[8%] w-[450px] h-[450px] bg-cyan-500/12 rounded-full blur-[140px] animate-pulse-slow" />
//         <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[130px] animate-pulse-slow" />
//         <div className="absolute top-[55%] right-[30%] w-56 h-56 bg-violet-500/8 rounded-full blur-[100px] animate-pulse-slow" />
        
//         {/* Grid overlay - reduced opacity so image shows through better */}
//         <div className="absolute inset-0 grid-overlay opacity-20" />

//         <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-14">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">
//             {/* Left column - text content with glass backdrop for readability */}
//             <div className="relative animate-fade-in">
//               {/* Elegant glass panel behind text for readability over background image */}
//               <div className="absolute -inset-8" />
//               <div className="relative space-y-8 px-6 py-4">
//                 <div className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-cyan-300 border border-cyan-500/20">
//                   <Sparkles size={14} className="animate-pulse-slow" />
//                   Next-Gen Automation
//                 </div>
                
//                 {/* <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] pb-2">
//                   <span className="block gradient-text-cyan mb-2">
//                     The Future of
//                   </span>
//                   <span className="block gradient-text">
//                     Smart Living
//                   </span>
//                 </h1> */}
// <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1]">
//   <span className="block gradient-text-cyan ">
//     The Future of
//   </span>
//   <span className="block gradient-text leading-normal ">
//     Smart Living
//   </span>
// </h1>
//                 <p className="text-lg md:text-xl !text-white max-w-xl leading-relaxed">
//                   Discover premium automation products for your home, office, and industry.
//                   Smart technology that adapts to your lifestyle.
//                 </p>

//                 <div className="flex flex-wrap gap-4 pt-2">
//                   <Link to="/shop"
//                     className="btn-shimmer group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-base font-semibold text-black hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300">
//                     Explore Products
//                     <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
//                   </Link>
//                   {/* <Link to="/register"
//                     className="inline-flex items-center gap-3 rounded-2xl glass-strong px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-300">
//                     Get Started
//                     <ChevronRight size={20} />
//                   </Link> */}
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* ═══ HERO TO MARQUEE SPACER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
//         <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           {/* <div className="h-6 lg:h-8" /> */}
//         </div>
//       </div>

   

//       {/* ═══ MARQUEE TO SHOWCASE SPACER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
//         <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           {/* <div className="h-6 lg:h-8" /> */}
//         </div>
//       </div>

//       {/* ═══ ELEGANT DIVIDER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
//         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
//         <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-32 h-8 bg-gradient-to-r from-cyan-500/5 via-cyan-400/25 to-cyan-500/5 blur-2xl rounded-full animate-pulse-slow" />
//         <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-blue-500/5 via-blue-400/20 to-blue-500/5 blur-xl rounded-full" />
//       </div>

//       {/* ═══ FEATURED PRODUCTS ═══ */}

//     <section className="relative py-20 bg-gradient-to-b from-transparent via-gray-950/50 to-transparent">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
//             <div className="space-y-4">
//               {/* <p className="section-label">POPULAR</p> */}
//               <h2 className="text-4xl md:text-7xl font-bold">Products</h2>
//               <p className="text-gray-400 max-w-xl">
//                 Discover our most popular automation products chosen by customers like you
//               </p>
//             </div>
//             <Link to="/shop"
//               className="mt-6 md:mt-0 inline-flex items-center gap-2 rounded-2xl glass-strong px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
//               View All <ArrowRight size={16} />
//             </Link>
//           </div>

//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400" />
//             </div>
//           ) : featuredProducts.length > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//               {featuredProducts.map((product) => (
//                 <Link key={product.id} to={`/product/${product.id}`}
//                   className="group relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 card-hover">
//                   <div className="relative h-56 overflow-hidden rounded-2xl bg-gray-800 mb-6">
//                     {product.image_url ? (
//                       <SafeImage
//                         src={product.image_url}
//                         alt={product.name}
//                         className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
//                         fallback={<div className="flex h-full items-center justify-center text-gray-500"><Cpu size={48} className="opacity-30" /></div>}
//                       />
//                     ) : (
//                       <div className="flex h-full items-center justify-center text-gray-500">
//                         <Cpu size={48} className="opacity-30" />
//                       </div>
//                     )}
//                     {product.stock_quantity <= 0 && (
//                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
//                         <span className="badge badge-danger">Out of Stock</span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <span className="badge badge-info uppercase">
//                         {product.category_name || "General"}
//                       </span>
//                       <span className="text-xl font-bold text-cyan-400">${parseFloat(product.price).toFixed(2)}</span>
//                     </div>

//                     <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition line-clamp-1">
//                       {product.name}
//                     </h3>
//                     <p className="text-sm text-gray-400 line-clamp-2">{product.description || "Premium automation product"}</p>

//                     <div className="flex items-center justify-between pt-2">
//                       <div className="flex items-center gap-2">
//                         <span className={`inline-block w-2 h-2 rounded-full ${product.stock_quantity > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
//                         <span className="text-xs text-gray-500">{product.stock_quantity > 0 ? "In Stock" : "Unavailable"}</span>
//                       </div>
//                       <button onClick={(e) => handleAddToCart(product, e)} disabled={product.stock_quantity <= 0}
//                         className="rounded-xl glass p-2.5 text-cyan-400 hover:glass-strong transition disabled:opacity-30 disabled:cursor-not-allowed">
//                         <ShoppingCart size={18} />
//                       </button>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           ) : (
//             <div className="glass-strong rounded-3xl p-16 text-center">
//               <p className="text-xl font-semibold text-gray-100">No products available yet</p>
//               <p className="mt-3 text-gray-500">Check back soon for new arrivals.</p>
//             </div>
//           )}
//         </div>
//       </section>
//  {/* ═══ CATEGORIES ═══ */}
//       <section className="relative py-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16 space-y-4">
//             <p className="section-label">Categories</p>
//             <h2 className="text-4xl md:text-5xl font-bold">Shop by Category</h2>
//             <p className="text-gray-400 max-w-2xl mx-auto">
//               Browse our extensive collection of automation products across multiple categories
//             </p>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {categories.map((cat) => {
//               const Icon = cat.icon;
//               const hasImage = cat.image_url && cat.image_url !== "null" && cat.image_url !== "";
//               return (
//                 <Link key={cat.id} to="/shop"
//                   className="group relative overflow-hidden rounded-3xl glass p-8 hover:glass-strong transition-all duration-500 card-hover">
//                   {hasImage ? (
//                     <div className="absolute inset-0">
//                       <SafeImage
//                         src={cat.image_url}
//                         alt={cat.name}
//                         className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-45 transition-opacity duration-500"
//                         fallback={null}
//                       />
//                       <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} mix-blend-multiply opacity-60 group-hover:opacity-40 transition-opacity duration-500`} />
//                     </div>
//                   ) : (
//                     <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${cat.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity duration-500`} />
//                   )}
//                   <div className="relative z-10 space-y-5">
//                     <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg overflow-hidden`}>
//                       {hasImage ? (
//                         <SafeImage
//                           src={cat.image_url}
//                           alt={cat.name}
//                           className="w-full h-full object-cover"
//                           fallback={<Icon size={28} className="text-white" />}
//                         />
//                       ) : (
//                         <Icon size={28} className="text-white" />
//                       )}
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
//                       <p className="text-sm text-gray-400 line-clamp-2">{cat.desc}</p>
//                     </div>
//                   </div>
//                   <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <ArrowRight size={20} className="text-cyan-400" />
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </div>
//       </section>


      
    
//       {/* ═══ PREMIUM SHOWCASE ═══ */}
//       <section className="relative py-16 lg:py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
//             <div className="space-y-6">
//               <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300 backdrop-blur-xl">
//                 Premium Smart Living
//               </span>
//               <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
//                 Future Smart Living
//               </h2>
//               <p className="max-w-xl text-lg leading-relaxed text-gray-400">
//                 Experience intelligent home control with premium automation, elegant visuals, and adaptive security for every space.
//               </p>
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
//                   <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Smart Automation</p>
//                   <p className="mt-3 text-lg font-semibold text-white">Control every room from one elegant dashboard.</p>
//                 </div>
//                 <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
//                   <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Premium Security</p>
//                   <p className="mt-3 text-lg font-semibold text-white">Protect your home with adaptive sensors and live alerts.</p>
//                 </div>
//               </div>
//             </div>

//             <div className="relative">
//               <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 shadow-2xl shadow-cyan-500/15 transition-transform duration-700 hover:-translate-y-1 hover:scale-[1.01]">
//                 <img
//                   src="https://bas-ip.com/wp-content/uploads/2023/05/smart-home-interface-with-augmented-realty-iot-object-interior-design.jpg"
//                   alt="Smart home interface"
//                   loading="lazy"
//                   decoding="async"
//                   className="h-[420px] min-h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/60" />
//                 <div className="absolute inset-x-6 bottom-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
//                   <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/90">Next Generation Automation</p>
//                   <h3 className="mt-3 text-3xl font-semibold text-white">Control Your Home Intelligently</h3>
//                   <p className="mt-3 text-sm leading-6 text-gray-300">
//                     A premium visual showcase designed for smart homes, blending glassmorphism, soft glow, and immersive motion.
//                   </p>
//                 </div>
//                 <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
//                 <div className="pointer-events-none absolute -right-8 bottom-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
//                 <div className="pointer-events-none absolute left-10 top-20 h-16 w-16 rounded-full bg-cyan-200/10 blur-2xl" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

     

    

//       {/* ═══ CUSTOMER REVIEWS ═══ */}
//       <section className="relative py-24">
//         <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-cyan-950/10 to-gray-950 pointer-events-none" />
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16 space-y-4">
//             <p className="section-label">Testimonials</p>
//             <h2 className="text-4xl md:text-5xl font-bold">What Our Customers Say</h2>
//             <p className="text-gray-400 max-w-2xl mx-auto">
//               Join thousands of satisfied customers who trust Tekunik for their automation needs
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {reviews.map((review) => (
//               <div key={review.id}
//                 className="glass-strong rounded-3xl p-6 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300 card-hover">
//                 <div className="flex items-center gap-1 mb-4">
//                   {[...Array(5)].map((_, i) => (
//                     <Star key={i} size={14}
//                       className={i < review.rating ? "fill-cyan-400 text-cyan-400" : "text-gray-600"} />
//                   ))}
//                 </div>
//                 <p className="text-sm text-gray-300 leading-relaxed mb-6">"{review.text}"</p>
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-black">
//                     {review.avatar}
//                   </div>
//                   <div>
//                     <p className="text-sm font-semibold text-white">{review.name}</p>
//                     <p className="text-xs text-gray-500">{review.role}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }


//
//
//
//
//
//
//
//
//
//
//
//
//
// irshad code 

// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   ShoppingCart, ChevronRight, Star, Cpu, Home as HomeIcon,
//   Camera, Wifi, Thermometer, Lock, Lightbulb, CheckCircle,
//   ArrowRight, Sparkles, CircuitBoard,
// } from "lucide-react";
// import { useCart } from "../context/CartContext.jsx";
// import { productService, cartService, categoryService } from "../services/api";
// import SafeImage from "../components/SafeImage.jsx";
// import heroBg from "../assest/Variant_ IoT sensor product family.png";

// const reviews = [
//   { id: 1, name: "Sarah Chen", role: "Homeowner", avatar: "SC", rating: 5, text: "Transformed my house into a smart home! The automation products are top-notch and easy to install." },
//   { id: 2, name: "Marcus Johnson", role: "Tech Enthusiast", avatar: "MJ", rating: 5, text: "Incredible selection of robotics and IoT devices. Fast shipping and great customer support." },
//   { id: 3, name: "Priya Sharma", role: "Business Owner", avatar: "PS", rating: 5, text: "Industrial automation solutions helped streamline our factory. Highly recommend Tekunik!" },
//   { id: 4, name: "Alex Rodriguez", role: "Security Expert", avatar: "AR", rating: 4, text: "Smart security systems are professional grade. Easy integration with existing infrastructure." },
// ];

// export default function Home({ token }) {
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [featuredProducts, setFeaturedProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState("");
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const [prodRes, catRes] = await Promise.all([
//           productService.getAllProducts(1, 6).catch(err => {
//             console.warn("Failed to load products:", err);
//             return { data: { products: [] } };
//           }),
//           categoryService.getAllCategories().catch(err => {
//             console.warn("Failed to load categories:", err);
//             return { data: { categories: [] } };
//           })
//         ]);
        
//         setFeaturedProducts(prodRes.data?.products?.slice(0, 6) || []);
        
//         const colors = [
//           "from-cyan-500 to-blue-500",
//           "from-emerald-500 to-teal-500",
//           "from-violet-500 to-purple-500",
//           "from-rose-500 to-pink-500",
//           "from-amber-500 to-orange-500",
//           "from-fuchsia-500 to-pink-500",
//           "from-indigo-500 to-purple-500",
//           "from-teal-500 to-cyan-500",
//         ];
        
//         const iconMap = [HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer];
        
//         const dynamicCategories = (catRes.data?.categories || []).map((cat, i) => ({
//           ...cat,
//           icon: iconMap[i % iconMap.length],
//           color: colors[i % colors.length],
//           desc: cat.description || `Browse our ${cat.name} collection`
//         }));
        
//         setCategories(dynamicCategories);
//       } catch (error) {
//         console.error("Failed to load home data:", error);
//         setError("Failed to load content. Please refresh the page.");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     loadData();
//   }, []);

//   const handleAddToCart = async (product, e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (!token) {
//       addToCart(product, 1);
//       setNotification(`${product.name} added to cart!`);
//       setTimeout(() => setNotification(""), 3000);
//       return;
//     }

//     try {
//       await cartService.addToCart(product.id, 1);
//       setNotification(`${product.name} added to cart!`);
//       setTimeout(() => setNotification(""), 3000);
//     } catch (error) {
//       console.error("Add to cart failed:", error);
//       setNotification(error.message || "Failed to add to cart");
//       setTimeout(() => setNotification(""), 3000);
//     }
//   };

//   if (error) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center p-4"
//        style={{
//          backgroundImage: `url(${heroBg})`,
//        }}>
//         <div className="text-center space-y-4">
//           <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
//             <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-bold text-white">Failed to Load</h2>
//           <p className="text-gray-400">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black hover:bg-cyan-400 transition"
//           >
//             Reload Page
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-primary text-primary transition-colors duration-300">
//       {/* Notification */}
//       {notification && (
//         <div className="fixed top-20 right-4 z-50 glass-strong rounded-2xl px-6 py-4 text-sm shadow-2xl animate-slide-down max-w-sm">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
//               <CheckCircle size={16} className="text-emerald-400" />
//             </div>
//             <span className="text-gray-200">{notification}</span>
//           </div>
//         </div>
//       )}
//       {/* ═══ HERO SECTION ═══ */}
//       <section className="relative min-h-[90vh] flex items-center overflow-hidden">
//         {/* Background image */}
//         <div
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//           style={{
//             backgroundImage: `url(${heroBg})`,
//           }}
//         />
        
//         {/* Dark gradient overlay - improves readability while keeping image visible */}
//         <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/40 to-gray-950/75" />
        
//         {/* Cinematic vignette overlay */}
//         <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/30" />
        
//         {/* Refined glow blobs - positioned for better visual balance behind content */}
//         <div className="absolute top-[15%] left-[8%] w-[450px] h-[450px] bg-cyan-500/12 rounded-full blur-[140px] animate-pulse-slow" />
//         <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[130px] animate-pulse-slow" />
//         <div className="absolute top-[55%] right-[30%] w-56 h-56 bg-violet-500/8 rounded-full blur-[100px] animate-pulse-slow" />
        
//         {/* Grid overlay - reduced opacity so image shows through better */}
//         <div className="absolute inset-0 grid-overlay opacity-20" />

//         <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-14">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">
//             {/* Left column - text content with glass backdrop for readability */}
//             <div className="relative animate-fade-in">
//               {/* Elegant glass panel behind text for readability over background image */}
//               <div className="absolute -inset-8" />
//               <div className="relative space-y-8 px-6 py-4">
//                 <div className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-cyan-300 border border-cyan-500/20">
//                   <Sparkles size={14} className="animate-pulse-slow" />
//                   Next-Gen Automation
//                 </div>
                
//                 {/* <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] pb-2">
//                   <span className="block gradient-text-cyan mb-2">
//                     The Future of
//                   </span>
//                   <span className="block gradient-text">
//                     Smart Living
//                   </span>
//                 </h1> */}
// <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1]">
//   <span className="block gradient-text-cyan ">
//     The Future of
//   </span>
//   <span className="block gradient-text leading-normal ">
//     Smart Living
//   </span>
// </h1>
//                 <p className="text-lg md:text-xl !text-white max-w-xl leading-relaxed">
//                   Discover premium automation products for your home, office, and industry.
//                   Smart technology that adapts to your lifestyle.
//                 </p>

//                 <div className="flex flex-wrap gap-4 pt-2">
//                   <Link to="/shop"
//                     className="btn-shimmer group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-base font-semibold text-black hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300">
//                     Explore Products
//                     <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
//                   </Link>
//                   {/* <Link to="/register"
//                     className="inline-flex items-center gap-3 rounded-2xl glass-strong px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-300">
//                     Get Started
//                     <ChevronRight size={20} />
//                   </Link> */}
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* ═══ HERO TO MARQUEE SPACER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
//         <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           {/* <div className="h-6 lg:h-8" /> */}
//         </div>
//       </div>

   

//       {/* ═══ MARQUEE TO SHOWCASE SPACER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
//         <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           {/* <div className="h-6 lg:h-8" /> */}
//         </div>
//       </div>

//       {/* ═══ ELEGANT DIVIDER ═══ */}
//       <div className="relative">
//         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
//         <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
//         <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-32 h-8 bg-gradient-to-r from-cyan-500/5 via-cyan-400/25 to-cyan-500/5 blur-2xl rounded-full animate-pulse-slow" />
//         <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-24 h-6 bg-gradient-to-r from-blue-500/5 via-blue-400/20 to-blue-500/5 blur-xl rounded-full" />
//       </div>

//       {/* ═══ FEATURED PRODUCTS ═══ */}

//     <section className="relative py-20 bg-gradient-to-b from-transparent via-gray-950/50 to-transparent">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
//             <div className="space-y-4">
//               {/* <p className="section-label">POPULAR</p> */}
//               <h2 className="text-4xl md:text-7xl font-bold">Products</h2>
//               <p className="text-gray-400 max-w-xl">
//                 Discover our most popular automation products chosen by customers like you
//               </p>
//             </div>
//             <Link to="/shop"
//               className="mt-6 md:mt-0 inline-flex items-center gap-2 rounded-2xl glass-strong px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
//               View All <ArrowRight size={16} />
//             </Link>
//           </div>

//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400" />
//             </div>
//           ) : featuredProducts.length > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//               {featuredProducts.map((product) => (
//                 <Link key={product.id} to={`/product/${product.id}`}
//                   className="group relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 card-hover">
//                   <div className="relative h-56 overflow-hidden rounded-2xl bg-gray-800 mb-6">
//                     {product.image_url ? (
//                       <SafeImage
//                         src={product.image_url}
//                         alt={product.name}
//                         className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
//                         fallback={<div className="flex h-full items-center justify-center text-gray-500"><Cpu size={48} className="opacity-30" /></div>}
//                       />
//                     ) : (
//                       <div className="flex h-full items-center justify-center text-gray-500">
//                         <Cpu size={48} className="opacity-30" />
//                       </div>
//                     )}
//                     {product.stock_quantity <= 0 && (
//                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
//                         <span className="badge badge-danger">Out of Stock</span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <span className="badge badge-info uppercase">
//                         {product.category_name || "General"}
//                       </span>
//                       <span className="text-xl font-bold text-cyan-400">${parseFloat(product.price).toFixed(2)}</span>
//                     </div>

//                     <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition line-clamp-1">
//                       {product.name}
//                     </h3>
//                     <p className="text-sm text-gray-400 line-clamp-2">{product.description || "Premium automation product"}</p>

//                     <div className="flex items-center justify-between pt-2">
//                       <div className="flex items-center gap-2">
//                         <span className={`inline-block w-2 h-2 rounded-full ${product.stock_quantity > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
//                         <span className="text-xs text-gray-500">{product.stock_quantity > 0 ? "In Stock" : "Unavailable"}</span>
//                       </div>
//                       <button onClick={(e) => handleAddToCart(product, e)} disabled={product.stock_quantity <= 0}
//                         className="rounded-xl glass p-2.5 text-cyan-400 hover:glass-strong transition disabled:opacity-30 disabled:cursor-not-allowed">
//                         <ShoppingCart size={18} />
//                       </button>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           ) : (
//             <div className="glass-strong rounded-3xl p-16 text-center">
//               <p className="text-xl font-semibold text-gray-100">No products available yet</p>
//               <p className="mt-3 text-gray-500">Check back soon for new arrivals.</p>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* ═══ CATEGORIES ═══ */}
//       <section className="relative py-24 bg-gradient-to-b from-gray-950 via-slate-900/40 to-gray-950 overflow-hidden">
//         {/* Decorative background visual elements */}
//         <div className="pointer-events-none absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />
//         <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
        
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//           <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
//             <div className="space-y-3">
//               <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/20">
//                 Explore Ecosystem
//               </div>
//               <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">Shop by Category</h2>
//               <p className="text-gray-400 max-w-xl text-base leading-relaxed">
//                 Browse our extensive collection of technical automation products tailored for environments demanding smart precision.
//               </p>
//             </div>
//             <Link to="/shop" 
//               className="group inline-flex items-center gap-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 shadow-lg backdrop-blur-md self-start md:self-end">
//               Explore Catalog <ArrowRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
//             </Link>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {categories.map((cat) => {
//               const Icon = cat.icon;
//               const hasImage = cat.image_url && cat.image_url !== "null" && cat.image_url !== "";
//               return (
//                 <Link key={cat.id} to="/shop"
//                   className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/5">
                  
//                   {/* Visual Background Overlays */}
//                   {hasImage ? (
//                     <div className="absolute inset-0 z-0">
//                       <SafeImage
//                         src={cat.image_url}
//                         alt={cat.name}
//                         className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500 scale-105 group-hover:scale-100 transition-transform duration-700"
//                         fallback={null}
//                       />
//                       <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} mix-blend-color-dodge opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
//                     </div>
//                   ) : (
//                     <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${cat.color} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500`} />
//                   )}

//                   {/* Top content wrapper */}
//                   <div className="relative z-10 space-y-6">
//                     {/* Icon Base Container */}
//                     <div className="relative inline-flex">
//                       <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cat.color} opacity-20 blur-md group-hover:blur-xl transition-all duration-500`} />
//                       <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-xl border border-white/10 relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
//                         {hasImage ? (
//                           <SafeImage
//                             src={cat.image_url}
//                             alt={cat.name}
//                             className="w-full h-full object-cover"
//                             fallback={<Icon size={24} className="text-white" />}
//                           />
//                         ) : (
//                           <Icon size={24} className="text-white" />
//                         )}
//                       </div>
//                     </div>

//                     {/* Metadata Header text */}
//                     <div className="space-y-2">
//                       <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors duration-300">{cat.name}</h3>
//                       <p className="text-sm text-gray-400/90 leading-relaxed font-normal min-h-[40px] line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">{cat.desc}</p>
//                     </div>
//                   </div>

//                   {/* Bottom functional interactive row */}
//                   <div className="relative z-10 pt-6 mt-4 border-t border-white/[0.04] flex items-center justify-between">
//                     <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 group-hover:text-cyan-400 transition-colors duration-300">
//                       View Products
//                     </span>
//                     <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-transparent transition-all duration-300 group-hover:translate-x-1">
//                       <ChevronRight size={16} />
//                     </div>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </div>
//       </section>
      
    
//       {/* ═══ PREMIUM SHOWCASE ═══ */}
//       <section className="relative py-16 lg:py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
//             <div className="space-y-6">
//               <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300 backdrop-blur-xl">
//                 Premium Smart Living
//               </span>
//               <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
//                 Future Smart Living
//               </h2>
//               <p className="max-w-xl text-lg leading-relaxed text-gray-400">
//                 Experience intelligent home control with premium automation, elegant visuals, and adaptive security for every space.
//               </p>
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
//                   <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Smart Automation</p>
//                   <p className="mt-3 text-lg font-semibold text-white">Control every room from one elegant dashboard.</p>
//                 </div>
//                 <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
//                   <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Premium Security</p>
//                   <p className="mt-3 text-lg font-semibold text-white">Protect your home with adaptive sensors and live alerts.</p>
//                 </div>
//               </div>
//             </div>

//             <div className="relative">
//               <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 shadow-2xl shadow-cyan-500/15 transition-transform duration-700 hover:-translate-y-1 hover:scale-[1.01]">
//                 <img
//                   src="https://bas-ip.com/wp-content/uploads/2023/05/smart-home-interface-with-augmented-realty-iot-object-interior-design.jpg"
//                   alt="Smart home interface"
//                   loading="lazy"
//                   decoding="async"
//                   className="h-[420px] min-h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/60" />
//                 <div className="absolute inset-x-6 bottom-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
//                   <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/90">Next Generation Automation</p>
//                   <h3 className="mt-3 text-3xl font-semibold text-white">Control Your Home Intelligently</h3>
//                   <p className="mt-3 text-sm leading-6 text-gray-300">
//                     A premium visual showcase designed for smart homes, blending glassmorphism, soft glow, and immersive motion.
//                   </p>
//                 </div>
//                 <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
//                 <div className="pointer-events-none absolute -right-8 bottom-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
//                 <div className="pointer-events-none absolute left-10 top-20 h-16 w-16 rounded-full bg-cyan-200/10 blur-2xl" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

      

    

//       {/* ═══ CUSTOMER REVIEWS ═══ */}
//       <section className="relative py-24">
//         <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-cyan-950/10 to-gray-950 pointer-events-none" />
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16 space-y-4">
//             <p className="section-label">Testimonials</p>
//             <h2 className="text-4xl md:text-5xl font-bold">What Our Customers Say</h2>
//             <p className="text-gray-400 max-w-2xl mx-auto">
//               Join thousands of satisfied customers who trust Tekunik for their automation needs
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {reviews.map((review) => (
//               <div key={review.id}
//                 className="glass-strong rounded-3xl p-6 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300 card-hover">
//                 <div className="flex items-center gap-1 mb-4">
//                   {[...Array(5)].map((_, i) => (
//                     <Star key={i} size={14}
//                       className={i < review.rating ? "fill-cyan-400 text-cyan-400" : "text-gray-600"} />
//                   ))}
//                 </div>
//                 <p className="text-sm text-gray-300 leading-relaxed mb-6">"{review.text}"</p>
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-black">
//                     {review.avatar}
//                   </div>
//                   <div>
//                     <p className="text-sm font-semibold text-white">{review.name}</p>
//                     <p className="text-xs text-gray-500">{review.role}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

//////
//////
//////
//////
//////
//////
//////
//////
//////
//////
//////
//////


// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   ShoppingCart, ChevronRight, Star, Cpu, Home as HomeIcon,
//   Camera, Wifi, Thermometer, Lock, Lightbulb, CheckCircle,
//   ArrowRight, Sparkles, CircuitBoard, Layers, ArrowUpRight, 
//   ShoppingBag, Sliders, RefreshCw, AlertTriangle
// } from "lucide-react";
// import { useCart } from "../context/CartContext.jsx";
// import { productService, cartService, categoryService } from "../services/api";
// import SafeImage from "../components/SafeImage.jsx";
// import heroBg from "../assest/Variant_ IoT sensor product family.png";

// const reviews = [
//   { id: 1, name: "Sarah Chen", role: "Smart Homeowner", avatar: "SC", rating: 5, text: "Transformed my architectural environment into an autonomous ecosystem. The engineering grade is flawless." },
//   { id: 2, name: "Marcus Johnson", role: "Hardware Engineer", avatar: "MJ", rating: 5, text: "Incredible response times on the IoT microcontrollers. Exceptional craftsmanship and industrial packaging." },
//   { id: 3, name: "Priya Sharma", role: "Operations Lead", avatar: "PS", rating: 5, text: "The custom automation frameworks streamlined our multi-tier infrastructure. Unmatched performance scales." },
//   { id: 4, name: "Alex Rodriguez", role: "Security Director", avatar: "AR", rating: 5, text: "The sensor packages integrate natively with existing firewalls. Zero telemetry lag recorded." },
// ];

// // Precision Micro-Animations
// const transitionConfig = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

// const faderUp = {
//   hidden: { opacity: 0, y: 40 },
//   visible: { opacity: 1, y: 0, transition: transitionConfig }
// };

// const containerStagger = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
// };

// export default function Home({ token }) {
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [featuredProducts, setFeaturedProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState("");
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const [prodRes, catRes] = await Promise.all([
//           productService.getAllProducts(1, 6).catch(err => {
//             console.warn("Failed to load products:", err);
//             return { data: { products: [] } };
//           }),
//           categoryService.getAllCategories().catch(err => {
//             console.warn("Failed to load categories:", err);
//             return { data: { categories: [] } };
//           })
//         ]);
        
//         setFeaturedProducts(prodRes.data?.products?.slice(0, 6) || []);
        
//         const glowAccents = [
//           "shadow-cyan-500/10 border-cyan-500/20 text-cyan-400",
//           "shadow-emerald-500/10 border-emerald-500/20 text-emerald-400",
//           "shadow-violet-500/10 border-violet-500/20 text-violet-400",
//           "shadow-blue-500/10 border-blue-500/20 text-blue-400",
//           "shadow-amber-500/10 border-amber-500/20 text-amber-400",
//         ];
        
//         const iconMap = [HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer];
        
//         const dynamicCategories = (catRes.data?.categories || []).map((cat, i) => ({
//           ...cat,
//           icon: iconMap[i % iconMap.length],
//           stylePreset: glowAccents[i % glowAccents.length],
//           desc: cat.description || `Industrial scale ${cat.name} solutions`
//         }));
        
//         setCategories(dynamicCategories);
//       } catch (error) {
//         console.error("Failed to load ecosystem matrices:", error);
//         setError("System framework failed to load cleanly. Force refreshing is advised.");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     loadData();
//   }, []);

//   const handleAddToCart = async (product, e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (!token) {
//       addToCart(product, 1);
//       setNotification(`${product.name} initialized into cart.`);
//       setTimeout(() => setNotification(""), 3000);
//       return;
//     }

//     try {
//       await cartService.addToCart(product.id, 1);
//       setNotification(`${product.name} secure-routed to cart.`);
//       setTimeout(() => setNotification(""), 3000);
//     } catch (error) {
//       setNotification(error.message || "Routing collision occurs");
//       setTimeout(() => setNotification(""), 3000);
//     }
//   };

//   if (error) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center p-8">
//         <div className="max-w-md w-full border border-zinc-900 bg-zinc-950 p-8 rounded-none text-center relative">
//           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-red-500" />
//           <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" strokeWidth={1} />
//           <h3 className="text-sm font-mono tracking-widest text-zinc-400 uppercase mb-2">System Interruption</h3>
//           <p className="text-xs text-zinc-500 mb-6 font-mono">{error}</p>
//           <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-xs font-mono tracking-widest text-white hover:bg-white hover:text-black transition-all duration-300">
//             RE-INITIALIZE
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#030303] text-zinc-300 antialiased font-sans selection:bg-white selection:text-black">
      
//       {/* ═══ MINIMALIST NOTIFICATION BANNER ═══ */}
//       <AnimatePresence>
//         {notification && (
//           <motion.div 
//             initial={{ opacity: 0, y: 15 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="fixed bottom-8 right-8 z-50 bg-zinc-950 border border-zinc-800 rounded-none px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
//               <span className="text-xs font-mono tracking-wider text-zinc-200 uppercase">{notification}</span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ═══ SECTION I: THE CINEMATIC HERO MONOLITH ═══ */}
//       <section className="relative min-h-screen flex items-center justify-center overflow-hidden border-b border-zinc-900">
//         {/* Full Screen Ambient Plate */}
//         <div className="absolute inset-0 bg-cover bg-center opacity-25 scale-100 transition-transform duration-1000" style={{ backgroundImage: `url(${heroBg})` }} />
//         <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-[#030303]/40" />
        
//         {/* Architectural Grid Lines */}
//         <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

//         <div className="relative w-full max-w-7xl mx-auto px-6 z-10 text-center">
//           <motion.div 
//             initial={{ opacity: 0, y: 15 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase mb-8 border border-cyan-500/20 bg-cyan-950/20 px-4 py-1.5 rounded-full"
//           >
//             <Sparkles size={10} /> LABORATORY GRADE SYSTEMS AVAILABLE
//           </motion.div>

//           <motion.h1 
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, delay: 0.1 }}
//             className="text-4xl sm:text-6xl md:text-8xl font-normal tracking-[-0.03em] text-white leading-[0.95]"
//           >
//             Engineered For <br />
//             <span className="font-light italic text-zinc-500">Autonomous Ecosystems</span>
//           </motion.h1>

//           <motion.p 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 1, delay: 0.3 }}
//             className="mt-8 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-mono tracking-wide leading-relaxed"
//           >
//             Premium industrial automation hardware and environmental sensors calibrated for absolute structural synergy.
//           </motion.p>

//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.4 }}
//             className="mt-12 flex items-center justify-center gap-6"
//           >
//             <Link to="/shop" className="group relative inline-flex items-center gap-3 bg-white text-black text-xs font-mono font-bold tracking-[0.2em] uppercase px-8 py-4 transition-all duration-300 hover:bg-cyan-400 shadow-xl">
//               ACCESS APPARATUS
//               <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
//             </Link>
//           </motion.div>
//         </div>

//         {/* Minimal Scroll Telemetry indicator */}
//         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
//           <span className="text-[9px] font-mono tracking-[0.3em] text-white uppercase">SCROLL ENGINE</span>
//           <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
//         </div>
//       </section>

//       {/* ═══ SECTION II: THE INTEGRATED CATEGORY GRID INDEX ═══ */}
//       <section className="relative py-32 bg-black border-b border-zinc-900">
//         <div className="max-w-7xl mx-auto px-6">
          
//           <div className="grid lg:grid-cols-12 gap-8 items-end mb-24">
//             <div className="lg:col-span-6">
//               <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase block mb-3">// MATRIX DIRECTORIES</span>
//               <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">Shop by Architecture</h2>
//             </div>
//             <div className="lg:col-span-6 lg:text-right">
//               <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors group">
//                 VIEW CORE ARCHIVE <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-cyan-400" />
//               </Link>
//             </div>
//           </div>

//           <motion.div 
//             variants={containerStagger}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-100px" }}
//             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900 border border-zinc-900"
//           >
//             {categories.map((cat) => {
//               const Icon = cat.icon;
//               return (
//                 <motion.div variants={faderUp} key={cat.id} className="group relative bg-[#050505] p-8 transition-all duration-500 hover:bg-zinc-950">
//                   <div className="flex items-start justify-between mb-12">
//                     <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-300">
//                       <Icon size={18} strokeWidth={1.5} />
//                     </div>
//                     <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">SELECTOR // 0{cat.id || 1}</span>
//                   </div>

//                   <div className="space-y-2">
//                     <h3 className="text-lg font-normal tracking-tight text-white group-hover:text-cyan-400 transition-colors">{cat.name}</h3>
//                     <p className="text-xs text-zinc-500 font-mono leading-relaxed line-clamp-2">{cat.desc}</p>
//                   </div>

//                   <div className="mt-12 pt-6 border-t border-zinc-900/60 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-zinc-500 group-hover:text-white transition-colors">
//                     <span>EXPLORE CATALOGUE</span>
//                     <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-cyan-400" />
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══ SECTION III: HIGH CONTRAST PRODUCT SHOWROOM ═══ */}
//       <section className="relative py-32 bg-[#030303]">
//         <div className="max-w-7xl mx-auto px-6">
          
//           <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
//             <div>
//               <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase block mb-3">// HARDWARE APPARATUS</span>
//               <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">Featured Machinery</h2>
//             </div>
//             <div className="flex items-center gap-4 border border-zinc-800 bg-black p-2 rounded-none">
//               <span className="text-[11px] font-mono text-zinc-400 px-3 uppercase tracking-wider">PRECISE STOCKS ARCHIVE</span>
//             </div>
//           </div>

//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-32 gap-3">
//               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-6 h-6 border border-cyan-400 border-t-transparent" />
//               <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase">STREAMING INTERNALS...</span>
//             </div>
//           ) : featuredProducts.length > 0 ? (
//             <motion.div 
//               variants={containerStagger}
//               initial="hidden"
//               whileInView="visible"
//               viewport={{ once: true, margin: "-50px" }}
//               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
//             >
//               {featuredProducts.map((product) => (
//                 <motion.div variants={faderUp} key={product.id} className="group relative border border-zinc-900 bg-black p-5 transition-all duration-500 hover:border-zinc-700 flex flex-col justify-between">
                  
//                   {/* High Definition Product Isolation Plate */}
//                   <div className="relative w-full h-72 bg-[#070707] overflow-hidden border border-zinc-900 mb-6 flex items-center justify-center">
//                     {product.image_url ? (
//                       <SafeImage src={product.image_url} alt={product.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-102" fallback={<Cpu size={32} strokeWidth={1} className="text-zinc-700" />} />
//                     ) : (
//                       <Cpu size={32} strokeWidth={1} className="text-zinc-700" />
//                     )}
                    
//                     {product.stock_quantity <= 0 && (
//                       <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center">
//                         <span className="border border-red-900 text-red-500 font-mono text-[9px] px-3 py-1 tracking-widest uppercase">OUT OF STREAM</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Operational Parameters Specs */}
//                   <div className="flex-grow flex flex-col justify-between">
//                     <div>
//                       <div className="flex items-center justify-between gap-4 mb-4">
//                         <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-1 tracking-wider uppercase">
//                           {product.category_name || "HARDWARE"}
//                         </span>
//                         <span className="text-md font-mono font-bold text-white">₹{parseFloat(product.price).toFixed(2)}</span>
//                       </div>

//                       <Link to={`/product/${product.id}`} className="block mb-2">
//                         <h3 className="text-md font-normal text-white group-hover:text-cyan-400 transition-colors tracking-tight line-clamp-1">
//                           {product.name}
//                         </h3>
//                       </Link>
//                       <p className="text-xs text-zinc-500 font-mono leading-relaxed line-clamp-2 mb-6">
//                         {product.description || "No description logged for active asset serial."}
//                       </p>
//                     </div>

//                     <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
//                       <div className="flex items-center gap-2">
//                         <span className={`w-1.5 h-1.5 rounded-none ${product.stock_quantity > 0 ? "bg-cyan-400" : "bg-zinc-800"}`} />
//                         <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">{product.stock_quantity > 0 ? "STABLE // IN STOCK" : "UNAVAILABLE"}</span>
//                       </div>
                      
//                       <button 
//                         onClick={(e) => handleAddToCart(product, e)} 
//                         disabled={product.stock_quantity <= 0}
//                         className="bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black border border-zinc-800 hover:border-white p-2.5 transition-all duration-300 disabled:opacity-10"
//                       >
//                         <ShoppingCart size={14} />
//                       </button>
//                     </div>
//                   </div>

//                 </motion.div>
//               ))}
//             </motion.div>
//           ) : (
//             <div className="border border-zinc-900 bg-black p-16 text-center max-w-md mx-auto">
//               <Layers size={24} className="mx-auto text-zinc-700 mb-4" strokeWidth={1} />
//               <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">NO HARDWARE RECORDS DISCOVERED</p>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* ═══ SECTION IV: ARCHITECTURAL MONOCHROME SHOWCASE ═══ */}
//       <section className="relative py-36 overflow-hidden border-t border-zinc-900 bg-black">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="grid lg:grid-cols-12 gap-16 items-center">
            
//             <div className="lg:col-span-5 space-y-8">
//               <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-400 border border-cyan-500/20 bg-cyan-950/30 px-3 py-1 rounded-full uppercase">// ECOSYSTEM TELEMETRY</span>
//               <h2 className="text-4xl sm:text-6xl font-light text-white tracking-[-0.02em] leading-[0.95]">
//                 Complete Architectural Oversight.
//               </h2>
//               <p className="text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed tracking-wide">
//                 Integrate complex array networks natively with zero external middleware dependencies. Experience absolute system visibility under a hyper-minimalized terminal command pipeline.
//               </p>
              
//               <div className="space-y-3 pt-4 font-mono text-[11px] text-zinc-500">
//                 {[
//                   "CRYPTO-SECURED HARDWARE STACK PASSES",
//                   "REAL-TIME MILLISECOND REACTION TELEMETRY",
//                   "ORGANIC AMBIENT AUTOMATION BALANCING"
//                 ].map((text, i) => (
//                   <div key={i} className="flex items-center gap-3">
//                     <div className="w-1 h-1 bg-cyan-400" />
//                     <span className="tracking-widest text-zinc-400">{text}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="lg:col-span-7 relative">
//               <motion.div 
//                 initial={{ opacity: 0, x: 30 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 viewport={{ once: true }}
//                 transition={transitionConfig}
//                 className="relative bg-zinc-950 border border-zinc-900 p-3"
//               >
//                 <img 
//                   src="https://bas-ip.com/wp-content/uploads/2023/05/smart-home-interface-with-augmented-realty-iot-object-interior-design.jpg" 
//                   alt="Telemetry Interface Mockup" 
//                   className="w-full h-[450px] object-cover grayscale brightness-75 contrast-125 filter"
//                 />
//                 <div className="absolute top-6 left-6 bg-black/80 border border-zinc-800 font-mono text-[9px] px-3 py-1.5 text-zinc-400 tracking-widest uppercase">
//                   ACTIVE MATRIX STACK STATUS // STABLE
//                 </div>
//               </motion.div>
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* ═══ SECTION V: TELEMETRY VALIDATIONS (REVIEWS) ═══ */}
//       <section className="relative py-32 bg-[#030303] border-t border-zinc-900">
//         <div className="max-w-7xl mx-auto px-6">
          
//           <div className="text-center max-w-xl mx-auto mb-24">
//             <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase block mb-3">// NETWORK VALIDATION</span>
//             <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Ecosystem Deployment Reports</h2>
//           </div>

//           <motion.div 
//             variants={containerStagger}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-50px" }}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900 border border-zinc-900"
//           >
//             {reviews.map((review) => (
//               <motion.div 
//                 variants={faderUp}
//                 key={review.id}
//                 className="bg-black p-8 flex flex-col justify-between hover:bg-zinc-950 transition-colors duration-300"
//               >
//                 <div>
//                   <div className="flex items-center gap-0.5 mb-8">
//                     {[...Array(5)].map((_, i) => (
//                       <Star key={i} size={10} className={i < review.rating ? "fill-cyan-400 text-cyan-400" : "text-zinc-800"} />
//                     ))}
//                   </div>
//                   <p className="text-xs font-mono text-zinc-400 leading-relaxed tracking-wide">"{review.text}"</p>
//                 </div>

//                 <div className="flex items-center gap-3 pt-8 mt-12 border-t border-zinc-900">
//                   <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-white">
//                     {review.avatar}
//                   </div>
//                   <div>
//                     <h4 className="text-xs font-mono font-bold text-white tracking-wide">{review.name}</h4>
//                     <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider block mt-0.5">{review.role}</span>
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//     </div>
//   );
// }

////////////
///

///

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, ChevronRight, Star, Cpu, Home as HomeIcon,
  Camera, Wifi, Thermometer, Lock, Lightbulb, CheckCircle,
  ArrowRight, Sparkles, CircuitBoard, Layers, ShieldCheck, 
  Truck, BadgeCheck, Percent, RefreshCw, AlertCircle, Heart
} from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { productService, cartService, categoryService } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";

// Standard high-trust Indian E-commerce Reviews
const reviews = [
  { id: 1, name: "Rakesh Sharma", role: "Verified Buyer, Bengaluru", avatar: "RS", rating: 5, text: "Excellent product quality! Perfect for my smart home setup. Fast delivery to Indiranagar within 2 days." },
  { id: 2, name: "Ananya Iyer", role: "Verified Buyer, Chennai", avatar: "AI", rating: 5, text: "Very easy to install. The sensor integration is seamless. Customer support team helped me configure it over WhatsApp." },
  { id: 3, name: "Vikram Malhotra", role: "Verified Buyer, Mumbai", avatar: "VM", rating: 5, text: "Using these automation tools for our corporate office space. Sturdy build quality and great packaging." },
  { id: 4, name: "Deepak Gupta", role: "Verified Buyer, Delhi", avatar: "DG", rating: 4, text: "Value for money product. Best IoT catalog in India right now. Cash on delivery option made ordering very secure." },
];

export default function Home({ token }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [prodRes, catRes] = await Promise.all([
          productService.getAllProducts(1, 6).catch(err => {
            console.warn("Failed to load products:", err);
            return { data: { products: [] } };
          }),
          categoryService.getAllCategories().catch(err => {
            console.warn("Failed to load categories:", err);
            return { data: { categories: [] } };
          })
        ]);
        
        setFeaturedProducts(prodRes.data?.products?.slice(0, 6) || []);
        
        const colors = [
          "bg-blue-50 text-blue-600 border-blue-100",
          "bg-emerald-50 text-emerald-600 border-emerald-100",
          "bg-purple-50 text-purple-600 border-purple-100",
          "bg-orange-50 text-orange-600 border-orange-100",
          "bg-cyan-50 text-cyan-600 border-cyan-100",
          "bg-rose-50 text-rose-600 border-rose-100",
        ];
        
        const iconMap = [HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer];
        
        const dynamicCategories = (catRes.data?.categories || []).map((cat, i) => ({
          ...cat,
          icon: iconMap[i % iconMap.length],
          colorStyle: colors[i % colors.length],
          desc: cat.description || `Explore our ${cat.name} range`
        }));
        
        setCategories(dynamicCategories);
      } catch (error) {
        console.error("Failed to load home data:", error);
        setError("Failed to sync store parameters. Please reload.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      addToCart(product, 1);
      setNotification(`🛒 Added ${product.name} to your basket!`);
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    try {
      await cartService.addToCart(product.id, 1);
      setNotification(`🛒 Added ${product.name} to your basket!`);
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      setNotification(error.message || "Could not complete item routing.");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Issues</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ═══ FLASH ACTION STATUS BANNER ═══ */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-full px-6 py-3.5 shadow-2xl flex items-center gap-3 min-w-[320px] justify-center"
          >
            <span className="text-sm font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION I: CLEAN HERO HERO BANNER GRID ═══ */}
      <section className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white pt-28 pb-20 overflow-hidden">
        {/* Subtle geometric overlay pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 text-left space-y-6">
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs tracking-wider uppercase shadow-sm animate-pulse">
                <Percent size={14} /> India's Best Tech Offers Live
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Upgrade Your Space With <span className="text-amber-400">Smart Automation</span>
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-xl leading-relaxed">
                Shop premium, heavy-duty automation systems, IoT switches, and smart home arrays. Super-fast shipping across India with 100% genuine brand warranty.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/shop" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-4 rounded-xl text-md shadow-lg shadow-black/10 transition-transform active:scale-[0.98] inline-flex items-center gap-2">
                  Shop All Products
                  <ArrowRight size={18} />
                </Link>
                <div className="text-xs text-blue-200 font-medium space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                  <p>✓ Cash on Delivery Available</p>
                  <p>✓ Easy 7-Day Returns</p>
                </div>
              </div>
            </div>

            {/* Clean Hero Visual Grid Frame */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
                <div className="bg-white rounded-xl overflow-hidden shadow-inner p-2">
                  <img 
                    src="https://bas-ip.com/wp-content/uploads/2023/05/smart-home-interface-with-augmented-realty-iot-object-interior-design.jpg" 
                    alt="Smart Home Electronics Ecosystem" 
                    className="w-full h-[320px] object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ TRUST HUB TRIPLE VALUE PIPELINE ═══ */}
      <section className="bg-white border-b border-slate-200 py-4 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="flex items-center gap-4 py-2 md:py-0 md:justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Truck size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Free & Fast Shipping</p>
              <p className="text-xs text-slate-500">Free delivery inside India on all prepaid orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-2 md:py-0 md:justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><BadgeCheck size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">100% Genuine Products</p>
              <p className="text-xs text-slate-500">Directly sourced from certified tech manufacturing facilities</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-2 md:py-0 md:justify-center">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Secure Secure Transactions</p>
              <p className="text-xs text-slate-500">UPI, NetBanking, Credit/Debit Cards & COD supported</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION II: HIGHLY RESPONSE HORIZONTAL CATEGORIES BAR ═══ */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Trending Categories</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Explore our top hardware ranges built for performance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link to="/shop" key={cat.id} className="group bg-slate-50 border border-slate-200 hover:border-blue-400 p-5 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-md">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3.5 transition-transform group-hover:scale-105 ${cat.colorStyle}`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{cat.name}</h3>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium group-hover:text-slate-500 transition-colors">View Range</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION III: DYNAMIC PRODUCT RETAIL GRID ═══ */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Top Deals On Featured Hardware</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Handpicked premium devices with highly rated reviews</p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 border-b-2 border-transparent hover:border-blue-600 py-1 transition-all self-start sm:self-center">
            See All Offers <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fetching store catalog...</span>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden p-3.5 flex flex-col justify-between transition-all hover:shadow-lg relative">
                
                {/* Wishlist Icon Micro Interaction */}
                <button className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-100 shadow-sm transition-colors">
                  <Heart size={15} />
                </button>

                {/* Main Product Retail Image Box */}
                <div className="relative w-full h-40 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-3">
                  {product.image_url ? (
                    <SafeImage src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2 mix-blend-multiply" fallback={<Cpu size={28} className="text-slate-300" />} />
                  ) : (
                    <Cpu size={28} className="text-slate-300" />
                  )}
                  
                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                      <span className="bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Information Specification Block */}
                <div className="flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide block">
                      {product.category_name || "IoT Hardware"}
                    </span>
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 line-clamp-1 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Micro E-commerce Rating Indicators */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="bg-emerald-600 text-white font-bold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        4.4 <Star size={10} className="fill-white text-transparent" />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">(128 ratings)</span>
                    </div>

                    {/* Price with fake retail percentage markdowns */}
                    <div className="flex flex-col items-baseline gap-1.5 pt-2">
                      <span className="text-md font-extrabold text-slate-900">₹{parseFloat(product.price).toFixed(2)}</span>
                      <span className="text-xs text-slate-400 line-through">₹{(parseFloat(product.price) * 1.25).toFixed(2)}</span>
                      <span className="text-xs text-emerald-600 font-bold">20% off</span>
                    </div>
                  </div>

                  {/* High conversion Add to Cart Trigger */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center gap-2">
                    <button 
                      onClick={(e) => handleAddToCart(product, e)} 
                      disabled={product.stock_quantity <= 0}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-[0.97] disabled:pointer-events-none"
                    >
                      <ShoppingCart size={13} />
                      Add to Basket
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 bg-white rounded-2xl p-14 text-center max-w-md mx-auto shadow-sm">
            <Layers size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No active promotions logged</p>
            <p className="text-xs text-slate-400 mt-1">Our team is setting up fresh catalog inventories. Check back soon!</p>
          </div>
        )}
      </section>

      {/* ═══ SECTION IV: TRUSTWORTHY INDIAN USER REVIEWS GRID ═══ */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">What Our Customers Say</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Real ratings from verified tech buyers across Indian cities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">"{review.text}"</p>
                </div>

                <div className="flex items-center gap-3 pt-4 mt-5 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      {review.name} 
                      <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
