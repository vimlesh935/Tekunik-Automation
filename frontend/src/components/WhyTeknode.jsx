

// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { HeadphonesIcon, Mic, Smartphone, Globe, Cloud, Leaf, Wrench, ShieldCheck, X } from "lucide-react";

// const features = [
//   { 
//     title: "24x7 Support", 
//     desc: "Always here when you need us.", 
//     icon: HeadphonesIcon, 
//     longDesc: "Our dedicated global support team is available round-the-clock to assist you with any questions, troubleshooting, or configuration support. You can reach us via live chat, phone, or email anytime." 
//   },
//   { 
//     title: "Voice Assistant", 
//     desc: "Works with Alexa & Google.", 
//     icon: Mic, 
//     longDesc: "Seamlessly connect your smart ecosystem with leading voice controllers. Issue voice commands to adjust illumination levels, arm your property, or manage daily multi-device automation routines." 
//   },
//   { 
//     title: "Mobile App Control", 
//     desc: "Manage everything from your phone.", 
//     icon: Smartphone, 
//     longDesc: "Take complete control of your environment with our intuitive native iOS and Android application. Customize dashboard shortcuts, monitor system parameters, and modify settings in a unified UI." 
//   },
//   { 
//     title: "Remote Access", 
//     desc: "Control devices from anywhere.", 
//     icon: Globe, 
//     longDesc: "Whether you are at the office or travelling abroad, securely check real-time device logs, toggle power grids, and receive critical push alerts instantly over encrypted network tunnels." 
//   },
//   { 
//     title: "Cloud Connectivity", 
//     desc: "Secure & fast data sync.", 
//     icon: Cloud, 
//     longDesc: "Powered by edge computing cluster arrays, device states synchronize instantly with millisecond latency. All cloud metrics are mirrored across decentralized node systems for continuous uptime." 
//   },
//   { 
//     title: "Energy Saving", 
//     desc: "Reduce electricity bills easily.", 
//     icon: Leaf, 
//     longDesc: "Gain exhaustive historical utility metrics. Our smart algorithms isolate high-consumption nodes and recommend automated custom schedules to minimize waste and utility expenses." 
//   },
//   { 
//     title: "Easy Installation", 
//     desc: "Zero damage, quick setup.", 
//     icon: Wrench, 
//     longDesc: "Engineered around zero-invasive mounting interfaces. Our plug-and-play architectural components fit straight cleanly into existing wall matrices without expensive rewiring overhauls." 
//   },
//   { 
//     title: "Advanced Security", 
//     desc: "Bank-level encryption standards.", 
//     icon: ShieldCheck, 
//     longDesc: "Equipped with AES-256 bit end-to-end data transport cryptography. Local authentication handshakes ensure external network intrusions cannot compromise the perimeter integrity of your home." 
//   },
// ];

// export default function FeaturesSection() {
//   // Safe JavaScript dynamic state hook
//   const [activeFeature, setActiveFeature] = useState(null);

//   return (
//     <section className="py-24 bg-background-secondary relative border-y border-border-color">
//       <div className="max-w-7xl mx-auto px-6">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.6 }}
//           className="text-center mb-16"
//         >
//           <h2 className="text-4xl font-bold mb-4">Why Choose Automate?</h2>
//           <p className="text-text-secondary">Engineered for reliability, security, and elegance.</p>
//         </motion.div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {features.map((feature, idx) => (
//             <motion.div
//               key={idx}
//               initial={{ opacity: 0, scale: 0.9 }}
//               whileInView={{ opacity: 1, scale: 1 }}
//               viewport={{ once: true }}
//               transition={{ delay: idx * 0.1, duration: 0.5 }}
//               whileHover={{ scale: 1.05 }}
//               onClick={() => setActiveFeature(feature)}
//               className="glass p-6 rounded-2xl flex flex-col items-center text-center group hover:bg-white/5 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:border-secondary/50 cursor-pointer"
//             >
//               <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
//                 <feature.icon className="w-8 h-8 text-secondary" />
//               </div>
//               <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
//               <p className="text-sm text-text-secondary">{feature.desc}</p>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* Professional Pop-up Modal Section */}
//       <AnimatePresence>
//         {activeFeature !== null && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setActiveFeature(null)}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0, y: 20 }}
//               animate={{ scale: 1, opacity: 1, y: 0 }}
//               exit={{ scale: 0.9, opacity: 0, y: 20 }}
//               transition={{ type: "spring", damping: 25, stiffness: 350 }}
//               onClick={(e) => e.stopPropagation()}
//               className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 relative shadow-2xl bg-slate-900/90 text-center flex flex-col items-center"
//             >
//               {/* Close Button */}
//               <button
//                 onClick={() => setActiveFeature(null)}
//                 className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
//               >
//                 <X className="w-4 h-4" />
//               </button>

