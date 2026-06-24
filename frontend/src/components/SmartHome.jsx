// import { motion } from "framer-motion";
// import { Lightbulb, Thermometer, Blinds, Lock, Video, CalendarClock } from "lucide-react";

// const controls = [
//   { id: "lights", label: "Control Lights", icon: Lightbulb, active: true },
//   { id: "ac", label: "Control AC", icon: Thermometer, active: false },
//   { id: "curtains", label: "Control Curtains", icon: Blinds, active: false },
//   { id: "doors", label: "Control Door Locks", icon: Lock, active: false },
//   { id: "cameras", label: "Monitor Cameras", icon: Video, active: false },
//   { id: "schedule", label: "Schedule Automation", icon: CalendarClock, active: false },
// ];

// export default function ExperienceSection() {
//   return (
//     <section className="py-24 bg-background-secondary border-y border-border-color overflow-hidden">
//       <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
//         {/* Left: Large Home Image */}
//         <motion.div
//           initial={{ opacity: 0, x: -50 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.8 }}
//           className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden glass border border-white/10"
//         >
//           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-50"></div>
//           <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          
//           <div className="absolute bottom-10 left-10 right-10">
//             <div className="glass p-6 rounded-2xl flex items-center justify-between border border-white/20">
//               <div>
//                 <h4 className="text-xl font-bold mb-1">Living Room</h4>
//                 <p className="text-sm text-text-secondary">Temperature: 24°C • Humidity: 45%</p>
//               </div>
//               <div className="w-16 h-10 rounded-full bg-primary/20 border border-primary p-1 flex items-center cursor-pointer">
//                  <div className="w-8 h-8 rounded-full bg-primary shadow-lg translate-x-6"></div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Right: Phone Mockup & Controls */}
//         <motion.div
//           initial={{ opacity: 0, x: 50 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.8 }}
//         >
//           <h2 className="text-4xl font-bold mb-6">Smart Home Experience</h2>
//           <p className="text-lg text-text-secondary mb-10">
//             Manage your entire home from a single intuitive interface. The Automate app gives you unprecedented control and insight into your living space.
//           </p>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {controls.map((item, idx) => (
//               <motion.div
//                 key={item.id}
//                 initial={{ opacity: 0, y: 10 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ delay: idx * 0.1 }}
//                 whileHover={{ scale: 1.05 }}
//                 className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
//                   item.active 
//                     ? "bg-primary/10 border-primary text-white" 
//                     : "glass border-transparent text-text-secondary hover:text-white hover:border-white/20"
//                 }`}
//               >
//                 <item.icon className={`w-6 h-6 ${item.active ? "text-primary" : ""}`} />
//                 <span className="font-medium">{item.label}</span>
//               </motion.div>
//             ))}
//           </div>

//           {/* <motion.div 
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ delay: 0.8 }}
//             className="mt-10"
//           >
//              <button className="text-primary hover:text-white transition-colors font-medium flex items-center gap-2">
//                View App Features <span className="text-xl">→</span>
//              </button>
//           </motion.div> */}
//         </motion.div>
//       </div>
//     </section>
//   );
// }


import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Thermometer, Blinds, Lock, Video, CalendarClock } from "lucide-react";

const controlsData = [
  { 
    id: "lights", 
    label: "Control Lights", 
    icon: Lightbulb,
    image: "https://i.pinimg.com/1200x/75/3b/61/753b619c49e1b03e2ed4fab126353551.jpg" 
  },
  { 
    id: "ac", 
    label: "Control AC", 
    icon: Thermometer,
    image: "https://i.pinimg.com/736x/f1/fc/71/f1fc7139c996e652d8653a0f926dfcad.jpg" 
  },
  { 
    id: "curtains", 
    label: "Control Curtains", 
    icon: Blinds,
    image: "https://i.pinimg.com/736x/a5/66/6a/a5666a9b5716d120a688f2a81534215f.jpg" 
  },
  { 
    id: "doors", 
    label: "Control Door Locks", 
    icon: Lock,
    image: "https://i.pinimg.com/736x/8e/cd/1c/8ecd1c9f6d479fd2627a65bae3ba9921.jpg" 
  },
  { 
    id: "cameras", 
    label: "Monitor Cameras", 
    icon: Video,
    image: "https://i.pinimg.com/736x/ef/7e/75/ef7e75094f49be1ca257ba4b2b92eef7.jpg" 
  },
  { 
    id: "schedule", 
    label: "Schedule Automation", 
    icon: CalendarClock,
    image: "https://i.pinimg.com/1200x/9a/0c/ad/9a0cad3b73d108da0795a4ee72803fb5.jpg" 
  },
];

export default function ExperienceSection() {
  // Manage which tab item is currently being hovered or active
  const [activeTab, setActiveTab] = useState(controlsData[0]);

  return (
    <section className="py-24 bg-background-secondary border-y border-border-color overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Interactive Home Frame */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden glass border border-white/10 bg-slate-950"
        >
          {/* AnimatePresence enables cross-fade structural imagery updates */}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeTab.id}
              src={activeTab.image}
              alt={activeTab.label}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          
          {/* <div className="absolute bottom-10 left-10 right-10 z-10">
            <div className="glass p-6 rounded-2xl flex items-center justify-between border border-white/20">
              <div>
                <h4 className="text-xl font-bold mb-1">Living Room</h4>
                <p className="text-sm text-text-secondary">Temperature: 24°C • Humidity: 45%</p>
              </div>
              <div className="w-16 h-10 rounded-full bg-primary/20 border border-primary p-1 flex items-center cursor-pointer">
                 <div className="w-8 h-8 rounded-full bg-primary shadow-lg translate-x-6"></div>
              </div>
            </div>
          </div> */}
        </motion.div>

        {/* Right: Phone Mockup & Controls */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-6">Smart Home Experience</h2>
          <p className="text-lg text-text-secondary mb-10">
            Manage your entire home from a single intuitive interface. The Automate app gives you unprecedented control and insight into your living space.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {controlsData.map((item, idx) => {
              const isCurrentlyActive = activeTab.id === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => setActiveTab(item)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                    isCurrentlyActive 
                      ? "bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                      : "glass border-transparent text-text-secondary hover:text-white hover:border-white/20"
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isCurrentlyActive ? "text-primary" : ""}`} />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}