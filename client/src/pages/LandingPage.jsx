import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';

export default function LandingPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #0d0a2e 0%, #05081e 40%, #020410 100%)',
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <Navbar />
      <HeroSection />
    </div>
  );
}
