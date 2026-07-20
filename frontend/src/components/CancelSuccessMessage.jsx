import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Leaf } from "lucide-react";

const isOnlinePayment = (method) => {
  return method && method !== "cod";
};

export default function CancelSuccessMessage({ show, order, onClose, autoDismissMs = 8000 }) {
  useEffect(() => {
    if (!show || !autoDismissMs) return;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [show, autoDismissMs, onClose]);

  const isOnline = isOnlinePayment(order?.payment_method);
  const orderNumber = order?.order_number || "";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-6 right-6 z-[200] w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/95 to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/10">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <CheckCircle size={26} className="text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Order Cancelled Successfully
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {orderNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 pl-0 sm:pl-16">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your order has been cancelled successfully.
                </p>

                {isOnline ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-sm text-emerald-300 font-medium">
                      Your refund has been initiated and will be credited to your
                      original payment method within <span className="font-bold text-emerald-200">5–7 business days</span>,
                      depending on your bank.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      You will receive a confirmation once the refund is processed.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-sm text-slate-300">
                      Since this order was not prepaid, no refund is required.
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      We hope to serve you again soon.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Leaf size={12} className="text-emerald-500/60" />
                  <span>
                    Thank you for choosing <span className="font-semibold text-slate-400">TekNode</span>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
