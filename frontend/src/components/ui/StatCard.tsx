import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'coral' | 'teal' | 'amber' | 'blue' | 'slate';
  change?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'teal',
  change,
}) => {
  const borderVariants = {
    coral: 'border-l-[#FF6B6B]',
    teal:  'border-l-[#14B8A6]',
    amber: 'border-l-amber-400',
    blue:  'border-l-blue-400',
    slate: 'border-l-slate-500',
  };

  const iconBg = {
    coral: { bg: 'rgba(255,107,107,0.12)', color: '#FF6B6B' },
    teal:  { bg: 'rgba(20,184,166,0.12)',  color: '#14B8A6' },
    amber: { bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24' },
    blue:  { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
    slate: { bg: 'rgba(148,163,184,0.10)', color: '#94A3B8' },
  };

  const changeBg = {
    coral: 'rgba(255,107,107,0.12)',
    teal:  'rgba(20,184,166,0.12)',
    amber: 'rgba(245,158,11,0.12)',
    blue:  'rgba(59,130,246,0.12)',
    slate: 'rgba(148,163,184,0.10)',
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`rounded-xl p-5 flex items-center justify-between border-l-4 ${borderVariants[variant]}`}
      style={{
        background: 'rgba(13, 22, 40, 0.65)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderLeft: `4px solid ${iconBg[variant].color}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.35), 0 0 0 0 ${iconBg[variant].color}`,
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${iconBg[variant].color}22`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 4px 24px rgba(0,0,0,0.35)';
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight" style={{ color: '#F1F5F9' }}>
            {value}
          </span>
          {change && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ background: changeBg[variant], color: iconBg[variant].color }}
            >
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{subtitle}</p>}
      </div>

      <div
        className="p-3 rounded-xl shrink-0"
        style={{ background: iconBg[variant].bg, color: iconBg[variant].color }}
      >
        {icon}
      </div>
    </motion.div>
  );
};
