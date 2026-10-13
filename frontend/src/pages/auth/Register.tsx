import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, User, Mail, Lock, Phone, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { AstraCanvas } from '../../components/ui/AstraCanvas';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 4 Civic Center');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        phone_number: phone,
        address,
        ward,
        role: 'CITIZEN',
      });
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/40 outline-none transition shadow-inner focus:ring-2 focus:ring-[#14B8A6] focus:border-teal-400";
  const inputStyle = {
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.12)',
  };
  const labelClass = "block text-xs font-bold text-white/90 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1a2e 0%, #050c18 60%, #020810 100%)' }}
    >
      {/* Astra interactive stars */}
      <AstraCanvas density={1.1} />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

      {/* Pulsing center glow */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.07, 0.18, 0.07] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: '#14B8A6' }}
      />

      {/* Registration card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg space-y-5 relative z-10 text-white"
        style={{
          background: 'rgba(5, 14, 30, 0.5)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.75rem',
          padding: '2.5rem',
          boxShadow: '0 8px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-13 h-13 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(15,118,110,0.6), rgba(20,184,166,0.3))',
              border: '1px solid rgba(20,184,166,0.35)',
              width: '52px', height: '52px',
            }}
          >
            <Shield className="w-6 h-6" style={{ color: '#14B8A6' }} />
          </motion.div>

          <h2 className="text-2xl font-black text-white tracking-tight">Citizen Registration</h2>
          <p className="text-xs mt-1.5 font-medium" style={{ color: '#94A3B8' }}>
            Join the smart civic reporting platform to improve your neighborhood.
          </p>

          {/* Decorative line */}
          <div className="mt-4 h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.4), transparent)' }} />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl font-medium text-xs"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3.5" style={{ color: '#14B8A6' }} />
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className={inputClass} style={inputStyle} placeholder="Jane Doe" />
            </div>
          </motion.div>

          {/* Email */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5" style={{ color: '#14B8A6' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} style={inputStyle} placeholder="jane.doe@example.com" />
            </div>
          </motion.div>

          {/* Password + Phone */}
          <motion.div
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5" style={{ color: '#14B8A6' }} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3.5" style={{ color: '#14B8A6' }} />
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="+1 (555) 012-3456" />
              </div>
            </div>
          </motion.div>

          {/* Address + Ward */}
          <motion.div
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className={labelClass}>Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3.5" style={{ color: '#14B8A6' }} />
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="450 Broadway Ave" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Civic Ward</label>
              <select value={ward} onChange={e => setWard(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition focus:ring-2 focus:ring-[#14B8A6]"
                style={{ ...inputStyle, background: 'rgba(0,0,0,0.5)' }}
              >
                {['Ward 1 Downtown','Ward 2 Harbor','Ward 3 North','Ward 4 Civic Center','Ward 5 University','Ward 6 Tech Corridor'].map(w => (
                  <option key={w} value={w} className="bg-slate-900 text-white">{w}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <Button type="submit" variant="teal" size="lg"
              className="w-full mt-1 font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-400/40"
              isLoading={loading}
            >
              Create Citizen Account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#14B8A6' }} />
          <p className="text-xs" style={{ color: '#64748B' }}>
            Already registered?{' '}
            <Link to="/login" className="font-bold underline underline-offset-4 hover:opacity-80 transition"
              style={{ color: '#14B8A6' }}>
              Sign In here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
