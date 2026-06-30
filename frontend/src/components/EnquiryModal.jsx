import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { demoEnquiryService } from "../services/api";
import ValidatedEmailInput from "./ValidatedEmailInput.jsx";

export default function EnquiryModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(formData.email.trim())) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else {
      const digits = formData.phone.replace(/\D/g, "");
      if (digits.length < 10) {
        newErrors.phone = "Phone must be at least 10 digits";
      }
    }
    if (!formData.preferred_date) {
      newErrors.preferred_date = "Preferred Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await demoEnquiryService.submit({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time || null,
        message: formData.message.trim() || null,
      });

      console.log("[EnquiryModal] Response:", response);

      if (response.success) {
        setSubmitted(true);
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          preferred_date: "",
          preferred_time: "",
          message: "",
        });
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 4000);
      } else {
        setServerError({
          code: response.code || "UNKNOWN",
          message: response.message || "Submission failed.",
          errors: response.errors || [],
        });
      }
    } catch (error) {
      console.error("[EnquiryModal] Error:", error);
      setServerError({
        code: error.code || "NETWORK_ERROR",
        message: error.message || "Unable to connect to server.",
        errors: error.details?.errors || [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !submitted) {
      setServerError(null);
      setErrors({});
      onClose();
    }
  };

  // ── SUCCESS VIEW ──
  if (submitted) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] p-12 text-center shadow-2xl"
            >
              <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">✅ Demo request submitted successfully.</h3>
              <p className="text-gray-400 text-lg">Our team will contact you shortly.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // ── FORM VIEW ──
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] shadow-2xl"
          >
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── SERVER ERROR ── */}
            {serverError && (
              <div className="mx-8 mt-8 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-mono text-red-300 uppercase tracking-wider mb-1">
                  {serverError.code}
                </p>
                <p className="text-sm text-red-200">{serverError.message}</p>
                {serverError.errors.length > 0 && (
                  <ul className="mt-2 text-xs text-red-300 list-disc list-inside">
                    {serverError.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="px-8 pt-8 pb-4">
              <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6" />
              <h2 className="text-3xl font-bold text-white mb-2">Book Free Demo</h2>
              <p className="text-gray-400">Fill in your details below and we'll get back to you.</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.full_name ? "border-red-500" : "border-white/10"
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all`}
                />
                {errors.full_name && <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.email ? "border-red-500" : "border-white/10"
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.phone ? "border-red-500" : "border-white/10"
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
              </div>

              {/* Preferred Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.preferred_date ? "border-red-500" : "border-white/10"
                    } text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all [color-scheme:dark]`}
                  />
                  {errors.preferred_date && <p className="mt-1 text-sm text-red-400">{errors.preferred_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Time</label>
                  <input
                    type="time"
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about your requirements..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Enquiry
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}