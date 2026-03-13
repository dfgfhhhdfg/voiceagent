import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  FaTooth,
  FaCalendarCheck,
  FaUserMd,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBars,
  FaTimes,
  FaArrowRight,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaMicrophoneAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaHeartbeat,
  FaTeeth,
  FaStethoscope,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Design tokens ──────────────────────────────────────────────────── */
const T = {
  bg: "#080C14",
  surface: "#0D1320",
  card: "#111827",
  border: "#1E2A3A",
  accent: "#fd356d",
  gold: "#C9A84C",
  emerald: "#00E5A0",
  text: "#E8EDF5",
  muted: "#5A6A82",
  danger: "#FF4D6A",
};

const ACCENT_DARK = "#b8184a";

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
    background:linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK});
    color:#fff;
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

  .grad {
    background: linear-gradient(135deg, #fd356d 0%, #ff8c69 45%, #C9A84C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .grad-cool {
    background: linear-gradient(135deg, #00E5A0 0%, #00bfff 60%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

/* ── Helpers ────────────────────────────────────────────────────────── */
const Stars = ({ n = 5 }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <FaStar
        key={i}
        style={{ fontSize: 10, color: i < n ? T.gold : T.border }}
      />
    ))}
  </div>
);

const SPEC_COLORS = {
  "General Dentist": { bg: "#0F1F40", text: "#60A5FA" },
  Orthodontist: { bg: "#1A0F2E", text: "#A78BFA" },
  "Cosmetic Dentist": { bg: "#200F1A", text: "#F472B6" },
  Periodontist: { bg: "#0A2018", text: "#34D399" },
  Endodontist: { bg: "#221000", text: "#FB923C" },
  "Oral Surgeon": { bg: "#200000", text: "#F87171" },
  "Pediatric Dentist": { bg: "#1A1800", text: "#FBBF24" },
  Prosthodontist: { bg: "#001818", text: "#2DD4BF" },
};
const specStyle = (s) => SPEC_COLORS[s] || { bg: T.surface, text: T.muted };

