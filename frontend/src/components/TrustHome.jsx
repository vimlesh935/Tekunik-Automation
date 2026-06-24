import { motion } from "framer-motion";

const brands = [
  "Google Home",
  "Amazon Alexa",
  "Apple HomeKit",
  "Samsung SmartThings",
  "Hilton Hotels",
  "Marriott",
  "DLF Builders",
  "Taj Hotels",
];

export default function TrustedBySection() {
  return (
    <section className="py-20 border-y border-border-color bg-background/50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <p className="text-sm font-semibold tracking-wider text-text-secondary uppercase">
          Trusted by Industry Leaders
        </p>
      </div>

      <div className="relative flex w-full flex-col justify-center overflow-hidden">
        {/* Gradient Masks for smooth fading on edges */}
        <div className="absolute left-0 top-0 z-10 h-full w-[100px] bg-gradient-to-r from-background to-transparent md:w-[200px]"></div>
        <div className="absolute right-0 top-0 z-10 h-full w-[100px] bg-gradient-to-l from-background to-transparent md:w-[200px]"></div>

        <motion.div
          animate={{ x: [0, -1035] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20,
          }}
          className="flex w-max gap-16 md:gap-24 px-8 items-center"
        >
          {/* Double the list for infinite scroll effect */}
          {[...brands, ...brands].map((brand, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-xl md:text-2xl font-bold text-text-secondary/50 grayscale hover:grayscale-0 hover:text-white transition-all duration-300"
            >
              {brand}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}