import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-2xl shadow-2xl w-full ${maxWClasses[maxWidth]} z-10 overflow-hidden flex flex-col max-h-[90vh]`}
            style={{
              background: 'rgba(8, 16, 32, 0.92)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(20,184,166,0.08)',
            }}
          >
            <div className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,22,40,0.6)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>{title}</h3>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: '#64748B' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,107,107,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ color: '#E2E8F0' }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