/* ══════════════════════════════════════════════════════════════════════
   UPGRADED 3-D DENTAL HERO CANVAS
   New additions over original:
     1. Central rotating crystal tooth (large LatheGeometry + inner wireframe + pulsing glow)
     2. Upgraded double helix — denser rungs, dual-color strands, smoother curves
     3. Three-layer star field — white / pink / gold at different Z depths & speeds
     4. Aurora sine wave mesh — 8 undulating bands sweeping the deep background
     5. Smoothed mouse parallax (lerped tx/ty → x/y)
     6. Satellite teeth + molecule orbiters (retained & improved from original)
     7. Background cross-section ring (retained)
══════════════════════════════════════════════════════════════════════ */
function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let animId;
    let doCleanup = () => {};

    import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js")
      .then((THREE) => {
        /* ── Renderer ── */
        const W = el.clientWidth,
          H = el.clientHeight;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(W, H);
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 300);
        camera.position.set(0, 0, 32);

        /* ── Smoothed mouse parallax ── */
        const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        const onMouse = (e) => {
          mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
          mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
        };
        window.addEventListener("mousemove", onMouse);

        const ADD = THREE.AdditiveBlending;
        const AC = 0xfd356d,
          EM = 0x00e5a0,
          GD = 0xc9a84c;

        /* ── Sprite texture helper ── */
        const makeSprite = (r, g, b) => {
          const c = document.createElement("canvas");
          c.width = c.height = 64;
          const cx = c.getContext("2d");
          const gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
          gr.addColorStop(0.35, `rgba(${r},${g},${b},0.7)`);
          gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
          cx.fillStyle = gr;
          cx.fillRect(0, 0, 64, 64);
          return new THREE.CanvasTexture(c);
        };
        const spPink = makeSprite(253, 53, 109);
        const spGreen = makeSprite(0, 229, 160); // eslint-disable-line no-unused-vars
        const spGold = makeSprite(201, 168, 76);
        const spWhite = makeSprite(255, 210, 225);

        /* ════════════════════════════════
           1. CENTRAL CRYSTAL TOOTH
        ════════════════════════════════ */
        const toothGroup = new THREE.Group();
        const toothPts = [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.5, 0.05),
          new THREE.Vector2(0.75, 0.35),
          new THREE.Vector2(0.72, 0.75),
          new THREE.Vector2(0.55, 1.1),
          new THREE.Vector2(0.32, 1.38),
          new THREE.Vector2(0, 1.48),
        ];

        /* Outer crown */
        const outerLathe = new THREE.LatheGeometry(toothPts, 16);
        toothGroup.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(outerLathe),
            new THREE.LineBasicMaterial({
              color: AC,
              transparent: true,
              opacity: 0.35,
              blending: ADD,
            }),
          ),
        );

        /* Inner crown (60% scale) */
        const innerPts = toothPts.map((v) => new THREE.Vector2(v.x * 0.6, v.y));
        const innerLathe = new THREE.LatheGeometry(innerPts, 12);
        toothGroup.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(innerLathe),
            new THREE.LineBasicMaterial({
              color: EM,
              transparent: true,
              opacity: 0.2,
              blending: ADD,
            }),
          ),
        );

        /* Root */
        const rootMesh = new THREE.LineSegments(
          new THREE.EdgesGeometry(
            new THREE.CylinderGeometry(0.35, 0.1, 2.0, 10),
          ),
          new THREE.LineBasicMaterial({
            color: EM,
            transparent: true,
            opacity: 0.22,
            blending: ADD,
          }),
        );
        rootMesh.position.y = -1.4;
        toothGroup.add(rootMesh);

        toothGroup.scale.setScalar(2.2);
        toothGroup.position.set(0, -1, 0);
        scene.add(toothGroup);

        /* Pulsing glow point */
        const glowGeo = new THREE.BufferGeometry();
        glowGeo.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
        );
        const glowMesh = new THREE.Points(
          glowGeo,
          new THREE.PointsMaterial({
            size: 13,
            map: spPink,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: ADD,
          }),
        );
        glowMesh.position.set(0, 1, 0);
        scene.add(glowMesh);

        /* ════════════════════════════════
           2. UPGRADED DOUBLE HELIX
        ════════════════════════════════ */
        const makeHelix = (angleOffset, col1, col2, opacity, pos, rotZ) => {
          const g = new THREE.Group();
          const N = 140,
            R = 1.5,
            HEIGHT = 26,
            TURNS = 5;
          const pts1 = [],
            pts2 = [],
            rungPts = [];

          for (let i = 0; i <= N; i++) {
            const t = i / N;
            const a = t * Math.PI * 2 * TURNS + angleOffset;
            const y = t * HEIGHT - HEIGHT / 2;
            pts1.push(new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R));
            pts2.push(
              new THREE.Vector3(
                Math.cos(a + Math.PI) * R,
                y,
                Math.sin(a + Math.PI) * R,
              ),
            );
            if (i % 7 === 0) {
              rungPts.push(
                new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R),
                new THREE.Vector3(
                  Math.cos(a + Math.PI) * R,
                  y,
                  Math.sin(a + Math.PI) * R,
                ),
              );
            }
          }

          g.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts1),
              new THREE.LineBasicMaterial({
                color: col1,
                transparent: true,
                opacity,
                blending: ADD,
              }),
            ),
          );
          g.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts2),
              new THREE.LineBasicMaterial({
                color: col2,
                transparent: true,
                opacity: opacity * 0.7,
                blending: ADD,
              }),
            ),
          );
          g.add(
            new THREE.LineSegments(
              new THREE.BufferGeometry().setFromPoints(rungPts),
              new THREE.LineBasicMaterial({
                color: col1,
                transparent: true,
                opacity: opacity * 0.4,
                blending: ADD,
              }),
            ),
          );

          g.position.copy(pos);
          g.rotation.z = rotZ;
          return g;
        };

        const helixL = makeHelix(
          0,
          AC,
          EM,
          0.22,
          new THREE.Vector3(-22, 0, -16),
          0.18,
        );
        const helixR = makeHelix(
          Math.PI / 3,
          EM,
          GD,
          0.18,
          new THREE.Vector3(20, 0, -20),
          -0.22,
        );
        scene.add(helixL, helixR);

        /* ════════════════════════════════
           3. SATELLITE TEETH
        ════════════════════════════════ */
        const satTeeth = [];
        [
          { x: -18, y: 5, z: -14, s: 1.3 },
          { x: 16, y: -4, z: -17, s: 1.7 },
          { x: -9, y: -9, z: -9, s: 0.85 },
          { x: 22, y: 8, z: -22, s: 2.0 },
          { x: -3, y: 13, z: -19, s: 1.0 },
          { x: 11, y: -13, z: -11, s: 0.7 },
        ].forEach((cfg) => {
          const g = new THREE.Group();
          g.add(
            new THREE.LineSegments(
              new THREE.EdgesGeometry(new THREE.LatheGeometry(toothPts, 10)),
              new THREE.LineBasicMaterial({
                color: AC,
                transparent: true,
                opacity: 0.18,
                blending: ADD,
              }),
            ),
          );
          const rt = new THREE.LineSegments(
            new THREE.EdgesGeometry(
              new THREE.CylinderGeometry(
                0.18 * cfg.s,
                0.06 * cfg.s,
                0.9 * cfg.s,
                8,
              ),
            ),
            new THREE.LineBasicMaterial({
              color: EM,
              transparent: true,
              opacity: 0.12,
              blending: ADD,
            }),
          );
          rt.position.y = -0.6 * cfg.s;
          g.add(rt);
          g.scale.setScalar(cfg.s);
          g.position.set(cfg.x, cfg.y, cfg.z);
          g.userData = {
            baseY: cfg.y,
            fp: 0.3 + Math.random() * 0.4,
            fa: 0.5 + Math.random() * 0.7,
            ph: Math.random() * Math.PI * 2,
            rs: (Math.random() - 0.5) * 0.003,
          };
          scene.add(g);
          satTeeth.push(g);
        });

        /* ════════════════════════════════
           4. MOLECULE ORBITERS
        ════════════════════════════════ */
        const mols = [];
        [
          [-14, 4, -6, AC],
          [14, -5, -5, EM],
          [2, 9, -10, GD],
          [-6, -9, -8, AC],
          [18, 8, -12, EM],
        ].forEach(([x, y, z, col]) => {
          const m = new THREE.Group();
          m.add(
            new THREE.LineSegments(
              new THREE.EdgesGeometry(new THREE.SphereGeometry(0.28, 10, 10)),
              new THREE.LineBasicMaterial({
                color: col,
                transparent: true,
                opacity: 0.5,
                blending: ADD,
              }),
            ),
          );
          const orbR = 0.9 + Math.random() * 0.5;
          const torus = new THREE.Mesh(
            new THREE.TorusGeometry(orbR, 0.025, 6, 48),
            new THREE.MeshBasicMaterial({
              color: col,
              transparent: true,
              opacity: 0.12,
              blending: ADD,
            }),
          );
          torus.rotation.x = Math.PI / 2;
          m.add(torus);

          const elecs = [0, 1, 2].map((k) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute(
              "position",
              new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
            );
            const pt = new THREE.Points(
              geo,
              new THREE.PointsMaterial({
                size: 0.2,
                map: spPink,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                blending: ADD,
                color: col,
              }),
            );
            m.add(pt);
            return { mesh: pt, phase: (k / 3) * Math.PI * 2, r: orbR };
          });

          m.position.set(x, y, z);
          m.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          );
          m.userData = {
            rs: new THREE.Vector3(
              (Math.random() - 0.5) * 0.006,
              (Math.random() - 0.5) * 0.008,
              (Math.random() - 0.5) * 0.004,
            ),
            baseY: y,
            fp: 0.35 + Math.random() * 0.3,
            fa: 0.4 + Math.random() * 0.5,
            fo: Math.random() * Math.PI * 2,
            es: 0.8 + Math.random() * 0.6,
            elecs,
          };
          scene.add(m);
          mols.push(m);
        });

        /* ════════════════════════════════
           5. THREE-LAYER STAR FIELD
        ════════════════════════════════ */
        const makeStarLayer = (
          count,
          spread,
          size,
          colHex,
          spriteMap,
          opacity,
        ) => {
          const pos = new Float32Array(count * 3);
          const vel = [];
          for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * spread;
            pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 15;
            vel.push({
              vx: (Math.random() - 0.5) * 0.007,
              vy: (Math.random() - 0.5) * 0.005,
            });
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          const mat = new THREE.PointsMaterial({
            size,
            map: spriteMap,
            color: colHex,
            transparent: true,
            opacity,
            depthWrite: false,
            blending: ADD,
          });
          return {
            pts: new THREE.Points(geo, mat),
            geo,
            vel,
            mat,
            count,
            spread,
          };
        };

        const starLayers = [
          makeStarLayer(220, 80, 0.12, 0xffe0eb, spWhite, 0.45),
          makeStarLayer(80, 60, 0.22, 0xfd356d, spPink, 0.3),
          makeStarLayer(40, 50, 0.35, 0xc9a84c, spGold, 0.35),
        ];
        starLayers.forEach((l) => scene.add(l.pts));

        /* ════════════════════════════════
           6. AURORA SINE WAVE MESH
        ════════════════════════════════ */
        const auroraLines = [];
        for (let band = 0; band < 8; band++) {
          const pts = [];
          for (let i = 0; i <= 120; i++) {
            pts.push(
              new THREE.Vector3((i / 120) * 60 - 30, 0, -30 - band * 0.5),
            );
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const col = band < 3 ? AC : band < 6 ? EM : GD;
          const line = new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({
              color: col,
              transparent: true,
              opacity: 0.02 + band * 0.005,
              blending: ADD,
            }),
          );
          auroraLines.push(line);
          scene.add(line);
        }

        /* ════════════════════════════════
           7. BACKGROUND CROSS-SECTION RING
        ════════════════════════════════ */
        const outerRing = new THREE.Mesh(
          new THREE.TorusGeometry(14, 0.06, 8, 120),
          new THREE.MeshBasicMaterial({
            color: AC,
            transparent: true,
            opacity: 0.04,
            blending: ADD,
          }),
        );
        const innerRing = new THREE.Mesh(
          new THREE.TorusGeometry(8, 0.04, 8, 100),
          new THREE.MeshBasicMaterial({
            color: EM,
            transparent: true,
            opacity: 0.05,
            blending: ADD,
          }),
        );
        [outerRing, innerRing].forEach((r) => r.position.set(6, -2, -22));
        scene.add(outerRing, innerRing);

        const radPts = [];
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          radPts.push(
            new THREE.Vector3(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0),
            new THREE.Vector3(Math.cos(a) * 13.8, Math.sin(a) * 13.8, 0),
          );
        }
        const radLines = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(radPts),
          new THREE.LineBasicMaterial({
            color: AC,
            transparent: true,
            opacity: 0.025,
            blending: ADD,
          }),
        );
        radLines.position.set(6, -2, -22);
        scene.add(radLines);

        /* ── Resize ── */
        const onResize = () => {
          const nW = el.clientWidth,
            nH = el.clientHeight;
          camera.aspect = nW / nH;
          camera.updateProjectionMatrix();
          renderer.setSize(nW, nH);
        };
        window.addEventListener("resize", onResize);

        /* ── Animation loop ── */
        let tick = 0;
        const loop = () => {
          animId = requestAnimationFrame(loop);
          tick += 0.007;

          /* Smooth mouse lerp */
          mouse.x += (mouse.tx - mouse.x) * 0.04;
          mouse.y += (mouse.ty - mouse.y) * 0.04;

          /* Central tooth */
          toothGroup.rotation.y = tick * 0.12;
          toothGroup.rotation.x = Math.sin(tick * 0.3) * 0.08;
          glowMesh.material.opacity = 0.15 + 0.12 * Math.sin(tick * 1.5);

          /* Helixes */
          helixL.rotation.y = tick * 0.08;
          helixR.rotation.y = -tick * 0.06;

          /* Satellite teeth */
          satTeeth.forEach((t) => {
            const d = t.userData;
            t.position.y = d.baseY + Math.sin(tick * d.fp + d.ph) * d.fa;
            t.rotation.y += d.rs;
          });

          /* Molecules */
          mols.forEach((m) => {
            const d = m.userData;
            m.rotation.x += d.rs.x;
            m.rotation.y += d.rs.y;
            m.rotation.z += d.rs.z;
            m.position.y = d.baseY + Math.sin(tick * d.fp + d.fo) * d.fa;
            d.elecs.forEach((e) => {
              const a = tick * d.es + e.phase;
              const p = e.mesh.geometry.attributes.position;
              p.array[0] = Math.cos(a) * e.r;
              p.array[2] = Math.sin(a) * e.r;
              p.needsUpdate = true;
            });
          });

          /* Star layers drift + wrap */
          starLayers.forEach((l, li) => {
            const pos = l.geo.attributes.position;
            const spd = 0.6 + li * 0.3;
            for (let i = 0; i < l.count; i++) {
              pos.array[i * 3] += l.vel[i].vx * spd;
              pos.array[i * 3 + 1] += l.vel[i].vy * spd;
              if (pos.array[i * 3] > l.spread / 2)
                pos.array[i * 3] = -l.spread / 2;
              if (pos.array[i * 3] < -l.spread / 2)
                pos.array[i * 3] = l.spread / 2;
              if (pos.array[i * 3 + 1] > l.spread * 0.3)
                pos.array[i * 3 + 1] = -l.spread * 0.3;
              if (pos.array[i * 3 + 1] < -l.spread * 0.3)
                pos.array[i * 3 + 1] = l.spread * 0.3;
            }
            pos.needsUpdate = true;
            l.mat.opacity =
              (li === 0 ? 0.38 : li === 1 ? 0.28 : 0.32) +
              0.1 * Math.sin(tick * (0.9 + li * 0.4));
          });

          /* Aurora waves animate */
          auroraLines.forEach((line, band) => {
            const pos = line.geometry.attributes.position;
            const freq = 0.15 + band * 0.03;
            for (let i = 0; i <= 120; i++) {
              const x = (i / 120) * 60 - 30;
              pos.setY(
                i,
                Math.sin(x * freq + tick * 0.4 + band * 0.8) * 2.5 +
                  Math.sin(x * freq * 0.5 + tick * 0.25) * 1.2 +
                  (band - 4) * 3.5,
              );
            }
            pos.needsUpdate = true;
          });

          /* Background rings */
          outerRing.rotation.z = tick * 0.025;
          innerRing.rotation.z = -tick * 0.035;
          radLines.rotation.z = tick * 0.018;

          /* Camera parallax */
          camera.position.x += (mouse.x * 3.5 - camera.position.x) * 0.025;
          camera.position.y += (-mouse.y * 2.5 - camera.position.y) * 0.025;
          camera.lookAt(scene.position);

          renderer.render(scene, camera);
        };
        loop();

        doCleanup = () => {
          cancelAnimationFrame(animId);
          window.removeEventListener("mousemove", onMouse);
          window.removeEventListener("resize", onResize);
          renderer.dispose();
          if (el.contains(renderer.domElement))
            el.removeChild(renderer.domElement);
        };
      })
      .catch((err) => console.warn("Three.js failed to load:", err));

    return () => doCleanup();
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════ */
function LandingPage({ onLogin, onRegister, onDoctorLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const services = [
    {
      icon: <FaTeeth />,
      title: "General Dentistry",
      desc: "Thorough check-ups, precision fillings, and preventive care that protects your teeth for life.",
    },
    {
      icon: <FaTooth />,
      title: "Cosmetic Dentistry",
      desc: "Porcelain veneers, professional whitening, and full smile redesigns by certified aesthetic experts.",
    },
    {
      icon: <FaStethoscope />,
      title: "Orthodontics",
      desc: "Invisible aligners and modern braces, custom-mapped to your bite and designed to fit your life.",
    },
    {
      icon: <FaHeartbeat />,
      title: "Oral Surgery",
      desc: "Dental implants, wisdom extractions, and corrective jaw procedures delivered with surgical precision.",
    },
    {
      icon: <FaMicrophoneAlt />,
      title: "AI Booking — Sarah",
      desc: "Skip the phone queue. Sarah is live 24/7 to confirm appointments, answer questions, and handle reschedules.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Emergency Care",
      desc: "Dedicated same-day slots for acute pain, trauma, and urgent dental emergencies — no waiting.",
    },
  ];

  const steps = [
    {
      n: "01",
      title: "Create your account",
      desc: "Sign up in under 60 seconds — just your name, email, and a password. No paperwork.",
    },
    {
      n: "02",
      title: "Talk to Sarah",
      desc: "Open the voice widget and speak naturally. Sarah understands what you need and handles the rest.",
    },
    {
      n: "03",
      title: "You're confirmed",
      desc: "A confirmation hits your inbox the moment Sarah locks in your slot. Zero back-and-forth.",
    },
  ];

  const testimonials = [
    {
      name: "Priya M.",
      rating: 5,
      treat: "Smile Design",
      text: "I booked at 11 PM and had a confirmation before midnight. The whole experience felt premium from the very first interaction.",
    },
    {
      name: "James T.",
      rating: 5,
      treat: "Orthodontics",
      text: "Sarah handled everything without me lifting a finger. No hold music, no confusion — just a confirmed appointment and a great result.",
    },
    {
      name: "Ananya S.",
      rating: 5,
      treat: "Teeth Whitening",
      text: "This doesn't feel like a typical dentist. It feels like a luxury brand that happens to do dentistry. Sarah is incredible.",
    },
    {
      name: "Rahul D.",
      rating: 4,
      treat: "General Check-up",
      text: "Seamless from booking to chair. The AI assistant had my history ready and the team was prepared. No wasted time.",
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Space Grotesk',sans-serif",
        background: T.bg,
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <div className="noise" />
      <div className="grid-bg" />

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          width: "calc(100% - 48px)",
          maxWidth: 1200,
          background: scrolled ? `${T.surface}CC` : "transparent",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${T.border}80`,
          borderRadius: 20,
          transition: "all .4s",
        }}
      >
        <div
          style={{
            padding: "0 32px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: `linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK})`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <FaTooth style={{ color: "white", fontSize: 16 }} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
                className="grad"
              >
                SmileCare
              </p>
              <p
                style={{
                  color: T.accent,
                  fontSize: 9,
                  letterSpacing: ".22em",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                DENTAL CLINIC
              </p>
            </div>
          </div>

          {/* Desktop links */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 36 }}
            className="hidden md:flex"
          >
            {["Services", "How It Works", "Testimonials", "Contact"].map(
              (l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{
                    color: T.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color .2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = T.text)}
                  onMouseLeave={(e) => (e.target.style.color = T.muted)}
                >
                  {l}
                </a>
              ),
            )}
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: 10 }}
            className="hidden md:flex"
          >
            <button
              onClick={onDoctorLogin}
              className="btn-ghost"
              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13 }}
            >
              Doctor Portal
            </button>
            <button
              onClick={onLogin}
              className="btn-ghost"
              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13 }}
            >
              Sign In
            </button>
            <button
              onClick={onRegister}
              className="btn-primary"
              style={{ padding: "10px 22px", borderRadius: 12, fontSize: 13 }}
            >
              Get Started →
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen((m) => !m)}
            style={{
              background: "none",
              border: "none",
              color: T.text,
              cursor: "pointer",
            }}
          >
            {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: T.surface,
                borderTop: `1px solid ${T.border}`,
                padding: "20px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                borderRadius: "0 0 20px 20px",
              }}
            >
              {["Services", "How It Works", "Testimonials", "Contact"].map(
                (l) => (
                  <a
                    key={l}
                    href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{
                      color: T.muted,
                      fontSize: 15,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l}
                  </a>
                ),
              )}
              <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                <button
                  onClick={onLogin}
                  className="btn-ghost"
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={onRegister}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          paddingTop: 100,
          overflow: "hidden",
        }}
      >
        {/* Upgraded 3-D dental scene */}
        <HeroCanvas />

        {/* Radial vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: `radial-gradient(ellipse 85% 65% at 50% 50%, transparent 20%, ${T.bg}BB 100%)`,
          }}
        />

        <motion.div
          style={{ y: heroY, position: "relative", zIndex: 2, width: "100%" }}
          className="w-full"
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "80px 32px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 80,
              alignItems: "center",
            }}
          >
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
            >
              <div className="tag" style={{ marginBottom: 28 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: T.accent,
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                />
                Next-Gen Dental Experience
              </div>

              <h1
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: "clamp(44px,5vw,72px)",
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: "-2px",
                  marginBottom: 24,
                }}
              >
                <span className="grad">Your Perfect</span>
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #E8EDF5 40%, #a0b4cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-1px",
                  }}
                >
                  Smile Starts Here.
                </span>
              </h1>

              <p
                style={{
                  color: T.muted,
                  fontSize: 17,
                  lineHeight: 1.9,
                  maxWidth: 460,
                  marginBottom: 40,
                }}
              >
                Meet <strong style={{ color: T.text }}>Sarah</strong> — your
                always-on AI dental concierge. She books appointments, answers
                your questions, and connects you with elite specialists, all
                through natural conversation.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  marginBottom: 56,
                }}
              >
                <button
                  onClick={onRegister}
                  className="btn-primary"
                  style={{
                    padding: "15px 34px",
                    borderRadius: 14,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Book a Consultation <FaArrowRight style={{ fontSize: 11 }} />
                </button>
                <button
                  onClick={onLogin}
                  className="btn-ghost"
                  style={{
                    padding: "15px 34px",
                    borderRadius: 14,
                    fontSize: 15,
                  }}
                >
                  Sign In
                </button>
              </div>

              <div
                style={{
                  borderTop: `1px solid ${T.border}`,
                  paddingTop: 36,
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 24,
                }}
              ></div>
            </motion.div>

            {/* Sarah card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="float"
              style={{ justifySelf: "center", width: "100%", maxWidth: 360 }}
            >
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 32,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius: 24,
                    pointerEvents: "none",
                  }}
                >
                  <div className="scan-line" />
                </div>

                {/* Live badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: `${T.emerald}15`,
                    border: `1px solid ${T.emerald}30`,
                    borderRadius: 20,
                    padding: "5px 12px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: T.emerald,
                      borderRadius: "50%",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <span
                    style={{
                      color: T.emerald,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                    }}
                  >
                    LIVE
                  </span>
                </div>

                {/* Avatar */}
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: `linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK})`,
                      borderRadius: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaMicrophoneAlt style={{ color: "white", fontSize: 24 }} />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: 22,
                    }}
                  >
                    <div className="pulse-ring" />
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                  className="grad"
                >
                  Hi, I'm Sarah
                </p>
                <p style={{ color: T.muted, fontSize: 13, marginBottom: 24 }}>
                  Your AI-Powered Dental Concierge
                </p>

                <div
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    marginBottom: 20,
                  }}
                >
                  {[
                    "Book, reschedule & cancel visits",
                    "Instant dental Q&A, any hour",
                    "Matches you with the right specialist",
                    "Email confirmation in seconds",
                  ].map((txt, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: i < 3 ? 11 : 0,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          background: `${T.accent}15`,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FaCheckCircle
                          style={{ color: T.accent, fontSize: 8 }}
                        />
                      </div>
                      <span style={{ color: T.muted, fontSize: 12.5 }}>
                        {txt}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Voice wave */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    marginBottom: 20,
                  }}
                >
                  {[
                    0.3, 0.5, 0.8, 1, 0.7, 0.9, 0.5, 0.4, 0.6, 0.3, 0.7, 0.45,
                  ].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3,
                        height: h * 30,
                        background: `linear-gradient(to top, ${T.accent}50, ${T.accent})`,
                        borderRadius: 3,
                        animation: `float ${1.5 + i * 0.1}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                  <span
                    style={{
                      color: T.accent,
                      fontSize: 11,
                      marginLeft: 10,
                      fontWeight: 600,
                    }}
                  >
                    Listening…
                  </span>
                </div>

                <button
                  onClick={onRegister}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    borderRadius: 14,
                    fontSize: 14,
                  }}
                >
                  Talk to Sarah →
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            color: T.muted,
            animation: "float 2s infinite",
            zIndex: 3,
          }}
        >
          <FaChevronDown />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section
        id="services"
        style={{ padding: "100px 0", position: "relative", zIndex: 1 }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 56 }}
          >
            <div className="tag" style={{ marginBottom: 16 }}>
              Our Expertise
            </div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: "clamp(30px,4vw,48px)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-1px",
              }}
            >
              <span style={{ color: T.text }}>World-class care,</span>
              <br />
              <span className="grad">built around your smile.</span>
            </h2>
          </motion.div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
              gap: 18,
            }}
          >
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card"
                style={{ padding: 28, cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: `${T.accent}10`,
                    border: `1px solid ${T.accent}20`,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <span style={{ color: T.accent, fontSize: 18 }}>
                    {s.icon}
                  </span>
                </div>
                <h3
                  style={{
                    color: T.text,
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.8 }}>
                  {s.desc}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: T.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 18,
                  }}
                >
                  Learn more <FaArrowRight style={{ fontSize: 9 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        style={{
          padding: "100px 0",
          background: T.surface,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div className="tag" style={{ marginBottom: 16 }}>
              Simple Process
            </div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: "clamp(28px,4vw,46px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              <span style={{ color: T.text }}>Confirmed appointment.</span>
              <br />
              <span className="grad-cool">Just three steps away.</span>
            </h2>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 32,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 44,
                left: "17%",
                right: "17%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${T.accent}40, transparent)`,
              }}
            />
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: "center" }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    background:
                      i === 1
                        ? `linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK})`
                        : T.card,
                    border: `1px solid ${i === 1 ? T.accent : T.border}`,
                    borderRadius: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: i === 1 ? `0 0 40px ${T.accent}30` : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      color: i === 1 ? "#fff" : T.accent,
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {s.n}
                  </span>
                </div>
                <h3
                  style={{
                    color: T.text,
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.8 }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginTop: 56 }}
          >
            <button
              onClick={onRegister}
              className="btn-primary"
              style={{
                padding: "15px 44px",
                borderRadius: 14,
                fontSize: 15,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Create your free account <FaArrowRight style={{ fontSize: 11 }} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        id="testimonials"
        style={{ padding: "100px 0", position: "relative", zIndex: 1 }}
      >
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            background: `${T.accent}06`,
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 48 }}
          >
            <div className="tag" style={{ marginBottom: 16 }}>
              Patient Stories
            </div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: "clamp(28px,4vw,46px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              <span style={{ color: T.text }}>Real patients.</span>
              <br />
              <span className="grad">Real transformations.</span>
            </h2>
          </motion.div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 16,
            }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card"
                style={{ padding: 26 }}
              >
                <Stars n={t.rating} />
                <p
                  style={{
                    color: T.muted,
                    fontSize: 13.5,
                    lineHeight: 1.85,
                    margin: "14px 0 18px",
                  }}
                >
                  "{t.text}"
                </p>
                <div
                  style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}
                >
                  <p style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>
                    {t.name}
                  </p>
                  <p style={{ color: T.accent, fontSize: 12, marginTop: 4 }}>
                    {t.treat}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCTOR CTA ── */}
      <section style={{ padding: "72px 0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 24,
              padding: "44px 48px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="glow-orb"
              style={{
                width: 400,
                height: 400,
                background: `${T.accent}06`,
                top: -200,
                right: -100,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: `${T.accent}10`,
                  border: `1px solid ${T.accent}20`,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FaUserMd style={{ color: T.accent, fontSize: 26 }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                  className="grad-cool"
                >
                  Are you a dental professional?
                </h3>
                <p
                  style={{
                    color: T.muted,
                    fontSize: 14,
                    maxWidth: 500,
                    lineHeight: 1.8,
                  }}
                >
                  Join SmileCare's network of elite practitioners. Set your
                  availability once and let Sarah fill your schedule with
                  pre-qualified, ready-to-book patients — automatically.
                </p>
              </div>
              <button
                onClick={onDoctorLogin}
                className="btn-primary"
                style={{
                  padding: "13px 28px",
                  borderRadius: 14,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Doctor Portal →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section
        id="contact"
        style={{
          padding: "100px 0",
          background: T.surface,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderTop: `1px solid ${T.border}`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "start",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="tag" style={{ marginBottom: 16 }}>
              Contact
            </div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: "clamp(26px,3.5vw,40px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
                marginBottom: 36,
              }}
            >
              <span style={{ color: T.text }}>Ready to transform</span>
              <br />
              <span className="grad">your smile today?</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  icon: <FaPhone />,
                  label: "Call us",
                  val: "+1 (555) 123-4567",
                },
                {
                  icon: <FaEnvelope />,
                  label: "Email",
                  val: "hello@smilecaredental.com",
                },
                {
                  icon: <FaMapMarkerAlt />,
                  label: "Visit us",
                  val: "123 Dental Ave, Suite 100",
                },
                {
                  icon: <FaClock />,
                  label: "Open hours",
                  val: "Mon–Fri 9–6 · Sat 10–4",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: `${T.accent}10`,
                      border: `1px solid ${T.accent}20`,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: T.accent, fontSize: 14 }}>
                      {c.icon}
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        color: T.muted,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      style={{
                        color: T.text,
                        fontSize: 14,
                        fontWeight: 500,
                        marginTop: 3,
                      }}
                    >
                      {c.val}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 22,
              padding: 32,
            }}
          >
            <h3
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 22,
              }}
              className="grad"
            >
              Send us a message
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Your full name" />
              <input type="email" placeholder="Email address" />
              <input type="tel" placeholder="Phone number" />
              <textarea
                rows={4}
                placeholder="Your message…"
                style={{ resize: "none" }}
              />
              <button
                className="btn-primary"
                style={{
                  padding: "14px 0",
                  borderRadius: 12,
                  fontSize: 14,
                  width: "100%",
                }}
              >
                Send Message
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          padding: "40px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: `linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK})`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTooth style={{ color: "white", fontSize: 13 }} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                }}
                className="grad"
              >
                SmileCare Dental
              </p>
              <p style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>
          <p style={{ color: T.muted, fontSize: 12 }}>
            Powered by Sarah AI · The world's smartest dental concierge
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[FaFacebook, FaInstagram, FaWhatsapp].map((Icon, i) => (
              <button
                key={i}
                className="btn-ghost"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Icon style={{ color: T.muted, fontSize: 13 }} />
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
  const [doctors, setDoctors] = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setDocLoading(true);
    setDocError("");
    try {
      const data = await (await fetch(`${API}/api/doctors`)).json();
      if (data.success) setDoctors(data.doctors || []);
      else setDocError("Could not load doctors.");
    } catch {
      setDocError("Could not connect to server.");
    } finally {
      setDocLoading(false);
    }
  };

  const specs = [
    "All",
    ...Array.from(
      new Set(doctors.map((d) => d.specialization).filter(Boolean)),
    ),
  ];
  const filtered =
    filter === "All"
      ? doctors
      : doctors.filter((d) => d.specialization === filter);
  const role = user?.role || "patient";
  const initial = user?.name?.charAt(0).toUpperCase() || "?";
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <div
      style={{
        fontFamily: "'Space Grotesk',sans-serif",
        background: T.bg,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div className="noise" />
      <div className="grid-bg" />

      {/* NAV */}
      <nav
        style={{
          background: `${T.surface}E0`,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: `linear-gradient(135deg, ${T.accent}, ${ACCENT_DARK})`,
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTooth style={{ color: "white", fontSize: 15 }} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 17,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
                className="grad"
              >
                SmileCare
              </p>
              <p
                style={{
                  color: T.accent,
                  fontSize: 9,
                  letterSpacing: ".2em",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                DENTAL
              </p>
            </div>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: 10 }}
            className="hidden md:flex"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "8px 14px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background:
                    role === "doctor"
                      ? `linear-gradient(135deg,#059669,#0D9488)`
                      : `linear-gradient(135deg,${T.accent},${ACCENT_DARK})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {initial}
              </div>
              <div>
                <p
                  style={{
                    color: T.text,
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: 1,
                  }}
                >
                  {user?.name}
                </p>
                <p
                  style={{
                    color: role === "doctor" ? T.emerald : T.accent,
                    fontSize: 10,
                    marginTop: 3,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {role}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 12,
                fontSize: 13,
              }}
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen((m) => !m)}
            style={{
              background: "none",
              border: "none",
              color: T.text,
              cursor: "pointer",
            }}
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: T.surface,
                borderTop: `1px solid ${T.border}`,
                padding: "16px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `linear-gradient(135deg,${T.accent},${ACCENT_DARK})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {initial}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: T.text }}>
                    {user?.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      textTransform: "capitalize",
                    }}
                  >
                    {role}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  color: T.danger,
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 22,
            padding: "36px 40px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="glow-orb"
            style={{
              width: 400,
              height: 400,
              background: `${T.accent}08`,
              top: -200,
              right: -100,
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>
              {greeting()},
            </p>
            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                marginBottom: 8,
              }}
            >
              <span className="grad">
                Welcome back, {user?.name?.split(" ")[0]}.
              </span>{" "}
              <span style={{ color: T.text }}>👋</span>
            </h1>
            <p
              style={{
                color: T.muted,
                fontSize: 14,
                maxWidth: 480,
                lineHeight: 1.8,
              }}
            >
              Sarah is live and ready. Use the chat widget in the bottom-right
              to book, reschedule, or get instant answers to any dental
              question.
            </p>
          </div>
        </motion.div>

        {/* Sarah card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 22,
            padding: "28px 32px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 64,
                height: 64,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: `linear-gradient(135deg,${T.accent},${ACCENT_DARK})`,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaMicrophoneAlt style={{ color: "white", fontSize: 24 }} />
              </div>
              <div
                style={{ position: "absolute", inset: -5, borderRadius: 22 }}
              >
                <div className="pulse-ring" />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                  className="grad"
                >
                  Talk to Sarah
                </h2>
                <span
                  style={{
                    background: `${T.emerald}15`,
                    color: T.emerald,
                    border: `1px solid ${T.emerald}30`,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 20,
                    letterSpacing: ".1em",
                  }}
                >
                  LIVE
                </span>
              </div>
              <p
                style={{
                  color: T.muted,
                  fontSize: 13.5,
                  lineHeight: 1.8,
                  maxWidth: 460,
                  marginBottom: 14,
                }}
              >
                Ask Sarah to book, reschedule, or cancel appointments — check
                availability, get dental advice, or find the right specialist.
                All hands-free, all instant.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  '"Schedule a cleaning"',
                  '"Find an implant specialist"',
                  '"My tooth hurts"',
                  '"Cancel my Friday slot"',
                ].map((s) => (
                  <span
                    key={s}
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      color: T.muted,
                      fontSize: 11.5,
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
              }}
            >
              {[0.3, 0.55, 0.88, 0.7, 0.45, 0.82, 0.38, 0.6, 0.42, 0.25].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: h * 38,
                      background: `linear-gradient(to top, ${T.accent}40, ${T.accent})`,
                      borderRadius: 3,
                      animation: `float ${1.8 + i * 0.1}s ease-in-out infinite`,
                    }}
                  />
                ),
              )}
            </div>
          </div>
          <p
            style={{
              color: T.muted,
              fontSize: 12,
              marginTop: 20,
              paddingTop: 18,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            💡 Tap the chat bubble in the bottom-right corner to open Sarah —
            she's always on.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[
            {
              icon: <FaUserMd />,
              label: "Specialists",
              value: doctors.length || "–",
              color: T.accent,
            },
            {
              icon: <FaCalendarCheck />,
              label: "Appointments",
              value: "24/7",
              color: T.emerald,
            },
            {
              icon: <FaMicrophoneAlt />,
              label: "AI Assistant",
              value: "Live",
              color: "#A78BFA",
            },
            {
              icon: <FaStar />,
              label: "Patient Rating",
              value: "4.9★",
              color: T.gold,
            },
          ].map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  background: `${s.color}12`,
                  border: `1px solid ${s.color}20`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    color: T.text,
                    fontSize: 22,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ color: T.muted, fontSize: 11, marginTop: 5 }}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Doctors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                }}
                className="grad-cool"
              >
                Our Specialists
              </h2>
              <p style={{ color: T.muted, fontSize: 12.5, marginTop: 4 }}>
                {docLoading
                  ? "Loading…"
                  : `${filtered.length} specialist${filtered.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
            {specs.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {specs.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1.5px solid ${filter === s ? T.accent : T.border}`,
                      background:
                        filter === s ? `${T.accent}15` : "transparent",
                      color: filter === s ? T.accent : T.muted,
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {docLoading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 16,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="card"
                  style={{ padding: 22, animation: "pulse 1.5s infinite" }}
                >
                  <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        background: T.border,
                        borderRadius: 14,
                      }}
                    />
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div
                        style={{
                          height: 13,
                          background: T.border,
                          borderRadius: 6,
                          width: "70%",
                          marginBottom: 8,
                        }}
                      />
                      <div
                        style={{
                          height: 11,
                          background: T.border,
                          borderRadius: 6,
                          width: "45%",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      height: 11,
                      background: T.border,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 11,
                      background: T.border,
                      borderRadius: 6,
                      width: "80%",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {docError && !docLoading && (
            <div
              style={{
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}30`,
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
              }}
            >
              <p style={{ color: T.danger, fontSize: 14, marginBottom: 12 }}>
                {docError}
              </p>
              <button
                onClick={fetchDoctors}
                className="btn-primary"
                style={{ padding: "8px 24px", borderRadius: 10, fontSize: 13 }}
              >
                Retry
              </button>
            </div>
          )}

          {!docLoading && !docError && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                gap: 16,
              }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1/-1",
                    textAlign: "center",
                    padding: "60px 0",
                  }}
                >
                  <FaUserMd
                    style={{
                      fontSize: 40,
                      color: T.border,
                      margin: "0 auto 12px",
                      display: "block",
                    }}
                  />
                  <p style={{ color: T.muted }}>
                    No doctors found for this filter.
                  </p>
                </div>
              ) : (
                filtered.map((doc, i) => {
                  const name = doc.name || "Doctor";
                  const last = name
                    .replace(/^Dr\.?\s*/i, "")
                    .split(" ")
                    .slice(-1)[0];
                  const sc = specStyle(doc.specialization);
                  return (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="card"
                      style={{ padding: 22 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          marginBottom: 14,
                        }}
                      >
                        {doc.photo ? (
                          <img
                            src={doc.photo}
                            alt={name}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 14,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 54,
                              height: 54,
                              background: `linear-gradient(135deg,${T.accent}20,${T.accent}10)`,
                              border: `1px solid ${T.accent}20`,
                              borderRadius: 14,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: T.accent,
                              fontWeight: 800,
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3
                            style={{
                              color: T.text,
                              fontFamily: "'Syne',sans-serif",
                              fontWeight: 700,
                              fontSize: 15,
                              marginBottom: 6,
                            }}
                          >
                            {name}
                          </h3>
                          <span
                            className="spec-badge"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {doc.specialization}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 7,
                          fontSize: 12.5,
                          color: T.muted,
                          marginBottom: 12,
                        }}
                      >
                        {doc.qualification && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <FaCheckCircle
                              style={{
                                color: T.emerald,
                                fontSize: 10,
                                flexShrink: 0,
                              }}
                            />
                            {doc.qualification}
                          </span>
                        )}
                        {doc.experience > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <FaClock
                              style={{
                                color: T.gold,
                                fontSize: 10,
                                flexShrink: 0,
                              }}
                            />
                            {doc.experience} years experience
                          </span>
                        )}
                        {doc.availableDays?.length > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <FaCalendarCheck
                              style={{
                                color: T.accent,
                                fontSize: 10,
                                flexShrink: 0,
                              }}
                            />
                            {doc.availableDays
                              .slice(0, 3)
                              .map((d) => d.slice(0, 3))
                              .join(", ")}
                            {doc.availableDays.length > 3 &&
                              ` +${doc.availableDays.length - 3}`}
                          </span>
                        )}
                      </div>

                      {doc.bio && (
                        <p
                          style={{
                            fontSize: 12,
                            color: T.muted,
                            lineHeight: 1.7,
                            marginBottom: 14,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {doc.bio}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stars n={5} />
                        <button
                          className="btn-primary"
                          style={{
                            padding: "7px 16px",
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                        >
                          Book — Dr. {last}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
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
export default function HomePage({
  user,
  onLogin,
  onRegister,
  onDoctorLogin,
  onLogout,
}) {
  return (
    <>
      <style>{css}</style>
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard user={user} onLogout={onLogout} />
          </motion.div>
        ) : (
          <motion.div
            key="land"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage
              onLogin={onLogin}
              onRegister={onRegister}
              onDoctorLogin={onDoctorLogin}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
