import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Headphones, Award, Users, Package, Truck, Clock } from "lucide-react";

export default function AboutUs() {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    orders: 0,
    support: "24/7",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        products: 500,
        customers: 10000,
        orders: 25000,
        support: "24/7",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-8"
          >
            <Zap size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Smart Automation</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
          >
            About <span className="text-indigo-400">Tek Node</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto"
          >
            Empowering Homes and Businesses with Smart Automation Solutions.
          </motion.p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Who We Are</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
                Innovating the Future of Smart Living
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Tek Node specializes in smart automation products including smart switches, digital locks, gateways, sensors, smart knobs, and intelligent control systems designed for homes, offices, hotels, hospitals, educational institutions, and industrial environments.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Our commitment to quality and innovation has made us a trusted name in the automation industry, delivering solutions that transform the way people live and work.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Zap, label: "Smart Tech", desc: "Advanced automation" },
                { icon: Shield, label: "Secure", desc: "Reliable protection" },
                { icon: Award, label: "Premium", desc: "Top quality products" },
                { icon: Headphones, label: "Support", desc: "24/7 assistance" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/30 transition-all">
                  <item.icon size={32} className="text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-sm font-black text-white mb-1">{item.label}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Our Mission</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
              What Drives Us Forward
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              To provide innovative, secure, energy-efficient, and user-friendly automation solutions that improve everyday life for homes and businesses across India and beyond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-4">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">The Tek Node Advantage</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: "Premium Quality Products", desc: " rigorously tested components built to last" },
              { icon: Zap, title: "Advanced Smart Automation", desc: "Cutting-edge technology for modern living" },
              { icon: Shield, title: "Secure & Reliable Solutions", desc: "Enterprise-grade security for peace of mind" },
              { icon: Headphones, title: "Fast Customer Support", desc: "Dedicated team ready to help you anytime" },
              { icon: Award, title: "Professional Installation Guidance", desc: "Expert support from setup to maintenance" },
              { icon: Users, title: "Trusted Technology Partner", desc: "Join thousands of satisfied customers" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-all">
                  <item.icon size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Package, value: stats.products, suffix: "+", label: "Products Available" },
              { icon: Users, value: stats.customers, suffix: "+", label: "Happy Customers" },
              { icon: Truck, value: stats.orders, suffix: "+", label: "Orders Delivered" },
              { icon: Clock, value: null, suffix: "", label: "Support Availability", display: "24/7" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/30 transition-all"
              >
                <stat.icon size={32} className="text-indigo-400 mx-auto mb-3" />
                <div className="text-3xl font-black text-white mb-1">
                  {stat.display || stat.value}{stat.suffix}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}