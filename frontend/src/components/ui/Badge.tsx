import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'coral' | 'teal' | 'amber' | 'blue' | 'slate' | 'green';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'teal', size = 'md' }) => {
  const variantStyles = {
    coral: 'bg-[#FFF0F0] text-[#E85D5D] border border-[#FF6B6B]/30',
    teal: 'bg-[#E6FFFB] text-[#0F766E] border border-[#14B8A6]/30',
    amber: 'bg-amber-50 text-amber-700 border border-amber-300',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold rounded-full',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide rounded-md uppercase',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 transition-all ${sizeStyles[size]} ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  if (['RESOLVED', 'CLOSED', 'COMPLETED', 'VERIFIED'].includes(norm)) {
    return <Badge variant="teal">{norm.replace('_', ' ')}</Badge>;
  }
  if (['REPORTED', 'PENDING_REVIEW', 'SUBMITTED', 'PENDING'].includes(norm)) {
    return <Badge variant="amber">{norm.replace('_', ' ')}</Badge>;
  }
  if (['ASSIGNED', 'IN_PROGRESS', 'WORK_STARTED', 'UNDER_REVIEW'].includes(norm)) {
    return <Badge variant="blue">{norm.replace('_', ' ')}</Badge>;
  }
  if (['REOPENED', 'REJECTED', 'CANCELLED', 'CRITICAL', 'SUSPENDED'].includes(norm)) {
    return <Badge variant="coral">{norm.replace('_', ' ')}</Badge>;
  }
  return <Badge variant="slate">{norm.replace('_', ' ')}</Badge>;
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const norm = priority?.toUpperCase() || 'MEDIUM';

  if (norm === 'CRITICAL' || norm === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0F0] text-[#E85D5D] border border-[#FF6B6B]/40 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse"></span>
        {norm}
      </span>
    );
  }
  if (norm === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        {norm}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {norm}
    </span>
  );
};
