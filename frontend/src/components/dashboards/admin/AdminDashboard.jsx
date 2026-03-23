import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Table, Button, Tag } from 'antd';
import { UserOutlined, BookOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import './AdminDashboard.css';

const { Content } = Layout;
const { Meta } = Card;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/users/recent?limit=5')
      ]);

      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: role => (
      <Tag color={role === 'admin' ? 'red' : role === 'instructor' ? 'green' : 'blue'}>{role}</Tag>
    )},
    { title: 'Joined Date', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <h1>Admin Dashboard</h1>

      <Row gutter={24}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Courses"
              value={stats.totalCourses}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Instructors"
              value={stats.totalInstructors}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.totalStudents}
              prefix={<BankOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Users" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={recentUsers}
          loading={loading}
          pagination={false}
          rowKey="id"
        />
      </Card>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card
            title="Quick Actions"
            actions={[
              <Button type="primary" href="/admin/users">Manage Users</Button>,
              <Button href="/admin/courses">Manage Courses</Button>
            ]}
          >
            <p>Quick access to administrative functions</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="System Status">
            <p>All systems operational</p>
            <p>Last updated: {new Date().toLocaleString()}</p>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default AdminDashboard;
