import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Loader,
  ArrowLeft,
  User,
  Lock,
  Phone,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { authService } from "../services/api";
import AuthInput from "../components/AuthInput.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    age: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!form.age || isNaN(form.age) || form.age < 18) {
      setError("You must be at least 18 years old");
      return;
    }
    if (!form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      setError("Address, city, and pincode are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.register({
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        phone: form.phone.trim(),
        age: form.age,
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Make sure the backend is running on port 8787."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-primary font-sans antialiased flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[110px] pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 shadow-xl rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-600 hover:bg-slate-800 transition-all duration-300 group z-10"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300 text-blue-600" />
        Back
      </button>

      <div className="w-full max-w-[560px] relative z-10 my-4">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] transform hover:rotate-12 transition-transform duration-300">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Tek
            <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]">Node</span>
          </span>
        </div>

        <div className="card card-body">
          <div className="text-center mb-8">
            <h1 className="section-heading text-2xl">Create Identity</h1>
            <p className="section-subheading">Provision your secure credentials platform-wide</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <p className="font-bold text-emerald-400 text-lg">Registered Successfully!</p>
              <p className="text-emerald-400/70 text-sm mt-1">Routing to authentication gateway...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="First Name"
                  type="text"
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="John"
                  icon={User}
                />
                <AuthInput
                  label="Last Name"
                  type="text"
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Doe"
                />
              </div>

              <AuthInput
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                icon={Mail}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="Phone Number"
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />
                <AuthInput
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder="18"
                  min="18"
                />
              </div>

              <AuthInput
                label="Address Configuration"
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Street address details"
                icon={MapPin}
                as="textarea"
                rows={2}
                className="resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="City"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Mumbai"
                />
                <AuthInput
                  label="Pincode"
                  type="text"
                  value={form.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  placeholder="400001"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min 6 chars"
                  icon={Lock}
                  showPasswordToggle
                />
                <AuthInput
                  label="Confirm System Password"
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                  placeholder="Confirm"
                  icon={Lock}
                  showPasswordToggle
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Building System Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </button>

              <p className="text-center text-sm text-slate-400 pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-400 font-bold transition-colors duration-300 underline underline-offset-4 decoration-blue-600/30"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
        <p className="text-center mt-6 text-xs text-slate-500 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Tek Node. Secure Core System Architecture.
        </p>
      </div>
    </div>
  );
}