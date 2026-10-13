import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AstraCanvas } from '../ui/AstraCanvas';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0d1a2e 0%, #060D1A 55%, #020810 100%)' }}
    >
      {/* Global Astra star field behind everything */}
      <AstraCanvas density={0.7} repulseRadius={110} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Ambient static glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', zIndex: 0 }} />

      {/* Navbar */}
      <div className="relative" style={{ zIndex: 40 }}>
        <Navbar />
      </div>

      <div className="flex flex-1 relative" style={{ zIndex: 10 }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Page content with enter animation */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};
