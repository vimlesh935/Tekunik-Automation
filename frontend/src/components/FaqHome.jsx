import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do I need special wiring for Automate switches?",
    answer: "No, Automate switches are designed to fit into your existing switchboards without requiring neutral wires or re-wiring."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use bank-level AES-256 encryption. Your video feeds and data never leave our secure cloud environment."
  },
  {
    question: "What happens if the internet goes down?",
    answer: "Your smart devices will continue to function normally via physical switches or local network controls (if you are connected to the same WiFi router)."
  },
  {
    question: "Do you offer professional installation?",
    answer: "Absolutely. We have a network of certified professionals who can install and configure your entire smart home in a few hours."
  },
  {
    question: "Is there a monthly subscription fee?",
    answer: "Basic app usage and device control is completely free. We offer an optional premium plan for extended cloud storage of camera feeds."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 bg-background-secondary border-y border-border-color">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-text-secondary">Everything you need to know about our smart home ecosystem.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`glass rounded-2xl overflow-hidden transition-all duration-300 border ${openIndex === idx ? 'border-primary/50' : 'border-white/10 hover:border-white/30'}`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="font-medium text-lg pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-text-secondary transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? "rotate-180 text-primary" : ""}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-text-secondary">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}