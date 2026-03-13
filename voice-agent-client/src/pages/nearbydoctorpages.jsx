import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMapMarkerAlt, FaUserMd, FaSearch, FaCheckCircle,
  FaClock, FaCalendarCheck, FaTimes, FaLocationArrow,
  FaFilter, FaRupeeSign, FaRoute,
} from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const T = {
  bg:'#080C14', surface:'#0D1320', card:'#111827',
  border:'#1E2A3A', accent:'#00D4FF', emerald:'#00E5A0',
  text:'#E8EDF5', muted:'#5A6A82', danger:'#FF4D6A', gold:'#C9A84C',
};

const SPEC_COLORS = {
  'General Dentist':   { bg:'#0F1F40', text:'#60A5FA' },
  'Orthodontist':      { bg:'#1A0F2E', text:'#A78BFA' },
  'Cosmetic Dentist':  { bg:'#200F1A', text:'#F472B6' },
  'Periodontist':      { bg:'#0A2018', text:'#34D399' },
  'Endodontist':       { bg:'#221000', text:'#FB923C' },
  'Oral Surgeon':      { bg:'#200000', text:'#F87171' },
  'Pediatric Dentist': { bg:'#1A1800', text:'#FBBF24' },
  'Prosthodontist':    { bg:'#001818', text:'#2DD4BF' },
};
const specStyle = s => SPEC_COLORS[s] || { bg:T.surface, text:T.muted };

