import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTooth,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaUserMd,
  FaStethoscope,
  FaGraduationCap,
  FaClock,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaSearch,
  FaLocationArrow,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SPECIALIZATIONS = [
  "General Dentist",
  "Orthodontist",
  "Periodontist",
  "Endodontist",
  "Oral Surgeon",
  "Pediatric Dentist",
  "Cosmetic Dentist",
  "Prosthodontist",
  "Oral Pathologist",
];
const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DEFAULT_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

/* ── Shared input focus handlers ─────────────────────────────────── */
const focusIn = (e) => {
  e.target.style.borderColor = "#fd356d";
  e.target.style.boxShadow = "0 0 0 3px rgba(253,53,109,0.12)";
};
const focusOut = (e) => {
  e.target.style.borderColor = "#e5e7eb";
  e.target.style.boxShadow = "none";
};

/* ── Leaflet map picker ──────────────────────────────────────────── */
function MapPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const DEFAULT = { lat: 12.2958, lng: 76.6394 };

  useEffect(() => {
    if (mapRef.current._leaflet_id) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => initMap(window.L);
    document.head.appendChild(script);
  }, []);

  const initMap = (L) => {
    leafletRef.current = L;
    const lat0 = value?.lat || DEFAULT.lat,
      lng0 = value?.lng || DEFAULT.lng;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [lat0, lng0],
      14,
    );
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap, © CartoDB",
        maxZoom: 19,
      },
    ).addTo(map);
    const icon = L.divIcon({
      html: `<div style="width:26px;height:26px;background:linear-gradient(135deg,#fd356d,#b8184a);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 4px 12px rgba(253,53,109,0.5)"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -26],
      className: "",
    });
    const marker = L.marker([lat0, lng0], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;
    const onMove = async (lat, lng) => {
      const addr = await reverseGeocode(lat, lng);
      onChange({ lat, lng, address: addr });
    };
    marker.on("dragend", (e) => {
      const { lat, lng } = e.target.getLatLng();
      onMove(lat, lng);
    });
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onMove(lat, lng);
    });
    if (value?.lat) onMove(value.lat, value.lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const d = await r.json();
      return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const searchLocation = async () => {
    if (!search.trim() || !leafletRef.current) return;
    setSearching(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`,
      );
      const d = await r.json();
      if (d[0]) {
        const lat = parseFloat(d[0].lat),
          lng = parseFloat(d[0].lon);
        markerRef.current?.setLatLng([lat, lng]);
        onChange({ lat, lng, address: d[0].display_name });
      }
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        markerRef.current?.setLatLng([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        onChange({ lat, lng, address: addr });
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: 12,
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
            placeholder="Search clinic address…"
            onFocus={focusIn}
            onBlur={focusOut}
            style={{
              width: "100%",
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: 10,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              color: "#111",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color .2s, box-shadow .2s",
            }}
          />
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          style={{
            padding: "10px 14px",
            background: "rgba(253,53,109,0.08)",
            border: "1px solid rgba(253,53,109,0.25)",
            borderRadius: 10,
            color: "#fd356d",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {searching ? "…" : "Search"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my location"
          style={{
            padding: "10px 12px",
            background: "rgba(253,53,109,0.06)",
            border: "1px solid rgba(253,53,109,0.2)",
            borderRadius: 10,
            color: "#fd356d",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <FaLocationArrow />
        </button>
      </div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: 240,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          position: "relative",
          zIndex: 0,
        }}
      />
      {value?.address && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: "#fff0f4",
            border: "1px solid #fecdd6",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <FaMapMarkerAlt
            style={{
              color: "#fd356d",
              fontSize: 12,
              marginTop: 2,
              flexShrink: 0,
            }}
          />
          <p style={{ color: "#374151", fontSize: 12.5, lineHeight: 1.5 }}>
            {value.address}
          </p>
        </div>
      )}
      <p style={{ color: "#9ca3af", fontSize: 11 }}>
        🗺️ Click the map or drag the pin to set your exact clinic location.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function DoctorRegister({ onSuccess, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    specialization: "",
    qualification: "",
    experience: "",
    consultationFee: "500",
    bio: "",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: [...DEFAULT_SLOTS],
    customSlot: "",
    location: null,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(d)
        ? f.availableDays.filter((x) => x !== d)
        : [...f.availableDays, d],
    }));
  const toggleSlot = (s) =>
    setForm((f) => ({
      ...f,
      availableSlots: f.availableSlots.includes(s)
        ? f.availableSlots.filter((x) => x !== s)
        : [...f.availableSlots, s].sort(),
    }));
  const addCustomSlot = () => {
    const s = form.customSlot.trim();
    if (!s || form.availableSlots.includes(s)) return;
    setForm((f) => ({
      ...f,
      availableSlots: [...f.availableSlots, s].sort(),
      customSlot: "",
    }));
  };

  const pwStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][
    strength
  ];
  const strengthColor = [
    "",
    "#ef4444",
    "#f59e0b",
    "#3b82f6",
    "#10b981",
    "#059669",
  ][strength];

  const validateStep = (n) => {
    if (n === 1) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.email.trim()) return "Email is required.";
      if (!form.password) return "Password is required.";
      if (form.password.length < 6)
        return "Password must be at least 6 characters.";
      if (form.password !== form.confirm) return "Passwords do not match.";
    }
    if (n === 2) {
      if (!form.specialization) return "Please select a specialization.";
      if (!form.qualification.trim()) return "Qualification is required.";
      if (!form.experience || isNaN(form.experience))
        return "Years of experience is required.";
    }
    if (n === 3) {
      if (!form.location?.lat)
        return "Please pin your clinic location on the map.";
    }
    return null;
  };

  const nextStep = () => {
    setError("");
    const e = validateStep(step);
    if (e) {
      setError(e);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (form.availableDays.length === 0) {
      setError("Please select at least one available day.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.location?.address || "",
        specialization: form.specialization,
        qualification: form.qualification,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
        bio: form.bio,
        availableDays: form.availableDays,
        availableSlots: form.availableSlots,
        location: form.location?.lat
          ? {
              type: {
                type: "Point",
                coordinates: [form.location.lng, form.location.lat],
              },
              address: form.location.address || "",
              placeName: form.location.address?.split(",")[0] || "",
            }
          : undefined,
      };
      const res = await fetch(`${API}/api/doctors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed.");
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...data.doctor, role: "doctor" }),
        );
      }
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess({ ...data.doctor, role: "doctor" });
      }, 2000);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fff0f4 0%, #ffffff 50%, #fff0f4 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "56px 48px",
            textAlign: "center",
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg,#fd356d,#b8184a)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 12px 32px rgba(253,53,109,0.4)",
            }}
          >
            <FaUserMd style={{ color: "white", fontSize: 32 }} />
          </motion.div>
          <h2
            style={{
              color: "#111827",
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Welcome to SmileCare!
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7 }}>
            Your doctor account has been created successfully.
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
            Logging you in…
          </p>
        </motion.div>
      </div>
    );

  const stepLabels = [
    "Basic Info",
    "Professional",
    "Clinic Location",
    "Availability",
  ];
  const stepSubLabels = [
    "Name, email & password",
    "Qualifications & fee",
    "Pin on map",
    "Days & time slots",
  ];

  /* shared input style */
  const inp = (extra = {}) => ({
    width: "100%",
    padding: "11px 14px 11px 40px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    color: "#111827",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color .2s, box-shadow .2s",
    ...extra,
  });

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
            minHeight: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Real dental clinic photo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80')`,
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

          {/* Subtle pink tint at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background:
                "linear-gradient(to top, rgba(253,53,109,0.25), transparent)",
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
                    Doctor Registration Portal
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
                Join our expert
                <br />
                <span style={{ color: "rgba(255,255,255,0.88)" }}>
                  dental network.
                </span>
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.82)",
                  marginBottom: 28,
                  lineHeight: 1.7,
                }}
              >
                Create your profile in 4 steps and let Sarah fill your schedule
                automatically.
              </p>

              {/* Step indicators */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {stepLabels.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      opacity: step === i + 1 ? 1 : step > i + 1 ? 0.65 : 0.35,
                      transition: "opacity .3s",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                        border: `1.5px solid ${step > i + 1 ? "#fd356d" : "rgba(255,255,255,0.6)"}`,
                        background:
                          step > i + 1
                            ? "rgba(253,53,109,0.35)"
                            : step === i + 1
                              ? "rgba(255,255,255,0.2)"
                              : "transparent",
                        backdropFilter: "blur(4px)",
                        color: "white",
                      }}
                    >
                      {step > i + 1 ? (
                        <FaCheckCircle style={{ fontSize: 10 }} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          lineHeight: 1,
                          margin: 0,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 11,
                          margin: "3px 0 0 0",
                        }}
                      >
                        {stepSubLabels[i]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom card */}
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
                👨‍⚕️
              </div>
              <div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    margin: "0 0 2px 0",
                  }}
                >
                  Already have a doctor account?
                </p>
                <button
                  onClick={onSwitchToLogin}
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
                  Sign in to Doctor Portal{" "}
                  <FaArrowRight style={{ fontSize: 10 }} />
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
            padding: "36px 40px",
            overflowY: "auto",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header + progress */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#111827",
                margin: "0 0 4px 0",
              }}
            >
              {
                [
                  "Basic Information",
                  "Professional Details",
                  "Clinic Location",
                  "Availability",
                ][step - 1]
              }
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
              {stepSubLabels[step - 1]}
            </p>

            <div
              style={{
                marginTop: 16,
                width: "100%",
                height: 4,
                background: "#f3f4f6",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #fd356d, #b8184a)",
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: step >= n ? "#fd356d" : "#d1d5db",
                  }}
                >
                  Step {n}
                </span>
              ))}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  background: "#fff0f4",
                  border: "1px solid #fecdd6",
                  color: "#be123c",
                  fontSize: 13,
                  borderRadius: 12,
                  padding: "11px 15px",
                  marginBottom: 18,
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                flex: 1,
              }}
            >
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
                  Full Name *
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser
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
                    name="name"
                    value={form.name}
                    onChange={handle}
                    placeholder="Dr. Jane Smith"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp()}
                  />
                </div>
              </div>
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
                  Email Address *
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
                    value={form.email}
                    onChange={handle}
                    placeholder="doctor@clinic.com"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp()}
                  />
                </div>
              </div>
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
                  Phone{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <div style={{ position: "relative" }}>
                  <FaPhone
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
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handle}
                    placeholder="+91 9876543210"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp()}
                  />
                </div>
              </div>
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
                  Password *
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
                    value={form.password}
                    onChange={handle}
                    placeholder="Min. 6 characters"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp({ paddingRight: 44 })}
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
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 4,
                            background:
                              i <= strength ? strengthColor : "#e5e7eb",
                            transition: "background .3s",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: strengthColor,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>
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
                  Confirm Password *
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
                    type={showConfirm ? "text" : "password"}
                    name="confirm"
                    value={form.confirm}
                    onChange={handle}
                    placeholder="Re-enter password"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp({
                      paddingRight: 70,
                      borderColor: form.confirm
                        ? form.password === form.confirm
                          ? "#10b981"
                          : "#ef4444"
                        : "#e5e7eb",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 38,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  {form.confirm && form.password === form.confirm && (
                    <FaCheckCircle
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#10b981",
                      }}
                    />
                  )}
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      marginTop: 4,
                      marginBottom: 0,
                    }}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                flex: 1,
              }}
            >
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
                  Specialization *
                </label>
                <div style={{ position: "relative" }}>
                  <FaStethoscope
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      fontSize: 13,
                      zIndex: 1,
                    }}
                  />
                  <select
                    name="specialization"
                    value={form.specialization}
                    onChange={handle}
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={{
                      ...inp(),
                      appearance: "none",
                      cursor: "pointer",
                      color: form.specialization ? "#111827" : "#9ca3af",
                    }}
                  >
                    <option value="">Select specialization…</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                  Qualification *
                </label>
                <div style={{ position: "relative" }}>
                  <FaGraduationCap
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
                    name="qualification"
                    value={form.qualification}
                    onChange={handle}
                    placeholder="e.g. BDS, MDS (Orthodontics)"
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={inp()}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                    Years of Experience *
                  </label>
                  <div style={{ position: "relative" }}>
                    <FaClock
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
                      type="number"
                      name="experience"
                      value={form.experience}
                      onChange={handle}
                      min="0"
                      max="60"
                      placeholder="10"
                      onFocus={focusIn}
                      onBlur={focusOut}
                      style={inp()}
                    />
                  </div>
                </div>
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
                    Consultation Fee (₹)
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      name="consultationFee"
                      value={form.consultationFee}
                      onChange={handle}
                      min="0"
                      placeholder="500"
                      onFocus={focusIn}
                      onBlur={focusOut}
                      style={inp()}
                    />
                  </div>
                </div>
              </div>
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
                  Bio{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handle}
                  rows={3}
                  placeholder="Brief description of your expertise…"
                  onFocus={focusIn}
                  onBlur={focusOut}
                  style={{ ...inp({ paddingLeft: 14 }), resize: "none" }}
                />
              </div>
              {form.specialization && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "#fff0f4",
                    border: "1px solid #fecdd6",
                    borderRadius: 14,
                    padding: "14px 18px",
                  }}
                >
                  <p
                    style={{
                      color: "#fd356d",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      margin: "0 0 10px 0",
                    }}
                  >
                    Preview Card
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background:
                          "linear-gradient(135deg,rgba(253,53,109,0.2),rgba(253,53,109,0.06))",
                        border: "1px solid rgba(253,53,109,0.25)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fd356d",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {form.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#111827",
                          fontWeight: 700,
                          fontSize: 14,
                          margin: 0,
                        }}
                      >
                        {form.name || "Doctor Name"}
                      </p>
                      <p
                        style={{
                          color: "#fd356d",
                          fontSize: 12,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {form.specialization}
                      </p>
                      <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                        {form.qualification} · {form.experience || 0} yrs · ₹
                        {Number(form.consultationFee || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                flex: 1,
              }}
            >
              <div
                style={{
                  background: "#fff0f4",
                  border: "1px solid #fecdd6",
                  borderRadius: 12,
                  padding: "12px 16px",
                }}
              >
                <p
                  style={{
                    color: "#fd356d",
                    fontSize: 12,
                    fontWeight: 600,
                    margin: "0 0 4px 0",
                  }}
                >
                  📍 Pin Your Clinic Location
                </p>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: 12,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Search your address or drag the pin to set the exact spot.
                </p>
              </div>
              <MapPicker
                value={form.location}
                onChange={(loc) => setForm((f) => ({ ...f, location: loc }))}
              />
            </motion.div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                flex: 1,
              }}
            >
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 10,
                  }}
                >
                  <FaCalendarAlt style={{ color: "#fd356d" }} /> Available Days
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all .2s",
                        border: `1.5px solid ${form.availableDays.includes(day) ? "#fd356d" : "#e5e7eb"}`,
                        background: form.availableDays.includes(day)
                          ? "#fff0f4"
                          : "#fff",
                        color: form.availableDays.includes(day)
                          ? "#fd356d"
                          : "#6b7280",
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 10,
                  }}
                >
                  <FaClock style={{ color: "#fd356d" }} /> Time Slots
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  {DEFAULT_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      style={{
                        padding: "6px 13px",
                        borderRadius: 9,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all .2s",
                        border: `1.5px solid ${form.availableSlots.includes(slot) ? "#fd356d" : "#e5e7eb"}`,
                        background: form.availableSlots.includes(slot)
                          ? "#fff0f4"
                          : "#fff",
                        color: form.availableSlots.includes(slot)
                          ? "#fd356d"
                          : "#6b7280",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="time"
                    value={form.customSlot}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customSlot: e.target.value }))
                    }
                    onFocus={focusIn}
                    onBlur={focusOut}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      color: "#111827",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "border-color .2s, box-shadow .2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomSlot}
                    style={{
                      padding: "9px 16px",
                      background: "#fff0f4",
                      border: "1px solid #fecdd6",
                      borderRadius: 10,
                      color: "#fd356d",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: "inherit",
                    }}
                  >
                    <FaPlus style={{ fontSize: 10 }} /> Add
                  </button>
                </div>
                {form.availableSlots.filter((s) => !DEFAULT_SLOTS.includes(s))
                  .length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {form.availableSlots
                      .filter((s) => !DEFAULT_SLOTS.includes(s))
                      .map((s) => (
                        <span
                          key={s}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            background: "#fff0f4",
                            border: "1px solid #fecdd6",
                            color: "#fd356d",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => toggleSlot(s)}
                            style={{
                              color: "#9ca3af",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              lineHeight: 1,
                            }}
                          >
                            <FaTimes style={{ fontSize: 9 }} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div
                style={{
                  background: "#fff0f4",
                  border: "1px solid #fecdd6",
                  borderRadius: 14,
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    color: "#fd356d",
                    fontWeight: 700,
                    fontSize: 11,
                    margin: "0 0 10px 0",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  📋 Registration Summary
                </p>
                {[
                  ["Name", form.name],
                  ["Specialization", form.specialization],
                  ["Experience", `${form.experience} years`],
                  [
                    "Clinic",
                    form.location?.address?.substring(0, 48) || "Not set",
                  ],
                  ["Days", form.availableDays.join(", ") || "None"],
                  ["Slots", `${form.availableSlots.length} slots`],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{ display: "flex", gap: 8, marginBottom: 4 }}
                  >
                    <span
                      style={{
                        color: "#9ca3af",
                        minWidth: 100,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {l}:
                    </span>
                    <span style={{ color: "#374151", fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── NAV BUTTONS ── */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep((s) => s - 1);
                }}
                style={{
                  flex: 1,
                  border: "1px solid #e5e7eb",
                  color: "#6b7280",
                  padding: "12px 0",
                  borderRadius: 14,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#fd356d";
                  e.currentTarget.style.color = "#fd356d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <FaArrowLeft style={{ fontSize: 11 }} /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #fd356d, #b8184a)",
                  color: "white",
                  padding: "12px 0",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(253,53,109,0.35)",
                  transition: "opacity .2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = ".9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || form.availableDays.length === 0}
                style={{
                  flex: 1,
                  background:
                    loading || form.availableDays.length === 0
                      ? "#d1d5db"
                      : "linear-gradient(135deg, #fd356d, #b8184a)",
                  color: "white",
                  padding: "12px 0",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
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
                    Creating…
                  </>
                ) : (
                  "✅ Create Doctor Account"
                )}
              </button>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 11,
              marginTop: 14,
            }}
          >
            By registering you agree to SmileCare's terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
