import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaTooth,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaUserPlus,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PatientLogin({
  onSuccess,
  onSwitchToRegister,
  onSwitchToDoctor,
}) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/patient/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (onSuccess) onSuccess(data.user);
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #fff0f4 0%, #ffffff 50%, #fff0f4 100%)",
      }}
    >
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 rounded-3xl shadow-2xl overflow-hidden">
        {/* ── Left panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white flex flex-col justify-between"
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "100%",
          }}
        >
          {/* Background image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              zIndex: 0,
            }}
          />

          {/* Dark veil — readability only, no color tint */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.38)",
              zIndex: 1,
            }}
          />

          {/* Decorative blur circles */}
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              top: -60,
              right: -60,
              background: "rgba(255,255,255,0.07)",
              filter: "blur(2px)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              bottom: 80,
              left: -50,
              background: "rgba(255,255,255,0.05)",
              filter: "blur(2px)",
              zIndex: 2,
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 3,
              padding: "40px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-10">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <FaTooth className="text-white text-3xl" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
                  >
                    SmileCare Dental
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Your Trusted Dental Partner
                  </p>
                </div>
              </div>

              <h2
                className="text-4xl font-bold mb-4 leading-tight"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
              >
                Welcome back!
                <br />
                <span style={{ color: "rgba(255,255,255,0.88)" }}>
                  Good to see you again.
                </span>
              </h2>
              <p
                className="text-lg mb-8"
                style={{ color: "rgba(255,255,255,0.82)" }}
              >
                Sign in to manage your appointments, view your records, and
                connect with Sarah 24/7.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "📅", text: "View & manage appointments" },
                  { icon: "🤖", text: "Chat with Sarah anytime" },
                  { icon: "📧", text: "Get email confirmations" },
                  { icon: "🦷", text: "Access dental records" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor CTA card */}
            <div
              className="mt-10 rounded-2xl p-4 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(6px)",
                }}
              >
                👨‍⚕️
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Are you a doctor?
                </p>
                <button
                  onClick={onSwitchToDoctor}
                  className="font-semibold hover:underline text-sm flex items-center gap-1 text-white"
                >
                  Sign in as Doctor <FaArrowRight className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Right panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-10 flex flex-col justify-center"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Patient Sign In
          </h3>
          <p className="text-gray-500 mb-8">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handle}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition placeholder-gray-400"
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fd356d";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(253,53,109,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm outline-none transition placeholder-gray-400"
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fd356d";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(253,53,109,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
                style={{
                  background: "#fff0f4",
                  border: "1px solid #fecdd6",
                  color: "#be123c",
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold
                         transform transition-all duration-300
                         disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #fd356d, #b8184a)",
                boxShadow: loading
                  ? "none"
                  : "0 4px 24px rgba(253,53,109,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.92";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToRegister}
                className="font-semibold hover:underline inline-flex items-center gap-1"
                style={{ color: "#fd356d" }}
              >
                <FaUserPlus className="text-xs" /> Create Account
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Protected by JWT authentication
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
