import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FaTooth, FaCalendarCheck, FaUserMd, FaStar, FaPhone,
  FaEnvelope, FaMapMarkerAlt, FaBars, FaTimes, FaArrowRight,
  FaShieldAlt, FaClock, FaCheckCircle, FaMicrophoneAlt,
  FaSignOutAlt, FaChevronDown, FaWhatsapp, FaInstagram,
  FaFacebook, FaHeartbeat, FaTeeth, FaStethoscope
} from 'react-icons/fa';
import NearbyDoctorsMap  from './nearbydoctorpages'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Design tokens ──────────────────────────────────────────────────── */
const T = {
  bg:       '#080C14',
  surface:  '#0D1320',
  card:     '#111827',
  border:   '#1E2A3A',
  accent:   '#00D4FF',
  gold:     '#C9A84C',
  emerald:  '#00E5A0',
  text:     '#E8EDF5',
  muted:    '#5A6A82',
  danger:   '#FF4D6A',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${T.bg}; color:${T.text}; font-family:'Space Grotesk',sans-serif; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:${T.bg}; }
  ::-webkit-scrollbar-thumb { background:${T.accent}30; border-radius:2px; }

  .noise {
    position:fixed; inset:0; z-index:0; pointer-events:none; opacity:.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(${T.accent}06 1px, transparent 1px),
      linear-gradient(90deg, ${T.accent}06 1px, transparent 1px);
    background-size:60px 60px;
  }

  .glow-orb {
    position:absolute; border-radius:50%; filter:blur(120px); pointer-events:none;
  }

  .card {
    background:${T.card};
    border:1px solid ${T.border};
    border-radius:20px;
    transition:border-color .3s, box-shadow .3s;
  }
  .card:hover {
    border-color:${T.accent}40;
    box-shadow:0 0 40px ${T.accent}08;
  }

  .btn-primary {
    background:linear-gradient(135deg, ${T.accent}, #0099CC);
    color:${T.bg};
    font-family:'Space Grotesk',sans-serif;
    font-weight:700;
    border:none; cursor:pointer;
    transition:opacity .2s, transform .2s;
  }
  .btn-primary:hover { opacity:.9; transform:translateY(-1px); }

  .btn-ghost {
    background:transparent;
    border:1px solid ${T.border};
    color:${T.muted};
    font-family:'Space Grotesk',sans-serif;
    font-weight:500;
    cursor:pointer;
    transition:border-color .2s, color .2s;
  }
  .btn-ghost:hover { border-color:${T.accent}60; color:${T.text}; }

  .tag {
    display:inline-flex; align-items:center; gap:6px;
    background:${T.accent}10; border:1px solid ${T.accent}25;
    color:${T.accent}; font-size:11px; font-weight:700;
    padding:5px 14px; border-radius:30px; letter-spacing:.14em; text-transform:uppercase;
  }

  .stat-card {
    background:${T.surface};
    border:1px solid ${T.border};
    border-radius:16px;
    padding:22px 24px;
  }

  @keyframes pulse-ring {
    0%   { transform:scale(1);   opacity:.6; }
    100% { transform:scale(1.8); opacity:0;  }
  }
  .pulse-ring {
    position:absolute; inset:0; border-radius:50%;
    border:1.5px solid ${T.accent};
    animation:pulse-ring 2s ease-out infinite;
  }

  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-8px); }
  }
  .float { animation:float 4s ease-in-out infinite; }

  @keyframes scan {
    0%   { top:0; }
    100% { top:100%; }
  }
  .scan-line {
    position:absolute; left:0; right:0; height:1px;
    background:linear-gradient(90deg, transparent, ${T.accent}60, transparent);
    animation:scan 3s linear infinite;
  }

  .spec-badge {
    font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px;
    letter-spacing:.06em;
  }

  input, textarea {
    background:${T.surface} !important;
    border:1px solid ${T.border} !important;
    border-radius:12px !important;
    color:${T.text} !important;
    font-family:'Space Grotesk',sans-serif !important;
    font-size:14px !important;
    padding:13px 16px !important;
    width:100% !important;
    outline:none !important;
    transition:border-color .2s !important;
  }
  input:focus, textarea:focus { border-color:${T.accent}60 !important; }
  input::placeholder, textarea::placeholder { color:${T.muted} !important; }
