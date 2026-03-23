import axios, { AxiosError } from 'axios';

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface TransferResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  fee?: number;
  estimatedArrival?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class TransferServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TransferServiceError';
  }
}

class TransferService {
  private baseURL = '/api/transfers';

  async initiateTransfer(transfer: TransferRequest): Promise<TransferResponse> {
    // [RISK 5] Sanitize inputs before sending
    const sanitized = this.sanitizeTransferRequest(transfer);

    try {
      const response = await axios.post<TransferResponse>(
        `${this.baseURL}/initiate`,
        sanitized,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID()
          }
        }
      );

      // [RISK 3] Check response validity
      if (!response.data?.id || !response.data?.status) {
        throw new TransferServiceError(
          'Invalid response from server',
          'INVALID_RESPONSE'
        );
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 422) {
        const validationErrors = axiosError.response.data as ValidationError[];
        throw new TransferServiceError(
          'Validation failed',
          'VALIDATION_ERROR',
          { errors: validationErrors }
        );
      }

      if (axiosError.response?.status === 400) {
        throw new TransferServiceError(
          'Invalid transfer request',
          'BAD_REQUEST',
          axiosError.response.data
        );
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new TransferServiceError(
          'Transfer request timed out',
          'TIMEOUT'
        );
      }

      if (!axiosError.response) {
        throw new TransferServiceError(
          'Network connection failed',
          'NETWORK_ERROR'
        );
      }

      throw new TransferServiceError(
        'Transfer initiation failed',
        'UNKNOWN_ERROR',
        axiosError.response.data
      );
    }
  }

  async getTransferLimits(accountId: string): Promise<{
    dailyLimit: number;
    monthlyLimit: number;
    currentDaily: number;
    currentMonthly: number;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/limits/${accountId}`);
      return response.data;
    } catch (error) {
      // [RISK 6] Provide defaults if limits unavailable
      console.error('Failed to fetch transfer limits:', error);
      return {
        dailyLimit: 50000,
        monthlyLimit: 500000,
        currentDaily: 0,
        currentMonthly: 0
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private sanitizeTransferRequest(request: TransferRequest): TransferRequest {
    return {
      fromAccount: String(request.fromAccount || '').trim(),
      toAccount: String(request.toAccount || '').trim(),
      amount: Math.max(0, Number(request.amount || 0)),
      currency: String(request.currency || 'USD').toUpperCase(),
      description: request.description?.trim().slice(0, 500)
    };
  }
}

export const transferService = new TransferService();
