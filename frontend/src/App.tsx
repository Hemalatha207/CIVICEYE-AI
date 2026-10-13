import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

/* Shared animated loading screen */
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d1a2e 0%, #050c18 60%, #020810 100%)' }}
  >
    {/* Outer spinning ring */}
    <div className="relative flex items-center justify-center mb-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        className="absolute w-20 h-20 rounded-full"
        style={{ border: '2px solid transparent', borderTopColor: '#14B8A6', borderRightColor: 'rgba(20,184,166,0.2)' }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        className="absolute w-14 h-14 rounded-full"
        style={{ border: '2px solid transparent', borderTopColor: '#8B5CF6', borderLeftColor: 'rgba(139,92,246,0.2)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}
      >
        <Shield className="w-5 h-5 text-white" />
      </motion.div>
    </div>
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-sm font-semibold"
      style={{ color: '#64748B' }}
    >
      {message}
    </motion.p>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: '120px' }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className="mt-3 h-0.5 rounded-full"
      style={{ background: 'linear-gradient(90deg, transparent, #14B8A6, transparent)' }}
    />
  </div>
);

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportIssue } from './pages/citizen/ReportIssue';
import { CitizenReports } from './pages/citizen/CitizenReports';
import { CitizenIssueDetail } from './pages/citizen/CitizenIssueDetail';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerIssues } from './pages/manager/ManagerIssues';
import { ManagerIssueDetail } from './pages/manager/ManagerIssueDetail';
import { ManagerMap } from './pages/manager/ManagerMap';
import { ManagerWorkOrders } from './pages/manager/ManagerWorkOrders';
import { ManagerStaff } from './pages/manager/ManagerStaff';
import { ManagerAnalytics } from './pages/manager/ManagerAnalytics';
import { ManagerReports } from './pages/manager/ManagerReports';
import { ManagerAuditLogs } from './pages/manager/ManagerAuditLogs';
import { AdminManagers } from './pages/manager/AdminManagers';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'MANAGER' | 'CITIZEN' }> = ({
  children,
  requiredRole,
}) => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing CivicEye AI Command Center..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'MANAGER' && !isManager) {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return <>{children}</>;
};

// Index redirect based on role
const RootRedirect: React.FC = () => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return <LoadingScreen message="Connecting to Civic Command Center..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return isManager ? <Navigate to="/manager/dashboard" replace /> : <Navigate to="/citizen/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Citizen Routes */}
            <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
            <Route path="/citizen/report" element={<ReportIssue />} />
            <Route path="/citizen/my-reports" element={<CitizenReports />} />
            <Route path="/citizen/report/:id" element={<CitizenIssueDetail />} />

            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/issues"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerIssues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/issues/:id"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerIssueDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/map"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerMap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/work-orders"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerWorkOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/staff"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/analytics"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/reports"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/audit-logs"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/managers"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <AdminManagers />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
