import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaimForm from '../src/components/ClaimForm';

describe('ClaimForm merge tests', () => {
  test('should render claim form without crashing', () => {
    render(<ClaimForm />);
    expect(screen.getByTestId('claim-form')).toBeInTheDocument();
  });

  test('should handle form submission', async () => {
    render(<ClaimForm />);
    const form = screen.getByTestId('claim-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  test('should validate required fields', () => {
    render(<ClaimForm />);
    const submitButton = screen.getByText('Submit');

    fireEvent.click(submitButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
