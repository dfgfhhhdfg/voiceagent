import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaComments, FaUserMd, FaMicrophoneAlt, FaVolumeMute } from 'react-icons/fa';
import { useWebRTC } from '../../hooks/useWebRTC';
import MicButton from './MicButton';

/* ── Design tokens (must match HomePage) ──────────────────────────── */
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600&display=swap');

  .vw-container {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    font-family: 'Space Grotesk', sans-serif;
  }

  /* ── Floating button ── */
  .vw-fab {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    background: linear-gradient(135deg, ${T.accent}, #0066AA);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 32px ${T.accent}40, 0 0 0 1px ${T.accent}30;
    position: relative;
    z-index: 2;
  }
  .vw-fab-ring {
    position: absolute;
    inset: -4px;
    border-radius: 22px;
    border: 1.5px solid ${T.accent}30;
    animation: vw-ring 2.5s ease-out infinite;
  }
  @keyframes vw-ring {
    0%   { transform: scale(1);   opacity: .5; }
    100% { transform: scale(1.5); opacity: 0;  }
  }

  /* ── Panel ── */
  .vw-panel {
    position: absolute;
    bottom: 72px;
    right: 0;
    width: 360px;
    height: 560px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 0 0 1px ${T.accent}10;
  }

  /* noise overlay */
  .vw-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: .02;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* ── Header ── */
  .vw-header {
    background: ${T.card};
    border-bottom: 1px solid ${T.border};
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
  .vw-avatar {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    background: linear-gradient(135deg, ${T.accent}, #0066AA);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
  }
  .vw-status-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid ${T.card};
  }
  .vw-header-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: ${T.text};
    line-height: 1;
    margin-bottom: 4px;
  }
  .vw-header-status {
    font-size: 11px;
    color: ${T.muted};
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .vw-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid ${T.border};
    color: ${T.muted};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color .2s, color .2s;
  }
  .vw-close-btn:hover { border-color: ${T.danger}60; color: ${T.danger}; }

  /* ── Messages ── */
  .vw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    z-index: 1;
  }
  .vw-messages::-webkit-scrollbar { width: 3px; }
  .vw-messages::-webkit-scrollbar-track { background: transparent; }
  .vw-messages::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }

  /* ── Message bubbles ── */
  .vw-msg {
    display: flex;
    flex-direction: column;
    max-width: 82%;
  }
  .vw-msg.user   { align-self: flex-end; align-items: flex-end; }
  .vw-msg.assistant { align-self: flex-start; align-items: flex-start; }
  .vw-msg.error  { align-self: center; align-items: center; }

  .vw-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 13px;
    line-height: 1.65;
  }
  .vw-msg.user .vw-bubble {
    background: linear-gradient(135deg, ${T.accent}25, ${T.accent}15);
    border: 1px solid ${T.accent}30;
    color: ${T.text};
    border-bottom-right-radius: 4px;
  }
  .vw-msg.assistant .vw-bubble {
    background: ${T.card};
    border: 1px solid ${T.border};
    color: ${T.text};
    border-bottom-left-radius: 4px;
  }
  .vw-msg.error .vw-bubble {
    background: ${T.danger}10;
    border: 1px solid ${T.danger}30;
    color: ${T.danger};
    font-size: 12px;
    border-radius: 12px;
  }
  .vw-msg-time {
    font-size: 10px;
    color: ${T.muted};
    margin-top: 4px;
    padding: 0 4px;
  }

  /* ── Listening indicator ── */
  .vw-listening {
    display: flex;
    align-items: center;
    gap: 10px;
    align-self: flex-start;
    background: ${T.card};
    border: 1px solid ${T.border};
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    padding: 10px 14px;
  }
  .vw-wave-bar {
    width: 3px;
    border-radius: 3px;
    background: ${T.accent};
    transition: height .1s ease;
  }
  .vw-listening-text {
    font-size: 12px;
    color: ${T.accent};
    font-weight: 600;
    letter-spacing: .04em;
  }

  /* ── Empty state ── */
  .vw-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    gap: 12px;
  }
  .vw-empty-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, ${T.accent}20, ${T.accent}10);
    border: 1px solid ${T.accent}25;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .vw-empty-ring {
    position: absolute;
    inset: -5px;
    border-radius: 22px;
    border: 1.5px solid ${T.accent}20;
    animation: vw-ring 2.5s ease-out infinite;
  }
  .vw-empty-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: ${T.text};
  }
  .vw-empty-desc {
    font-size: 12.5px;
    color: ${T.muted};
    line-height: 1.75;
    max-width: 240px;
  }
  .vw-suggestion {
    background: ${T.card};
    border: 1px solid ${T.border};
    color: ${T.muted};
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .vw-suggestion:hover { border-color: ${T.accent}40; color: ${T.text}; }

  /* ── Controls ── */
  .vw-controls {
    border-top: 1px solid ${T.border};
    padding: 14px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: ${T.card};
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
  .vw-connected-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: ${T.emerald}10;
    border: 1px solid ${T.emerald}25;
    color: ${T.emerald};
    font-size: 11px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: .04em;
  }
  .vw-connected-dot {
    width: 6px;
    height: 6px;
    background: ${T.emerald};
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  /* ── Disclaimer ── */
  .vw-disclaimer {
    padding: 8px 20px 10px;
    text-align: center;
    font-size: 10px;
    color: ${T.muted};
    background: ${T.card};
    border-top: 1px solid ${T.border};
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    letter-spacing: .02em;
  }

  @keyframes pulse {
    0%,100% { opacity:1; }
    50%      { opacity:.4; }
  }

  /* ── Responsive ── */
  @media (max-width: 420px) {
    .vw-panel { width: calc(100vw - 32px); right: -4px; }
  }
`;

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════ */
const VoiceWidget = ({ user }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef          = useRef(null);

  const {
    isConnected, isMuted, isListening,
    transcript, assistantMessage, error, audioLevel,
    startCall, stopCall, toggleMute,
  } = useWebRTC();

  /* Auto scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Transcript → messages */
  useEffect(() => {
    if (!transcript) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.type === 'user' && !last.isFinal) {
        const updated = [...prev];
        updated[updated.length - 1] = { type:'user', text:transcript, isFinal:false, timestamp:new Date() };
        return updated;
      }
      return [...prev, { type:'user', text:transcript, isFinal:false, timestamp:new Date() }];
    });
  }, [transcript]);

  /* Assistant message */
  useEffect(() => {
    if (!assistantMessage) return;
    setMessages(prev => [...prev, { type:'assistant', text:assistantMessage, isFinal:true, timestamp:new Date() }]);
  }, [assistantMessage]);

  /* Errors */
  useEffect(() => {
    if (!error) return;
    setMessages(prev => [...prev, { type:'error', text:error, timestamp:new Date() }]);
  }, [error]);

  const handleCallToggle = () => {
    if (isConnected) { stopCall(); setMessages([]); }
    else startCall();
  };

  const formatTime = d => d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  if (!user) return null;

  const waveHeights = [20, 32, 44, 36, 26, 38, 22, 30, 42, 28];

  

  return (
    <>
      <style>{css}</style>
      <div className="vw-container">

        {/* ── Widget Panel ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="vw-panel"
              initial={{ opacity:0, y:16, scale:.96 }}
              animate={{ opacity:1, y:0,  scale:1   }}
              exit={{    opacity:0, y:16, scale:.96 }}
              transition={{ duration:.22, ease:'easeOut' }}
            >
              {/* Header */}
              <div className="vw-header">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="vw-avatar">
                    <FaUserMd style={{ color:'white', fontSize:17 }} />
                    <div className="vw-status-dot" style={{ background: isConnected ? T.emerald : T.muted }} />
                  </div>
                  <div>
                    <p className="vw-header-name">Sarah</p>
                    <p className="vw-header-status">
                      {isConnected ? (
                        <>
                          <span style={{ width:6, height:6, background:T.emerald, borderRadius:'50%', animation:'pulse 1.5s infinite' }} />
                          Connected
                        </>
                      ) : (
                        <>
                          <span style={{ width:6, height:6, background:T.muted, borderRadius:'50%' }} />
                          Dental Assistant · Ready
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button className="vw-close-btn" onClick={() => setIsOpen(false)}>
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Messages */}
              <div className="vw-messages">

                {/* Empty state */}
                {messages.length === 0 && !isConnected && (
                  <div className="vw-empty">
                    <div className="vw-empty-icon">
                      <FaMicrophoneAlt style={{ color:T.accent, fontSize:22 }} />
                      <div className="vw-empty-ring" />
                    </div>
                    <p className="vw-empty-name">Hi {user?.name?.split(' ')[0]}, I'm Sarah!</p>
                    <p className="vw-empty-desc">
                      Press the microphone to start. I can book appointments, find doctors, or answer dental questions.
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginTop:4 }}>
                      {['"Book an appointment"', '"Find a dentist"', '"Clinic hours?"'].map(s => (
                        <span key={s} className="vw-suggestion">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`vw-msg ${msg.type}`}
                    initial={{ opacity:0, y:8 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:.18 }}
                  >
                    <div className="vw-bubble">{msg.text}</div>
                    <span className="vw-msg-time">{formatTime(msg.timestamp)}</span>
                  </motion.div>
                ))}

                {/* Listening indicator */}
                {isListening && (
                  <motion.div className="vw-listening" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {waveHeights.map((h, i) => (
                        <div key={i} className="vw-wave-bar"
                          style={{ height: `${Math.max(4, Math.min(h, audioLevel * 60))}px` }} />
                      ))}
                    </div>
                    <span className="vw-listening-text">Listening…</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div className="vw-controls">
                <MicButton
                  isActive={isConnected}
                  isMuted={isMuted}
                  onClick={handleCallToggle}
                  onToggleMute={toggleMute}
                />
                {isConnected && (
                  <div className="vw-connected-badge">
                    <span className="vw-connected-dot" />
                    Connected to Sarah
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="vw-disclaimer">
                🦷 Dental emergencies? Call 911 or visit your nearest ER.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAB ──────────────────────────────────────────────────── */}
        <motion.button
          className="vw-fab"
          onClick={() => setIsOpen(p => !p)}
          whileHover={{ scale:1.08 }}
          whileTap={{ scale:.92 }}
        >
          <div className="vw-fab-ring" />
          <AnimatePresence mode="wait">
            {isOpen
              ? <motion.span key="x"  initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:.18}}><FaTimes size={22}/></motion.span>
              : <motion.span key="ch" initial={{rotate:90, opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}} transition={{duration:.18}}><FaComments size={22}/></motion.span>
            }
          </AnimatePresence>

          {/* Unread ping when disconnected */}
          {!isConnected && !isOpen && (
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              style={{ position:'absolute', top:-4, right:-4, width:14, height:14, background:T.emerald, borderRadius:'50%', border:`2px solid ${T.bg}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ width:6, height:6, background:'white', borderRadius:'50%', animation:'pulse 1.5s infinite' }} />
            </motion.div>
          )}
        </motion.button>

      </div>
    </>
  );
};

export default VoiceWidget;