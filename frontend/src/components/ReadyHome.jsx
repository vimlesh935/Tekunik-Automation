import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden flex items-center justify-center border-y border-border-color">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background z-0"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 z-0"></div>
      
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-r from-primary/40 via-secondary/40 to-highlight/40 blur-[120px] rounded-full z-0"
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Ready to Transform <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Your Home?
            </span>
          </h2>
          
          <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
            Book your free smart home consultation today. Experience the ultimate comfort, security, and convenience with Automate.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/enquiry"
              className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Book Free Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button onClick={() => window.open('https://wa.me/919322475209?text=Hello%20Tek%20Node,%20I%20am%20interested%20in%20your%20smart%20automation%20solutions.', '_blank')} className="w-full sm:w-auto px-8 py-5 rounded-2xl glass border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 cursor-pointer">
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
