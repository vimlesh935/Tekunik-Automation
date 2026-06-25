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