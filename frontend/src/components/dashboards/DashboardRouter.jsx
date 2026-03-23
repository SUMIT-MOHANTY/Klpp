import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import StudentDashboard from './student/StudentDashboard';
import InstructorDashboard from './instructor/InstructorDashboard';
import { Spin } from 'antd';

const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spin size="large" />;
  }

  if (!user) {
    return <div>Please login to view dashboard</div>;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'instructor':
      return <InstructorDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <div>Unknown role</div>;
  }
};

export default DashboardRouter;
