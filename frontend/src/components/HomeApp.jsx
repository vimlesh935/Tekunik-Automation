import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function AppDownloadSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Home In Your Pocket</h2>
          <p className="text-lg text-text-secondary mb-10 max-w-lg">
            Download the Automate app to access all your devices remotely. Enjoy real-time notifications, camera feeds, and automated routines anywhere in the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-black hover:bg-gray-100 transition-colors group">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current text-black">
                <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path>
                <path d="M10 2c1 .5 2 2 2 3.5-1.5.5-3-.5-3-3.5Z"></path>
              </svg>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide">Download on the</p>
                <p className="text-xl font-bold -mt-1">App Store</p>
              </div>
            </button>
            <button className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl glass border border-white/20 hover:bg-white/10 transition-colors group">
              <Play className="w-8 h-8 fill-current text-white" />
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary group-hover:text-white transition-colors">GET IT ON</p>
                <p className="text-xl font-bold -mt-1">Google Play</p>
              </div>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative h-[600px] flex justify-center lg:justify-end items-center"
        >
          {/* Animated Floating Phone Mockup */}
          <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-[280px] h-[580px] rounded-[3rem] bg-black border-[8px] border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.3)] relative overflow-hidden flex flex-col"
          >
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
              <div className="w-1/3 h-full bg-black rounded-b-xl"></div>
            </div>
            
            {/* Screen UI Placeholder */}
            <div className="flex-1 bg-gradient-to-b from-background to-background-secondary p-6 pt-12">
               <div className="flex justify-between items-center mb-8">
                 <div>
                   <p className="text-xs text-text-secondary">Welcome home,</p>
                   <p className="font-bold">Sarah</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="h-24 rounded-2xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20"></div>
                    <p className="text-sm font-medium">Lights On</p>
                 </div>
                 <div className="h-24 rounded-2xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20"></div>
                    <p className="text-sm font-medium">Doors Locked</p>
                 </div>
               </div>

               <div className="h-40 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 p-4 relative overflow-hidden">
                  <p className="font-medium relative z-10">Living Room Cam</p>
                  <p className="text-xs text-text-secondary relative z-10">Live • 4K</p>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')] mix-blend-overlay opacity-40 bg-cover"></div>
               </div>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -right-10 top-1/4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"
          ></motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute -left-10 bottom-1/4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"
          ></motion.div>
        </motion.div>
      </div>
    </section>
  );
}