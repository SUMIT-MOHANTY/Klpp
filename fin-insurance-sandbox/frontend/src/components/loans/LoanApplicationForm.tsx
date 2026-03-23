/**
 * LoanApplicationForm Component
 *
 * Provides a user-facing form to submit a new loan application.
 * Uses the API contract:
 * POST /api/loans with body {amount, interest_rate, tenure_months, purpose}
 * Response: {id, amount, interest_rate, tenure_months, status}
 *
 * @returns {JSX.Element} Loan application form
 */
import React, { useState } from 'react';
import axios from 'axios';

/**
 * Request payload interface (snake_case to match API).
 */
interface LoanApplicationPayload {
  amount: number;
  interest_rate: number;
  tenure_months: number;
  purpose: string;
}

const LoanApplicationForm: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [tenureMonths, setTenureMonths] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  /**
   * Validates form inputs.
   * Returns true if all fields are valid.
   */
  const validate = (): boolean => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      return false;
    }
    if (!interestRate || isNaN(Number(interestRate)) || Number(interestRate) <= 0) {
      setError('Interest rate must be a positive number.');
      return false;
    }
    if (!tenureMonths || isNaN(Number(tenureMonths)) || Number(tenureMonths) <= 0) {
      setError('Tenure must be a positive integer (months).');
      return false;
    }
    if (!purpose.trim()) {
      setError('Purpose is required.');
      return false;
    }
    setError('');
    return true;
  };

  /**
   * Submits the form to the backend API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const payload: LoanApplicationPayload = {
      amount: Number(amount),
      interest_rate: Number(interestRate),
      tenure_months: Number(tenureMonths),
      purpose: purpose.trim(),
    };

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authorization token found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/loans',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(`Loan applied successfully (ID: ${response.data.id}). Status: ${response.data.status}`);
      // Reset form
      setAmount('');
      setInterestRate('');
      setTenureMonths('');
      setPurpose('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit loan application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Apply for a Loan</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount (USD)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="5000.00"
          />
        </div>
        <div>
          <label htmlFor="interest_rate" className="block text-sm font-medium">
            Interest Rate (%)
          </label>
          <input
            id="interest_rate"
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="5.5"
          />
        </div>
        <div>
          <label htmlFor="tenure_months" className="block text-sm font-medium">
            Tenure (months)
          </label>
          <input
            id="tenure_months"
            type="number"
            value={tenureMonths}
            onChange={(e) => setTenureMonths(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="24"
          />
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium">
            Purpose
          </label>
          <textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            rows={3}
            placeholder="Education, home improvement, etc."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Apply for Loan'}
        </button>
      </form>
    </div>
  );
};

export default LoanApplicationForm;
