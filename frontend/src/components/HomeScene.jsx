import { motion } from "framer-motion";
import { Sunrise, MoonStar, Plane, Film } from "lucide-react";

const scenes = [
  {
    title: "Morning Mode",
    desc: "Curtains open, coffee machine starts, and gentle lights turn on.",
    icon: Sunrise,
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    title: "Good Night",
    desc: "Doors lock, lights dim, and AC sets to optimal sleep temperature.",
    icon: MoonStar,
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    title: "Vacation Mode",
    desc: "Randomized lighting and active security cameras for peace of mind.",
    icon: Plane,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Movie Mode",
    desc: "Curtains close, lights dim to 10%, and TV turns on instantly.",
    icon: Film,
    gradient: "from-rose-500 to-red-500",
  },
];

export default function ScenesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Automation Scenes</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Create custom scenes to trigger multiple actions with a single tap or voice command.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {scenes.map((scene, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-3xl relative overflow-hidden group border hover:border-white/20 transition-all cursor-pointer"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${scene.gradient} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`}></div>
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${scene.gradient} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                <scene.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                {scene.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {scene.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}