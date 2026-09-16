import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';
import { useEffect, useRef, useState } from 'react';
import {
  HiAcademicCap,
  HiDocumentText,
  HiPhotograph,
  HiPlay,
  HiCollection,
  HiUserGroup,
  HiHeart,
  HiChat,
  HiBell,
  HiBookmark,
  HiSun,
  HiMoon,
  HiArrowRight,
  HiGlobe,
  HiDownload,
  HiMenuAlt3,
  HiX,
} from 'react-icons/hi';

/* ── Lightweight particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function createParticles() {
      particles = [];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2 + 0.5,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 180, 248, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(138, 180, 248, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

/* ── Typing animation hook ── */
function useTypingEffect(words, typingSpeed = 80, deletingSpeed = 40, pauseTime = 2000) {
  const [display, setDisplay] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout;

    if (!isDeleting && display === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && display === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timeout = setTimeout(() => {
        setDisplay(
          isDeleting
            ? currentWord.substring(0, display.length - 1)
            : currentWord.substring(0, display.length + 1)
        );
      }, isDeleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [display, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

  return display;
}

export default function Landing() {
  const { darkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const typedText = useTypingEffect(
    ['inspire learning', 'build communities', 'share knowledge', 'grow together'],
    70, 35, 2200
  );

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: HiDocumentText, title: 'Share PDFs', desc: 'Upload study notes, cheat sheets, and textbook summaries for your classmates.', color: 'from-blue-500/20 to-blue-600/10' },
    { icon: HiPhotograph, title: 'Share Images', desc: 'Upload diagrams, whiteboard photos, and visual study aids.', color: 'from-emerald-500/20 to-emerald-600/10' },
    { icon: HiPlay, title: 'YouTube Videos', desc: 'Paste any YouTube link and it auto-embeds for easy viewing.', color: 'from-red-500/20 to-red-600/10' },
    { icon: HiCollection, title: 'YouTube Playlists', desc: 'Share entire course playlists with a single link.', color: 'from-purple-500/20 to-purple-600/10' },
  ];

  const socialFeatures = [
    { icon: HiHeart, title: 'Like & React', desc: 'Show appreciation for helpful content' },
    { icon: HiChat, title: 'Comments', desc: 'Discuss and ask questions on posts' },
    { icon: HiUserGroup, title: 'Follow Students', desc: 'Build your study network' },
    { icon: HiBell, title: 'Notifications', desc: 'Stay updated on interactions' },
    { icon: HiBookmark, title: 'Bookmarks', desc: 'Save posts for later revision' },
    { icon: HiGlobe, title: 'Explore', desc: 'Discover content across all subjects' },
  ];

  const subjects = [
    { name: 'Mathematics', color: 'bg-blue-500/10 text-blue-400 dark:bg-blue-500/15 dark:text-blue-300' },
    { name: 'Science', color: 'bg-green-500/10 text-green-400 dark:bg-green-500/15 dark:text-green-300' },
    { name: 'Programming', color: 'bg-purple-500/10 text-purple-400 dark:bg-purple-500/15 dark:text-purple-300' },
    { name: 'History', color: 'bg-amber-500/10 text-amber-400 dark:bg-amber-500/15 dark:text-amber-300' },
    { name: 'Physics', color: 'bg-cyan-500/10 text-cyan-400 dark:bg-cyan-500/15 dark:text-cyan-300' },
    { name: 'Chemistry', color: 'bg-rose-500/10 text-rose-400 dark:bg-rose-500/15 dark:text-rose-300' },
    { name: 'Biology', color: 'bg-emerald-500/10 text-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { name: 'Engineering', color: 'bg-yellow-500/10 text-yellow-400 dark:bg-yellow-500/15 dark:text-yellow-300' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* ── Glassmorphic Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerScrolled
          ? 'glass-light dark:glass shadow-lg dark:shadow-ag-glass'
          : 'bg-transparent'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2.5">
            <img src={logoImg} alt="Scholars Hub" className="w-8 h-8 rounded-full object-cover" />
            Scholars<span className="gradient-text">Hub</span>
          </h1>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#features" className="px-4 py-2 text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              Features
            </a>
            <a href="#community" className="px-4 py-2 text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              Community
            </a>
            <div className="w-px h-6 bg-ig-separator dark:bg-ig-separator-dark mx-2" />
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-ig-text-2 hover:text-ig-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <a
              href="/scholars-hub.apk"
              download
              className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5"
            >
              <HiDownload className="w-4 h-4" />
              App
            </a>
            <Link to="/login" className="text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white px-4 py-2 rounded-ag-pill hover:bg-black/5 dark:hover:bg-white/5 transition-all font-medium">
              Log in
            </Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2">
              Sign up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full text-ig-text-2 hover:text-ig-text dark:hover:text-white transition-all">
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-full text-ig-text dark:text-ig-text-light hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenuAlt3 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-light dark:glass border-t border-ig-separator/30 dark:border-ig-separator-dark/30 animate-fade-in">
            <div className="px-6 py-4 space-y-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-ig-text dark:text-ig-text-light rounded-ag-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all">Features</a>
              <a href="#community" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-ig-text dark:text-ig-text-light rounded-ag-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all">Community</a>
              <a href="/scholars-hub.apk" download className="block px-4 py-2.5 text-sm text-ag-primary font-semibold rounded-ag-sm hover:bg-blue-500/5 transition-all">
                <HiDownload className="w-4 h-4 inline mr-2" />Download App
              </a>
              <div className="pt-2 flex gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-outline flex-1 text-center text-sm py-2.5">Log in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary flex-1 text-center text-sm py-2.5">Sign up</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particle background */}
        <ParticleCanvas />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-ag-primary/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-ig-text dark:text-white leading-[1.1] tracking-tight">
              Share knowledge,{' '}
              <span className="bg-ag-gradient-hero bg-clip-text text-transparent">
                {typedText}
              </span>
              <span className="inline-block w-[3px] h-[0.8em] bg-ag-primary ml-1 align-middle animate-typing-cursor" />
            </h1>
          </div>

          <p className="animate-fade-in-up-delay-1 mt-6 text-lg sm:text-xl text-ig-text-2 max-w-[600px] mx-auto leading-relaxed">
            Upload study notes, videos, and resources. Connect with students worldwide.
            Like Instagram, but built for education.
          </p>

          <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 text-[15px]">
              Get Started Free
              <HiArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/scholars-hub.apk"
              download
              className="btn-secondary text-base px-8 py-3.5 flex items-center gap-2 text-[15px]"
            >
              <HiDownload className="w-5 h-5" />
              Download App
            </a>
          </div>

          {/* Subject pills */}
          <div className="animate-fade-in-up-delay-3 mt-12 flex flex-wrap gap-2 justify-center">
            {subjects.map((s) => (
              <span key={s.name} className={`subject-badge ${s.color}`}>
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-ig-text-2/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-ig-text-2/50 rounded-full animate-fade-in" />
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 px-6 bg-ig-bg-2 dark:bg-ag-surface-dim border-t border-ig-separator/50 dark:border-ig-separator-dark/50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ig-text dark:text-white tracking-tight">
              4 Ways to Share Knowledge
            </h2>
            <p className="mt-4 text-ig-text-2 max-w-xl mx-auto text-base leading-relaxed">
              Whether it's a PDF, an image, or a YouTube video — Scholars Hub makes sharing effortless.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group card p-6 text-center hover:shadow-ag-card-hover hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-ag-glow`}>
                  <f.icon className="w-7 h-7 text-ag-primary" />
                </div>
                <h3 className="font-heading font-semibold text-ig-text dark:text-white mb-2 text-[15px]">
                  {f.title}
                </h3>
                <p className="text-sm text-ig-text-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community / Social Features ── */}
      <section id="community" className="py-24 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ig-text dark:text-white tracking-tight">
              Built for Student Communities
            </h2>
            <p className="mt-4 text-ig-text-2 max-w-xl mx-auto text-base leading-relaxed">
              All the social features you need to connect, collaborate, and learn with peers.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {socialFeatures.map((f, i) => (
              <div
                key={f.title}
                className="group card p-5 text-center hover:shadow-ag-card-hover hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-ag-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-ag-primary/20">
                  <f.icon className="w-6 h-6 text-ag-primary" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-ig-text dark:text-white mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-ig-text-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section — Dark inverted ── */}
      <section className="py-24 px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="relative rounded-ag bg-black dark:bg-ag-surface-container overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-ag-primary/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 p-12 sm:p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-ag-primary/15 flex items-center justify-center">
                <HiAcademicCap className="w-8 h-8 text-ag-primary-light" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4 tracking-tight">
                Ready to Start Sharing?
              </h2>
              <p className="text-ag-on-surface-variant text-base mb-8 max-w-md mx-auto leading-relaxed">
                Join students who are already sharing notes, videos, and study materials. It's completely free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
                  Sign up — it's free
                  <HiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="text-ag-on-surface-variant hover:text-white font-medium text-sm px-4 py-3 rounded-ag-pill hover:bg-white/5 transition-all">
                  Already have an account?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-ig-separator/50 dark:border-ig-separator-dark/50">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Scholars Hub" className="w-6 h-6 rounded-full object-cover" />
              <span className="font-heading font-bold text-sm text-ig-text dark:text-ig-text-light">
                Scholars<span className="gradient-text">Hub</span>
              </span>
            </div>
            <div className="flex items-center gap-5">
              <a href="/scholars-hub.apk" download className="text-xs text-ig-text-2 hover:text-ig-text dark:hover:text-white transition-colors flex items-center gap-1">
                <HiDownload className="w-3.5 h-3.5" /> Get App
              </a>
              <Link to="/login" className="text-xs text-ig-text-2 hover:text-ig-text dark:hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/register" className="text-xs text-ig-text-2 hover:text-ig-text dark:hover:text-white transition-colors">
                Sign up
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-ig-text-2 space-y-1">
            <p>&copy; {new Date().getFullYear()} Scholars Hub. Learn together, grow together.</p>
            <p>
              Developed by <span className="font-semibold text-ig-text dark:text-ig-text-light">Nitish Kumar Sahu</span>
              {' · '}
              Report issues:{' '}
              <a href="mailto:nitishkumarshah92@gmail.com" className="text-ag-primary hover:underline">
                nitishkumarshah92@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
