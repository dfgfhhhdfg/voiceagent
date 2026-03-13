import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaTooth,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaPhone,
  FaArrowLeft,
  FaCheckCircle,
  FaCalendarCheck,
  FaRobot,
  FaShieldAlt,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PatientRegister({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const getStrength = (p) => {
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { label: "Too short", color: "bg-red-400" },
      { label: "Weak", color: "bg-orange-400" },
      { label: "Fair", color: "bg-yellow-400" },
      { label: "Good", color: "bg-pink-400" },
      { label: "Strong", color: "bg-green-500" },
    ];
    return { score, ...map[score] };
  };

  const strength = getStrength(form.password);
  const passwordsMatch = form.confirm && form.password === form.confirm;
  const passwordsMismatch = form.confirm && form.password !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/patient/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(data.user);
      }, 1500);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, #fff0f4 0%, #ffffff 50%, #fff0f4 100%)",
        }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full"
          style={{ border: "1px solid #fde0e8" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #fd356d, #b8184a)" }}
          >
            <FaCheckCircle className="text-white text-5xl" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome aboard!
          </h2>
          <p className="text-gray-500 mb-4">
            Your account has been created successfully.
          </p>
          <div
            className="flex items-center justify-center gap-2"
            style={{ color: "#fd356d" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "#fd356d", animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "#fd356d", animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "#fd356d", animationDelay: "300ms" }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-3">Redirecting you now...</p>
        </motion.div>
      </div>
    );
  }

  /* ── Main layout ────────────────────────────────────────────────── */
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #fff0f4 0%, #ffffff 50%, #fff0f4 100%)",
      }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl grid md:grid-cols-5 gap-0 rounded-3xl shadow-2xl overflow-hidden">
        {/* ── Left panel ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 text-white flex flex-col justify-between"
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

          {/* Subtle dark overlay for text readability only */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.38)",
              zIndex: 1,
            }}
          />

          {/* Decorative blurred glow circles */}
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              top: -60,
              right: -60,
              background: "rgba(255,255,255,0.08)",
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
              background: "rgba(255,255,255,0.06)",
              filter: "blur(2px)",
              zIndex: 2,
            }}
          />

          {/* Content sits on top of image + overlay */}
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
                    className="text-xl font-bold"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
                  >
                    SmileCare Dental
                  </h1>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Your Trusted Dental Partner
                  </p>
                </div>
              </div>

              <h2
                className="text-3xl font-bold mb-3 leading-tight"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
              >
                Join the
                <br />
                <span style={{ color: "rgba(255,255,255,0.9)" }}>
                  SmileCare Family!
                </span>
              </h2>
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "rgba(255,255,255,0.82)" }}
              >
                Create your free account and experience modern dental care with
                Sarah, your 24/7 AI assistant.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: <FaCalendarCheck />,
                    title: "Easy Booking",
                    desc: "Book appointments anytime, 24/7",
                  },
                  {
                    icon: <FaRobot />,
                    title: "AI Assistant Sarah",
                    desc: "Voice-powered dental receptionist",
                  },
                  {
                    icon: <FaEnvelope />,
                    title: "Email Confirmations",
                    desc: "Instant appointment confirmations",
                  },
                  {
                    icon: <FaShieldAlt />,
                    title: "Secure & Private",
                    desc: "Your data is encrypted & safe",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-10 rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Already have an account?
              </p>
              <button
                onClick={onSwitchToLogin}
                className="font-semibold text-sm flex items-center gap-1 hover:underline text-white"
              >
                <FaArrowLeft className="text-xs" /> Back to Sign In
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-3 bg-white p-10 overflow-y-auto"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            Create Account
          </h3>
          <p className="text-gray-500 text-sm mb-7">
            Fill in your details to get started — it's free!
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Full Name <span style={{ color: "#fd356d" }}>*</span>
              </label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handle}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             transition placeholder-gray-400 outline-none"
                  style={{ "--tw-ring-color": "#fd356d" }}
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

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span style={{ color: "#fd356d" }}>*</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handle}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             transition placeholder-gray-400 outline-none"
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

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handle}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             transition placeholder-gray-400 outline-none"
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span style={{ color: "#fd356d" }}>*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handle}
                  placeholder="Min. 6 characters"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm
                             transition placeholder-gray-400 outline-none"
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

              {/* Strength meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      strength.score <= 1
                        ? "text-red-500"
                        : strength.score === 2
                          ? "text-yellow-500"
                          : strength.score === 3
                            ? "text-pink-500"
                            : "text-green-500"
                    }`}
                  >
                    {strength.label}
                  </p>
                </div>
              )}

              {/* Password hints */}
              <div className="mt-2 grid grid-cols-2 gap-1">
                {[
                  { label: "8+ characters", met: form.password.length >= 8 },
                  {
                    label: "Uppercase letter",
                    met: /[A-Z]/.test(form.password),
                  },
                  { label: "Number", met: /[0-9]/.test(form.password) },
                  {
                    label: "Special character",
                    met: /[^A-Za-z0-9]/.test(form.password),
                  },
                ].map((hint, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: hint.met ? "#16a34a" : "#9ca3af" }}
                  >
                    <FaCheckCircle
                      style={{ color: hint.met ? "#16a34a" : "#d1d5db" }}
                    />
                    {hint.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password <span style={{ color: "#fd356d" }}>*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  required
                  value={form.confirm}
                  onChange={handle}
                  placeholder="Re-enter your password"
                  className="w-full pl-11 pr-12 py-3 border rounded-xl text-sm
                             transition placeholder-gray-400 outline-none"
                  style={{
                    borderColor: passwordsMismatch
                      ? "#fca5a5"
                      : passwordsMatch
                        ? "#86efac"
                        : "#e5e7eb",
                    boxShadow: "none",
                  }}
                  onFocus={(e) => {
                    if (!passwordsMismatch && !passwordsMatch) {
                      e.target.style.borderColor = "#fd356d";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(253,53,109,0.12)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "none";
                    e.target.style.borderColor = passwordsMismatch
                      ? "#fca5a5"
                      : passwordsMatch
                        ? "#86efac"
                        : "#e5e7eb";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
                {passwordsMatch && (
                  <FaCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-500 mt-1">
                  ✅ Passwords match
                </p>
              )}
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

            {/* Terms */}
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{" "}
              <a
                href="#"
                style={{ color: "#fd356d" }}
                className="hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                style={{ color: "#fd356d" }}
                className="hover:underline"
              >
                Privacy Policy
              </a>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full text-white py-3.5 rounded-xl font-semibold
                         transform transition-all duration-300
                         disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 text-sm"
              style={{
                background: "linear-gradient(135deg, #fd356d, #b8184a)",
                boxShadow:
                  loading || passwordsMismatch
                    ? "none"
                    : "0 4px 24px rgba(253,53,109,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading && !passwordsMismatch)
                  e.currentTarget.style.opacity = "0.92";
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
                  Creating your account...
                </>
              ) : (
                "🎉 Create My Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold hover:underline"
              style={{ color: "#fd356d" }}
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
