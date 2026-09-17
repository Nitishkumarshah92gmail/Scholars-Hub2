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
import ParticleCanvas from '../components/ParticleCanvas';

/* ── Typing animation hook ── */

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
    <div className="min-h-screen transition-colors duration-300">
      {/* ── Liquid Glass Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerScrolled
          ? ''
          : 'bg-transparent'
      }`}
        style={headerScrolled ? {
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 4px 20px rgba(0,0,0,0.08)',
        } : {}}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2.5">
            <img src={logoImg} alt="Scholars Hub" className="w-8 h-8 rounded-full object-cover" />
            Scholars<span className="gradient-text">Hub</span>
          </h1>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#features" className="px-4 py-2 text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-white/10 transition-all">
              Features
            </a>
            <a href="#community" className="px-4 py-2 text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-white/10 transition-all">
              Community
            </a>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-ig-text-2 hover:text-ig-text dark:hover:text-white transition-all"
              style={{ boxShadow: '2px 2px 5px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}
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
            <Link to="/login" className="text-sm text-ig-text-2 hover:text-ig-text dark:hover:text-white px-4 py-2 rounded-ag-pill hover:bg-white/10 transition-all font-medium">
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
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-full text-ig-text dark:text-ig-text-light transition-all">
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenuAlt3 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown — Liquid Glass */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            <div className="px-6 py-4 space-y-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-ig-text dark:text-ig-text-light rounded-ag-sm hover:bg-white/10 transition-all">Features</a>
              <a href="#community" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-ig-text dark:text-ig-text-light rounded-ag-sm hover:bg-white/10 transition-all">Community</a>
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
      <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          
          {/* Trust Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[8px] text-white font-bold">A+</div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[8px] text-white font-bold">100</div>
              <div className="w-5 h-5 rounded-full bg-orange-500 border border-white flex items-center justify-center text-[8px] text-white font-bold">🎓</div>
            </div>
            <div className="flex text-yellow-400 text-[10px]">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 pr-1">10k+ students</span>
          </div>

          {/* Heading */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-black text-gray-900 dark:text-white leading-[1.05] tracking-tight max-w-[900px] mx-auto">
              Your Study Community's Future, All in One Platform.
            </h1>
          </div>

          <p className="animate-fade-in-up-delay-1 mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-[700px] mx-auto leading-relaxed font-medium">
            Share notes, discuss topics, and grow your knowledge with Scholars Hub — your complete network for students, powered by collaborative tools.
          </p>

          <div className="animate-fade-in-up-delay-2 mt-8 flex flex-col items-center justify-center gap-2">
            <Link to="/register" className="btn-primary rounded-full text-base font-bold px-10 py-4 shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              Start Your Free Trial
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              No credit card required.
            </div>
          </div>

          {/* Masonry Collage */}
          <div className="animate-fade-in-up-delay-3 mt-20 max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
              
              {/* Column 1 */}
              <div className="flex flex-col gap-4 md:gap-6 mt-0 md:mt-12">
                <div className="rounded-3xl overflow-hidden aspect-[4/5] shadow-xl relative group">
                  <img src="/collage-1.jpg" alt="Student Studying" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3 text-white text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[10px] font-bold">@</div>
                      <span className="text-xs font-semibold shadow-sm">alex_studies</span>
                    </div>
                    <p className="text-sm font-bold leading-tight">Crushing this semester's finals with the squad! 🔥</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-blue-500 text-white p-6 shadow-xl aspect-square flex flex-col justify-end text-left relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
                  <h3 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 relative z-10">10k+</h3>
                  <p className="text-sm font-semibold text-blue-100 relative z-10">Study Notes shared by students</p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-4 md:gap-6 mt-0 md:mt-0">
                <div className="rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl relative group">
                  <img src="/collage-2.jpg" alt="Student Portrait" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
                     <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">Stories</span>
                     <span className="bg-black/30 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center border border-white/20">✕</span>
                  </div>
                  <div className="absolute bottom-6 left-4 right-4 flex gap-2 overflow-hidden">
                    <div className="w-12 h-12 rounded-full border-2 border-orange-400 overflow-hidden"><img src="https://ui-avatars.com/api/?name=Sam&background=random" className="w-full h-full" /></div>
                    <div className="w-12 h-12 rounded-full border-2 border-transparent opacity-60 overflow-hidden"><img src="https://ui-avatars.com/api/?name=Ali&background=random" className="w-full h-full" /></div>
                    <div className="w-12 h-12 rounded-full border-2 border-transparent opacity-60 overflow-hidden"><img src="https://ui-avatars.com/api/?name=Jen&background=random" className="w-full h-full" /></div>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-4 md:gap-6 mt-0 md:mt-8">
                <div className="rounded-3xl bg-[#ff6b4a] text-white p-6 shadow-xl aspect-square flex flex-col justify-center text-left relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -ml-10 -mb-10 transition-transform duration-500 group-hover:scale-150"></div>
                  <h3 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 relative z-10">50+</h3>
                  <p className="text-sm font-semibold text-orange-100 relative z-10">Universities represented</p>
                </div>
                <div className="rounded-3xl overflow-hidden aspect-[4/5] shadow-xl relative group">
                  <img src="/collage-3.jpg" alt="3D Books" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>

              {/* Column 4 */}
              <div className="flex flex-col gap-4 md:gap-6 mt-0 md:mt-24">
                 <div className="rounded-3xl overflow-hidden aspect-[3/4] shadow-xl relative bg-emerald-500 group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
                    <img src="/collage-2.jpg" alt="Portrait" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-overlay" />
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 text-white flex items-center justify-center font-bold text-xs">AI</div>
                           <div>
                             <p className="text-xs font-bold text-gray-900 leading-none mb-1">Smart Summaries</p>
                             <p className="text-[10px] font-semibold text-gray-500 leading-none">Auto-generated from notes</p>
                           </div>
                         </div>
                      </div>
                    </div>
                 </div>
              </div>

            </div>
          </div>

          {/* Trusted By Strip */}
          <div className="animate-fade-in-up-delay-3 mt-32 border-t border-gray-200 dark:border-gray-800 pt-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-8">Trusted by students to build better grades, together.</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="text-xl font-black tracking-tighter">HARVARD</div>
               <div className="text-xl font-black tracking-tighter">STANFORD</div>
               <div className="text-xl font-black tracking-tighter">MIT</div>
               <div className="text-xl font-black tracking-tighter">OXFORD</div>
               <div className="text-xl font-black tracking-tighter">CAMBRIDGE</div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── Features Section — Liquid Glass Cards ── */}
      <section id="features" className="py-24 px-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
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
                className="group card p-6 text-center hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                  style={{ boxShadow: '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' }}
                >
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

      {/* ── Community / Social Features — Glass Cards ── */}
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
                className="group card p-5 text-center hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(26,115,232,0.1)',
                    boxShadow: '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
                  }}
                >
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

      {/* ── CTA Section — Neumorphic Dark Glass Panel ── */}
      <section className="py-24 px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="relative rounded-ag overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '8px 8px 20px rgba(0,0,0,0.4), -8px -8px 20px rgba(40,40,60,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-ag-primary/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 p-12 sm:p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(26,115,232,0.15)',
                  boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.3), inset -3px -3px 8px rgba(40,40,60,0.15)',
                }}
              >
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

      {/* ── Footer — Glass separator ── */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
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
