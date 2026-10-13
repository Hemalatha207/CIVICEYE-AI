import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Shield, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch (e) { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.readAll();
    loadNotifications();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(6,13,26,0.92)'
          : 'rgba(6,13,26,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #14B8A6, #8B5CF6, #FF6B6B, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
          >
            <Shield className="w-5 h-5 text-white relative z-10" />
            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)' }} />
          </motion.div>

          <div>
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              CIVICEYE{' '}
              <span style={{
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>AI</span>
            </span>
            <p className="text-[10px] uppercase font-bold tracking-widest"
              style={{ color: '#14B8A6' }}>
              Smart City Command Center
            </p>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" style={{ animationDuration: '1.5s' }} />
            Live
          </motion.div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl transition cursor-pointer"
              style={{ color: '#94A3B8', background: 'rgba(255,255,255,0.05)' }}
            >
              <Bell className="w-4 h-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#FF6B6B' }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl py-3 z-50"
                  style={{
                    background: 'rgba(13,22,40,0.97)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(20,184,166,0.1)',
                  }}
                >
                  <div className="px-4 pb-2.5 mb-1 flex items-center justify-between"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: '#14B8A6' }} />
                      <span className="text-sm font-bold text-white">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold hover:underline cursor-pointer"
                        style={{ color: '#14B8A6' }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs" style={{ color: '#64748B' }}>No notifications</p>
                    ) : (
                      notifications.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="p-3 text-xs cursor-pointer transition-all"
                          style={{
                            background: !n.is_read ? 'rgba(20,184,166,0.04)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                          onClick={() => { setShowNotifications(false); if (n.link) navigate(n.link); }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                              background: n.type === 'ALERT' ? '#FF6B6B' : n.type === 'WORK_ORDER' ? '#3B82F6' : '#14B8A6'
                            }} />
                            <div>
                              <p className="font-bold text-white">{n.title}</p>
                              <p className="mt-0.5" style={{ color: '#94A3B8' }}>{n.message}</p>
                              <span className="text-[10px] mt-1 block" style={{ color: '#64748B' }}>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2.5 pl-3"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="relative">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: '2px solid rgba(20,184,166,0.4)' }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E]"
                  style={{ border: '2px solid #060D1A' }} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user.full_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#14B8A6' }}>
                  {user.roles[0]?.name || 'CITIZEN'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, color: '#FF6B6B' }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg transition cursor-pointer"
                style={{ color: '#64748B' }}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login"
                className="text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
              >
                Sign In
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
