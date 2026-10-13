import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'rgba(13, 22, 40, 0.65)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            {title && <h3 className="text-lg font-bold tracking-tight" style={{ color: '#F1F5F9' }}>{title}</h3>}
            {subtitle && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