`;

/* ── Helpers ────────────────────────────────────────────────────────── */
const Stars = ({ n = 5 }) => (
  <div style={{ display:'flex', gap:3 }}>
    {Array.from({ length:5 }).map((_,i) => (
      <FaStar key={i} style={{ fontSize:10, color: i<n ? T.gold : T.border }} />
    ))}
  </div>
);

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

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════ */
function LandingPage({ onLogin, onRegister, onDoctorLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0,1], [0, 120]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const services = [
    { icon:<FaTeeth />,        title:'General Dentistry',  desc:'Comprehensive check-ups, fillings, and preventive care for lasting oral health.' },
    { icon:<FaTooth />,        title:'Cosmetic Dentistry', desc:'Veneers, whitening, and smile design crafted by aesthetic specialists.' },
    { icon:<FaStethoscope />,  title:'Orthodontics',       desc:'Braces and clear aligners tailored precisely to your bite and lifestyle.' },
    { icon:<FaHeartbeat />,    title:'Oral Surgery',       desc:'Implants, extractions, and corrective procedures performed with precision.' },
    { icon:<FaMicrophoneAlt />,title:'AI Booking — Sarah', desc:'24/7 voice assistant for instant, confirmed appointment scheduling.' },
    { icon:<FaShieldAlt />,    title:'Emergency Care',     desc:'Same-day reserved slots for urgent pain relief and dental trauma.' },
  ];

  const steps = [
    { n:'01', title:'Create your account',  desc:'Register in under a minute with your name, email, and password.' },
    { n:'02', title:'Talk to Sarah',          desc:'Open the voice widget and speak naturally — Sarah understands context.' },
    { n:'03', title:'Confirmed instantly',    desc:'A confirmation email arrives the moment Sarah books your appointment.' },
  ];

  const testimonials = [
    { name:'Priya M.',  rating:5, treat:'Smile Design',    text:'Booked a consultation at midnight and received an email within seconds. The care exceeded every expectation.' },
    { name:'James T.',  rating:5, treat:'Orthodontics',    text:'Sarah handled everything — no hold music, no back-and-forth. The smoothest booking I have ever experienced.' },
    { name:'Ananya S.', rating:5, treat:'Teeth Whitening', text:'The clinic feels like a luxury experience. Sarah matched me with the perfect specialist instantly.' },
    { name:'Rahul D.',  rating:4, treat:'General Checkup', text:'Effortlessly modern. The AI assistant had my details ready and the whole visit was seamless.' },
  ];

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", background:T.bg, minHeight:'100vh', overflowX:'hidden', position:'relative' }}>

      {/* Background layers */}
      <div className="noise" />
      <div className="grid-bg" />

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        background: scrolled ? `${T.surface}E0` : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
        transition:'all .4s',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, background:`linear-gradient(135deg, ${T.accent}, #0066AA)`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              <FaTooth style={{ color:'white', fontSize:16 }} />
            </div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:18, fontWeight:800, lineHeight:1, letterSpacing:'-0.5px' }}>SmileCare</p>
              <p style={{ color:T.accent, fontSize:9, letterSpacing:'.22em', fontWeight:600, marginTop:2 }}>DENTAL CLINIC</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div style={{ display:'flex', alignItems:'center', gap:36 }} className="hidden md:flex">
            {['Services','How It Works','Testimonials','Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g,'-')}`}
                style={{ color:T.muted, fontSize:13, fontWeight:500, textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e=>e.target.style.color=T.text}
                onMouseLeave={e=>e.target.style.color=T.muted}>{l}</a>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }} className="hidden md:flex">
            <button onClick={onDoctorLogin} className="btn-ghost" style={{ padding:'8px 18px', borderRadius:10, fontSize:13 }}>Doctor Portal</button>
            <button onClick={onLogin}       className="btn-ghost" style={{ padding:'8px 18px', borderRadius:10, fontSize:13 }}>Sign In</button>
            <button onClick={onRegister}    className="btn-primary" style={{ padding:'10px 22px', borderRadius:12, fontSize:13 }}>Get Started →</button>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(m=>!m)} style={{ background:'none', border:'none', color:T.text, cursor:'pointer' }}>
            {menuOpen ? <FaTimes size={22}/> : <FaBars size={22}/>}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
              style={{ background:T.surface, borderTop:`1px solid ${T.border}`, padding:'20px 32px', display:'flex', flexDirection:'column', gap:16 }}>
              {['Services','How It Works','Testimonials','Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/\s+/g,'-')}`}
                  style={{ color:T.muted, fontSize:15, fontWeight:500, textDecoration:'none' }}
                  onClick={() => setMenuOpen(false)}>{l}</a>
              ))}
              <div style={{ display:'flex', gap:10, paddingTop:8 }}>
                <button onClick={onLogin}    className="btn-ghost"   style={{ flex:1, padding:'11px 0', borderRadius:12, fontSize:13 }}>Sign In</button>
                <button onClick={onRegister} className="btn-primary" style={{ flex:1, padding:'11px 0', borderRadius:12, fontSize:13 }}>Get Started</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ minHeight:'100vh', position:'relative', display:'flex', alignItems:'center', paddingTop:72, overflow:'hidden' }}>

        {/* Glow orbs */}
        <div className="glow-orb" style={{ width:600, height:600, background:`${T.accent}10`, top:-200, right:-200 }} />
        <div className="glow-orb" style={{ width:400, height:400, background:`${T.emerald}08`, bottom:0, left:-100 }} />

        <motion.div style={{ y: heroY }} className="w-full relative z-10">
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'80px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>

            {/* Left copy */}
            <motion.div initial={{opacity:0,x:-40}} animate={{opacity:1,x:0}} transition={{duration:.9}}>
              <div className="tag" style={{ marginBottom:28 }}>
                <span style={{ width:6, height:6, background:T.accent, borderRadius:'50%', animation:'pulse 2s infinite' }} />
                AI-Powered Dental Care
              </div>

              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(44px,5vw,72px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-2px', marginBottom:24, color:T.text }}>
                Where Smiles<br />
                <span style={{ color:'transparent', WebkitTextStroke:`1px ${T.accent}`, letterSpacing:'-1px' }}>Begin.</span>
              </h1>

              <p style={{ color:T.muted, fontSize:17, lineHeight:1.9, maxWidth:460, marginBottom:40 }}>
                Meet <strong style={{ color:T.text }}>Sarah</strong>, your 24/7 AI dental receptionist. Book appointments, get expert guidance, and connect with our specialist team — entirely by voice.
              </p>

              <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:56 }}>
                <button onClick={onRegister} className="btn-primary" style={{ padding:'15px 34px', borderRadius:14, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                  Book a Consultation <FaArrowRight style={{ fontSize:11 }}/>
                </button>
                <button onClick={onLogin} className="btn-ghost" style={{ padding:'15px 34px', borderRadius:14, fontSize:15 }}>
                  Sign In
                </button>
              </div>

              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:36, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
                {[['2,500+','Smiles restored'],['15+','Specialists'],['24/7','AI availability']].map(([n,l]) => (
                  <div key={l}>
                    <p style={{ fontFamily:"'Syne',sans-serif", color:T.accent, fontSize:32, fontWeight:800, lineHeight:1, letterSpacing:'-1px' }}>{n}</p>
                    <p style={{ color:T.muted, fontSize:12, marginTop:6, letterSpacing:'.04em' }}>{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sarah card */}
            <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{duration:.9,delay:.2}} className="float" style={{ justifySelf:'center', width:'100%', maxWidth:360 }}>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:24, padding:32, position:'relative', overflow:'hidden' }}>

                {/* Scan line effect */}
                <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:24, pointerEvents:'none' }}>
                  <div className="scan-line" />
                </div>

                {/* Live badge */}
                <div style={{ position:'absolute', top:20, right:20, display:'flex', alignItems:'center', gap:6, background:`${T.emerald}15`, border:`1px solid ${T.emerald}30`, borderRadius:20, padding:'5px 12px' }}>
                  <span style={{ width:6, height:6, background:T.emerald, borderRadius:'50%', animation:'pulse 1.5s infinite' }} />
                  <span style={{ color:T.emerald, fontSize:10, fontWeight:700, letterSpacing:'.1em' }}>LIVE</span>
                </div>

                {/* Avatar */}
                <div style={{ position:'relative', width:64, height:64, marginBottom:20 }}>
                  <div style={{ width:64, height:64, background:`linear-gradient(135deg, ${T.accent}, #0066AA)`, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <FaMicrophoneAlt style={{ color:'white', fontSize:24 }} />
                  </div>
                  <div style={{ position:'absolute', inset:-6, borderRadius:22 }}>
                    <div className="pulse-ring" />
                  </div>
                </div>

                <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:22, fontWeight:800, marginBottom:4 }}>Hi, I'm Sarah</p>
                <p style={{ color:T.muted, fontSize:13, marginBottom:24 }}>Your AI Dental Receptionist</p>

                {/* Capabilities */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', marginBottom:20 }}>
                  {['Book & reschedule appointments','Answer dental questions 24/7','Find specialists by need','Send instant confirmations'].map((t,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: i<3 ? 11 : 0 }}>
                      <div style={{ width:16, height:16, background:`${T.accent}15`, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <FaCheckCircle style={{ color:T.accent, fontSize:8 }} />
                      </div>
                      <span style={{ color:T.muted, fontSize:12.5 }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* Voice wave */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginBottom:20 }}>
                  {[.3,.5,.8,1,.7,.9,.5,.4,.6,.3,.7,.45].map((h,i) => (
                    <div key={i} style={{ width:3, height:h*30, background:`linear-gradient(to top, ${T.accent}50, ${T.accent})`, borderRadius:3, animation:`float ${1.5+i*.1}s ease-in-out infinite` }} />
                  ))}
                  <span style={{ color:T.accent, fontSize:11, marginLeft:10, fontWeight:600 }}>Listening…</span>
                </div>

                <button onClick={onRegister} className="btn-primary" style={{ width:'100%', padding:'13px 0', borderRadius:14, fontSize:14 }}>
                  Talk to Sarah →
                </button>
              </div>
            </motion.div>

          </div>
        </motion.div>

        <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', color:T.muted, animation:'float 2s infinite' }}>
          <FaChevronDown />
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────── */}
      <section id="services" style={{ padding:'100px 0', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px' }}>
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} style={{ marginBottom:56 }}>
            <div className="tag" style={{ marginBottom:16 }}>Our Expertise</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:'clamp(30px,4vw,48px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-1px' }}>
              Comprehensive care,<br /><span style={{ color:T.accent }}>crafted around you.</span>
            </h2>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:18 }}>
            {services.map((s,i) => (
              <motion.div key={i} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07}}
                className="card" style={{ padding:28, cursor:'pointer' }}>
                <div style={{ width:48, height:48, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  <span style={{ color:T.accent, fontSize:18 }}>{s.icon}</span>
                </div>
                <h3 style={{ color:T.text, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, marginBottom:10 }}>{s.title}</h3>
                <p style={{ color:T.muted, fontSize:13.5, lineHeight:1.8 }}>{s.desc}</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:T.accent, fontSize:12, fontWeight:600, marginTop:18 }}>
                  Learn more <FaArrowRight style={{ fontSize:9 }}/>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding:'100px 0', background:T.surface, position:'relative', zIndex:1 }}>
        <div style={{ position:'absolute', inset:0, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, pointerEvents:'none' }} />
        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 32px' }}>
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} style={{ textAlign:'center', marginBottom:64 }}>
            <div className="tag" style={{ marginBottom:16 }}>Simple Process</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:'clamp(28px,4vw,46px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px' }}>
              From sign-up to confirmed<br /><span style={{ color:T.accent }}>appointment in three steps.</span>
            </h2>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, position:'relative' }}>
            {/* Connector line */}
            <div style={{ position:'absolute', top:44, left:'17%', right:'17%', height:1, background:`linear-gradient(90deg, transparent, ${T.accent}40, transparent)` }} />

            {steps.map((s,i) => (
              <motion.div key={i} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.15}}
                style={{ textAlign:'center' }}>
                <div style={{ width:88, height:88, background: i===1 ? `linear-gradient(135deg, ${T.accent}, #0066AA)` : T.card, border:`1px solid ${i===1 ? T.accent : T.border}`, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow: i===1 ? `0 0 40px ${T.accent}30` : 'none' }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", color: i===1 ? T.bg : T.accent, fontSize:24, fontWeight:800 }}>{s.n}</span>
                </div>
                <h3 style={{ color:T.text, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, marginBottom:10 }}>{s.title}</h3>
                <p style={{ color:T.muted, fontSize:13.5, lineHeight:1.8 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} style={{ textAlign:'center', marginTop:56 }}>
            <button onClick={onRegister} className="btn-primary" style={{ padding:'15px 44px', borderRadius:14, fontSize:15, display:'inline-flex', alignItems:'center', gap:8 }}>
              Create your free account <FaArrowRight style={{ fontSize:11 }}/>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section id="testimonials" style={{ padding:'100px 0', position:'relative', zIndex:1 }}>
        <div className="glow-orb" style={{ width:500, height:500, background:`${T.accent}06`, top:'10%', left:'50%', transform:'translateX(-50%)' }} />
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', position:'relative', zIndex:1 }}>
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} style={{ marginBottom:48 }}>
            <div className="tag" style={{ marginBottom:16 }}>Patient Stories</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:'clamp(28px,4vw,46px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px' }}>
              Trusted by thousands<br /><span style={{ color:T.accent }}>across the city.</span>
            </h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {testimonials.map((t,i) => (
              <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}}
                className="card" style={{ padding:26 }}>
                <Stars n={t.rating} />
                <p style={{ color:T.muted, fontSize:13.5, lineHeight:1.85, margin:'14px 0 18px' }}>"{t.text}"</p>
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
                  <p style={{ color:T.text, fontWeight:600, fontSize:14 }}>{t.name}</p>
                  <p style={{ color:T.accent, fontSize:12, marginTop:4 }}>{t.treat}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCTOR CTA ─────────────────────────────────────────────── */}
      <section style={{ padding:'72px 0', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px' }}>
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:24, padding:'44px 48px', position:'relative', overflow:'hidden' }}>
            <div className="glow-orb" style={{ width:400, height:400, background:`${T.accent}06`, top:-200, right:-100 }} />
            <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:24, position:'relative', zIndex:1 }}>
              <div style={{ width:64, height:64, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FaUserMd style={{ color:T.accent, fontSize:26 }} />
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:22, fontWeight:800, marginBottom:8 }}>Are you a dental professional?</h3>
                <p style={{ color:T.muted, fontSize:14, maxWidth:500, lineHeight:1.8 }}>Join SmileCare. Set your availability and let Sarah automatically fill your schedule with qualified patients.</p>
              </div>
              <button onClick={onDoctorLogin} className="btn-primary" style={{ padding:'13px 28px', borderRadius:14, fontSize:14, whiteSpace:'nowrap', flexShrink:0 }}>
                Doctor Portal →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding:'100px 0', background:T.surface, position:'relative', zIndex:1 }}>
        <div style={{ position:'absolute', inset:0, borderTop:`1px solid ${T.border}`, pointerEvents:'none' }} />
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'start' }}>
          <motion.div initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
            <div className="tag" style={{ marginBottom:16 }}>Contact</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px', marginBottom:36 }}>
              Let's talk about<br /><span style={{ color:T.accent }}>your smile.</span>
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {[
                { icon:<FaPhone />,        label:'Call us',    val:'+1 (555) 123-4567' },
                { icon:<FaEnvelope />,     label:'Email',      val:'hello@smilecaredental.com' },
                { icon:<FaMapMarkerAlt />, label:'Visit us',   val:'123 Dental Ave, Suite 100' },
                { icon:<FaClock />,        label:'Open hours', val:'Mon–Fri 9–6 · Sat 10–4' },
              ].map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, background:`${T.accent}10`, border:`1px solid ${T.accent}20`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color:T.accent, fontSize:14 }}>{c.icon}</span>
                  </div>
                  <div>
                    <p style={{ color:T.muted, fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>{c.label}</p>
                    <p style={{ color:T.text, fontSize:14, fontWeight:500, marginTop:3 }}>{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true}}
            style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:22, padding:32 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontWeight:700, fontSize:20, marginBottom:22 }}>Send a message</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input type="text"  placeholder="Your full name" />
              <input type="email" placeholder="Email address" />
              <input type="tel"   placeholder="Phone number" />
              <textarea rows={4}  placeholder="Your message…" style={{ resize:'none' }} />
              <button className="btn-primary" style={{ padding:'14px 0', borderRadius:12, fontSize:14, width:'100%' }}>Send Message</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ background:T.bg, borderTop:`1px solid ${T.border}`, padding:'40px 0', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, background:`linear-gradient(135deg, ${T.accent}, #0066AA)`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FaTooth style={{ color:'white', fontSize:13 }} />
            </div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:15, fontWeight:800 }}>SmileCare Dental</p>
              <p style={{ color:T.muted, fontSize:11, marginTop:2 }}>© {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
          <p style={{ color:T.muted, fontSize:12 }}>Powered by Sarah AI · Your virtual dental receptionist</p>
          <div style={{ display:'flex', gap:8 }}>
            {[FaFacebook,FaInstagram,FaWhatsapp].map((Icon,i) => (
              <button key={i} className="btn-ghost" style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                <Icon style={{ color:T.muted, fontSize:13 }} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════════ */
function Dashboard({ user, onLogout }) {
  const [doctors, setDoctors]       = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError]     = useState('');
  const [filter, setFilter]         = useState('All');
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    setDocLoading(true); setDocError('');
    try {
      const data = await (await fetch(`${API}/api/doctors`)).json();
      if (data.success) setDoctors(data.doctors || []);
      else setDocError('Could not load doctors.');
    } catch { setDocError('Could not connect to server.'); }
    finally { setDocLoading(false); }
  };

  const specs    = ['All', ...Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)))];
  const filtered = filter === 'All' ? doctors : doctors.filter(d => d.specialization === filter);
  const role     = user?.role || 'patient';
  const initial  = user?.name?.charAt(0).toUpperCase() || '?';
  const greeting = () => { const h = new Date().getHours(); return h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : 'Good evening'; };

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", background:T.bg, minHeight:'100vh', position:'relative' }}>
      <div className="noise" />
      <div className="grid-bg" />

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav style={{ background:`${T.surface}E0`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:40 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, background:`linear-gradient(135deg, ${T.accent}, #0066AA)`, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FaTooth style={{ color:'white', fontSize:15 }} />
            </div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:17, fontWeight:800, lineHeight:1, letterSpacing:'-0.5px' }}>SmileCare</p>
              <p style={{ color:T.accent, fontSize:9, letterSpacing:'.2em', fontWeight:600, marginTop:2 }}>DENTAL</p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }} className="hidden md:flex">
            {/* User chip */}
            <div style={{ display:'flex', alignItems:'center', gap:10, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'8px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:9, background: role==='doctor' ? `linear-gradient(135deg,#059669,#0D9488)` : `linear-gradient(135deg,${T.accent},#0066AA)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:14 }}>
                {initial}
              </div>
              <div>
                <p style={{ color:T.text, fontWeight:600, fontSize:13, lineHeight:1 }}>{user?.name}</p>
                <p style={{ color: role==='doctor' ? T.emerald : T.accent, fontSize:10, marginTop:3, fontWeight:600, textTransform:'capitalize' }}>{role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:12, fontSize:13 }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(m=>!m)} style={{ background:'none', border:'none', color:T.text, cursor:'pointer' }}>
            {menuOpen ? <FaTimes size={20}/> : <FaBars size={20}/>}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              style={{ background:T.surface, borderTop:`1px solid ${T.border}`, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.accent},#0066AA)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700 }}>{initial}</div>
                <div>
                  <p style={{ fontWeight:600, fontSize:13, color:T.text }}>{user?.name}</p>
                  <p style={{ fontSize:11, color:T.muted, textTransform:'capitalize' }}>{role}</p>
                </div>
              </div>
              <button onClick={onLogout} style={{ color:T.danger, fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
                <FaSignOutAlt /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px', position:'relative', zIndex:1 }}>

        {/* Welcome banner */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:22, padding:'36px 40px', marginBottom:20, position:'relative', overflow:'hidden' }}>
          <div className="glow-orb" style={{ width:400, height:400, background:`${T.accent}08`, top:-200, right:-100 }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <p style={{ color:T.muted, fontSize:13, marginBottom:6 }}>{greeting()},</p>
            <h1 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:30, fontWeight:800, letterSpacing:'-0.5px', marginBottom:8 }}>
              Welcome back, {user?.name?.split(' ')[0]}. 👋
            </h1>
            <p style={{ color:T.muted, fontSize:14, maxWidth:480, lineHeight:1.8 }}>
              Sarah is live and ready to assist. Use the chat widget in the bottom-right corner to book, reschedule, or ask dental questions.
            </p>
          </div>
        </motion.div>

        {/* Sarah card */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:22, padding:'28px 32px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
              <div style={{ width:64, height:64, background:`linear-gradient(135deg,${T.accent},#0066AA)`, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FaMicrophoneAlt style={{ color:'white', fontSize:24 }} />
              </div>
              <div style={{ position:'absolute', inset:-5, borderRadius:22 }}><div className="pulse-ring" /></div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:20, fontWeight:800 }}>Talk to Sarah</h2>
                <span style={{ background:`${T.emerald}15`, color:T.emerald, border:`1px solid ${T.emerald}30`, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:20, letterSpacing:'.1em' }}>LIVE</span>
              </div>
              <p style={{ color:T.muted, fontSize:13.5, lineHeight:1.8, maxWidth:460, marginBottom:14 }}>
                Ask Sarah to book, reschedule or cancel appointments, check doctor availability, or answer any dental question — hands-free.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {['"Book me a checkup"','"Find an orthodontist"','"I have a toothache"','"What are your hours?"'].map(s => (
                  <span key={s} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.muted, fontSize:11.5, padding:'5px 12px', borderRadius:20, fontWeight:500 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
              {[.3,.55,.88,.7,.45,.82,.38,.6,.42,.25].map((h,i) => (
                <div key={i} style={{ width:4, height:h*38, background:`linear-gradient(to top, ${T.accent}40, ${T.accent})`, borderRadius:3, animation:`float ${1.8+i*.1}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
          <p style={{ color:T.muted, fontSize:12, marginTop:20, paddingTop:18, borderTop:`1px solid ${T.border}` }}>
            💡 Press the chat bubble in the bottom-right corner to start a conversation with Sarah.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.15}}
          style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {[
            { icon:<FaUserMd />,        label:'Specialists',    value:doctors.length||'–', color:T.accent },
            { icon:<FaCalendarCheck />, label:'Appointments',   value:'24/7',               color:T.emerald },
            { icon:<FaMicrophoneAlt />, label:'AI Assistant',   value:'Live',               color:'#A78BFA' },
            { icon:<FaStar />,          label:'Patient Rating', value:'4.9★',              color:T.gold },
          ].map((s,i) => (
            <div key={i} className="stat-card" style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, background:`${s.color}12`, border:`1px solid ${s.color}20`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, fontSize:15, flexShrink:0 }}>{s.icon}</div>
              <div>
                <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:22, fontWeight:800, lineHeight:1 }}>{s.value}</p>
                <p style={{ color:T.muted, fontSize:11, marginTop:5 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Doctors */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:24, fontWeight:800, letterSpacing:'-0.5px' }}>Our Specialists</h2>
              <p style={{ color:T.muted, fontSize:12.5, marginTop:4 }}>
                {docLoading ? 'Loading…' : `${filtered.length} specialist${filtered.length!==1?'s':''} available`}
              </p>
            </div>
            {specs.length>1 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {specs.map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600, border:`1.5px solid ${filter===s ? T.accent : T.border}`, background: filter===s ? `${T.accent}15` : 'transparent', color: filter===s ? T.accent : T.muted, cursor:'pointer', transition:'all .2s' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {docLoading && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ padding:22, animation:'pulse 1.5s infinite' }}>
                  <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                    <div style={{ width:54, height:54, background:T.border, borderRadius:14 }} />
                    <div style={{ flex:1, paddingTop:4 }}>
                      <div style={{ height:13, background:T.border, borderRadius:6, width:'70%', marginBottom:8 }} />
                      <div style={{ height:11, background:T.border, borderRadius:6, width:'45%' }} />
                    </div>
                  </div>
                  <div style={{ height:11, background:T.border, borderRadius:6, marginBottom:8 }} />
                  <div style={{ height:11, background:T.border, borderRadius:6, width:'80%' }} />
                </div>
              ))}
            </div>
          )}

          {docError && !docLoading && (
            <div style={{ background:`${T.danger}10`, border:`1px solid ${T.danger}30`, borderRadius:16, padding:24, textAlign:'center' }}>
              <p style={{ color:T.danger, fontSize:14, marginBottom:12 }}>{docError}</p>
              <button onClick={fetchDoctors} className="btn-primary" style={{ padding:'8px 24px', borderRadius:10, fontSize:13 }}>Retry</button>
            </div>
          )}

          {!docLoading && !docError && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {filtered.length===0 ? (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0' }}>
                  <FaUserMd style={{ fontSize:40, color:T.border, margin:'0 auto 12px', display:'block' }} />
                  <p style={{ color:T.muted }}>No doctors found for this filter.</p>
                </div>
              ) : filtered.map((doc,i) => {
                const name = doc.name || 'Doctor';
                const last = name.replace(/^Dr\.?\s*/i,'').split(' ').slice(-1)[0];
                const sc   = specStyle(doc.specialization);
                return (
                  <motion.div key={doc._id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
                    className="card" style={{ padding:22 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                      {doc.photo
                        ? <img src={doc.photo} alt={name} style={{ width:54, height:54, borderRadius:14, objectFit:'cover', flexShrink:0 }} />
                        : <div style={{ width:54, height:54, background:`linear-gradient(135deg,${T.accent}20,${T.accent}10)`, border:`1px solid ${T.accent}20`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:T.accent, fontWeight:800, fontSize:20, flexShrink:0 }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                      }
                      <div>
                        <h3 style={{ color:T.text, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, marginBottom:6 }}>{name}</h3>
                        <span className="spec-badge" style={{ background:sc.bg, color:sc.text }}>{doc.specialization}</span>
                      </div>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:7, fontSize:12.5, color:T.muted, marginBottom:12 }}>
                      {doc.qualification && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaCheckCircle style={{ color:T.emerald, fontSize:10, flexShrink:0 }}/>{doc.qualification}</span>}
                      {doc.experience>0  && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaClock style={{ color:T.gold, fontSize:10, flexShrink:0 }}/>{doc.experience} years experience</span>}
                      {doc.availableDays?.length>0 && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaCalendarCheck style={{ color:T.accent, fontSize:10, flexShrink:0 }}/>{doc.availableDays.slice(0,3).map(d=>d.slice(0,3)).join(', ')}{doc.availableDays.length>3&&` +${doc.availableDays.length-3}`}</span>}
                    </div>

                    {doc.bio && <p style={{ fontSize:12, color:T.muted, lineHeight:1.7, marginBottom:14, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{doc.bio}</p>}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <Stars n={5} />
                      <button className="btn-primary" style={{ padding:'7px 16px', borderRadius:10, fontSize:12 }}>
                        Book — Dr. {last}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════════ */
export default function HomePage({ user, onLogin, onRegister, onDoctorLogin, onLogout }) {
  return (
    <>
      <style>{css}</style>
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
            <Dashboard user={user} onLogout={onLogout} />
          </motion.div>
        ) : (
          <motion.div key="land" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
            <LandingPage onLogin={onLogin} onRegister={onRegister} onDoctorLogin={onDoctorLogin} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}