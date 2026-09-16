import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const faqs = [
  {
    questionKey: "homeFaq.wiring.question",
    answerKey: "homeFaq.wiring.answer",
  },
  {
    questionKey: "homeFaq.security.question",
    answerKey: "homeFaq.security.answer",
  },
  {
    questionKey: "homeFaq.internet.question",
    answerKey: "homeFaq.internet.answer",
  },
  {
    questionKey: "homeFaq.installation.question",
    answerKey: "homeFaq.installation.answer",
  },
  {
    questionKey: "homeFaq.subscription.question",
    answerKey: "homeFaq.subscription.answer",
  }
];

export default function FaqSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 bg-background-secondary border-y border-border-color">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t("homeFaq.title")}</h2>
          <p className="text-text-secondary">{t("homeFaq.subtitle")}</p>
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
                <span className="font-medium text-lg pr-8">{t(faq.questionKey)}</span>
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
                      {t(faq.answerKey)}
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
