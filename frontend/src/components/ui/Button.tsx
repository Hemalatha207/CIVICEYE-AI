import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'teal' | 'coral' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    teal:      'bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-sm focus:ring-[#14B8A6]',
    coral:     'bg-[#FF6B6B] hover:bg-[#E85D5D] text-white shadow-sm focus:ring-[#FF6B6B]',
    outline:   'border border-white/20 hover:border-[#14B8A6]/60 text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm',
    secondary: 'bg-white/8 hover:bg-white/12 text-slate-300 hover:text-white border border-white/10',
    ghost:     'text-slate-400 hover:text-white hover:bg-white/8',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
