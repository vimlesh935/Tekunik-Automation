import { motion } from "framer-motion";
import { PackageSearch, Wrench, SmartphoneNfc, Sparkles } from "lucide-react";

const steps = [
  { id: 1, title: "Choose Device", desc: "Select from our premium range.", icon: PackageSearch },
  { id: 2, title: "Professional Installation", desc: "Expert setup with zero damage.", icon: Wrench },
  { id: 3, title: "Connect Mobile App", desc: "Sync devices seamlessly.", icon: SmartphoneNfc },
  { id: 4, title: "Enjoy Smart Living", desc: "Experience true automation.", icon: Sparkles },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-text-secondary">Four simple steps to transform your home.</p>
        </div>

        <div className="relative">
          {/* Animated Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-border-color -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              whileInView={{ x: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-6 relative z-10 border-primary/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:scale-110 transition-transform">
                  <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <step.icon className="w-8 h-8 text-primary relative z-10" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border-color text-xs font-bold">
                    {step.id}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}