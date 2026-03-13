import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaTooth,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaArrowRight,
  FaUserMd,
  FaCalendarCheck,
  FaUsers,
  FaBell,
  FaUserPlus,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* shared focus handlers — identical to PatientLogin & DoctorRegister */
const focusIn = (e) => {
  e.target.style.borderColor = "#fd356d";
  e.target.style.boxShadow = "0 0 0 3px rgba(253,53,109,0.12)";
};
const focusOut = (e) => {
  e.target.style.borderColor = "#e5e7eb";
  e.target.style.boxShadow = "none";
};

export default function DoctorLogin({
  onSuccess,
  onSwitchToPatient,
  onSwitchToRegister,
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
      const res = await fetch(`${API}/api/auth/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Invalid credentials");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (onSuccess) onSuccess(data.user);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background:
          "linear-gradient(135deg, #fff0f4 0%, #ffffff 50%, #fff0f4 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1020,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── LEFT — dental photo ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: 580,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Real dental photo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('https://images.unsplash.com/photo-1588776814546-1ffbb172c69d?w=800&q=80')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              zIndex: 0,
            }}
          />

          {/* Dark veil */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.42)",
              zIndex: 1,
            }}
          />

          {/* Pink tint at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background:
                "linear-gradient(to top, rgba(253,53,109,0.28), transparent)",
              zIndex: 2,
            }}
          />

          {/* Decorative blobs */}
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
              padding: 40,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "white",
            }}
          >
            <div>
              {/* Logo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 36,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <FaTooth style={{ fontSize: 26, color: "white" }} />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      textShadow: "0 1px 8px rgba(0,0,0,0.3)",
                      margin: 0,
                    }}
                  >
                    SmileCare Dental
                  </h1>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    Doctor Portal
                  </p>
                </div>
              </div>

              <h2
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: 14,
                  textShadow: "0 2px 12px rgba(0,0,0,0.25)",
                  margin: "0 0 14px 0",
                }}
              >
                Welcome back,
                <br />
                <span style={{ color: "rgba(255,255,255,0.88)" }}>Doctor.</span>
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.82)",
                  marginBottom: 28,
                  lineHeight: 1.7,
                }}
              >
                Sign in to view your appointments, patient list, and get
                notified when Sarah books a new slot with you.
              </p>

              {/* Feature list */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {[
                  {
                    icon: <FaCalendarCheck />,
                    title: "Appointment Dashboard",
                    desc: "View all your upcoming appointments",
                  },
                  {
                    icon: <FaUsers />,
                    title: "Patient Management",
                    desc: "Access patient records easily",
                  },
                  {
                    icon: <FaBell />,
                    title: "Instant Notifications",
                    desc: "Email alerts for every new booking",
                  },
                  {
                    icon: <FaUserMd />,
                    title: "Profile Management",
                    desc: "Update your availability & bio",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(6px)",
                        borderRadius: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "white", fontSize: 14 }}>
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 12,
                          margin: "4px 0 0 0",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch to patient */}
            <div
              style={{
                marginTop: 32,
                borderRadius: 18,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(6px)",
                }}
              >
                👤
              </div>
              <div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    margin: "0 0 2px 0",
                  }}
                >
                  Are you a patient?
                </p>
                <button
                  onClick={onSwitchToPatient}
                  style={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <FaArrowLeft style={{ fontSize: 10 }} /> Patient Sign In
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT — white form ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#fff",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Doctor badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, #fd356d, #b8184a)",
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(253,53,109,0.35)",
                flexShrink: 0,
              }}
            >
              <FaUserMd style={{ color: "white", fontSize: 22 }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Doctor Sign In
              </h3>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                Access your doctor dashboard
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: 13,
                  }}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handle}
                  placeholder="doctor@smilecaredental.com"
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    color: "#111827",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color .2s, box-shadow .2s",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••"
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 40px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    color: "#111827",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color .2s, box-shadow .2s",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
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
                style={{
                  background: "#fff0f4",
                  border: "1px solid #fecdd6",
                  color: "#be123c",
                  fontSize: 13,
                  borderRadius: 12,
                  padding: "11px 15px",
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "#d1d5db"
                  : "linear-gradient(135deg, #fd356d, #b8184a)",
                color: "white",
                padding: "13px 0",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                border: "none",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(253,53,109,0.35)",
                transition: "opacity .2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = ".9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      display: "inline-block",
                    }}
                  />
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              New to SmileCare?
            </span>
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
          </div>

          {/* Register CTA */}
          <button
            onClick={onSwitchToRegister}
            style={{
              width: "100%",
              background: "#fff",
              border: "1.5px solid #fecdd6",
              color: "#fd356d",
              padding: "13px 0",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff0f4";
              e.currentTarget.style.borderColor = "#fd356d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#fecdd6";
            }}
          >
            <FaUserPlus style={{ fontSize: 13 }} /> Create Doctor Account{" "}
            <FaArrowRight style={{ fontSize: 11 }} />
          </button>

          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 12,
              margin: "12px 0 0 0",
            }}
          >
            Register your profile so patients can find and book with you through
            Sarah.
          </p>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #f3f4f6",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 12,
            }}
          >
            🔒 Secure doctor portal — JWT authenticated
          </div>
        </motion.div>
      </div>
    </div>
  );
}
