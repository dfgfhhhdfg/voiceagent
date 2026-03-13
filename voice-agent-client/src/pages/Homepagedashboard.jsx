// Dashboard section only — drop-in replacement for the Dashboard function
// in your existing HomePage.jsx. Also add this import at the top:
// import NearbyDoctorsMap from './NearbyDoctorsMap';

function Dashboard({ user, onLogout }) {
  const [doctors,    setDoctors]    = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docError,   setDocError]   = useState('');
  const [filter,     setFilter]     = useState('All');
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [tab,        setTab]        = useState('list'); // 'list' | 'map'

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
  const greeting = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", background:T.bg, minHeight:'100vh', position:'relative' }}>
      <div className="noise" />
      <div className="grid-bg" />

      <nav style={{ background:`${T.surface}E0`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:40 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, background:`linear-gradient(135deg,${T.accent},#0066AA)`, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FaTooth style={{ color:'white', fontSize:15 }} />
            </div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:17, fontWeight:800, lineHeight:1, letterSpacing:'-0.5px' }}>SmileCare</p>
              <p style={{ color:T.accent, fontSize:9, letterSpacing:'.2em', fontWeight:600, marginTop:2 }}>DENTAL</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }} className="hidden md:flex">
            <div style={{ display:'flex', alignItems:'center', gap:10, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'8px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:9, background:role==='doctor'?`linear-gradient(135deg,#059669,#0D9488)`:`linear-gradient(135deg,${T.accent},#0066AA)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:14 }}>{initial}</div>
              <div>
                <p style={{ color:T.text, fontWeight:600, fontSize:13, lineHeight:1 }}>{user?.name}</p>
                <p style={{ color:role==='doctor'?T.emerald:T.accent, fontSize:10, marginTop:3, fontWeight:600, textTransform:'capitalize' }}>{role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:12, fontSize:13 }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
          <button className="md:hidden" onClick={()=>setMenuOpen(m=>!m)} style={{ background:'none', border:'none', color:T.text, cursor:'pointer' }}>
            {menuOpen?<FaTimes size={20}/>:<FaBars size={20}/>}
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
                {['"Book me a checkup"','"Find doctors near me"','"I have a toothache"','"Dentist near Mysuru"'].map(s => (
                  <span key={s} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.muted, fontSize:11.5, padding:'5px 12px', borderRadius:20, fontWeight:500 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
              {[.3,.55,.88,.7,.45,.82,.38,.6,.42,.25].map((h,i) => (
                <div key={i} style={{ width:4, height:h*38, background:`linear-gradient(to top,${T.accent}40,${T.accent})`, borderRadius:3, animation:`float ${1.8+i*.1}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
          <p style={{ color:T.muted, fontSize:12, marginTop:20, paddingTop:18, borderTop:`1px solid ${T.border}` }}>
            💡 Try saying <em>"Find doctors near me"</em> — Sarah will use your location to show nearby clinics with addresses and distances.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.15}}
          style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {[
            { icon:<FaUserMd/>,        label:'Specialists',    value:doctors.length||'–', color:T.accent },
            { icon:<FaCalendarCheck/>, label:'Appointments',   value:'24/7',               color:T.emerald },
            { icon:<FaMicrophoneAlt/>, label:'AI Assistant',   value:'Live',               color:'#A78BFA' },
            { icon:<FaStar/>,          label:'Patient Rating', value:'4.9★',              color:T.gold },
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

        {/* ── DOCTORS WITH TAB ─────────────────────────────────────── */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", color:T.text, fontSize:24, fontWeight:800, letterSpacing:'-0.5px' }}>Our Specialists</h2>
              <p style={{ color:T.muted, fontSize:12.5, marginTop:4 }}>
                {tab==='list' ? (docLoading?'Loading…':`${filtered.length} specialist${filtered.length!==1?'s':''} available`) : 'Find doctors near your location'}
              </p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Tab switcher */}
              <div style={{ display:'flex', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:4, gap:2 }}>
                {[{key:'list',label:'📋 Directory'},{key:'map',label:'🗺️ Nearby Map'}].map(t => (
                  <button key={t.key} onClick={()=>setTab(t.key)}
                    style={{ padding:'7px 16px', borderRadius:9, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', transition:'all .2s', background:tab===t.key?`${T.accent}15`:'transparent', color:tab===t.key?T.accent:T.muted }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── LIST tab ─────────────────────────────────────────── */}
          {tab==='list' && (
            <>
              {specs.length>1 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                  {specs.map(s => (
                    <button key={s} onClick={()=>setFilter(s)}
                      style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600, border:`1.5px solid ${filter===s?T.accent:T.border}`, background:filter===s?`${T.accent}15`:'transparent', color:filter===s?T.accent:T.muted, cursor:'pointer', transition:'all .2s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {docLoading && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="card" style={{ padding:22, animation:'pulse 1.5s infinite' }}>
                      <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                        <div style={{ width:54, height:54, background:T.border, borderRadius:14 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ height:13, background:T.border, borderRadius:6, width:'70%', marginBottom:8 }}/>
                          <div style={{ height:11, background:T.border, borderRadius:6, width:'45%' }}/>
                        </div>
                      </div>
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
                      <FaUserMd style={{ fontSize:40, color:T.border, margin:'0 auto 12px', display:'block' }}/>
                      <p style={{ color:T.muted }}>No doctors found.</p>
                    </div>
                  ) : filtered.map((doc,i) => {
                    const name = doc.name||'Doctor';
                    const last = name.replace(/^Dr\.?\s*/i,'').split(' ').slice(-1)[0];
                    const sc   = specStyle(doc.specialization);
                    return (
                      <motion.div key={doc._id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
                        className="card" style={{ padding:22 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                          {doc.photo
                            ? <img src={doc.photo} alt={name} style={{ width:54, height:54, borderRadius:14, objectFit:'cover', flexShrink:0 }}/>
                            : <div style={{ width:54, height:54, background:`linear-gradient(135deg,${T.accent}20,${T.accent}10)`, border:`1px solid ${T.accent}20`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:T.accent, fontWeight:800, fontSize:20, flexShrink:0 }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                          }
                          <div>
                            <h3 style={{ color:T.text, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, marginBottom:6 }}>{name}</h3>
                            <span style={{ background:sc.bg, color:sc.text, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{doc.specialization}</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:7, fontSize:12.5, color:T.muted, marginBottom:12 }}>
                          {doc.qualification && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaCheckCircle style={{ color:T.emerald, fontSize:10, flexShrink:0 }}/>{doc.qualification}</span>}
                          {doc.experience>0  && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaClock style={{ color:T.gold, fontSize:10, flexShrink:0 }}/>{doc.experience} years experience</span>}
                          {(doc.location?.address||doc.address) && (
                            <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaMapMarkerAlt style={{ color:T.accent, fontSize:10, flexShrink:0 }}/>{(doc.location?.address||doc.address).split(',').slice(0,2).join(',')}</span>
                          )}
                          {doc.availableDays?.length>0 && <span style={{ display:'flex', alignItems:'center', gap:8 }}><FaCalendarCheck style={{ color:T.accent, fontSize:10, flexShrink:0 }}/>{doc.availableDays.slice(0,3).map(d=>d.slice(0,3)).join(', ')}{doc.availableDays.length>3&&` +${doc.availableDays.length-3}`}</span>}
                        </div>
                        {doc.bio && <p style={{ fontSize:12, color:T.muted, lineHeight:1.7, marginBottom:14, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{doc.bio}</p>}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', gap:2 }}>
                            {Array.from({length:5}).map((_,j) => <FaStar key={j} style={{ fontSize:10, color:T.gold }}/>)}
                          </div>
                          <button className="btn-primary" style={{ padding:'7px 16px', borderRadius:10, fontSize:12 }}>
                            Book — Dr. {last}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── MAP tab ──────────────────────────────────────────── */}
          {tab==='map' && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:24 }}>
              <NearbyDoctorsMap
                onBookDoctor={doc => {
                  // Switch to list and scroll, or trigger booking flow
                  setTab('list');
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}