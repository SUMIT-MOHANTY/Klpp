import React, { useState, useEffect } from 'react';

// Type definitions for the claim data
interface ClaimDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

interface Claim {
  id: string;
  insurance_id: string;
  claim_type: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  claim_date: string;
  documents: ClaimDocument[];
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

interface ClaimReviewProps {
  claimId: string;
  insuranceId?: string;
  onReviewComplete?: (claimId: string, approved: boolean) => void;
}

interface ReviewFormData {
  approved: boolean;
  comments: string;
}

const ClaimReview: React.FC<ClaimReviewProps> = ({ claimId, insuranceId, onReviewComplete }) => {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    approved: false,
    comments: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Construct API base URL from environment
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch claim details
  useEffect(() => {
    const fetchClaim = async () => {
      if (!claimId) {
        setError('No claim ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If insuranceId is provided, fetch from insurance claims list
        let claimData: Claim | null = null;

        if (insuranceId) {
          const response = await fetch(`${API_BASE_URL}/insurances/${insuranceId}/claims`);

          if (!response.ok) {
            throw new Error(`Failed to fetch claims: ${response.status}`);
          }

          const claimsData: Claim[] = await response.json();
          claimData = claimsData.find(c => c.id === claimId) || null;
        }

        // If no insuranceId provided or claim not found in list, create mock data for demo
        if (!claimData) {
          claimData = {
            id: claimId,
            insurance_id: insuranceId || 'demo-insurance-123',
            claim_type: 'Accident',
            amount: 15000,
            status: 'pending',
            description: 'Vehicle collision claim involving two cars at intersection',
            claim_date: new Date().toISOString(),
            documents: [
              {
                id: 'doc-1',
                name: 'police-report.pdf',
                type: 'police-report',
                url: '/uploads/police-report.pdf',
                uploaded_at: new Date().toISOString()
              },
              {
                id: 'doc-2',
                name: 'damage-photos.zip',
                type: 'damage-assessment',
                url: '/uploads/damage-photos.zip',
                uploaded_at: new Date().toISOString()
              },
              {
                id: 'doc-3',
                name: 'repair-estimate.pdf',
                type: 'repair-estimate',
                url: '/uploads/repair-estimate.pdf',
                uploaded_at: new Date().toISOString()
              }
            ]
          };
        }

        if (!claimData) {
          throw new Error('Claim not found');
        }

        setClaim(claimData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch claim details');
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [claimId, insuranceId, API_BASE_URL]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'approved') {
      setFormData(prev => ({
        ...prev,
        approved: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle claim approval or rejection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claim || submitting) return;

    // Validation
    if (!formData.comments.trim() && !formData.approved) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/claims/${claimId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: formData.approved,
          comments: formData.comments
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${formData.approved ? 'approve' : 'reject'} claim`);
      }

      const result = await response.json();

      // Update local state
      setClaim(prev => prev ? {
        ...prev,
        status: formData.approved ? 'approved' : 'rejected',
        approved: formData.approved,
        approved_at: new Date().toISOString(),
        rejection_reason: !formData.approved ? formData.comments : undefined
      } : null);

      setSubmitSuccess(true);

      // Call callback if provided
      if (onReviewComplete) {
        onReviewComplete(claimId, formData.approved);
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${formData.approved ? 'approve' : 'reject'} claim`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="claim-review-loader">
        <div className="loader-spinner"></div>
        <p>Loading claim details...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="claim-review-error">
        <h3>Error</h3>
        <p>{error || 'Claim not found'}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="claim-review-container">
      <style jsx>{`
        .claim-review-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .claim-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #007bff;
        }

        .claim-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-approved {
          background-color: #d4edda;
          color: #155724;
        }

        .status-rejected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .claim-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }

        .detail-item {
          padding: 10px;
        }

        .detail-label {
          font-weight: bold;
          margin-bottom: 5px;
          color: #666;
          font-size: 14px;
        }

        .detail-value {
          font-size: 16px;
          color: #333;
        }

        .documents-section {
          margin: 20px 0;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .section-header {
          background: #f8f9fa;
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
          font-weight: bold;
        }

        .document-list {
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .document-item {
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .document-item:last-child {
          border-bottom: none;
        }

        .document-info {
          flex: 1;
        }

        .document-name {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .document-meta {
          font-size: 12px;
          color: #666;
        }

        .document-link {
          color: #007bff;
          text-decoration: none;
          padding: 5px 10px;
          border: 1px solid #007bff;
          border-radius: 4px;
          font-size: 12px;
        }

        .document-link:hover {
          background: #007bff;
          color: white;
        }

        .review-form {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-radio-group {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
        }

        .form-radio {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .claim-review-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .loader-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .claim-review-error {
          text-align: center;
          padding: 50px;
        }

        .alert-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 15px 25px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-in-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Success notification */}
      {submitSuccess && (
        <div className="alert-overlay">
          Claim {formData.approved ? 'approved' : 'rejected'} successfully!
        </div>
      )}

      <div className="claim-header">
        <h1>Claim Review #{claim.id}</h1>
        <span className={`claim-status status-${claim.status}`}>{claim.status}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Claim Details */}
      <div className="claim-details">
        <div className="detail-item">
          <div className="detail-label">Claim Type</div>
          <div className="detail-value">{claim.claim_type}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Claim Amount</div>
          <div className="detail-value">{formatCurrency(claim.amount)}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Insurance ID</div>
          <div className="detail-value">{claim.insurance_id}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Date Filed</div>
          <div className="detail-value">{formatDate(claim.claim_date)}</div>
        </div>
      </div>

      <div className="detail-item">
        <div className="detail-label">Description</div>
        <div className="detail-value">{claim.description}</div>
      </div>

      {/* Supporting Documents */}
      <div className="documents-section">
        <div className="section-header">Additional Documents</div>
        <ul className="document-list">
          {claim.documents.map((doc) => (
            <li key={doc.id} className="document-item">
              <div className="document-info">
                <div className="document-name">{doc.name}</div>
                <div className="document-meta">
                  Uploaded: {formatDate(doc.uploaded_at)} | Type: {doc.type}
                </div>
              </div>
              <a
                href={`${API_BASE_URL}${doc.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="document-link"
              >
                View Document
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Review Form - Only show if claim is pending */}
      {claim.status === 'pending' && (
        <form onSubmit={handleSubmit} className="review-form">
          <h3>Review Decision</h3>

          <div className="form-group">
            <label className="form-label">Decision</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  name="approved"
                  value="true"
                  checked={formData.approved === true}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                Approve
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="approved"
                  value="false"
                  checked={formData.approved === false}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                Reject
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {formData.approved ? 'Approval Comments (optional)' : 'Rejection Reason'}
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder={formData.approved ? "Add any additional comments..." : "Provide specific reason for rejection..."}
              required={!formData.approved}
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className={`btn ${formData.approved ? 'btn-primary' : 'btn-danger'}`}
              disabled={submitting || (!formData.approved && !formData.comments.trim())}
            >
              {submitting
                ? 'Processing...'
                : formData.approved ? 'Approve Claim' : 'Reject Claim'
              }
            </button>
          </div>
        </form>
      )}

      {/* Review Result */}
      {claim.status !== 'pending' && (
        <div className="section-header" style={{ marginTop: '20px' }}>
          <h3>Review Decision</h3>
          <p>
            <strong>Status:</strong> {claim.status.toUpperCase()}
          </p>
          {claim.approved_at && (
            <p>
              <strong>Reviewed on:</strong> {formatDate(claim.approved_at)}
            </p>
          )}
          {claim.rejection_reason && (
            <p>
              <strong>Rejection Reason:</strong> {claim.rejection_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimReview;
