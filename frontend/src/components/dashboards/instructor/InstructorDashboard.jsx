import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Table, Button, Tag, Progress } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  QuestionOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import './InstructorDashboard.css';

const { Content } = Layout;

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalCourses: 0,
    totalStudents: 0,
    avgRating: 0,
    activeAssignments: 0,
    recentCourses: [],
    recentSubmissions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      const response = await api.get('/instructor/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const courseColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Enrolled Students',
      dataIndex: 'enrolled_students',
      key: 'enrolled_students',
      render: count => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Avg Rating',
      dataIndex: 'avg_rating',
      key: 'avg_rating',
      render: rating => <Rate disabled defaultValue={rating} />
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" href={`/instructor/courses/${record.id}`}>
          Manage
        </Button>
      )
    }
  ];

  const submissionColumns = [
    { title: 'Student', dataIndex: 'student_name', key: 'student_name' },
    { title: 'Assignment', dataIndex: 'assignment_title', key: 'assignment_title' },
    { title: 'Course', dataIndex: 'course_title', key: 'course_title' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const color = status === 'graded' ? 'green' : status === 'submitted' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    }
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <h1>Instructor Dashboard - {user?.name}</h1>

      <Row gutter={24}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Courses"
              value={data.totalCourses}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={data.totalStudents}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Rating"
              value={data.avgRating}
              precision={1}
              prefix={<StarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={data.activeAssignments}
              prefix={<QuestionOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={16}>
          <Card title="My Courses">
            <Table
              columns={courseColumns}
              dataSource={data.recentCourses}
              loading={loading}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Recent Submissions">
            {data.recentSubmissions?.map(submission => (
              <div key={submission.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>{submission.student_name}</Text>
                <br />
                <Text>{submission.assignment_title}</Text>
                <br />
                <Tag color={submission.status === 'graded' ? 'green' : 'blue'}>
                  {submission.status}
                </Tag>
              </div>
            ))}
            {data.recentSubmissions?.length === 0 && (
              <Text type="secondary">No recent submissions</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card>
            <Button
              type="primary"
              size="large"
              href="/instructor/courses/new"
              style={{ marginRight: 16 }}
            >
              Create New Course
            </Button>
            <Button href="/instructor/assignments">
              Manage Assignments
            </Button>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default InstructorDashboard;
