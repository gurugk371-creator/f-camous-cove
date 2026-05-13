import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { RiRocketLine, RiShieldCheckLine } from 'react-icons/ri';

// ── Floating orb spheres scattered like reference ──────────────────────────
const ORBS = [
  { w: 28, h: 28, top: '18%', left: '8%', delay: 0 },
  { w: 18, h: 18, top: '55%', left: '3%', delay: 1.5 },
  { w: 22, h: 22, top: '30%', right: '28%', delay: 0.8 },
  { w: 14, h: 14, top: '12%', right: '36%', delay: 2 },
  { w: 20, h: 20, bottom: '22%', right: '18%', delay: 1 },
  { w: 12, h: 12, top: '65%', right: '42%', delay: 2.5 },
];

// ── Star particles ──────────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.8 + 0.5,
  delay: Math.random() * 6,
  dur: 4 + Math.random() * 5,
}));

export default function HeroSection() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleStars = isMobile ? STARS.slice(0, 20) : STARS;

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>

      {/* ── Star field ─────────────────────────────────────── */}
      {visibleStars.map(s => (
        <motion.div key={s.id} style={{
          position: 'absolute', borderRadius: '50%',
          background: 'rgba(255,255,255,0.75)', pointerEvents: 'none',
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: 0,
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(0,0,0)',
          willChange: 'opacity, transform',
        }}
          animate={isMobile ? { opacity: [0, 0.8, 0] } : { opacity: [0, 0.8, 0], x: [0, Math.random() * 30 - 15, 0], y: [0, Math.random() * 30 - 15, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Deep background orbs ───────────────────────────── */}
      {/* Main violet center */}
      <motion.div style={{
        position: 'absolute', borderRadius: '50%',
        width: isMobile ? 350 : 700, height: isMobile ? 350 : 700, top: '50%', left: '50%',
        background: 'radial-gradient(circle, rgba(88,28,220,0.35) 0%, transparent 70%)',
        filter: isMobile ? 'blur(50px)' : 'blur(100px)', pointerEvents: 'none',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translate3d(-50%, -50%, 0)',
        willChange: isMobile ? 'auto' : 'transform',
      }} 
        animate={isMobile ? { x: '-50%', y: '-50%' } : { x: ['-50%', '-48%', '-52%', '-50%'], y: ['-50%', '-52%', '-48%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Top-right planet glow */}
      <motion.div style={{
        position: 'absolute', borderRadius: '50%',
        width: isMobile ? 300 : 500, height: isMobile ? 300 : 500, top: '-12%', right: '-8%',
        background: 'radial-gradient(circle, rgba(15,30,120,0.6) 30%, rgba(88,28,220,0.2) 70%, transparent 100%)',
        filter: isMobile ? 'blur(15px)' : 'blur(30px)', pointerEvents: 'none',
        WebkitBackfaceVisibility: 'hidden',
        willChange: isMobile ? 'auto' : 'transform, opacity',
      }} 
        animate={isMobile ? {} : { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bottom-left glow */}
      <motion.div style={{
        position: 'absolute', borderRadius: '50%',
        width: isMobile ? 250 : 400, height: isMobile ? 250 : 400, bottom: '-10%', left: '5%',
        background: 'radial-gradient(circle, rgba(15,20,80,0.6) 0%, transparent 70%)',
        filter: isMobile ? 'blur(35px)' : 'blur(70px)', pointerEvents: 'none',
        WebkitBackfaceVisibility: 'hidden',
        willChange: isMobile ? 'auto' : 'transform',
      }} 
        animate={isMobile ? {} : { scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Planet Ring (top-right) like reference ────────── */}
      <motion.div style={{
        position: 'absolute', top: isMobile ? '-12%' : '-5%', right: isMobile ? '-15%' : '-5%',
        width: isMobile ? 260 : 480, height: isMobile ? 260 : 480, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, #0d1a5e 30%, #050d2e 100%)',
        boxShadow: '0 0 0 2px rgba(56,189,248,0.15)',
        overflow: 'visible',
        pointerEvents: 'none',
        WebkitBackfaceVisibility: 'hidden',
        willChange: isMobile ? 'auto' : 'transform',
      }}
        animate={isMobile ? {} : { rotate: [0, 5, -5, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Neon ring */}
        <div style={{
          position: 'absolute', inset: -14, borderRadius: '50%',
          border: '2px solid rgba(139,92,246,0.0)',
          boxShadow: '0 0 0 2px rgba(56,189,248,0.6), 0 0 40px 8px rgba(56,189,248,0.3)',
          transform: 'rotate(-35deg) scaleX(2.2) scaleY(0.35)',
          transformOrigin: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: -40, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 0 25px 4px rgba(139,92,246,0.2)',
          transform: 'rotate(-35deg) scaleX(2.4) scaleY(0.32)',
          transformOrigin: 'center',
        }} />
      </motion.div>

      {/* ── College building silhouette (left) ─────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '30%', height: '75%',
        background: 'linear-gradient(to right, rgba(5,8,40,0.9), transparent)',
        pointerEvents: 'none', zIndex: 1,
      }}>
        {/* Building blocks */}
        {[
          { l: '8%', w: 55, h: '55%', b: 0 },
          { l: '20%', w: 45, h: '45%', b: 0 },
          { l: '33%', w: 38, h: '35%', b: 0 },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: b.b, left: b.l,
            width: b.w, height: b.h,
            background: 'linear-gradient(to top, rgba(30,20,80,0.85), rgba(60,40,120,0.4))',
            borderTop: '1px solid rgba(139,92,246,0.3)',
            borderLeft: '1px solid rgba(139,92,246,0.15)',
            borderRight: '1px solid rgba(139,92,246,0.15)',
          }}>
            {/* windows */}
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} style={{
                position: 'absolute', top: `${15 + j * 14}%`, left: '15%', right: '15%', height: 4,
                background: 'rgba(139,92,246,0.25)', borderRadius: 1,
              }} />
            ))}
          </div>
        ))}
        {/* Sign glow */}
        <div style={{
          position: 'absolute', bottom: '56%', left: '10%',
          color: 'rgba(139,92,246,0.55)', fontSize: '0.45rem',
          fontWeight: 900, letterSpacing: '0.15em', lineHeight: 1.4,
          textShadow: '0 0 12px rgba(139,92,246,0.8)',
        }}>
          AMRAPALI<br />GROUP OF<br />INSTITUTES
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
          background: 'linear-gradient(to top, rgba(5,8,40,0.95), transparent)',
        }} />
      </div>

      {/* ── Floating glass orb spheres ─────────────────────── */}
      {ORBS.map((orb, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', borderRadius: '50%',
            width: isMobile ? orb.w * 0.7 : orb.w, height: isMobile ? orb.h * 0.7 : orb.h,
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
            background: 'radial-gradient(circle at 35% 30%, rgba(139,92,246,0.5), rgba(56,189,248,0.15))',
            border: '1px solid rgba(139,92,246,0.35)',
            boxShadow: '0 0 12px rgba(139,92,246,0.3)',
            backdropFilter: isMobile ? 'none' : 'blur(2px)',
            pointerEvents: 'none',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
          animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4 + i, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Subtle grid ────────────────────────────────────── */}
      <motion.div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: isMobile ? '40px 40px' : '80px 80px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)',
        WebkitBackfaceVisibility: 'hidden',
      }} 
        animate={isMobile ? {} : { backgroundPosition: ['0px 0px', '80px 80px'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* ── HERO TEXT: centered ────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 1rem',
        paddingBottom: '7rem', // shift up a bit for platform
      }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            marginBottom: '1.5rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            color: 'rgba(200,180,255,0.8)', fontSize: '0.72rem',
            fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
          }}
        >
          <span style={{ color: '#a78bfa', fontSize: '0.55rem' }}>✦</span>
          Digital Election System
          <span style={{ color: '#a78bfa', fontSize: '0.55rem' }}>✦</span>
        </motion.div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '0.6rem' }}
        >
          <h1 style={{
            margin: 0, lineHeight: 1.05, fontWeight: 900,
            fontSize: 'clamp(3.2rem, 7vw, 6rem)',
            letterSpacing: '-1.5px',
          }}>
            <span style={{ color: '#ffffff', display: 'block' }}>Amrapali</span>
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #c084fc 0%, #e879f9 35%, #818cf8 60%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(192,132,252,0.5))',
            }}>
              University Vote
            </span>
          </h1>
        </motion.div>

        {/* Shield icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.75, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '1rem', color: '#a78bfa', fontSize: '1.6rem' }}
        >
          <RiShieldCheckLine />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8 }}
          style={{
            margin: 0, marginBottom: '2.4rem',
            fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
            fontWeight: 300, letterSpacing: '0.01em',
            color: 'rgba(220,210,255,0.65)',
          }}
        >
          Your Voice. Your Leader.{' '}
          <span style={{
            fontWeight: 700,
            background: 'linear-gradient(90deg, #facc15, #fb923c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Your Campus.
          </span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <motion.button
            onClick={() => navigate('/vote')}
            animate={{ y: [0, -7, 0] }}
            transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
            whileHover={{
              scale: 1.07,
              boxShadow: '0 0 80px rgba(124,58,237,0.8), 0 0 160px rgba(56,189,248,0.3)',
            }}
            whileTap={{ scale: 0.96 }}
            style={{
              position: 'relative', overflow: 'hidden',
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              padding: '1.05rem 3.2rem',
              borderRadius: 999, border: '1px solid rgba(139,92,246,0.4)',
              background: 'linear-gradient(135deg, rgba(109,40,217,0.9) 0%, rgba(14,116,144,0.85) 100%)',
              color: '#fff', fontWeight: 700,
              fontSize: 'clamp(1rem, 1.4vw, 1.1rem)', letterSpacing: '0.02em',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 0 50px rgba(124,58,237,0.55), 0 0 100px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {/* Shimmer */}
            <motion.span style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
            }}
              animate={{ x: ['-100%', '160%'] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
            />
            <RiRocketLine style={{ fontSize: '1.2rem', flexShrink: 0 }} />
            Get Started
            <FiArrowRight style={{ fontSize: '1.1rem', flexShrink: 0 }} />
          </motion.button>
        </motion.div>
      </div>

      {/* ── Glowing Platform (bottom center) ──────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 500, pointerEvents: 'none', zIndex: 5,
      }}>
        {/* Concentric ring 1 */}
        <div style={{
          margin: '0 auto', width: 500, height: 30, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.4)',
          boxShadow: '0 0 25px 5px rgba(139,92,246,0.25)',
          marginBottom: -12,
        }} />
        {/* Ring 2 */}
        <div style={{
          margin: '0 auto', width: 380, height: 24, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.5)',
          boxShadow: '0 0 20px 4px rgba(139,92,246,0.35)',
          marginBottom: -10,
        }} />
        {/* Ring 3 */}
        <div style={{
          margin: '0 auto', width: 260, height: 20, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.6)',
          boxShadow: '0 0 18px 6px rgba(139,92,246,0.45)',
          marginBottom: -8,
        }} />
        {/* Center glow platform */}
        <div style={{
          margin: '0 auto', width: 140, height: 16, borderRadius: '50%',
          background: 'rgba(139,92,246,0.35)',
          boxShadow: '0 0 40px 20px rgba(139,92,246,0.5), 0 0 80px 30px rgba(56,189,248,0.15)',
        }} />
        {/* Bottom fade */}
        <div style={{
          height: 80,
          background: 'linear-gradient(to top, #05081e, transparent)',
        }} />
      </div>

      {/* ── Bottom vignette ────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(to top, #05081e 10%, transparent)',
        pointerEvents: 'none', zIndex: 4,
      }} />
    </div>
  );
}
