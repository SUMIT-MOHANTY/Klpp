import React, { useState, useEffect, useCallback } from 'react';
import { transferService, TransferRequest, TransferResponse, TransferServiceError, ValidationError } from '../../services/transferService';

interface TransferFormProps {
  onTransferComplete?: (response: TransferResponse) => void;
  onError?: (error: string) => void;
}

interface FormData {
  fromAccount: string;
  toAccount: string;
  amount: string;
  currency: string;
  description: string;
}

interface FormErrors {
  fromAccount?: string;
  toAccount?: string;
  amount?: string;
  general?: string;
}

const TransferForm: React.FC<TransferFormProps> = ({ onTransferComplete, onError }) => {
  const [formData, setFormData] = useState<FormData>({
    fromAccount: '',
    toAccount: '',
    amount: '',
    currency: 'USD',
    description: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferLimits, setTransferLimits] = useState<{
    dailyLimit: number;
    monthlyLimit: number;
    currentDaily: number;
    currentMonthly: number;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [plannedTransfer, setPlannedTransfer] = useState<TransferRequest | null>(null);

  // [RISK 4] Real-time input validation
  const validateInput = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fromAccount':
      case 'toAccount':
        if (!value.trim()) return 'This field is required';
        return undefined;

      case 'amount':
        const numAmount = parseFloat(value);
        if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be greater than 0';
        if (numAmount > 999999999) return 'Amount exceeds maximum allowed';
        if (transferLimits && numAmount > (transferLimits.dailyLimit - transferLimits.currentDaily)) {
          return 'Amount exceeds daily limit';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // [RISK 5] Basic XSS prevention
    const sanitized = value.replace(/[<>]/g, '');

    setFormData(prev => ({ ...prev, [name]: sanitized }));

    // Real-time validation
    const error = validateInput(name, sanitized);
    setErrors(prev => ({ ...prev, [name]: error, general: undefined }));
  }, [transferLimits]);

  // [RISK 6] Load transfer limits on mount
  useEffect(() => {
    const loadLimits = async () => {
      setIsLoading(true);
      try {
        // In real app, use actual account ID
        const limits = await transferService.getTransferLimits('current-user');
        setTransferLimits(limits);
      } catch (error) {
        console.error('Failed to load transfer limits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLimits();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.fromAccount = validateInput('fromAccount', formData.fromAccount);
    newErrors.toAccount = validateInput('toAccount', formData.toAccount);
    newErrors.amount = validateInput('amount', formData.amount);

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const transferRequest: TransferRequest = {
      fromAccount: formData.fromAccount.trim(),
      toAccount: formData.toAccount.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description.trim()
    };

    // [RISK 7] Show confirmation before execution
    setPlannedTransfer(transferRequest);
    setShowConfirm(true);
  };

  const handleConfirmTransfer = async () => {
    if (!plannedTransfer) return;

    setIsSubmitting(true);
    setErrors({ general: undefined });

    try {
      const response = await transferService.initiateTransfer(plannedTransfer);
      setShowConfirm(false);
      setFormData({
        fromAccount: '',
        toAccount: '',
        amount: '',
        currency: 'USD',
        description: ''
      });

      // Success callback
      onTransferComplete?.(response);
    } catch (error) {
      const serviceError = error as TransferServiceError;

      // [RISK 8] Handle detailed error responses
      const errorMessage = serviceError.details?.errors?.length
        ? serviceError.details.errors.map((e: ValidationError) => e.message).join(', ')
        : serviceError.message;

      const newErrors: FormErrors = { general: errorMessage };

      // Map field-specific errors
      if (serviceError.details?.errors) {
        serviceError.details.errors.forEach((validationError: ValidationError) => {
          if (validationError.field in formData) {
            newErrors[validationError.field as keyof FormErrors] = validationError.message;
          }
        });
      }

      setErrors(newErrors);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: '',
      currency: 'USD',
      description: ''
    });
    setErrors({});
    setShowConfirm(false);
    setPlannedTransfer(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow min-h-[200px] flex items-center justify-center">
        <div className="text-gray-500">Loading transfer limits...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Transfer Funds</h2>

      {transferLimits && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-700">
            Daily limit: ${(transferLimits.dailyLimit - transferLimits.currentDaily).toLocaleString()} remaining
          </div>
          <div className="text-sm text-blue-700">
            Monthly limit: ${(transferLimits.monthlyLimit - transferLimits.currentMonthly).toLocaleString()} remaining
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Account</label>
          <input
            type="text"
            name="fromAccount"
            value={formData.fromAccount}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded ${errors.fromAccount ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="1234567890"
            maxLength={20}
          />
          {errors.fromAccount && <span className="text-red-500 text-xs">{errors.fromAccount}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To Account</label>
          <input
            type="text"
            name="toAccount"
            value={formData.toAccount}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded ${errors.toAccount ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="0987654321"
            maxLength={20}
          />
          {errors.toAccount && <span className="text-red-500 text-xs">{errors.toAccount}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="999999999"
            />
            {errors.amount && <span className="text-red-500 text-xs">{errors.amount}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
            maxLength={500}
            placeholder="Optional description for this transfer"
          />
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 rounded text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Processing...' : 'Review Transfer'}
        </button>

        <button
          type="button"
          onClick={resetForm}
          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Reset Form
        </button>
      </form>

      {showConfirm && plannedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Transfer</h3>
            <div className="space-y-2 mb-4">
              <div><strong>From:</strong> {plannedTransfer.fromAccount}</div>
              <div><strong>To:</strong> {plannedTransfer.toAccount}</div>
              <div><strong>Amount:</strong> {plannedTransfer.amount.toLocaleString()} {plannedTransfer.currency}</div>
              {plannedTransfer.description && (
                <div><strong>Description:</strong> {plannedTransfer.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm & Send'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferForm;

// Example usage:
// import TransferForm from './components/transfers/TransferForm';
// <TransferForm
//   onTransferComplete={(response) => console.log('Transfer successful:', response)}
//   onError={(error) => console.error('Transfer error:', error)}
// />
