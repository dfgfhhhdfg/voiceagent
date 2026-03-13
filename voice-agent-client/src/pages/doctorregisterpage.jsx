import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTooth, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUser, FaPhone, FaMapMarkerAlt, FaArrowLeft,
  FaCheckCircle, FaUserMd, FaStethoscope, FaGraduationCap,
  FaClock, FaCalendarAlt, FaPlus, FaTimes, FaSearch,
  FaLocationArrow,
} from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:      '#080C14',
  surface: '#0D1320',
  card:    '#111827',
  border:  '#1E2A3A',
  accent:  '#00D4FF',
  emerald: '#00E5A0',
  text:    '#E8EDF5',
  muted:   '#5A6A82',
  danger:  '#FF4D6A',
  gold:    '#C9A84C',
};

const SPECIALIZATIONS = [
  'General Dentist','Orthodontist','Periodontist','Endodontist',
  'Oral Surgeon','Pediatric Dentist','Cosmetic Dentist','Prosthodontist','Oral Pathologist',
];
const ALL_DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_SLOTS = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

/* ── Leaflet map picker (loaded lazily) ────────────────────────────── */
function MapPicker({ value, onChange }) {
  const mapRef     = useRef(null);
  const markerRef  = useRef(null);
  const leafletRef = useRef(null);
  const [search, setSearch]   = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating]   = useState(false);
  const DEFAULT = { lat: 12.2958, lng: 76.6394 }; // Mysuru

  useEffect(() => {
    if (mapRef.current._leaflet_id) return; // already initialised

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap(window.L);
    document.head.appendChild(script);

    return () => { /* map cleanup handled by React unmount */ };
  }, []);

  const initMap = (L) => {
    leafletRef.current = L;
    const startLat = value?.lat || DEFAULT.lat;
    const startLng = value?.lng || DEFAULT.lng;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([startLat, startLng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Custom cyan pin icon
    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,${T.accent},#0066AA);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 4px 16px ${T.accent}60"></div>`,
      iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
      className: '',
    });

    const marker = L.marker([startLat, startLng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    const onMove = async (lat, lng) => {
      const addr = await reverseGeocode(lat, lng);
      onChange({ lat, lng, address: addr });
    };

    marker.on('dragend', e => {
      const { lat, lng } = e.target.getLatLng();
      onMove(lat, lng);
    });

    map.on('click', e => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onMove(lat, lng);
    });

    // Init with current value
    if (value?.lat) onMove(value.lat, value.lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const d = await r.json();
      return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
  };

  const searchLocation = async () => {
    if (!search.trim() || !leafletRef.current) return;
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`);
      const d = await r.json();
      if (d[0]) {
        const lat = parseFloat(d[0].lat);
        const lng = parseFloat(d[0].lon);
        const L   = leafletRef.current;
        const map = mapRef.current._leaflet_map || mapRef.current._leaflet_id && L.map(mapRef.current);
        // fly the map view
        mapRef.current._leaflet_map?.setView([lat, lng], 15);
        markerRef.current?.setLatLng([lat, lng]);
        const addr = d[0].display_name;
        onChange({ lat, lng, address: addr });
      }
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      mapRef.current._leaflet_map?.setView([lat, lng], 15);
      markerRef.current?.setLatLng([lat, lng]);
      const addr = await reverseGeocode(lat, lng);
      onChange({ lat, lng, address: addr });
      setLocating(false);
    }, () => setLocating(false));
  };

  // Store map instance on the DOM node for access
  useEffect(() => {
    const el = mapRef.current;
    const orig = el;
    return () => { if (orig?._leaflet_id && window.L) { try { window.L.map(orig).remove(); } catch {} } };
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {/* Search bar */}
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ flex:1, position:'relative' }}>
          <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.muted, fontSize:12 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchLocation()}
            placeholder="Search clinic address…"
            style={{ width:'100%', paddingLeft:34, paddingRight:12, paddingTop:10, paddingBottom:10, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
          />
        </div>
        <button type="button" onClick={searchLocation} disabled={searching}
          style={{ padding:'10px 16px', background:`${T.accent}15`, border:`1px solid ${T.accent}30`, borderRadius:10, color:T.accent, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          {searching ? '…' : 'Search'}
        </button>
        <button type="button" onClick={useMyLocation} disabled={locating}
          style={{ padding:'10px 12px', background:`${T.emerald}10`, border:`1px solid ${T.emerald}30`, borderRadius:10, color:T.emerald, fontSize:13, cursor:'pointer' }}
          title="Use my current location">
          <FaLocationArrow />
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ width:'100%', height:280, borderRadius:14, border:`1px solid ${T.border}`, overflow:'hidden', position:'relative', zIndex:0 }} />

      {/* Address display */}
      {value?.address && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:`${T.accent}08`, border:`1px solid ${T.accent}20`, borderRadius:10, padding:'10px 14px' }}>
          <FaMapMarkerAlt style={{ color:T.accent, fontSize:12, marginTop:2, flexShrink:0 }} />
          <p style={{ color:T.text, fontSize:12.5, lineHeight:1.5 }}>{value.address}</p>
        </div>
      )}
      <p style={{ color:T.muted, fontSize:11 }}>
        🗺️ Click the map or drag the pin to set your exact clinic location.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600&display=swap');
  .dr-input {
    width:100%; padding:11px 14px 11px 38px;
    background:${T.surface}; border:1px solid ${T.border}; border-radius:12px;
    color:${T.text}; font-family:'Space Grotesk',sans-serif; font-size:14px;
    outline:none; box-sizing:border-box; transition:border-color .2s;
  }
  .dr-input:focus { border-color:${T.accent}60; }
  .dr-input::placeholder { color:${T.muted}; }
  .dr-input-wrap { position:relative; }
  .dr-input-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:${T.muted}; font-size:13px; pointer-events:none; }
  .dr-label { display:block; font-size:12px; font-weight:600; color:${T.muted}; margin-bottom:6px; text-transform:uppercase; letter-spacing:.06em; }
  .dr-day-btn { padding:8px 14px; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; border:1px solid; font-family:'Space Grotesk',sans-serif; }
  .dr-slot-btn { padding:7px 13px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; font-family:'Space Grotesk',sans-serif; transition:all .2s; }
  select.dr-input { padding-left:38px; appearance:none; cursor:pointer; }
  textarea.dr-input { padding-left:14px; resize:none; }
`;

export default function DoctorRegister({ onSuccess, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:'', email:'', phone:'', password:'', confirm:'',
    specialization:'', qualification:'', experience:'', consultationFee:'500', bio:'',
    availableDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    availableSlots: [...DEFAULT_SLOTS],
    customSlot:'',
    // Location from map
    location: null, // { lat, lng, address }
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleDay  = d  => setForm(f => ({ ...f, availableDays:  f.availableDays.includes(d)  ? f.availableDays.filter(x=>x!==d)  : [...f.availableDays, d]  }));
  const toggleSlot = s  => setForm(f => ({ ...f, availableSlots: f.availableSlots.includes(s) ? f.availableSlots.filter(x=>x!==s) : [...f.availableSlots, s].sort() }));
  const addCustomSlot = () => {
    const s = form.customSlot.trim();
    if (!s || form.availableSlots.includes(s)) return;
    setForm(f => ({ ...f, availableSlots: [...f.availableSlots, s].sort(), customSlot:'' }));
  };

  const pwStrength = pw => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6)           s++;
    if (pw.length >= 10)          s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    return s;
  };
  const strength      = pwStrength(form.password);
  const strengthLabel = ['','Weak','Fair','Good','Strong','Very Strong'][strength];
  const strengthColor = ['','#FF4D6A','#F59E0B','#3B82F6',T.emerald,'#059669'][strength];

  const validateStep = n => {
    if (n === 1) {
      if (!form.name.trim())              return 'Full name is required.';
      if (!form.email.trim())             return 'Email is required.';
      if (!form.password)                 return 'Password is required.';
      if (form.password.length < 6)       return 'Password must be at least 6 characters.';
      if (form.password !== form.confirm) return 'Passwords do not match.';
    }
    if (n === 2) {
      if (!form.specialization)           return 'Please select a specialization.';
      if (!form.qualification.trim())     return 'Qualification is required.';
      if (!form.experience || isNaN(form.experience)) return 'Years of experience is required.';
    }
    if (n === 3) {
      if (!form.location?.lat)            return 'Please pin your clinic location on the map.';
    }
    return null;
  };

  const nextStep = () => {
    setError('');
    const e = validateStep(step);
    if (e) { setError(e); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (form.availableDays.length === 0) { setError('Please select at least one available day.'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone,
        address: form.location?.address || '',
        specialization: form.specialization, qualification: form.qualification,
        experience: Number(form.experience), consultationFee: Number(form.consultationFee),
        bio: form.bio,
        availableDays: form.availableDays, availableSlots: form.availableSlots,
        // GeoJSON location for DB
        location: form.location?.lat ? {
          type: { type: 'Point', coordinates: [form.location.lng, form.location.lat] },
          address:   form.location.address || '',
          placeName: form.location.address?.split(',')[0] || '',
        } : undefined,
      };

      const res  = await fetch(`${API}/api/doctors/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Registration failed.'); return; }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ ...data.doctor, role: 'doctor' }));
      }
      setSuccess(true);
      setTimeout(() => { if (onSuccess) onSuccess({ ...data.doctor, role: 'doctor' }); }, 2000);
    } catch { setError('Could not connect to server. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ── Success screen ──────────────────────────────────────────────── */
  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:T.bg, fontFamily:"'Space Grotesk',sans-serif" }}>
      <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}}
        style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:24, padding:'56px 48px', textAlign:'center', maxWidth:400, width:'90%' }}>
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:.2,type:'spring',stiffness:200}}
          style={{ width:80, height:80, background:`linear-gradient(135deg,${T.emerald},#059669)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:`0 12px 32px ${T.emerald}40` }}>
          <FaUserMd style={{ color:'white', fontSize:32 }} />
        </motion.div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:26, fontWeight:800, marginBottom:8 }}>Welcome to SmileCare!</h2>
        <p style={{ color:T.muted, fontSize:14, lineHeight:1.7 }}>Your doctor account has been created successfully.</p>
        <p style={{ color:T.muted, fontSize:12, marginTop:8 }}>Logging you in…</p>
      </motion.div>
    </div>
  );

  const stepLabels    = ['Basic Info','Professional','Clinic Location','Availability'];
  const stepSubLabels = ['Name, email & password','Qualifications & fee','Pin on map','Days & time slots'];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <style>{css}</style>

      <div style={{ width:'100%', maxWidth:980, display:'grid', gridTemplateColumns:'300px 1fr', borderRadius:24, overflow:'hidden', boxShadow:`0 24px 80px rgba(0,0,0,.6), 0 0 0 1px ${T.border}` }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}}
          style={{ background:`linear-gradient(155deg, #051A10 0%, #0A2A18 60%, #0D3020 100%)`, padding:'40px 32px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
              <div style={{ width:38, height:38, background:`${T.emerald}20`, border:`1px solid ${T.emerald}30`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FaTooth style={{ color:T.emerald, fontSize:17 }} />
              </div>
              <div>
                <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:16, fontWeight:800, lineHeight:1 }}>SmileCare</p>
                <p style={{ color:T.emerald, fontSize:9, letterSpacing:'.18em', fontWeight:600, marginTop:2 }}>DOCTOR PORTAL</p>
              </div>
            </div>

            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:24, fontWeight:800, lineHeight:1.15, marginBottom:10 }}>
              Join our<br /><span style={{ color:T.emerald }}>specialist network</span>
            </h2>
            <p style={{ color:T.muted, fontSize:13, lineHeight:1.8, marginBottom:32 }}>
              Create your profile, pin your clinic, set availability and let Sarah fill your schedule automatically.
            </p>

            {/* Steps */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, opacity: step===i+1 ? 1 : step>i+1 ? 0.65 : 0.35, transition:'opacity .3s' }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:700, flexShrink:0,
                    border:`1.5px solid ${step>i+1 ? T.emerald : step===i+1 ? T.emerald : T.border}`,
                    background: step>i+1 ? `${T.emerald}20` : step===i+1 ? `${T.emerald}10` : 'transparent',
                    color: step>i+1 ? T.emerald : step===i+1 ? T.emerald : T.muted,
                  }}>
                    {step>i+1 ? <FaCheckCircle style={{fontSize:11}}/> : i+1}
                  </div>
                  <div>
                    <p style={{ color:T.text, fontWeight:600, fontSize:13, lineHeight:1 }}>{label}</p>
                    <p style={{ color:T.muted, fontSize:11, marginTop:3 }}>{stepSubLabels[i]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop:32, background:`${T.emerald}08`, border:`1px solid ${T.emerald}15`, borderRadius:14, padding:'14px 18px' }}>
            <p style={{ color:T.muted, fontSize:11, marginBottom:8 }}>Already have a doctor account?</p>
            <button onClick={onSwitchToLogin}
              style={{ color:T.emerald, fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <FaArrowLeft style={{fontSize:10}}/> Sign in to Doctor Portal
            </button>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}}
          style={{ background:T.surface, padding:'36px 36px', overflowY:'auto', maxHeight:'92vh' }}>

          {/* Progress */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:20, fontWeight:800 }}>
                {['Basic Information','Professional Details','Clinic Location','Availability'][step-1]}
              </h3>
              <span style={{ color:T.muted, fontSize:12 }}>Step {step} / 4</span>
            </div>
            <div style={{ width:'100%', height:4, background:T.border, borderRadius:4, overflow:'hidden' }}>
              <motion.div animate={{ width:`${(step/4)*100}%` }} transition={{ duration:.5 }}
                style={{ height:'100%', background:`linear-gradient(90deg, ${T.emerald}, #059669)`, borderRadius:4 }} />
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                style={{ background:`${T.danger}12`, border:`1px solid ${T.danger}30`, color:T.danger, fontSize:13, borderRadius:12, padding:'11px 15px', marginBottom:18 }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 1: BASIC INFO ────────────────────────────────── */}
          {step === 1 && (
            <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Name */}
              <div>
                <label className="dr-label">Full Name *</label>
                <div className="dr-input-wrap">
                  <FaUser className="dr-input-icon" />
                  <input name="name" value={form.name} onChange={handle} placeholder="Dr. Jane Smith" className="dr-input" />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="dr-label">Email Address *</label>
                <div className="dr-input-wrap">
                  <FaEnvelope className="dr-input-icon" />
                  <input type="email" name="email" value={form.email} onChange={handle} placeholder="doctor@clinic.com" className="dr-input" />
                </div>
              </div>
              {/* Phone */}
              <div>
                <label className="dr-label">Phone</label>
                <div className="dr-input-wrap">
                  <FaPhone className="dr-input-icon" style={{fontSize:11}} />
                  <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="+91 9876543210" className="dr-input" />
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="dr-label">Password *</label>
                <div className="dr-input-wrap">
                  <FaLock className="dr-input-icon" style={{fontSize:11}} />
                  <input type={showPass?'text':'password'} name="password" value={form.password} onChange={handle} placeholder="Min. 6 characters"
                    className="dr-input" style={{ paddingRight:40 }} />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:T.muted, background:'none', border:'none', cursor:'pointer' }}>
                    {showPass ? <FaEyeSlash/> : <FaEye/>}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:4, background: i<=strength ? strengthColor : T.border, transition:'background .3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize:11, color:strengthColor, fontWeight:600 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>
              {/* Confirm */}
              <div>
                <label className="dr-label">Confirm Password *</label>
                <div className="dr-input-wrap">
                  <FaLock className="dr-input-icon" style={{fontSize:11}} />
                  <input type={showConfirm?'text':'password'} name="confirm" value={form.confirm} onChange={handle}
                    placeholder="Re-enter password" className="dr-input"
                    style={{ paddingRight:70, borderColor: form.confirm ? (form.password===form.confirm ? T.emerald : T.danger) : T.border }} />
                  <button type="button" onClick={()=>setShowConfirm(s=>!s)}
                    style={{ position:'absolute', right:34, top:'50%', transform:'translateY(-50%)', color:T.muted, background:'none', border:'none', cursor:'pointer' }}>
                    {showConfirm ? <FaEyeSlash/> : <FaEye/>}
                  </button>
                  {form.confirm && form.password===form.confirm && (
                    <FaCheckCircle style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:T.emerald }} />
                  )}
                </div>
                {form.confirm && form.password!==form.confirm && (
                  <p style={{ color:T.danger, fontSize:12, marginTop:4 }}>Passwords do not match</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: PROFESSIONAL ─────────────────────────────── */}
          {step === 2 && (
            <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Specialization */}
              <div>
                <label className="dr-label">Specialization *</label>
                <div className="dr-input-wrap">
                  <FaStethoscope className="dr-input-icon" />
                  <select name="specialization" value={form.specialization} onChange={handle} className="dr-input" style={{ color: form.specialization ? T.text : T.muted }}>
                    <option value="">Select specialization…</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Qualification */}
              <div>
                <label className="dr-label">Qualification *</label>
                <div className="dr-input-wrap">
                  <FaGraduationCap className="dr-input-icon" />
                  <input name="qualification" value={form.qualification} onChange={handle} placeholder="e.g. BDS, MDS (Orthodontics)" className="dr-input" />
                </div>
              </div>
              {/* Experience + Fee */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="dr-label">Years of Experience *</label>
                  <div className="dr-input-wrap">
                    <FaClock className="dr-input-icon" style={{fontSize:11}} />
                    <input type="number" name="experience" value={form.experience} onChange={handle} min="0" max="60" placeholder="10" className="dr-input" />
                  </div>
                </div>
                <div>
                  <label className="dr-label">Consultation Fee (₹) *</label>
                  <div className="dr-input-wrap">
                    <span className="dr-input-icon" style={{ fontSize:13, fontWeight:700 }}>₹</span>
                    <input type="number" name="consultationFee" value={form.consultationFee} onChange={handle} min="0" placeholder="500" className="dr-input" />
                  </div>
                </div>
              </div>
              {/* Bio */}
              <div>
                <label className="dr-label">Bio / About <span style={{color:T.muted,fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                <textarea name="bio" value={form.bio} onChange={handle} rows={3} placeholder="Brief description of your expertise…" className="dr-input" style={{ paddingTop:11, paddingBottom:11 }} />
              </div>
              {/* Preview card */}
              {form.specialization && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  style={{ background:`${T.emerald}08`, border:`1px solid ${T.emerald}20`, borderRadius:14, padding:'14px 18px' }}>
                  <p style={{ color:T.emerald, fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Preview Card</p>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:44, height:44, background:`linear-gradient(135deg,${T.emerald}30,${T.emerald}10)`, border:`1px solid ${T.emerald}20`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.emerald, fontWeight:800, fontSize:18 }}>
                      {form.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p style={{ color:T.text, fontWeight:700, fontSize:14 }}>{form.name || 'Doctor Name'}</p>
                      <p style={{ color:T.emerald, fontSize:12, fontWeight:600 }}>{form.specialization}</p>
                      <p style={{ color:T.muted, fontSize:11 }}>{form.qualification} · {form.experience||0} yrs · ₹{Number(form.consultationFee||0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: CLINIC LOCATION MAP ──────────────────────── */}
          {step === 3 && (
            <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:`${T.accent}08`, border:`1px solid ${T.accent}20`, borderRadius:12, padding:'12px 16px' }}>
                <p style={{ color:T.accent, fontSize:12, fontWeight:600, marginBottom:4 }}>📍 Pin Your Clinic Location</p>
                <p style={{ color:T.muted, fontSize:12, lineHeight:1.6 }}>
                  This location is used to help patients find the nearest doctor. Search for your address or drag the pin to the exact spot.
                </p>
              </div>
              <MapPicker
                value={form.location}
                onChange={loc => setForm(f => ({ ...f, location: loc }))}
              />
            </motion.div>
          )}

          {/* ── STEP 4: AVAILABILITY ─────────────────────────────── */}
          {step === 4 && (
            <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} style={{ display:'flex', flexDirection:'column', gap:22 }}>
              {/* Days */}
              <div>
                <label className="dr-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <FaCalendarAlt style={{ color:T.emerald }}/> Available Days
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {ALL_DAYS.map(day => (
                    <button key={day} type="button" onClick={()=>toggleDay(day)} className="dr-day-btn"
                      style={{ background: form.availableDays.includes(day) ? `${T.emerald}20` : 'transparent', borderColor: form.availableDays.includes(day) ? T.emerald : T.border, color: form.availableDays.includes(day) ? T.emerald : T.muted }}>
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots */}
              <div>
                <label className="dr-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <FaClock style={{ color:T.emerald }}/> Time Slots
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  {DEFAULT_SLOTS.map(slot => (
                    <button key={slot} type="button" onClick={()=>toggleSlot(slot)} className="dr-slot-btn"
                      style={{ background: form.availableSlots.includes(slot) ? `${T.emerald}20` : 'transparent', borderColor: form.availableSlots.includes(slot) ? T.emerald : T.border, color: form.availableSlots.includes(slot) ? T.emerald : T.muted }}>
                      {slot}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="time" value={form.customSlot} onChange={e=>setForm(f=>({...f,customSlot:e.target.value}))}
                    style={{ flex:1, padding:'9px 12px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                  <button type="button" onClick={addCustomSlot}
                    style={{ padding:'9px 16px', background:`${T.emerald}15`, border:`1px solid ${T.emerald}30`, borderRadius:10, color:T.emerald, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <FaPlus style={{fontSize:10}}/> Add
                  </button>
                </div>
                {form.availableSlots.filter(s=>!DEFAULT_SLOTS.includes(s)).length > 0 && (
                  <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
                    {form.availableSlots.filter(s=>!DEFAULT_SLOTS.includes(s)).map(s => (
                      <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:`${T.emerald}10`, border:`1px solid ${T.emerald}20`, color:T.emerald, borderRadius:8, fontSize:11, fontWeight:600 }}>
                        {s}
                        <button type="button" onClick={()=>toggleSlot(s)} style={{ color:T.muted, background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>
                          <FaTimes style={{fontSize:9}}/>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div style={{ background:`${T.emerald}06`, border:`1px solid ${T.emerald}15`, borderRadius:14, padding:'18px 20px' }}>
                <p style={{ color:T.emerald, fontWeight:700, fontSize:12, marginBottom:12, textTransform:'uppercase', letterSpacing:'.08em' }}>📋 Registration Summary</p>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    ['Name',          form.name],
                    ['Specialization',form.specialization],
                    ['Experience',    `${form.experience} years`],
                    ['Clinic',        form.location?.address?.substring(0,50) || 'Not set'],
                    ['Days',          form.availableDays.join(', ')||'None'],
                    ['Slots',         `${form.availableSlots.length} slots`],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', gap:8 }}>
                      <span style={{ color:T.muted, minWidth:110, fontSize:11, fontWeight:600 }}>{l}:</span>
                      <span style={{ color:T.text, fontSize:11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── NAV BUTTONS ──────────────────────────────────────── */}
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            {step > 1 && (
              <button type="button" onClick={()=>{setError('');setStep(s=>s-1);}}
                style={{ flex:1, border:`1px solid ${T.border}`, color:T.muted, padding:'12px 0', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', background:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted}}>
                <FaArrowLeft style={{fontSize:11}}/> Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={nextStep}
                style={{ flex:1, background:`linear-gradient(135deg,${T.emerald},#059669)`, color:T.bg, padding:'12px 0', borderRadius:14, fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit', boxShadow:`0 4px 16px ${T.emerald}30` }}>
                Next Step →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading||form.availableDays.length===0}
                style={{ flex:1, background: loading||form.availableDays.length===0 ? T.muted : `linear-gradient(135deg,${T.emerald},#059669)`, color:T.bg, padding:'12px 0', borderRadius:14, fontWeight:700, fontSize:14, cursor: loading?'not-allowed':'pointer', border:'none', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? (
                  <><span style={{ width:16, height:16, border:`2px solid ${T.bg}40`, borderTopColor:T.bg, borderRadius:'50%' }} className="animate-spin" />Creating…</>
                ) : '✅ Create Doctor Account'}
              </button>
            )}
          </div>

          <p style={{ textAlign:'center', color:T.muted, fontSize:11, marginTop:14 }}>
            By registering you agree to SmileCare's terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  );
}