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

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.reveal-on-scroll');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);
}

export default function Landing() {
  const { darkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const typedText = useTypingEffect(
    ['inspire learning', 'build communities', 'share knowledge', 'grow together'],
    70, 35, 2200
  );

  useScrollReveal();

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
      {/* ── Fixed Background (Always behind everything) ── */}
      <div 
         className="fixed inset-0 z-[-1] pointer-events-none"
         style={{ 
           backgroundImage: 'url(https://media.giphy.com/media/M3a51DMeWvYqs/giphy.gif)', 
           backgroundSize: 'cover', 
           backgroundPosition: 'center',
         }}
      >
        <div className="absolute inset-0 bg-[#0c1317]/40 bg-gradient-to-t from-[#0c1317]/90 via-transparent to-transparent"></div>
      </div>

      {/* ── Global Glass Frame (Always visible overlay) ── */}
      <div className="fixed inset-3 sm:inset-4 lg:inset-6 z-40 pointer-events-none border-2 border-white/10 rounded-[2rem] sm:rounded-[3rem] mix-blend-overlay"></div>

      {/* ── Liquid Glass Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerScrolled
          ? 'bg-black/40 backdrop-blur-2xl border-b border-white/10 shadow-lg'
          : 'bg-transparent pt-6 lg:pt-8'
      }`}
      >
        <div className="max-w-[1600px] mx-auto px-10 sm:px-14 lg:px-20 h-[88px] flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
            <img src={logoImg} alt="Scholars Hub" className="w-10 h-10 rounded-full object-cover" />
            Scholars<span className="text-white/70">Hub</span>
          </h1>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#features" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-all">
              Features
            </a>
            <a href="#community" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-all">
              Community
            </a>
            <Link to="/feed" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-all">
              Subjects
            </Link>
            <div className="w-px h-4 bg-white/20 mx-4" />
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-gray-300 hover:text-white transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white px-5 py-2.5 transition-all">
              Log In
            </Link>
            <Link to="/register" className="bg-white text-black text-sm px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform ml-2">
              Join Hub
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-300 hover:text-white transition-all">
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-full text-white transition-all">
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenuAlt3 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown — Dark Glass */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in bg-black/60 backdrop-blur-2xl border-t border-white/10"
          >
            <div className="px-6 py-4 space-y-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-white rounded-ag-sm hover:bg-white/10 transition-all">Features</a>
              <a href="#community" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-white rounded-ag-sm hover:bg-white/10 transition-all">Community</a>
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

      {/* ── Fixed Background Hero Section ── */}
      <section className="relative min-h-screen w-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 pt-40 pb-20">
        <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col justify-between h-full flex-1">
          
          {/* Typography */}
          <div className="max-w-4xl animate-fade-in-up mt-10 lg:mt-20">
            <h1 className="text-[60px] sm:text-[90px] lg:text-[130px] font-sans font-light leading-[0.9] tracking-tight text-white/90" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              Your<br/>
              <span className="text-white/60">Perfect</span><br/>
              Study Hub
            </h1>
          </div>

          {/* Bottom Row */}
          <div className="mt-16 sm:mt-auto flex flex-col lg:flex-row justify-between items-end gap-10">
             
             {/* Bottom Left Info */}
             <div className="max-w-sm text-gray-300 font-light text-sm sm:text-base animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
               Discover comprehensive study materials in collaborative digital hubs. Connect, learn, and excel together with your peers.
             </div>

             {/* Bottom Center Rating */}
             <div className="flex flex-col items-center animate-fade-in-up mb-4 lg:mb-0" style={{ animationDelay: '0.3s' }}>
               <div className="flex items-center gap-2 text-yellow-500">
                  ★ <span className="text-white text-3xl font-medium">4.9</span>
               </div>
               <span className="text-gray-400 text-sm mt-1">from 20,000+ students</span>
             </div>

             {/* Bottom Right Glass Card (Study Hub Widget) */}
             <div className="bg-[#121c22]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 w-full lg:w-[400px] shadow-2xl animate-fade-in-up hover:-translate-y-1 transition-transform duration-500" style={{ animationDelay: '0.4s' }}>
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <span className="inline-block bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md mb-2">Promoted</span>
                   <h3 className="text-[26px] font-light text-white leading-[1.2]">Advanced Physics<br/>Study Hub</h3>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center animate-spin-slow">
                   <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 </div>
               </div>

               <div className="flex gap-4 mb-6 border-b border-white/10 pb-6">
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">Resources</p>
                   <p className="text-sm text-gray-200 font-medium">1,240+ Notes</p>
                 </div>
                 <div className="w-px bg-white/10 h-8 self-center"></div>
                 <div className="flex-1 pl-2">
                   <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">Members</p>
                   <p className="text-sm text-gray-200 font-medium">850 Active</p>
                 </div>
               </div>

               <div className="flex justify-between items-end mb-6">
                 <div className="text-white flex items-end gap-1">
                   <span className="text-3xl font-medium">Free</span>
                   <span className="text-sm text-gray-500 pb-1">/ forever</span>
                 </div>
                 <div className="flex items-center gap-1 text-yellow-400">
                   ★ <span className="text-xs text-white font-medium">4.9</span>
                 </div>
               </div>

               <button className="w-full bg-[#f4f4f4] hover:bg-white text-black font-semibold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-sm">
                 Join Hub
               </button>

             </div>
          </div>
        </div>
      </section>

      {/* ── Features Section — Liquid Glass Cards ── */}
      <section id="features" className="py-24 px-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight drop-shadow-lg">
              4 Ways to Share Knowledge
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base leading-relaxed drop-shadow">
              Whether it's a PDF, an image, or a YouTube video — Scholars Hub makes sharing effortless.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 text-center hover:-translate-y-1 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out delay-[calc(var(--delay)*1ms)] bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-xl hover:bg-black/60"
                style={{ '--delay': i * 150 }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-white mb-2 text-[15px] drop-shadow-sm">
                  {f.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed drop-shadow-sm">
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
          <div className="text-center mb-16 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight drop-shadow-lg">
              Built for Student Communities
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base leading-relaxed drop-shadow">
              All the social features you need to connect, collaborate, and learn with peers.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {socialFeatures.map((f, i) => (
              <div
                key={f.title}
                className="group p-5 text-center hover:-translate-y-1 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out delay-[calc(var(--delay)*1ms)] bg-black/40 backdrop-blur-md border border-white/10 rounded-[1.5rem] shadow-xl hover:bg-black/60"
                style={{ '--delay': i * 100 }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-white mb-1 drop-shadow-sm">
                  {f.title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed drop-shadow-sm">{f.desc}</p>
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
