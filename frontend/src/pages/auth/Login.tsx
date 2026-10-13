import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { AstraCanvas } from '../../components/ui/AstraCanvas';


export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(email, password);
      const isStaffOrAdmin = loggedUser?.roles?.some((r: any) =>
        ['MANAGER', 'ADMIN'].includes(r.name?.toUpperCase())
      );
      if (isStaffOrAdmin) {
        navigate('/manager/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#070D18]">
      {/* Left Brand Panel */}
      <div className="md:w-1/2 relative p-8 md:p-16 flex flex-col justify-between text-white overflow-hidden bg-[#070D18]">
        {/* Futuristic Smart City Background Image */}
        <img
          src="/smart-city-bg.jpg"
          alt="CivicEye Smart City Command Center"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070D18]/90 via-[#0A262E]/78 to-[#0F766E]/55 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,107,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-[#070D18]/50" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                CIVICEYE <span className="text-[#FF6B6B]">AI</span>
              </span>
              <p className="text-xs uppercase font-bold tracking-widest text-teal-200">
                Smart City Command Center
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-teal-100 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
              Intelligent Civic Issue Management Platform
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Smarter Cities Start With Better Visibility.
            </h1>

            <p className="text-slate-200 text-sm md:text-base leading-relaxed">
              "See the Problem. Understand It. Fix It." Report, triage, verify, and track civic issues end-to-end with high-precision computer vision and workforce coordination.
            </p>

            <div className="pt-4 space-y-3">
              {[
                'YOLOv8 Computer Vision Category & Severity Detection',
                'Manager Verification, Priority & Dispatch Workflow',
                'Visual Before & After Evidence Verification',
                'Citizen Transparency & Interactive Satisfaction Feedback',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-teal-50">
                  <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-teal-100 flex items-center justify-between">
          <span>Metropolitan Civic Intelligence v1.0</span>
          <span>© {new Date().getFullYear()} CivicEye AI</span>
        </div>
      </div>

      {/* Right Login Form — deep space background + Astra stars */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #0d1a2e 0%, #050c18 60%, #020810 100%)' }}
      >
        {/* ✨ Astra-style interactive star canvas */}
        <AstraCanvas />

        {/* Subtle radial glow at center */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(20,184,166,0.07) 0%, transparent 65%)' }}
        />

        {/* Ambient Pulsing Glow Animation */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-96 h-96 bg-[#14B8A6]/20 rounded-full blur-3xl pointer-events-none"
        />

        {/* Transparent Glassmorphism Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md space-y-6 relative z-10 text-white"
          style={{
            background: 'rgba(5, 14, 30, 0.45)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            boxShadow: '0 8px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">Sign In to CivicEye</h2>
            <p className="text-sm text-white/80 mt-1 font-medium">
              Enter your credentials to access the platform.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/70 border border-red-500/50 text-red-100 text-xs rounded-xl font-medium shadow-md"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-300 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-[#14B8A6] focus:border-teal-400 outline-none transition shadow-inner"
                  style={{ backdropFilter: 'blur(8px)' }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-teal-300 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-[#14B8A6] focus:border-teal-400 outline-none transition shadow-inner"
                  style={{ backdropFilter: 'blur(8px)' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/80 font-medium cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-white/30 bg-black/40 text-[#14B8A6] focus:ring-[#14B8A6]" />
                Remember me
              </label>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" variant="teal" size="lg" className="w-full font-bold shadow-lg shadow-teal-500/30 hover:shadow-teal-400/50" isLoading={loading}>
                Sign In to Command Center <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </form>

          {/* Science Expo Demo Account Quick Buttons */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                Science Expo Demo Accounts (1-Click)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => { setEmail('admin@civiceye.local'); setPassword('password123'); }}
                className="p-2.5 rounded-xl border border-purple-400/30 bg-purple-950/40 hover:bg-purple-900/60 hover:border-purple-300 transition text-left shadow-xs"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">👑 Admin</div>
                <div className="text-xs font-bold text-white truncate">admin@...</div>
                <div className="text-[10px] text-white/70">password123</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => { setEmail('manager@civiceye.local'); setPassword('password123'); }}
                className="p-2.5 rounded-xl border border-teal-400/30 bg-teal-950/40 hover:bg-teal-900/60 hover:border-teal-300 transition text-left shadow-xs"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">🛠️ Manager</div>
                <div className="text-xs font-bold text-white truncate">manager@...</div>
                <div className="text-[10px] text-white/70">password123</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => { setEmail('citizen@civiceye.local'); setPassword('password123'); }}
                className="p-2.5 rounded-xl border border-blue-400/30 bg-blue-950/40 hover:bg-blue-900/60 hover:border-blue-300 transition text-left shadow-xs"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">👤 Citizen</div>
                <div className="text-xs font-bold text-white truncate">citizen@...</div>
                <div className="text-[10px] text-white/70">password123</div>
              </motion.button>
            </div>
          </div>

          <p className="text-center text-xs text-white/70">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-300 hover:text-teal-200 font-bold underline underline-offset-4">
              Register as Citizen
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
