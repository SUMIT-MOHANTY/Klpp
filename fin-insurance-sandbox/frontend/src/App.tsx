import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Project-wide type constants
export const ROLE = {
  BANK: 'BANK',
  INSURER: 'INSURER',
  USER: 'USER'
} as const;

// Lazy load dashboard components
const BankDashboard = React.lazy(() => import('./components/BankDashboard'));
const InsurerDashboard = React.lazy(() => import('./components/InsurerDashboard'));
const UserDashboard = React.lazy(() => import('./components/UserDashboard'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));

// AuthGuard component to handle role-based routing
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getRoleFromPath = (pathname: string): string | null => {
    if (pathname.startsWith('/dashboard/bank')) return ROLE.BANK;
    if (pathname.startsWith('/dashboard/insurer')) return ROLE.INSURER;
    if (pathname.startsWith('/dashboard/user')) return ROLE.USER;
    return null;
  };

  const isAuthenticated = () => {
    // Check for auth token or session
    return localStorage.getItem('authToken') !== null;
  };

  const getUserRole = () => {
    // Get role from localStorage or auth state
    return localStorage.getItem('userRole');
  };

  const isAuthorized = () => {
    const requiredRole = getRoleFromPath(location.pathname);
    const userRole = getUserRole();
    const authenticated = isAuthenticated();

    return authenticated && requiredRole === userRole;
  };

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthorized()) {
    // Redirect to appropriate dashboard based on role
    const userRole = getUserRole();
    switch (userRole) {
      case ROLE.BANK:
        return <Navigate to="/dashboard/bank" replace />;
      case ROLE.INSURER:
        return <Navigate to="/dashboard/insurer" replace />;
      case ROLE.USER:
        // For users, extract ID from localStorage or default to empty
        const userId = localStorage.getItem('userId') || '';
        return <Navigate to={`/dashboard/user/${userId}`} replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Loading component for suspense
const Loading: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard/bank"
            element={
              <AuthGuard>
                <BankDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard/insurer"
            element={
              <AuthGuard>
                <InsurerDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard/user/:user_id"
            element={
              <AuthGuard>
                <UserDashboard />
              </AuthGuard>
            }
          />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
