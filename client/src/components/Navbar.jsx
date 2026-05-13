import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'Contact', href: 'mailto:factstar524@gmail.com' },
];

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', top: 20, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem',
      }}
    >
      {/* ── Logo Block ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '0.55rem 1.1rem',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          boxShadow: '0 0 16px rgba(124,58,237,0.7)',
        }}>
          🗳️
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
            Amrapali University
          </div>
          <div style={{
            fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.12em',
            background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            VOTE
          </div>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '2.2rem',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '0.8rem 2rem',
        }}
      >
        {navLinks.map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            whileHover={{ scale: 1.08 }}
            style={{
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              color: i === 0 ? '#a78bfa' : 'rgba(255,255,255,0.6)',
              position: 'relative', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            {link.label}
            {i === 0 && (
              <motion.span
                layoutId="nav-underline"
                style={{
                  position: 'absolute', bottom: -4, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, #7c3aed, #38bdf8)',
                  borderRadius: 2,
                }}
              />
            )}
          </motion.a>
        ))}
      </div>
    </motion.nav>
  );
}
