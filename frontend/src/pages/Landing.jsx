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
        <div className="max-w-[1600px] mx-auto px-8 h-[88px] flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-3">
            <img src={logoImg} alt="Scholars Hub" className="w-10 h-10 rounded-full object-cover" />
            Scholars<span className="gradient-text">Hub</span>
          </h1>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#features" className="px-5 py-2.5 text-base font-medium text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-white/10 transition-all">
              Features
            </a>
            <a href="#community" className="px-5 py-2.5 text-base font-medium text-ig-text-2 hover:text-ig-text dark:hover:text-white rounded-ag-pill hover:bg-white/10 transition-all">
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
              className="btn-secondary text-base px-5 py-2.5 flex items-center gap-2"
            >
              <HiDownload className="w-5 h-5" />
              App
            </a>
            <Link to="/login" className="text-base text-ig-text-2 hover:text-ig-text dark:hover:text-white px-5 py-2.5 rounded-ag-pill hover:bg-white/10 transition-all font-medium">
              Log in
            </Link>
            <Link to="/register" className="btn-primary text-base px-6 py-2.5 font-bold shadow-lg">
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

      {/* ── Hero Section (Grow+ Style) ── */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-[1600px] w-full mx-auto">
          {/* Main Hero Card */}
          <div className="relative bg-[#e0e2e5] dark:bg-[#1a1b1e] rounded-[40px] lg:rounded-[60px] p-8 sm:p-12 lg:p-16 overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left Column (Text) */}
            <div className="flex-1 w-full relative z-10 text-left pt-4 lg:pt-0">
              
              {/* Badge */}
              <div className="flex items-center gap-4 mb-10">
                 <div className="flex -space-x-2">
                   <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs border-2 border-[#e0e2e5] dark:border-[#1a1b1e]">🎓</div>
                   <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-[#e0e2e5] dark:border-[#1a1b1e]"></div>
                 </div>
                 <div>
                   <p className="font-bold text-gray-900 dark:text-white leading-tight">20K+ Students</p>
                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read Our <a href="#" className="underline font-bold text-gray-900 dark:text-white">Success Stories</a></p>
                 </div>
              </div>

              {/* Massive Heading */}
              <h1 className="text-[100px] sm:text-[140px] lg:text-[180px] font-heading font-medium text-gray-900 dark:text-white leading-[0.85] tracking-tighter mb-10">
                Learn<span className="text-5xl sm:text-7xl lg:text-[100px] relative -top-10 lg:-top-16">+</span>
              </h1>
              
              <div className="h-[2px] w-full max-w-[400px] bg-gray-300 dark:bg-gray-700 mb-10"></div>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-md leading-relaxed mb-10 font-medium">
                Drive Academic Growth, And Harness Community-Powered Study Content — Up To 10× Faster.
              </p>

              {/* Testimonial & Buttons Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex flex-col gap-6 w-full max-w-sm">
                   <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-3">
                       <img src="https://ui-avatars.com/api/?name=Sarah&background=random" alt="Reviewer" className="w-8 h-8 rounded-full" />
                       <div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">Loved the platform</p>
                         <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">100% Satisfied</p>
                       </div>
                     </div>
                     <p className="text-sm font-bold text-gray-900 dark:text-white"><span className="text-gray-400 font-normal mr-2">/</span> ★ 4.9</p>
                   </div>
                   <div className="h-[2px] w-full bg-gray-300 dark:bg-gray-700"></div>
                   
                   <div className="flex items-center gap-6 mt-2">
                     <Link to="/register" className="bg-black dark:bg-white text-white dark:text-black rounded-full px-6 py-3 text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2">
                       Get Started — It's Free
                     </Link>
                     <a href="#features" className="text-sm font-bold text-gray-900 dark:text-white hover:underline flex items-center gap-1">
                       Explore Features ↗
                     </a>
                   </div>
                </div>
              </div>

            </div>

            {/* Right Column (Visuals) */}
            <div className="flex-1 w-full relative min-h-[500px] lg:min-h-[700px] flex justify-center lg:justify-end items-center mt-10 lg:mt-0 z-20">
               
               {/* Orange Background Pill */}
               <div className="absolute right-0 lg:right-10 w-full max-w-[360px] h-[500px] lg:h-[700px] rounded-[60px] lg:rounded-[100px] bg-gradient-to-br from-[#ff7a45] to-[#ff500b] overflow-hidden shadow-xl">
                 <img src="/hero-portrait.jpg" alt="Student" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
               </div>

               {/* Floating Elements (Absolute positioned relative to this right column) */}
               
               {/* Top Chat Bubble */}
               <div className="absolute top-[20%] left-0 lg:left-10 bg-white/90 backdrop-blur-md px-5 py-3 rounded-full shadow-lg flex items-center gap-3 animate-float z-30" style={{ animationDelay: '0s' }}>
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold">✓</div>
                  <span className="text-sm font-bold text-gray-800">Are these notes good?</span>
               </div>
               
               {/* Bottom Chat Bubble */}
               <div className="absolute top-[32%] -left-8 lg:left-0 bg-white/90 backdrop-blur-md px-5 py-3 rounded-full shadow-lg flex items-center gap-3 animate-float z-30" style={{ animationDelay: '1s' }}>
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                  <span className="text-sm font-bold text-gray-800">Helped me ace the exam!</span>
               </div>

               {/* Play Button */}
               <div className="absolute top-1/2 left-1/4 lg:left-1/3 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform z-30">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-black border-b-[10px] border-b-transparent ml-2"></div>
               </div>

               {/* Top Stat Card (Glass) */}
               <div className="absolute top-10 -right-4 lg:-right-8 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/50 p-6 rounded-[32px] shadow-2xl w-48 animate-float z-30" style={{ animationDelay: '0.5s' }}>
                 <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 mb-1 uppercase">— UP TO</p>
                 <h3 className="text-5xl font-normal text-gray-900 dark:text-white mb-2">90%</h3>
                 <p className="text-xs font-medium text-gray-800 dark:text-gray-300 leading-tight">Higher grades this semester</p>
               </div>

               {/* Bottom Asset Card (Glass) */}
               <div className="absolute bottom-10 -left-6 lg:left-12 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/50 p-4 rounded-[32px] shadow-2xl flex items-center gap-5 w-[320px] animate-float z-30" style={{ animationDelay: '1.5s' }}>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                    <img src="/hero-asset.jpg" alt="Physics Textbook" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">Physics 101 Notes</h4>
                    <p className="text-xl font-black text-gray-900 dark:text-white mb-2">Free</p>
                    <div className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                      ★ 4.9
                    </div>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Trusted By Strip (Moved out of the card to bottom) */}
          <div className="mt-12 flex flex-wrap justify-center sm:justify-between items-center gap-8 px-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pb-8">
             <div className="text-2xl font-black tracking-tighter">Rakuten</div>
             <div className="text-2xl font-black tracking-tighter flex items-center gap-1"><span className="text-3xl">∞</span>NCR</div>
             <div className="text-2xl font-black tracking-tighter">monday.com</div>
             <div className="text-2xl font-black tracking-tighter font-serif italic">Disney</div>
             <div className="text-2xl font-black tracking-tighter">Dropbox</div>
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
