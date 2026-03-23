import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth('/api/admin/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;
  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCourses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalGrades}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalAnnouncements}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.userDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
