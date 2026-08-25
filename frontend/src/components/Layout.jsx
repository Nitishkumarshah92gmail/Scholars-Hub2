import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, lazy, Suspense } from 'react';
import { getNotifications, getTotalUsers } from '../api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import { LocalNotifications } from '@capacitor/local-notifications';


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
      try {
        const { display } = await LocalNotifications.requestPermissions();
        console.log('LocalNotifications permission:', display);
      } catch (err) {
        console.error('Failed to request notification permissions', err);
      }
    };
    requestPushPermissions();

    // Listen for notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      const data = notificationAction.notification.extra?.data;
      if (data) {
        navigate(data);
      }
    });

    return () => { 
      clearInterval(notifInterval); 
      clearInterval(usersInterval); 
      LocalNotifications.removeAllListeners();
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadMessagesCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .neq('sender_id', user._id);
      if (count !== null) setUnreadMessagesCount(count);
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
                        <img src={sender.avatar || `https://ui-avatars.com/api/?name=${sender.name}`} className="w-10 h-10 rounded-full object-cover" />
                        <div className="min-w-0">
                           <p className="font-bold text-sm text-ig-text dark:text-ig-text-light truncate">{sender.name} sent a message</p>
                           <p className="text-xs text-ig-text-2 truncate max-w-[200px]">{newMsg.content}</p>
                        </div>
                     </div>
                  ), { duration: 5000 });
                  
                  // Trigger local push notification for Android
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
    <div className="min-h-screen flex flex-col md:flex-row bg-ig-bg-2 dark:bg-ig-bg-dark">
      {/* Desktop Sidebar — Instagram-style */}
      <aside className="hidden md:flex flex-col w-[245px] xl:w-[335px] fixed h-full bg-ig-bg dark:bg-ig-bg-dark border-r border-ig-separator dark:border-ig-separator-dark z-30">
        {/* Logo */}
        <div className="px-6 pt-5 pb-3">
          <h1
            className="text-2xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={logoImg} alt="Scholars Hub" className="w-9 h-9 rounded-full object-cover" />
            <span>
              Scholars<span className="gradient-text"> Hub</span>
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
                    <span className="ml-auto bg-ig-badge text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* External Links */}
          <div className="pt-2 mt-2 border-t border-ig-separator/30 dark:border-ig-separator-dark/30 space-y-0.5">


            <a href="https://nptel.ac.in/courses" target="_blank" rel="noopener noreferrer" className="nav-link w-full">
              <HiOutlineAcademicCap className="w-6 h-6" />
              <span className="hidden xl:inline">NPTEL Courses</span>
            </a>
          </div>
        </div>

        {/* Bottom section — always visible */}
        <div className="px-3 py-2 space-y-0.5 border-t border-ig-separator/30 dark:border-ig-separator-dark/30">
          <a href="/scholars-hub.apk" download className="nav-link w-full text-ig-primary hover:text-ig-primary">
            <HiDownload className="w-6 h-6" />
            <span className="hidden xl:inline font-bold">Get the App</span>
          </a>
          <button onClick={toggleTheme} className="nav-link w-full">
            {darkMode ? <HiSun className="w-6 h-6" /> : <HiMoon className="w-6 h-6" />}
            <span className="hidden xl:inline">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="nav-link w-full text-ig-error hover:text-ig-error">
            <HiLogout className="w-6 h-6" />
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>

        {/* User info */}
        <div
          className="px-3 pb-2 cursor-pointer"
          onClick={() => navigate(`/dashboard/profile/${user?._id}`)}
        >
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated transition-colors">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="font-semibold text-sm truncate text-ig-text dark:text-ig-text-light">{user?.name}</p>
              <p className="text-xs text-ig-text-2 truncate">{user?.school || 'Student'}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="px-6 pb-2 hidden xl:block">
          <div className="flex items-center gap-1.5 mb-1.5">
            <HiUserGroup className="w-3.5 h-3.5 text-ig-primary" />
            <span className="text-[11px] font-semibold text-ig-text dark:text-ig-text-light">{totalUsers}</span>
            <span className="text-[10px] text-ig-text-2">scholars using this platform</span>
          </div>
          <p className="text-[10px] text-ig-text-2 leading-relaxed">
            By <span className="font-semibold">Nitish Kumar Sahu</span> · <a href="mailto:nitishkumarshah92@gmail.com" className="text-ig-primary hover:underline">Report an issue</a>
          </p>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-ig-bg dark:bg-ig-bg-dark border-b border-ig-separator dark:border-ig-separator-dark z-30 flex items-center justify-between px-4 py-2.5">
        <h1
          className="text-xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logoImg} alt="Scholars Hub" className="w-7 h-7 rounded-full object-cover" />
          <span>
            Scholars<span className="gradient-text"> Hub</span>
          </span>
        </h1>
        <NavLink
          to="/dashboard/notifications"
          className={({ isActive }) =>
            `p-2 rounded-lg transition-colors relative ${isActive ? 'text-ig-text dark:text-ig-text-light' : 'text-ig-text dark:text-ig-text-light opacity-70'}`
          }
        >
          <HiOutlineBell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-ig-badge text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </header>

      {/* Mobile More Menu — Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          {/* Slide-in panel */}
          <div className="relative ml-auto w-72 h-full bg-ig-bg dark:bg-ig-bg-dark shadow-xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ig-separator dark:border-ig-separator-dark">
              <span className="font-semibold text-ig-text dark:text-ig-text-light">More</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-ig-text dark:text-ig-text-light hover:bg-gray-100 dark:hover:bg-ig-bg-elevated">
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
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-gray-100 dark:bg-ig-bg-elevated font-semibold' : 'hover:bg-gray-100 dark:hover:bg-ig-bg-elevated'} text-ig-text dark:text-ig-text-light`}
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <item.activeIcon className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <span className="ml-auto bg-ig-badge text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="border-t border-ig-separator/30 dark:border-ig-separator-dark/30 my-2" />

              {/* External Links */}


              <a href="https://nptel.ac.in/courses" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated text-ig-text dark:text-ig-text-light">
                <HiOutlineAcademicCap className="w-5 h-5" />
                <span>NPTEL Courses</span>
              </a>

              <div className="border-t border-ig-separator/30 dark:border-ig-separator-dark/30 my-2" />

              {/* Get the App */}
              <a href="/scholars-hub.apk" download className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated text-ig-primary font-bold w-full">
                <HiDownload className="w-5 h-5" />
                <span>Get the App</span>
              </a>

              {/* Theme Toggle */}
              <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated text-ig-text dark:text-ig-text-light w-full">
                {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {/* Logout */}
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated text-ig-error w-full">
                <HiLogout className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </div>

            {/* User info at bottom of menu */}
            <div className="px-3 py-3 border-t border-ig-separator/30 dark:border-ig-separator-dark/30">
              <div
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-ig-bg-elevated cursor-pointer"
                onClick={() => { navigate(`/dashboard/profile/${user?._id}`); setMobileMenuOpen(false); }}
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-ig-text dark:text-ig-text-light">{user?.name}</p>
                  <p className="text-xs text-ig-text-2 truncate">{user?.school || 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[245px] xl:ml-[335px] pb-16 md:pb-0 pt-14 md:pt-0 relative">
        {/* Desktop Top Right Actions */}
        <div className="hidden md:flex fixed top-4 right-6 z-40 items-center gap-4">
          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `relative p-2.5 rounded-full transition-colors ${isActive ? 'bg-gray-100 dark:bg-ig-bg-elevated' : 'hover:bg-gray-100 dark:hover:bg-ig-bg-elevated'} text-ig-text dark:text-ig-text-light`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <HiBell className="w-6 h-6" /> : <HiOutlineBell className="w-6 h-6" />}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-ig-badge text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="max-w-[630px] mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>



      {/* Mobile Bottom Nav — Instagram-style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ig-bg dark:bg-ig-bg-dark border-t border-ig-separator dark:border-ig-separator-dark z-30 flex justify-around py-2 px-1 safe-area-pb">
        {mobileBottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${isActive
                ? 'text-ig-text dark:text-ig-text-light'
                : 'text-ig-text dark:text-ig-text-light opacity-60'
              }`
            }
          >
            {({ isActive }) => (
              <div className="relative">
                {isActive ? (
                  <item.activeIcon className="w-7 h-7" />
                ) : (
                  <item.icon className="w-7 h-7" />
                )}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ig-badge text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
          className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors text-ig-text dark:text-ig-text-light opacity-60"
        >
          <HiDotsHorizontal className="w-7 h-7" />
        </button>
      </nav>
    </div>
  );
}
