import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Progress, Typography, Tabs } from 'antd';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import './StudentDashboard.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: [],
    completedCourses: [],
    upcomingAssignments: [],
    progress: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Content style={{ padding: '24px' }}>
      <h1>Welcome back, {user?.name}</h1>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Title level={4}>Course Progress</Title>
            <Progress
              type="dashboard"
              percent={dashboardData.progress?.overall || 0}
              format={percent => `${percent}% Complete`}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <Title level={4}>{dashboardData.completedCourses?.length || 0}</Title>
                  <Text>Completed Courses</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <Title level={4}>{dashboardData.upcomingAssignments?.length || 0}</Title>
                  <Text>Upcoming Assignments</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="current">
          <TabPane tab="Current Courses" key="current">
            <Row gutter={[24, 24]}>
              {dashboardData.enrolledCourses?.map(course => (
                <Col span={8} key={course.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{
                        height: 120,
                        background: '#f0f2f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BookOutlined style={{ fontSize: 48 }} />
                      </div>
                    }
                    actions={[
                      <a href={`/courses/${course.id}`}>View Course</a>
                    ]}
                  >
                    <Card.Meta
                      title={course.title}
                      description={
                        <>
                          <p>{course.instructor}</p>
                          <Progress
                            percent={course.progress}
                            size="small"
                            strokeColor={course.progress === 100 ? "#52c41a" : "#1890ff"}
                          />
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
          <TabPane tab="Upcoming Assignments" key="assignments">
            {dashboardData.upcomingAssignments?.map(assignment => (
              <Card key={assignment.id} size="small" style={{ marginBottom: 8 }}>
                <Text strong>{assignment.title}</Text>
                <br />
                <Text type="secondary">
                  Due: {new Date(assignment.due_date).toLocaleDateString()} -
                  Course: {assignment.course_title}
                </Text>
              </Card>
            ))}
          </TabPane>
        </Tabs>
      </Card>
    </Content>
  );
};

export default StudentDashboard;
