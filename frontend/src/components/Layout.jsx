import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, lazy, Suspense } from 'react';
import { getNotifications, getTotalUsers } from '../api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';


import {
  HiHome,
  HiOutlineHome,
  HiSearch,
  HiOutlineSearch,
  HiPlusCircle,
  HiOutlinePlusCircle,
  HiUser,
  HiOutlineUser,
  HiBell,
  HiOutlineBell,
  HiBookmark,
  HiOutlineBookmark,
  HiLogout,
  HiSun,
  HiMoon,
  HiOutlineBookOpen,
  HiOutlineLightBulb,
  HiOutlineAcademicCap,
  HiDotsHorizontal,
  HiUserGroup,
  HiChat,
  HiOutlineChat,
  HiX,
  HiDownload,
} from 'react-icons/hi';

export default function Layout() {
  const { user, logoutUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    getNotifications()
      .then((res) => setUnreadCount(res.data.unreadCount))
      .catch(() => { });
    getTotalUsers()
      .then((res) => setTotalUsers(res.data.totalUsers || 0))
      .catch(() => { });
    // Poll notifications every 60s (reduced from 30s) and total users every 5 min (rarely changes)
    const notifInterval = setInterval(() => {
      getNotifications()
        .then((res) => setUnreadCount(res.data.unreadCount))
        .catch(() => { });
    }, 60000);
    const usersInterval = setInterval(() => {
      getTotalUsers()
        .then((res) => setTotalUsers(res.data.totalUsers || 0))
        .catch(() => { });
    }, 300000);

    const requestPushPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { display } = await LocalNotifications.requestPermissions();
          console.log('LocalNotifications permission:', display);
        } catch (err) {
          console.error('Failed to request notification permissions', err);
        }
      }
    };
    requestPushPermissions();

    // Listen for notification taps
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        const data = notificationAction.notification.extra?.data;
        if (data) {
          navigate(data);
        }
      });
    }

    return () => { 
      clearInterval(notifInterval); 
      clearInterval(usersInterval); 
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadMessagesCount = async () => {
      const { data: convos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user._id);
        
      if (convos && convos.length > 0) {
        const convoIds = convos.map(c => c.conversation_id);
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('read', false)
          .neq('sender_id', user._id)
          .in('conversation_id', convoIds);
        if (count !== null) setUnreadMessagesCount(count);
      } else {
        setUnreadMessagesCount(0);
      }
    };
    
    fetchUnreadMessagesCount();
    
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          fetchUnreadMessagesCount();
          
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            if (newMsg.sender_id !== user._id) {
               const { data: sender } = await supabase.from('profiles').select('name, avatar').eq('id', newMsg.sender_id).single();
               if (sender) {
                  // Show in-app toast
                  toast((t) => (
                     <div className="flex items-center gap-3 cursor-pointer" onClick={() => { toast.dismiss(t.id); navigate('/dashboard/messages'); }}>
                        <img 
                          src={sender.avatar || `https://ui-avatars.com/api/?name=${sender.name}`} 
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${sender.name}&background=1e3a5f&color=fbbf24`; }}
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div className="min-w-0">
                           <p className="font-bold text-sm text-ig-text dark:text-ig-text-light truncate">{sender.name} sent a message</p>
                           <p className="text-xs text-ig-text-2 truncate max-w-[200px]">{newMsg.content}</p>
                        </div>
                     </div>
                  ), { duration: 5000 });
                  
                  // Trigger local push notification for Android
                  if (Capacitor.isNativePlatform()) {
                    try {
                      LocalNotifications.schedule({
                        notifications: [
                          {
                            title: `${sender.name} sent a message`,
                            body: newMsg.content,
                            id: Math.floor(Math.random() * 2147483647),
                            schedule: { at: new Date(Date.now() + 100) }, // Trigger immediately
                            actionTypeId: '',
                            extra: {
                              data: '/dashboard/messages'
                            }
                          }
                        ]
                      });
                    } catch (err) {
                      console.error('Failed to schedule local notification', err);
                    }
                  }
               }
            }
          }
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: HiOutlineHome, activeIcon: HiHome, label: 'Home' },
    { to: '/dashboard/explore', icon: HiOutlineSearch, activeIcon: HiSearch, label: 'Search' },
    { to: '/dashboard/upload', icon: HiOutlinePlusCircle, activeIcon: HiPlusCircle, label: 'Create' },
    { to: '/dashboard/bookmarks', icon: HiOutlineBookmark, activeIcon: HiBookmark, label: 'Saved' },
    { to: '/dashboard/pdf-tools', icon: HiOutlineBookOpen, activeIcon: HiOutlineBookOpen, label: 'PDF Tools' },
    { to: '/dashboard/messages', icon: HiOutlineChat, activeIcon: HiChat, label: 'Messages', badge: unreadMessagesCount },
    { to: `/dashboard/profile/${user?._id}`, icon: HiOutlineUser, activeIcon: HiUser, label: 'Profile' },
  ];

  // Mobile bottom nav: Home, Search, Create, Notifications, Profile
  const mobileBottomItems = [
    navItems[0], // Home
    navItems[1], // Search
    navItems[2], // Create
    navItems[5], // Messages
    navItems[6], // Profile
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 md:p-4">
      {/* Desktop Sidebar - Liquid Glass Pill */}
      <aside className="hidden md:flex flex-col w-[245px] xl:w-[320px] fixed h-[calc(100vh-32px)] z-30 transition-all duration-300 overflow-hidden"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
          WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
          border: '1px solid var(--glass-border)',
          borderRadius: '32px',
          boxShadow: '8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light), inset 0 1px 0 var(--glass-highlight)',
        }}
      >
        {/* Specular highlight edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent, var(--glass-highlight), transparent)' }} />
        
        {/* Logo */}
        <div className="px-6 pt-5 pb-3">
          <h1
            className="text-2xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={logoImg} alt="Scholars Hub" className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: '3px 3px 6px var(--neu-shadow-dark), -3px -3px 6px var(--neu-shadow-light)' }} />
            <span>
              Scholars<span className="gradient-text">Hub</span>
            </span>
          </h1>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <item.activeIcon className="w-6 h-6" />
                  ) : (
                    <item.icon className="w-6 h-6" />
                  )}
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-ag-badge text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* External Links */}
          <div className="pt-2 mt-2 border-t border-white/10 space-y-0.5">


            <a href="https://nptel.ac.in/courses" target="_blank" rel="noopener noreferrer" 
               className="group relative flex items-center gap-3 w-full p-3 my-2 rounded-[16px] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
               style={{
                 background: 'linear-gradient(135deg, #1a73e8, #4285f4, #8AB4F8)',
                 boxShadow: '4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.25)',
               }}
            >
              {/* Glass overlay for depth */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
              
              <HiOutlineAcademicCap className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
              <div className="hidden xl:flex flex-col relative z-10">
                <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">NPTEL Core</span>
                <span className="text-white/80 text-[10px] font-medium uppercase tracking-wider">Free Courses</span>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[slideInRight_1s_ease-in-out] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            </a>
          </div>
        </div>

        {/* Bottom section — always visible */}
        <div className="px-3 py-2 space-y-0.5 border-t border-white/10 hidden">
        </div>

        {/* User info */}
        <div
          className="px-3 pb-2 cursor-pointer"
          onClick={() => navigate(`/dashboard/profile/${user?._id}`)}
        >
          <div className="flex items-center gap-3 p-3 rounded-ag transition-all duration-200"
            style={{
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--glass-bg)';
              e.currentTarget.style.boxShadow = '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="w-[46px] h-[46px] flex-shrink-0 rounded-full p-[2px] bg-gradient-to-br from-ig-primary via-purple-500 to-pink-500"
              style={{ boxShadow: '3px 3px 6px var(--neu-shadow-dark), -3px -3px 6px var(--neu-shadow-light)' }}
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.name}&background=1e3a5f&color=fbbf24`; }}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover border-[2px] shadow-sm"
                style={{ borderColor: 'var(--neu-bg)' }}
              />
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="font-semibold text-sm truncate text-ig-text dark:text-ig-text-light">{user?.name}</p>
              <p className="text-xs text-ig-text-2 truncate">{user?.school || 'Student'}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="p-2 ml-auto text-ig-text-2 hover:text-ig-error hover:bg-ig-error/10 rounded-full transition-colors hidden xl:block"
              title="Log out"
            >
              <HiLogout className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="px-6 pb-2 hidden xl:block">
          <div className="flex items-center gap-1.5 mb-1.5">
            <HiUserGroup className="w-3.5 h-3.5 text-ag-primary" />
            <span className="text-[11px] font-semibold text-ig-text dark:text-ig-text-light">{totalUsers}</span>
            <span className="text-[10px] text-ig-text-2">scholars using this platform</span>
          </div>
          <p className="text-[10px] text-ig-text-2 leading-relaxed">
            By <span className="font-semibold">Nitish Kumar Sahu</span> · <a href="mailto:nitishkumarshah92@gmail.com" className="text-ag-primary hover:underline">Report an issue</a>
          </p>
        </div>
      </aside>

      {/* Mobile Top Header — Liquid Glass */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 transition-all duration-300"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: `blur(24px) saturate(200%)`,
          WebkitBackdropFilter: `blur(24px) saturate(200%)`,
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          className="text-xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logoImg} alt="Scholars Hub" className="w-7 h-7 rounded-full object-cover" />
          <span>
            Scholars<span className="gradient-text">Hub</span>
          </span>
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-full text-ig-text dark:text-ig-text-light opacity-70 hover:opacity-100 transition-colors"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '2px 2px 5px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {darkMode ? <HiSun className="w-6 h-6" /> : <HiMoon className="w-6 h-6" />}
          </button>
          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `p-2 rounded-full transition-all relative ${isActive ? 'text-ig-text dark:text-ig-text-light' : 'text-ig-text dark:text-ig-text-light opacity-70 hover:opacity-100'}`
            }
          >
            <HiOutlineBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-ag-badge text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        </div>
      </header>

      {/* Mobile More Menu — Glass Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          {/* Slide-in panel — Liquid Glass */}
          <div className="relative ml-auto w-72 h-full flex flex-col animate-slide-in-right"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
              WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
              borderLeft: '1px solid var(--glass-border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.2), inset 1px 0 0 var(--glass-highlight)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="font-heading font-semibold text-ig-text dark:text-ig-text-light">More</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-full text-ig-text dark:text-ig-text-light hover:bg-white/10 transition-colors">
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {/* All nav items accessible from More menu */}
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-ag-sm transition-all ${isActive ? 'font-semibold' : ''} text-ig-text dark:text-ig-text-light`}
                  style={({ isActive }) => isActive ? {
                    background: 'var(--glass-bg)',
                    boxShadow: 'inset 3px 3px 8px var(--neu-shadow-dark), inset -3px -3px 8px var(--neu-shadow-light)',
                  } : {}}
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <item.activeIcon className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <span className="ml-auto bg-ag-badge text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              <div style={{ borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

              {/* External Links */}


              <a href="https://nptel.ac.in/courses" target="_blank" rel="noopener noreferrer" 
                 className="relative overflow-hidden flex items-center gap-3 px-4 py-3 mt-4 rounded-xl"
                 style={{
                   background: 'linear-gradient(135deg, #1a73e8, #4285f4, #8AB4F8)',
                   boxShadow: '4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.25)',
                 }}
              >
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                <HiOutlineAcademicCap className="w-6 h-6 text-white relative z-10" />
                <div className="flex flex-col relative z-10">
                  <span className="text-white font-bold text-sm">NPTEL Core</span>
                  <span className="text-white/80 text-[10px] font-medium uppercase">Free Courses</span>
                </div>
              </a>

              <div style={{ borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

              {/* Get the App */}
              <a href="/scholars-hub.apk" download className="flex items-center gap-3 px-3 py-2.5 rounded-ag-sm text-ag-primary font-bold w-full transition-colors hover:bg-white/5">
                <HiDownload className="w-5 h-5" />
                <span>Get the App</span>
              </a>

            </div>

            {/* User info at bottom of menu */}
            <div className="px-3 py-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <div
                className="flex items-center gap-3 p-3 rounded-ag cursor-pointer transition-all"
                onClick={() => { navigate(`/dashboard/profile/${user?._id}`); setMobileMenuOpen(false); }}
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.name}&background=1e3a5f&color=fbbf24`; }}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-ig-text dark:text-ig-text-light">{user?.name}</p>
                  <p className="text-xs text-ig-text-2 truncate">{user?.school || 'Student'}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLogout(); setMobileMenuOpen(false); }} 
                  className="p-2 ml-auto text-ig-text-2 hover:text-ig-error hover:bg-ig-error/10 rounded-full transition-colors"
                >
                  <HiLogout className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Liquid Glass Window */}
      <main className="flex-1 md:ml-[260px] xl:ml-[340px] md:h-[calc(100vh-32px)] overflow-y-auto overflow-x-hidden pb-16 md:pb-0 pt-14 md:pt-0 relative md:rounded-[32px]"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: `blur(16px) saturate(160%)`,
          WebkitBackdropFilter: `blur(16px) saturate(160%)`,
          border: 'none',
          borderRadius: undefined,
          boxShadow: 'none',
        }}
      >
        {/* Desktop: glass border + shadow only on md+ */}
        <style>{`
          @media (min-width: 768px) {
            .main-glass-panel {
              border: 1px solid var(--glass-border) !important;
              box-shadow: 8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light), inset 0 1px 0 var(--glass-highlight) !important;
            }
          }
        `}</style>
        {/* Desktop Top Right Actions */}
        <div className="hidden md:flex fixed top-8 right-10 z-40 items-center gap-4">
          <a href="/scholars-hub.apk" download className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-ag-pill transition-all"
            style={{
              background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
              boxShadow: '4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <HiDownload className="w-4 h-4" />
            Get App
          </a>
          <button onClick={toggleTheme} className="p-2.5 rounded-full text-ig-text dark:text-ig-text-light transition-all"
            style={{ boxShadow: '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' }}
          >
            {darkMode ? <HiSun className="w-6 h-6" /> : <HiMoon className="w-6 h-6" />}
          </button>
          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `relative p-2.5 rounded-full transition-all text-ig-text dark:text-ig-text-light`
            }
            style={({ isActive }) => ({
              boxShadow: isActive
                ? 'inset 3px 3px 8px var(--neu-shadow-dark), inset -3px -3px 8px var(--neu-shadow-light)'
                : '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive ? <HiBell className="w-6 h-6" /> : <HiOutlineBell className="w-6 h-6" />}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-ag-badge text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="max-w-6xl mx-auto px-0 xl:px-8 py-4 xl:py-12 w-full">
          <Outlet />
        </div>
      </main>



      {/* Mobile Bottom Nav — Liquid Glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around py-2 px-1 safe-area-pb transition-all duration-300"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: `blur(24px) saturate(200%)`,
          WebkitBackdropFilter: `blur(24px) saturate(200%)`,
          borderTop: '1px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {mobileBottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive
                ? 'text-ig-text dark:text-ig-text-light'
                : 'text-ig-text dark:text-ig-text-light opacity-50 hover:opacity-80'
              }`
            }
            style={({ isActive }) => isActive ? {
              boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
              background: 'var(--glass-bg)',
            } : {}}
          >
            {({ isActive }) => (
              <div className="relative">
                {isActive ? (
                  <item.activeIcon className="w-7 h-7" />
                ) : (
                  <item.icon className="w-7 h-7" />
                )}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ag-badge text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
        {/* 3-dot More button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all text-ig-text dark:text-ig-text-light opacity-50 hover:opacity-80"
        >
          <HiDotsHorizontal className="w-7 h-7" />
        </button>
      </nav>
    </div>
  );
}
