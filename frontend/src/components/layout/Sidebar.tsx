import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, AlertCircle, MapPin, ClipboardList,
  Users, BarChart3, FileText, History, PlusCircle, FolderOpen, Shield, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  highlight?: boolean;
  color?: string;
}

export const Sidebar: React.FC = () => {
  const { isManager, isAdmin } = useAuth();

  const managerLinks: NavItem[] = [
    { name: 'Dashboard',        path: '/manager/dashboard',   icon: LayoutDashboard, color: '#14B8A6' },
    { name: 'Civic Issues',     path: '/manager/issues',      icon: AlertCircle,     color: '#FF6B6B' },
    { name: 'Smart City Map',   path: '/manager/map',         icon: MapPin,          color: '#3B82F6' },
    { name: 'Work Orders',      path: '/manager/work-orders', icon: ClipboardList,   color: '#F59E0B' },
    { name: 'Staff Management', path: '/manager/staff',       icon: Users,           color: '#8B5CF6' },
    { name: 'Analytics',        path: '/manager/analytics',   icon: BarChart3,       color: '#14B8A6' },
    { name: 'Reports Export',   path: '/manager/reports',     icon: FileText,        color: '#94A3B8' },
    { name: 'Audit Logs',       path: '/manager/audit-logs',  icon: History,         color: '#64748B' },
    ...(isAdmin ? [{ name: 'Managers Directory', path: '/manager/managers', icon: Shield, color: '#8B5CF6' }] : []),
  ];

  const citizenLinks: NavItem[] = [
    { name: 'My Dashboard',    path: '/citizen/dashboard',  icon: LayoutDashboard, color: '#14B8A6' },
    { name: 'Report An Issue', path: '/citizen/report',     icon: PlusCircle,      color: '#FF6B6B', highlight: true },
    { name: 'My Submissions',  path: '/citizen/my-reports', icon: FolderOpen,      color: '#8B5CF6' },
  ];

  const links = isManager ? managerLinks : citizenLinks;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-60 min-h-[calc(100vh-3.5rem)] flex flex-col shrink-0 relative"
      style={{
        background: 'rgba(6,13,26,0.85)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <Zap className="w-3 h-3" style={{ color: '#14B8A6' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748B' }}>
            {isManager ? 'Command Navigation' : 'Citizen Services'}
          </span>
        </div>
      </div>

      {/* Nav links */}
      <div className="px-3 flex-1 space-y-0.5">
        {links.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative overflow-hidden ${
                    isActive ? 'text-white' : 'hover:text-white'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive
                    ? `linear-gradient(135deg, ${link.color}22, ${link.color}15)`
                    : link.highlight
                    ? 'rgba(255,107,107,0.08)'
                    : 'transparent',
                  border: isActive
                    ? `1px solid ${link.color}30`
                    : link.highlight
                    ? '1px solid rgba(255,107,107,0.2)'
                    : '1px solid transparent',
                  color: isActive ? '#fff' : link.highlight ? '#FF6B6B' : '#94A3B8',
                })}
              >
                {/* Active left bar */}
                <NavLink to={link.path}>
                  {({ isActive }) =>
                    isActive ? (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: link.color }} />
                    ) : null
                  }
                </NavLink>

                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                  style={{ color: link.color }} />
                <span className="truncate">{link.name}</span>

                {/* Hover glow */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                  style={{ background: `radial-gradient(circle at left, ${link.color}08, transparent 60%)` }} />
              </NavLink>
            </motion.div>
          );
        })}
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="m-3 p-3 rounded-xl text-xs relative overflow-hidden"
        style={{
          background: 'rgba(20,184,166,0.06)',
          border: '1px solid rgba(20,184,166,0.15)',
        }}
      >
        {/* Subtle glow bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(20,184,166,0.08), transparent 60%)' }} />

        <div className="flex items-center justify-between mb-1.5 relative">
          <span className="font-semibold" style={{ color: '#94A3B8' }}>Core AI Status</span>
          <span className="flex items-center gap-1.5 font-bold" style={{ color: '#22C55E' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            ONLINE
          </span>
        </div>
        <p className="text-[10px] leading-relaxed relative" style={{ color: '#64748B' }}>
          YOLOv8 Civic Engine • Leaflet GIS • MySQL 8.0
        </p>
      </motion.div>
    </motion.aside>
  );
};
