import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import UnderwriterDashboard from './pages/dashboards/UnderwriterDashboard';
import AgentDashboard from './pages/dashboards/AgentDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { Role } from './types/auth';

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case Role.ADMIN:
        return '/admin/dashboard';
      case Role.UNDERWRITER:
        return '/underwriter/dashboard';
      case Role.AGENT:
        return '/agent/dashboard';
      case Role.CUSTOMER:
        return '/customer/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <Router>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Signup />} />
          <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            {/* Admin routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <Routes>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
            {/* Underwriter routes */}
            <Route path="/underwriter/*" element={
              <ProtectedRoute allowedRoles={[Role.UNDERWRITER]}>
                <Routes>
                  <Route index element={<Navigate to="/underwriter/dashboard" replace />} />
                  <Route path="dashboard" element={<UnderwriterDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
            {/* Agent routes */}
            <Route path="/agent/*" element={
              <ProtectedRoute allowedRoles={[Role.AGENT]}>
                <Routes>
                  <Route index element={<Navigate to="/agent/dashboard" replace />} />
                  <Route path="dashboard" element={<AgentDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
            {/* Customer routes */}
            <Route path="/customer/*" element={
              <ProtectedRoute allowedRoles={[Role.CUSTOMER]}>
                <Routes>
                  <Route index element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="dashboard" element={<CustomerDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
            {/* Legacy role-based routes for compatibility */}
            <Route path="/dashboard/bank" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard/insurer" element={<Navigate to="/underwriter/dashboard" replace />} />
            <Route path="/dashboard/user/:user_id" element={<Navigate to="/customer/dashboard" replace />} />
            {/* Root redirect */}
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
