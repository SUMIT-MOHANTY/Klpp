import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  InputAdornment
} from '@mui/material';

interface LoanRepaymentFormProps {
  loanId?: string;
  outstandingBalance?: number;
  onSubmit?: (paymentData: {
    amount: number;
    paymentMethod: string;
    loanId: string;
    notes?: string;
  }) => void;
  onCancel?: () => void;
}

const LoanRepaymentForm: React.FC<LoanRepaymentFormProps> = ({
  loanId = '',
  outstandingBalance = 0,
  onSubmit,
  onCancel
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (numericAmount > outstandingBalance) {
      setError('Payment amount cannot exceed outstanding balance');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    onSubmit?.({
      amount: numericAmount,
      paymentMethod,
      loanId,
      notes: notes.trim() || undefined
    });
  };

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'mobile_wallet', label: 'Mobile Wallet' },
    { value: 'check', label: 'Check' }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Loan Repayment
        </Typography>

        {loanId && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Loan ID: {loanId}
          </Typography>
        )}

        <Typography variant="body1" gutterBottom>
          Outstanding Balance: ${outstandingBalance.toFixed(2)}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: {
                min: 0.01,
                max: outstandingBalance,
                step: 0.01
              }
            }}
            required
          />

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Payment Method"
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Additional notes about this payment..."
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={!onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!amount || !paymentMethod}
            >
              Submit Payment
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoanRepaymentForm;