/* ══════════════════════════════════════════════════════════════
   NEARBY DOCTORS MAP — self-contained component
   Props:
     user         — logged-in user object
     onBookDoctor — callback(doctor) when patient books
══════════════════════════════════════════════════════════════ */
export default function NearbyDoctorsMap({ user, onBookDoctor }) {
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef= useRef([]);
  const userMarkerRef = useRef(null);

  const [doctors,      setDoctors]      = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [locating,     setLocating]     = useState(false);
  const [error,        setError]        = useState('');
  const [userLoc,      setUserLoc]      = useState(null);  // { lat, lng }
  const [radius,       setRadius]       = useState(10);    // km
  const [specFilter,   setSpecFilter]   = useState('All');
  const [mapReady,     setMapReady]     = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);

  const specs = ['All', ...Array.from(new Set(doctors.map(d=>d.specialization).filter(Boolean)))];
  const filtered = specFilter==='All' ? doctors : doctors.filter(d=>d.specialization===specFilter);

  /* ── Load Leaflet ─────────────────────────────────────── */
  useEffect(() => {
    if (window.L && mapObjRef.current) return;
    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id='leaflet-css'; link.rel='stylesheet';
        link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.querySelector('script[src*="leaflet"]')) {
        const script = document.createElement('script');
        script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else if (window.L) {
        initMap();
      } else {
        setTimeout(loadLeaflet, 200);
      }
    };
    loadLeaflet();
  }, []);

  const initMap = useCallback(() => {
    if (mapObjRef.current || !mapRef.current || !window.L) return;
    const L = window.L;

    const map = L.map(mapRef.current, { zoomControl:false })
      .setView([12.9716, 77.5946], 12);  // default: Bengaluru

    L.control.zoom({ position:'bottomright' }).addTo(map);

    // Dark tile layer from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap © CARTO',
      subdomains:'abcd', maxZoom:19,
    }).addTo(map);

    mapObjRef.current = map;
    setMapReady(true);
  }, []);

  /* ── Locate user ──────────────────────────────────────── */
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation is not supported by your browser.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude:lat, longitude:lng } = pos.coords;
        setUserLoc({ lat, lng });
        if (mapObjRef.current && window.L) {
          const L = window.L;
          mapObjRef.current.setView([lat, lng], 13);
          if (userMarkerRef.current) userMarkerRef.current.remove();
          const icon = L.divIcon({
            className:'',
            html:`<div style="width:18px;height:18px;background:${T.emerald};border-radius:50%;border:3px solid white;box-shadow:0 0 20px ${T.emerald}80;"></div>`,
            iconSize:[18,18], iconAnchor:[9,9],
          });
          userMarkerRef.current = L.marker([lat,lng],{icon,zIndexOffset:1000})
            .bindPopup('<span style="font-size:12px;font-weight:600;color:#111">📍 Your Location</span>')
            .addTo(mapObjRef.current);
        }
        setLocating(false);
        fetchNearby(lat, lng);
      },
      err => {
        setLocating(false);
        setError(`Could not get your location: ${err.message}. Please allow location access and try again.`);
      },
      { enableHighAccuracy:true, timeout:10000 }
    );
  }, [radius]);

  /* ── Fetch nearby doctors ─────────────────────────────── */
  const fetchNearby = useCallback(async (lat, lng, r = radius) => {
    setLoading(true); setError('');
    try {
      const url = `${API}/api/doctors/nearby?lat=${lat}&lng=${lng}&radius=${r}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load nearby doctors');
      setDoctors(data.doctors || []);
      plotDoctors(data.doctors || [], lat, lng);
    } catch (e) {
      setError(e.message);
      // Fall back to loading all doctors
      try {
        const res  = await fetch(`${API}/api/doctors`);
        const data = await res.json();
        if (data.success) {
          setDoctors(data.doctors||[]);
          plotDoctors(data.doctors||[], lat, lng);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [radius]);

  /* ── Plot doctor markers on map ───────────────────────── */
  const plotDoctors = useCallback((docs, userLat, userLng) => {
    if (!mapObjRef.current || !window.L) return;
    const L = window.L;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    docs.forEach((doc, i) => {
      const coords = doc.location?.coordinates;
      if (!coords || (coords[0]===0 && coords[1]===0)) return;
      const [dLng, dLat] = coords;

      const sc = specStyle(doc.specialization);
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:40px;height:40px;cursor:pointer;">
            <div style="width:40px;height:40px;background:${T.card};border:2px solid ${T.accent};border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${T.accent}30;">
              <span style="color:${T.accent};font-size:16px;">🦷</span>
            </div>
            <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:${T.accent};border-radius:50%;border:1px solid ${T.bg};"></div>
          </div>`,
        iconSize:[40,44], iconAnchor:[20,44],
      });

      const popup = L.popup({
        className:'smilecare-popup',
        maxWidth:260,
        closeButton:false,
      }).setContent(`
        <div style="font-family:'Space Grotesk',sans-serif;padding:4px;">
          <p style="font-weight:700;font-size:14px;color:#E8EDF5;margin:0 0 4px;">${doc.name}</p>
          <p style="font-size:11px;color:#00D4FF;margin:0 0 8px;">${doc.specialization}</p>
          <p style="font-size:11px;color:#5A6A82;margin:0 0 4px;">📍 ${doc.location?.address||doc.address||'No address'}</p>
          ${doc.distanceKm ? `<p style="font-size:11px;color:#00E5A0;margin:0;">🧭 ${doc.distanceKm} km away</p>` : ''}
          <p style="font-size:11px;color:#C9A84C;margin:4px 0 0;">₹${doc.consultationFee} consultation</p>
        </div>`
      );

      const marker = L.marker([dLat, dLng], { icon })
        .addTo(mapObjRef.current)
        .bindPopup(popup)
        .on('click', () => setSelected(doc));

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers + user
    if (docs.length > 0 && userLat && userLng) {
      const allCoords = docs
        .filter(d => d.location?.coordinates && !(d.location.coordinates[0]===0))
        .map(d => [d.location.coordinates[1], d.location.coordinates[0]]);
      if (allCoords.length) {
        const bounds = L.latLngBounds([[userLat,userLng], ...allCoords]);
        mapObjRef.current.fitBounds(bounds, { padding:[40,40] });
      }
    }
  }, []);

  /* ── Pan to doctor on card click ──────────────────────── */
  const focusDoctor = (doc) => {
    setSelected(doc);
    const coords = doc.location?.coordinates;
    if (!coords || !mapObjRef.current) return;
    const [dLng, dLat] = coords;
    if (dLat && dLng) mapObjRef.current.setView([dLat, dLng], 16, { animate:true });
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap');
    .smilecare-popup .leaflet-popup-content-wrapper {
      background:${T.card} !important;
      border:1px solid ${T.border} !important;
      border-radius:14px !important;
      box-shadow:0 8px 32px rgba(0,0,0,.5) !important;
      padding:0 !important;
    }
    .smilecare-popup .leaflet-popup-tip { background:${T.card} !important; }
    .smilecare-popup .leaflet-popup-content { margin:12px 16px !important; }
    .ndm-card { background:${T.card}; border:1px solid ${T.border}; border-radius:16px; padding:16px; cursor:pointer; transition:all .25s; }
    .ndm-card:hover, .ndm-card.active { border-color:${T.accent}50; box-shadow:0 0 24px ${T.accent}0A; }
    .ndm-card.active { border-color:${T.accent}; background:${T.surface}; }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:22, fontWeight:800, letterSpacing:'-0.5px', margin:0 }}>
              Doctors Near You
            </h2>
            <p style={{ color:T.muted, fontSize:12.5, marginTop:4 }}>
              {loading ? 'Searching…' : userLoc
                ? `${filtered.length} doctor${filtered.length!==1?'s':''} found within ${radius} km`
                : 'Enable location to find nearby specialists'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Radius selector */}
            <select value={radius} onChange={e=>{setRadius(Number(e.target.value));if(userLoc)fetchNearby(userLoc.lat,userLoc.lng,Number(e.target.value));}}
              style={{ background:T.card, border:`1px solid ${T.border}`, color:T.text, borderRadius:10, padding:'7px 12px', fontSize:12, outline:'none', cursor:'pointer', fontFamily:'inherit' }}>
              {[2,5,10,20,50].map(r=><option key={r} value={r}>{r} km</option>)}
            </select>

            {/* Filter toggle */}
            <button onClick={()=>setShowFilters(f=>!f)}
              style={{ display:'flex', alignItems:'center', gap:6, background:showFilters?`${T.accent}15`:T.card, border:`1px solid ${showFilters?T.accent:T.border}`, color:showFilters?T.accent:T.muted, borderRadius:10, padding:'7px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <FaFilter style={{fontSize:10}}/> Filter
            </button>

            {/* Locate Me */}
            <button onClick={locateUser} disabled={locating}
              style={{ display:'flex', alignItems:'center', gap:6, background:`linear-gradient(135deg,${T.accent},#0066AA)`, border:'none', color:T.bg, borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:locating?'wait':'pointer' }}>
              <FaLocationArrow style={{fontSize:10}}/>
              {locating ? 'Locating…' : 'Locate Me'}
            </button>
          </div>
        </div>

        {/* Spec filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              style={{ display:'flex', flexWrap:'wrap', gap:8, overflow:'hidden' }}>
              {specs.map(s=>(
                <button key={s} onClick={()=>setSpecFilter(s)}
                  style={{ padding:'5px 14px', borderRadius:20, fontSize:11.5, fontWeight:600, cursor:'pointer', border:`1.5px solid ${specFilter===s?T.accent:T.border}`, background:specFilter===s?`${T.accent}15`:'transparent', color:specFilter===s?T.accent:T.muted, transition:'all .2s' }}>
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div style={{ background:`${T.danger}10`, border:`1px solid ${T.danger}30`, borderRadius:12, padding:'10px 14px', color:T.danger, fontSize:12.5 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Map + list layout */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, minHeight:480 }}>

          {/* ── MAP ─────────────────────────────── */}
          <div style={{ position:'relative', borderRadius:20, overflow:'hidden', border:`1px solid ${T.border}`, background:T.surface }}>
            <div ref={mapRef} style={{ width:'100%', height:'100%', minHeight:480 }} />

            {/* Empty state overlay */}
            {!userLoc && mapReady && !loading && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`${T.bg}CC`, backdropFilter:'blur(4px)', zIndex:500, gap:12 }}>
                <div style={{ width:64, height:64, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FaLocationArrow style={{ color:T.accent, fontSize:24 }} />
                </div>
                <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:16, fontWeight:700 }}>Find Doctors Near You</p>
                <p style={{ color:T.muted, fontSize:13, textAlign:'center', maxWidth:240, lineHeight:1.7 }}>
                  Click "Locate Me" to find dental specialists near your current location.
                </p>
                <button onClick={locateUser}
                  style={{ background:`linear-gradient(135deg,${T.accent},#0066AA)`, color:T.bg, border:'none', borderRadius:12, padding:'11px 28px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <FaLocationArrow style={{fontSize:11}}/> Enable Location
                </button>
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', background:`${T.card}E0`, border:`1px solid ${T.border}`, borderRadius:20, padding:'8px 16px', display:'flex', alignItems:'center', gap:8, zIndex:600, backdropFilter:'blur(8px)' }}>
                <div style={{ width:14, height:14, border:`2px solid ${T.border}`, borderTopColor:T.accent, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
                <span style={{ color:T.text, fontSize:12, fontWeight:600 }}>Searching nearby…</span>
              </div>
            )}

            {/* Legend */}
            {userLoc && doctors.length>0 && (
              <div style={{ position:'absolute', bottom:12, left:12, background:`${T.card}E0`, border:`1px solid ${T.border}`, borderRadius:12, padding:'8px 12px', zIndex:500, backdropFilter:'blur(8px)', display:'flex', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, background:T.emerald, borderRadius:'50%', display:'inline-block' }}/>
                  <span style={{ color:T.muted, fontSize:10 }}>You</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:12 }}>🦷</span>
                  <span style={{ color:T.muted, fontSize:10 }}>Clinic</span>
                </div>
              </div>
            )}
          </div>

          {/* ── DOCTOR LIST ─────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto', maxHeight:480, paddingRight:2 }}>
            {!userLoc && !loading && (
              <div style={{ textAlign:'center', padding:'60px 16px', color:T.muted }}>
                <FaMapMarkerAlt style={{ fontSize:32, marginBottom:12, display:'block', margin:'0 auto 12px' }}/>
                <p style={{ fontSize:13 }}>Enable location to see nearby doctors</p>
              </div>
            )}

            {userLoc && filtered.length===0 && !loading && (
              <div style={{ textAlign:'center', padding:'40px 16px', color:T.muted }}>
                <FaUserMd style={{ fontSize:32, marginBottom:12, display:'block', margin:'0 auto 12px' }}/>
                <p style={{ fontSize:13 }}>No doctors found within {radius} km.</p>
                <p style={{ fontSize:12, marginTop:6 }}>Try increasing the radius.</p>
              </div>
            )}

            {filtered.map((doc,i) => {
              const sc   = specStyle(doc.specialization);
              const name = doc.name||'Doctor';
              const last = name.replace(/^Dr\.?\s*/i,'').split(' ').slice(-1)[0];
              const isActive = selected?._id===doc._id;
              return (
                <motion.div key={doc._id||i} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}
                  className={`ndm-card ${isActive?'active':''}`}
                  onClick={()=>focusDoctor(doc)}>
                  <div style={{ display:'flex', gap:12, marginBottom:10 }}>
                    <div style={{ width:42, height:42, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.accent, fontWeight:800, fontSize:17, flexShrink:0 }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontWeight:700, fontSize:13.5, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</p>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:sc.bg, color:sc.text }}>{doc.specialization}</span>
                    </div>
                    {doc.distanceKm && (
                      <div style={{ background:`${T.emerald}10`, border:`1px solid ${T.emerald}20`, borderRadius:8, padding:'3px 8px', color:T.emerald, fontSize:10, fontWeight:700, flexShrink:0, height:'fit-content' }}>
                        {doc.distanceKm} km
                      </div>
                    )}
                  </div>

                  {/* Clinic address */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginBottom:8 }}>
                    <FaMapMarkerAlt style={{ color:T.accent, fontSize:10, marginTop:2, flexShrink:0 }}/>
                    <p style={{ color:T.muted, fontSize:11.5, lineHeight:1.5 }}>
                      {doc.location?.address || doc.address || 'Address not set'}
                    </p>
                  </div>

                  <div style={{ display:'flex', gap:12, marginBottom:10, fontSize:11, color:T.muted }}>
                    {doc.experience>0 && <span style={{ display:'flex', alignItems:'center', gap:5 }}><FaClock style={{ fontSize:9, color:T.gold }}/>{doc.experience} yrs</span>}
                    {doc.consultationFee && <span style={{ display:'flex', alignItems:'center', gap:5 }}>₹{doc.consultationFee}</span>}
                  </div>

                  <button onClick={e=>{e.stopPropagation();onBookDoctor&&onBookDoctor(doc);}}
                    style={{ width:'100%', background:`linear-gradient(135deg,${T.accent},#0066AA)`, color:T.bg, border:'none', borderRadius:10, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Book — Dr. {last}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected doctor detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
              style={{ background:T.card, border:`1px solid ${T.accent}40`, borderRadius:18, padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <div style={{ width:52, height:52, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:T.accent, fontWeight:800, fontSize:20, flexShrink:0 }}>
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontWeight:800, fontSize:16, marginBottom:4 }}>{selected.name}</p>
                <p style={{ color:T.accent, fontSize:12, marginBottom:6 }}>{selected.specialization} · {selected.qualification} · {selected.experience} yrs</p>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <FaMapMarkerAlt style={{ color:T.gold, fontSize:11 }}/>
                  <p style={{ color:T.muted, fontSize:12 }}>{selected.location?.address||selected.address||'No address'}</p>
                </div>
              </div>
              {selected.distanceKm && (
                <div style={{ display:'flex', alignItems:'center', gap:6, background:`${T.emerald}10`, border:`1px solid ${T.emerald}20`, borderRadius:10, padding:'8px 14px' }}>
                  <FaRoute style={{ color:T.emerald, fontSize:12 }}/>
                  <span style={{ color:T.emerald, fontWeight:700, fontSize:14 }}>{selected.distanceKm} km</span>
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>onBookDoctor&&onBookDoctor(selected)}
                  style={{ background:`linear-gradient(135deg,${T.accent},#0066AA)`, color:T.bg, border:'none', borderRadius:12, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Book Appointment
                </button>
                <button onClick={()=>setSelected(null)}
                  style={{ background:'transparent', border:`1px solid ${T.border}`, color:T.muted, borderRadius:12, padding:'10px 14px', cursor:'pointer' }}>
                  <FaTimes/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </>
  );
}