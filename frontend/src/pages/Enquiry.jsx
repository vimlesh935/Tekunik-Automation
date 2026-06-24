import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Loader2, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { demoEnquiryService } from "../services/api";

const initialFormData = {
  full_name: "",
  email: "",
  phone: "",
  preferred_date: "",
  preferred_time: "",
  message: "",
};

export default function Enquiry() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.full_name.trim()) {
      nextErrors.full_name = "Full Name is required";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(formData.email.trim())) {
      nextErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Phone must be at least 10 digits";
    }

    if (!formData.preferred_date) {
      nextErrors.preferred_date = "Preferred Date is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

      if (response.success) {
        setFormData(initialFormData);
        navigate("/thank-you", { replace: true });
        return;
      }

      setServerError({
        code: response.code || "SUBMISSION_FAILED",
        message: response.message || "Submission failed. Please try again.",
        errors: response.errors || response.details?.errors || [],
      });
    } catch (error) {
      setServerError({
        code: error.code || "SUBMISSION_FAILED",
        message: error.message || "Unable to submit your enquiry. Please try again.",
        errors: error.details?.errors || [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-cyan-950/50" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-4 lg:pt-12"
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300 mb-5">
              Free Consultation
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Book Free Demo
            </h1>
            <p className="text-lg text-gray-300 leading-8 max-w-xl">
              Fill in your details and our team will contact you to schedule a smart home demo.
            </p>

            <div className="mt-10 space-y-4">
              {["Saved in MySQL", "Email sent to the team", "Quick follow-up from Tekunik"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-gray-200">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5"
          >
            {serverError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-xs font-mono text-red-300 uppercase tracking-wider mb-1">
                  {serverError.code}
                </p>
                <p className="text-sm text-red-100">{serverError.message}</p>
                {serverError.errors.length > 0 && (
                  <ul className="mt-2 text-xs text-red-200 list-disc list-inside">
                    {serverError.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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

            <div className="grid sm:grid-cols-2 gap-5">
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
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleChange}
                  min={today}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.preferred_date ? "border-red-500" : "border-white/10"
                  } text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all [color-scheme:dark]`}
                />
                {errors.preferred_date && <p className="mt-1 text-sm text-red-400">{errors.preferred_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Time
                </label>
                <input
                  type="time"
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your requirements..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
              />
            </div>

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
          </motion.form>
        </div>
      </div>
    </div>
  );
}