//               {/* Animated Icon badge inside popup */}
//               <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/30 flex items-center justify-center mb-6 shadow-lg shadow-secondary/10">
//                 <activeFeature.icon className="w-10 h-10 text-secondary" />
//               </div>

//               {/* Heading and content text block */}
//               <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
//                 {activeFeature.title}
//               </h3>
              
//               <p className="text-sm text-indigo-400 font-medium mb-4 uppercase tracking-widest">
//                 {activeFeature.desc}
//               </p>
              
//               <p className="text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
//                 {activeFeature.longDesc}
//               </p>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </section>
//   );
// }

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Mic, Smartphone, Globe, Cloud, Leaf, Wrench, ShieldCheck, X, Expand } from "lucide-react";

const features = [
  { 
    title: "24x7 Support", 
    desc: "Always here when you need us.", 
    icon: HeadphonesIcon, 
    longDesc: "Our dedicated global support team is available round-the-clock to assist you with any questions, troubleshooting, or configuration support. You can reach us via live chat, phone, or email anytime." 
  },
  { 
    title: "Voice Assistant", 
    desc: "Works with Alexa & Google.", 
    icon: Mic, 
    longDesc: "Seamlessly connect your smart ecosystem with leading voice controllers. Issue voice commands to adjust illumination levels, arm your property, or manage daily multi-device automation routines." 
  },
  { 
    title: "Mobile App Control", 
    desc: "Manage everything from your phone.", 
    icon: Smartphone, 
    longDesc: "Take complete control of your environment with our intuitive native iOS and Android application. Customize dashboard shortcuts, monitor system parameters, and modify settings in a unified UI." 
  },
  { 
    title: "Remote Access", 
    desc: "Control devices from anywhere.", 
    icon: Globe, 
    longDesc: "Whether you are at the office or travelling abroad, securely check real-time device logs, toggle power grids, and receive critical push alerts instantly over encrypted network tunnels." 
  },
  { 
    title: "Cloud Connectivity", 
    desc: "Secure & fast data sync.", 
    icon: Cloud, 
    longDesc: "Powered by edge computing cluster arrays, device states synchronize instantly with millisecond latency. All cloud metrics are mirrored across decentralized node systems for continuous uptime." 
  },
  { 
    title: "Energy Saving", 
    desc: "Reduce electricity bills easily.", 
    icon: Leaf, 
    longDesc: "Gain exhaustive historical utility metrics. Our smart algorithms isolate high-consumption nodes and recommend automated custom schedules to minimize waste and utility expenses." 
  },
  { 
    title: "Easy Installation", 
    desc: "Zero damage, quick setup.", 
    icon: Wrench, 
    longDesc: "Engineered around zero-invasive mounting interfaces. Our plug-and-play architectural components fit straight cleanly into existing wall matrices without expensive rewiring overhauls." 
  },
  { 
    title: "Advanced Security", 
    desc: "Bank-level encryption standards.", 
    icon: ShieldCheck, 
    longDesc: "Equipped with AES-256 bit end-to-end data transport cryptography. Local authentication handshakes ensure external network intrusions cannot compromise the perimeter integrity of your home." 
  },
];

export default function FeaturesSection() {
  // Safe JavaScript dynamic state hook
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <section className="py-24 bg-background-secondary relative border-y border-border-color">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Why Choose Automate?</h2>
          <p className="text-text-secondary">Engineered for reliability, security, and elegance.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveFeature(feature)}
              className="glass p-6 rounded-2xl flex flex-col items-center text-center group hover:bg-white/5 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:border-secondary/50 cursor-pointer relative"
            >
              {/* Expand Icon */}
              <div className="absolute top-4 right-4 text-text-secondary group-hover:text-secondary opacity-60 group-hover:opacity-100 transition-all duration-300">
                <Expand className="w-4 h-4" />
              </div>

              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <feature.icon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Professional Pop-up Modal Section */}
      <AnimatePresence>
        {activeFeature !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveFeature(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 relative shadow-2xl bg-slate-900/90 text-center flex flex-col items-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveFeature(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated Icon badge inside popup */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/30 flex items-center justify-center mb-6 shadow-lg shadow-secondary/10">
                <activeFeature.icon className="w-10 h-10 text-secondary" />
              </div>

              {/* Heading and content text block */}
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                {activeFeature.title}
              </h3>
              
              <p className="text-sm text-indigo-400 font-medium mb-4 uppercase tracking-widest">
                {activeFeature.desc}
              </p>
              
              <p className="text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                {activeFeature.longDesc}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}