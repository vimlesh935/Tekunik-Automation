import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Loader,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { authService } from "../services/api";
import AuthInput from "../components/AuthInput.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authService.login(email.trim(), password);
      const token = data.data?.token;
      if (!token) throw new Error("No token received from server");
      login(token);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-primary font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 shadow-xl rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-600 hover:bg-slate-800 transition-all duration-300 group z-10"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300 text-blue-600" />
        Back
      </button>

      <div className="w-full max-w-[440px] relative z-10">
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
            <h1 className="section-heading text-2xl">Welcome Back</h1>
            <p className="section-subheading">Sign in to secure your sessions</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              icon={Mail}
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-400 transition-colors duration-300"
                >
                  Forgot Password?
                </button>
              </div>
              <AuthInput
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••••••"
                icon={Lock}
                showPasswordToggle
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="badge-danger rounded-xl p-3.5 text-sm font-medium">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Account"
              )}
            </button>

            <p className="text-center text-sm text-slate-400 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-400 font-bold transition-colors duration-300 underline underline-offset-4 decoration-blue-600/30"
              >
                Register Here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}