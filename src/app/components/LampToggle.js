'use client';
import { useTheme } from './ThemeProvider';
import { useRef, useEffect, useCallback } from 'react';

// ── Physics constants ──────────────────────────────────────────────────────
const NATURAL   = 52;    // px — resting cord length
const K_S       = 420;   // stretch spring stiffness
const D_S       = 9.5;   // stretch damping
const K_W       = 260;   // wobble (transverse) spring stiffness
const D_W       = 4.2;   // wobble damping
const COUPLING  = 0.42;  // energy fraction transferred stretch→wobble on snap
const REST      = 0.18;  // settle threshold

// ── Bulb SVG ──────────────────────────────────────────────────────────────
function BulbSVG({ on }) {
  return (
    <svg viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      width="26" height="30" style={{ display:'block' }}>
      <defs>
        <radialGradient id="bg" cx="40%" cy="35%">
          <stop offset="0%"   stopColor={on ? '#fffde7' : '#4a4a4a'} />
          <stop offset="100%" stopColor={on ? '#fdd835' : '#2a2a2a'} />
        </radialGradient>
        <filter id="gf" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path
        d="M12 1.5C7.86 1.5 4.5 4.86 4.5 9c0 2.9 1.55 5.44 3.87 6.87V18h7.26v-2.13A7.5 7.5 0 0 0 19.5 9c0-4.14-3.36-7.5-7.5-7.5z"
        fill={on ? 'url(#bg)' : 'none'}
        stroke={on ? '#f9a825' : 'rgba(140,130,110,0.55)'}
        strokeWidth="1.2"
        filter={on ? 'url(#gf)' : undefined}
      />
      {on && <path d="M9.5 13q2.5-3.5 5 0" stroke="#ef6c00" strokeWidth="1"
        strokeLinecap="round" fill="none"/>}
      {[0,1,2].map(i=>(
        <rect key={i} x="9.5" y={18+i*2} width="5" height="1.3" rx="0.5"
          fill={on ? '#f9a825' : 'rgba(110,100,80,0.45)'} opacity={1-i*0.2}/>
      ))}
      <rect x="10.5" y="24" width="3" height="2" rx="1"
        fill={on ? '#e65100' : 'rgba(90,80,60,0.35)'}/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export default function LampToggle() {
  const { theme, toggle } = useTheme();
  const isOn = theme === 'light';

  // Physics state
  const S       = useRef(0);    // stretch: extra length (px)
  const vS      = useRef(0);    // stretch velocity
  const W       = useRef(0);    // wobble: lateral midpoint offset (px)
  const vW      = useRef(0);    // wobble velocity
  const snapped = useRef(false);
  const rafId   = useRef(null);
  const lastT   = useRef(null);

  // DOM refs
  const pathRef  = useRef(null);
  const knotRef  = useRef(null);
  const svgRef   = useRef(null);

  // ── Build SVG path from physics state ──────────────────────────────────
  const applyToDOM = useCallback(() => {
    const extra   = S.current;
    const wob     = W.current;
    const total   = NATURAL + extra;
    const mid     = total * 0.5;

    // Cubic bezier — control pts swing laterally, creating rubber wiggle
    const cx1 =  wob * 1.1;
    const cy1 =  mid * 0.35;
    const cx2 = -wob * 1.1;
    const cy2 =  mid * 0.72;
    const d = `M 0 0 C ${cx1} ${cy1} ${cx2} ${cy2} 0 ${total}`;

    // Cord thins when stretched (rubber volume conservation)
    const thickness = Math.max(1.2, 2.2 - extra * 0.018);

    if (pathRef.current) {
      pathRef.current.setAttribute('d', d);
      pathRef.current.setAttribute('stroke-width', thickness);
    }
    if (knotRef.current) {
      knotRef.current.setAttribute('cy', total + 5);
    }
    if (svgRef.current) {
      const h = Math.max(NATURAL, total) + 18;
      svgRef.current.style.height = `${h}px`;
    }
  }, []);

  // ── Animation loop ─────────────────────────────────────────────────────
  const tick = useCallback((now) => {
    if (!lastT.current) lastT.current = now;
    const dt = Math.min((now - lastT.current) / 1000, 0.038);
    lastT.current = now;

    // Stretch spring  (F = -k*x - d*v)
    const aS = -K_S * S.current - D_S * vS.current;
    const prevVS = vS.current;
    vS.current += aS * dt;
    S.current  += vS.current * dt;

    // Snap-back coupling: when stretch crosses zero going negative,
    // inject lateral energy → starts the rubber wobble
    if (!snapped.current && prevVS < 0 && S.current < 2) {
      vW.current += Math.abs(prevVS) * COUPLING;
      snapped.current = true;
    }

    // Wobble spring  (transverse oscillation)
    const aW = -K_W * W.current - D_W * vW.current;
    vW.current += aW * dt;
    W.current  += vW.current * dt;

    // Clamp cord from going too short
    if (S.current < -8) { S.current = -8; vS.current *= -0.3; }

    applyToDOM();

    const settled =
      Math.abs(S.current)  < REST &&
      Math.abs(vS.current) < REST &&
      Math.abs(W.current)  < REST &&
      Math.abs(vW.current) < REST;

    if (settled) {
      S.current = 0; vS.current = 0;
      W.current = 0; vW.current = 0;
      snapped.current = false;
      lastT.current = null;
      applyToDOM();
    } else {
      rafId.current = requestAnimationFrame(tick);
    }
  }, [applyToDOM]);

  // ── Click: pull cord ───────────────────────────────────────────────────
  const pull = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    lastT.current = null;
    snapped.current = false;
    vS.current = 170;  // downward stretch impulse
    W.current  = 0;
    vW.current = 0;
    rafId.current = requestAnimationFrame(tick);
    setTimeout(toggle, 200);
  }, [tick, toggle]);

  // ── Gentle idle drift on mount ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (Math.abs(vS.current) < 1) {
        vS.current = 18;
        lastT.current = null;
        rafId.current = requestAnimationFrame(tick);
      }
    }, 600);
    return () => { clearTimeout(t); cancelAnimationFrame(rafId.current); };
  }, [tick]);

  return (
    <button
      className={`lamp-toggle${isOn ? ' lamp-on' : ''}`}
      onClick={pull}
      aria-label={`Switch to ${isOn ? 'dark' : 'light'} mode`}
      title={`Switch to ${isOn ? 'dark' : 'light'} mode`}
    >
      {/* Bulb stays in navbar flow */}
      <span className="lamp-bulb">
        {isOn && <span className="lamp-glow-ring" />}
        <BulbSVG on={isOn} />
      </span>

      {/* SVG cord floats below navbar */}
      <svg
        ref={svgRef}
        className="lamp-cord-svg"
        width="60"
        style={{ height: NATURAL + 18 }}
        viewBox="-30 0 60 200"
        preserveAspectRatio="xMidYMin meet"
        overflow="visible"
      >
        {/* The elastic cord */}
        <path
          ref={pathRef}
          d={`M 0 0 L 0 ${NATURAL}`}
          stroke={isOn ? 'rgba(200,155,50,0.92)' : 'rgba(130,110,85,0.85)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Pull knot */}
        <circle
          ref={knotRef}
          cx="0"
          cy={NATURAL + 5}
          r="5.5"
          fill={isOn
            ? 'radial-gradient(circle at 35% 30%, #ffe082, #f57f17)'
            : 'rgba(120,95,60,1)'}
        />
        {/* Knot highlight */}
        <circle cx="0" cy={NATURAL + 5} r="5.5"
          fill="none"
          stroke={isOn ? 'rgba(255,230,100,0.4)' : 'rgba(255,255,255,0.1)'}
          strokeWidth="1"
        />
      </svg>
    </button>
  );
}
