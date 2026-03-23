import React, { useEffect, useState } from 'react';

/**
 * Interface matching the bank dashboard endpoint response
 */
interface BankKPIs {
  totalLoans: number;
  totalRepaid: number;
  outstandingPrincipal: number;
  avgInterestRate: number;
}

/**
 * Interface matching the insurer dashboard endpoint response
 */
interface InsurerKPIs {
  totalPolicies: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
}

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Generic hook to poll an endpoint and return data, loading state, and error
 * @param endpoint Absolute endpoint path
 */
function usePoller<T>(endpoint: string): {
  data: T | null;
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  /**
   * Fetch helper wrapped in try/catch
   */
  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: T = await res.json();
      setData(json);
    } catch (err) {
      console.error(`Failed to load ${endpoint}:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Reusable KPI card component
 */
function KPICard(props: {
  title: string;
  value: string | number;
  loading: boolean;
}) {
  const { title, value, loading } = props;
  return (
    <div className="card">
      <h3 className="cardTitle">{title}</h3>
      {loading || value === null ? (
        <div className="skeleton" />
      ) : (
        <p className="cardValue">{value}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const {
    data: bank,
    loading: bankLoading,
    error: bankError,
    refetch: refetchBank,
  } = usePoller<BankKPIs>('/dashboard/bank');

  const {
    data: insurer,
    loading: insurerLoading,
    error: insurerError,
    refetch: refetchInsurer,
  } = usePoller<InsurerKPIs>('/dashboard/insurer');

  const loading = bankLoading || insurerLoading;
  const error = bankError || insurerError;

  const refetch = () => {
    refetchBank();
    refetchInsurer();
  };

  if (error) {
    return (
      <div className="fallback">
        <title>Admin Dashboard - Error</title>
        <h2>Unable to load dashboard data</h2>
        <button onClick={refetch} className="retryButton">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <title>Admin Dashboard</title>
      <div className="dashboard">
        <h1 className="dashboardTitle">Admin Dashboard</h1>

        <section className="grid">
          <KPICard
            title="Loans Issued"
            value={bank?.totalLoans?.toLocaleString()}
            loading={bankLoading || bank == null}
          />
          <KPICard
            title="Repaid"
            value={bank?.totalRepaid?.toLocaleString()}
            loading={bankLoading || bank == null}
          />
          <KPICard
            title="Outstanding Principal"
            value={bank?.outstandingPrincipal?.toLocaleString()}
            loading={bankLoading || bank == null}
          />
          <KPICard
            title="Avg Interest Rate"
            value={`${bank?.avgInterestRate?.toLocaleString()}%`}
            loading={bankLoading || bank == null}
          />

          <KPICard
            title="Policies Active"
            value={insurer?.totalPolicies?.toLocaleString()}
            loading={insurerLoading || insurer == null}
          />
          <KPICard
            title="Claims Filed"
            value={insurer?.totalClaims?.toLocaleString()}
            loading={insurerLoading || insurer == null}
          />
          <KPICard
            title="Claims Pending"
            value={insurer?.pendingClaims?.toLocaleString()}
            loading={insurerLoading || insurer == null}
          />
          <KPICard
            title="Claims Approved"
            value={insurer?.approvedClaims?.toLocaleString()}
            loading={insurerLoading || insurer == null}
          />
        </section>
      </div>
      <style jsx>{`
        :global(html) {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            sans-serif;
          background: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        :global(body) {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </>
  );
}
