import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, message, Row, Col, Statistic } from 'antd';
import { CheckOutlined, CloseOutlined, DollarOutlined, UserOutlined, FileTextOutlined, AlertOutlined } from '@ant-design/icons';

// Type interfaces as specified
interface BankDashboardData {
  totalUsers: number;
  totalLoanAmount: number;
  totalInsuranceAmount: number;
  outstandingClaimCount: number;
}

interface Loan {
  loan_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'repaid' | 'rejected';
  created_at: string;
}

interface Insurance {
  insurance_id: string;
  user_id: string;
  type: string;
  premium: number;
  status: 'active' | 'expired' | 'cancelled';
}

interface Claim {
  claim_id: string;
  insurance_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BankDashboard: React.FC = () => {
  const [bankData, setBankData] = useState<BankDashboardData | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState({
    dashboard: false,
    loans: false,
    claims: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [repaymentModal, setRepaymentModal] = useState<{
    visible: boolean;
    loanId: string | null;
  }>({ visible: false, loanId: null });
  const [repaymentAmount, setRepaymentAmount] = useState<string>('');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const response = await fetch(`${BASE_URL}/dashboard/bank`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setBankData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  // Fetch loans
  const fetchLoans = async () => {
    setLoading(prev => ({ ...prev, loans: true }));
    try {
      const response = await fetch(`${BASE_URL}/loans`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch loans');
      }

      const data = await response.json();
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, loans: false }));
    }
  };

  // Fetch claims
  const fetchClaims = async () => {
    setLoading(prev => ({ ...prev, claims: true }));
    try {
      const response = await fetch(`${BASE_URL}/insurances`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      // Assuming claims are nested within insurance data
      const allClaims: Claim[] = [];
      data.forEach((insurance: any) => {
        if (insurance.claims) {
          allClaims.push(...insurance.claims);
        }
      });
      setClaims(allClaims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, claims: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLoans();
    fetchClaims();
  }, []);

  // Approve a claim
  const approveClaim = async (claimId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/claims/${claimId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to approve claim');
      }

      message.success('Claim approved successfully');
      fetchClaims();
      fetchDashboardData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error approving claim');
    }
  };

  // Process loan repayment
  const handleRepayment = async () => {
    if (!repaymentModal.loanId || !repaymentAmount) {
      message.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/loans/${repaymentModal.loanId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ amount: parseFloat(repaymentAmount) }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to process repayment');
      }

      message.success('Loan repayment processed successfully');
      setRepaymentModal({ visible: false, loanId: null });
      setRepaymentAmount('');
      fetchLoans();
      fetchDashboardData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error processing repayment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'green';
      case 'pending':
        return 'orange';
      case 'rejected':
      case 'expired':
      case 'cancelled':
        return 'red';
      case 'repaid':
        return 'blue';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Loan ID',
      dataIndex: 'loan_id',
      key: 'loan_id',
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: Loan) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => setRepaymentModal({ visible: true, loanId: record.loan_id })}
          disabled={record.status !== 'approved'}
        >
          Repay
        </Button>
      ),
    },
  ];

  const claimColumns = [
    {
      title: 'Claim ID',
      dataIndex: 'claim_id',
      key: 'claim_id',
    },
    {
      title: 'Insurance ID',
      dataIndex: 'insurance_id',
      key: 'insurance_id',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: Claim) => (
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => approveClaim(record.claim_id)}
          disabled={record.status !== 'pending'}
        >
          Approve
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <Card style={{ margin: 20 }}>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <AlertOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <Button type="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Bank Dashboard</h1>

      {/* Dashboard Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading.dashboard}>
            <Statistic
              title="Total Users"
              value={bankData?.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading.dashboard}>
            <Statistic
              title="Total Loan Amount"
              value={bankData?.totalLoanAmount || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading.dashboard}>
            <Statistic
              title="Total Insurance Amount"
              value={bankData?.totalInsuranceAmount || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading.dashboard}>
            <Statistic
              title="Outstanding Claims"
              value={bankData?.outstandingClaimCount || 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Loans Section */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title="Loan Management"
            loading={loading.loans}
            style={{ marginBottom: 24 }}
          >
            <Table
              dataSource={loans}
              columns={columns}
              rowKey="loan_id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>

        {/* Claims Section */}
        <Col xs={24} lg={12}>
          <Card
            title="Insurance Claims"
            loading={loading.claims}
            style={{ marginBottom: 24 }}
          >
            <Table
              dataSource={claims.filter(claim => claim.status === 'pending')}
              columns={claimColumns}
              rowKey="claim_id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Repayment Modal */}
      <Modal
        title="Process Loan Repayment"
        open={repaymentModal.visible}
        onOk={handleRepayment}
        onCancel={() => {
          setRepaymentModal({ visible: false, loanId: null });
          setRepaymentAmount('');
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Repayment Amount">
            <Input
              type="number"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
              placeholder="Enter amount"
              prefix="$"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BankDashboard;
