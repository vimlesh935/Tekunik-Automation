import { motion } from "framer-motion";
import { CheckCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute w-full max-w-3xl h-[400px] bg-gradient-to-r from-primary/40 via-secondary/40 to-highlight/40 blur-[120px] rounded-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
        className="relative z-10 text-center px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-8" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Thank You
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-4">
          Your demo request has been submitted successfully.
        </p>
        <p className="text-lg text-gray-400 mb-12">
          Our team will contact you shortly.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}