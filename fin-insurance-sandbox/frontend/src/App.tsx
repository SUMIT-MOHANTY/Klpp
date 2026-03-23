import React from 'react';
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
    return <div>Loading...</div>;
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
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<Layout />}>
          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <Routes>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  {/* Add more admin routes here */}
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Underwriter routes */}
          <Route
            path="/underwriter/*"
            element={
              <ProtectedRoute allowedRoles={[Role.UNDERWRITER]}>
                <Routes>
                  <Route index element={<Navigate to="/underwriter/dashboard" replace />} />
                  <Route path="dashboard" element={<UnderwriterDashboard />} />
                  {/* Add more underwriter routes here */}
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Agent routes */}
          <Route
            path="/agent/*"
            element={
              <ProtectedRoute allowedRoles={[Role.AGENT]}>
                <Routes>
                  <Route index element={<Navigate to="/agent/dashboard" replace />} />
                  <Route path="dashboard" element={<AgentDashboard />} />
                  {/* Add more agent routes here */}
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Customer routes */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={[Role.CUSTOMER]}>
                <Routes>
                  <Route index element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="dashboard" element={<CustomerDashboard />} />
                  {/* Add more customer routes here */}
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
