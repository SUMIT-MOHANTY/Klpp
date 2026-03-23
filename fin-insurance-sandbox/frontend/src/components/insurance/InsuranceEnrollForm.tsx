import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';

interface InsuranceProduct {
  id: string;
  name: string;
  description: string;
  monthlyPremium: number;
  coverageAmount: number;
  features: string[];
}

interface EnrollFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  beneficiary: {
    name: string;
    relationship: string;
  };
  selectedCoverage: number;
  paymentMethod: 'credit' | 'debit' | 'ach';
  termsAccepted: boolean;
}

interface InsuranceEnrollFormProps {
  product?: InsuranceProduct;
  onSuccess?: (enrollmentId: string) => void;
  onCancel?: () => void;
}

const InsuranceEnrollForm: React.FC<InsuranceEnrollFormProps> = ({
  product = {
    id: 'life-basic',
    name: 'Basic Life Insurance',
    description: 'Comprehensive life insurance coverage for your peace of mind',
    monthlyPremium: 50,
    coverageAmount: 50000,
    features: ['No medical exam required', 'Instant coverage approval', 'Flexible payment options']
  },
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<EnrollFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    beneficiary: {
      name: '',
      relationship: ''
    },
    selectedCoverage: product.coverageAmount,
    paymentMethod: 'credit',
    termsAccepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState({
    monthlyPayment: product.monthlyPremium,
    annualSavings: product.monthlyPremium * 12 * 0.05 // 5% annual discount
  });

  const formatPhone = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const calculateQuote = (coverage: number) => {
    const baseRate = 0.001; // $1 per $1000 coverage
    const ageFactor = Math.max(1, (parseInt(formData.dateOfBirth.split('-')[0]) || 1990) - 1970) / 100;
    const monthly = Math.round((coverage * baseRate * ageFactor + 10) * 100) / 100;
    setQuote({
      monthlyPayment: monthly,
      annualSavings: monthly * 12 * 0.05
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Omit<EnrollFormData, 'address' | 'beneficiary'>],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }

    if (name === 'selectedCoverage') {
      const coverage = parseInt(value) || product.coverageAmount;
      calculateQuote(coverage);
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateZipCode = (zip: string) => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() !== '' &&
               formData.lastName.trim() !== '' &&
               validateEmail(formData.email) &&
               formData.phone.replace(/\D/g, '').length === 10;

      case 2:
        return formData.address.street.trim() !== '' &&
               formData.address.city.trim() !== '' &&
               formData.address.state !== '' &&
               validateZipCode(formData.address.zipCode);

      case 3:
        return formData.beneficiary.name.trim() !== '' &&
               formData.beneficiary.relationship !== '';

      case 4:
        return formData.termsAccepted;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
      setError(null);
    } else {
      setError('Please complete all required fields.');
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const enrollmentId = `INS-${Date.now()}`;
      onSuccess?.(enrollmentId);
    } catch (err) {
      setError('Failed to enroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: '' },
    { number: 2, title: 'Address', icon: '' },
    { number: 3, title: 'Beneficiary', icon: '' },
    { number: 4, title: 'Coverage & Payment', icon: '' },
    { number: 5, title: 'Review & Submit', icon: '' }
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-md"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-md"
                required
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                phone: formatPhone(e.target.value)
              }))}
              className="w-full px-3 py-2 border rounded-md"
              maxLength={14}
              required
            />
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <input
              type="text"
              name="address.street"
              placeholder="Street Address"
              value={formData.address.street}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                name="address.city"
                placeholder="City"
                value={formData.address.city}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-md"
                required
              />
              <select
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-md"
                required
              >
                <option value="">State</option>
                <option value="AL">Alabama</option>
                <option value="CA">California</option>
                <option value="FL">Florida</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
              </select>
              <input
                type="text"
                name="address.zipCode"
                placeholder="ZIP Code"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-md"
                maxLength={10}
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Beneficiary Information</h3>
            <input
              type="text"
              name="beneficiary.name"
              placeholder="Beneficiary Full Name"
              value={formData.beneficiary.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <select
              name="beneficiary.relationship"
              value={formData.beneficiary.relationship}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Coverage Amount</h3>
              <select
                name="selectedCoverage"
                value={formData.selectedCoverage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={25000}>$25,000</option>
                <option value={50000}>$50,000</option>
                <option value={100000}>$100,000</option>
                <option value={250000}>$250,000</option>
                <option value={500000}>$500,000</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Monthly Quote</h4>
              <p className="text-2xl font-bold text-blue-600">${quote.monthlyPayment}</p>
              <p className="text-sm text-gray-600">Save ${quote.annualSavings}/year with annual payments</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="space-y-2">
                {['credit', 'debit', 'ach'].map((method) => (
                  <label key={method} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                      className="text-blue-600"
                    />
                    <span className="capitalize">{method === 'ach' ? 'Bank Account' : method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="text-blue-600"
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Review Your Enrollment</h3>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Policy Summary</h4>
                <p><strong>Plan:</strong> {product.name}</p>
                <p><strong>Coverage:</strong> ${formData.selectedCoverage.toLocaleString()}</p>
                <p><strong>Monthly Payment:</strong> ${quote.monthlyPayment}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Personal Details</h4>
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Beneficiary:</strong> {formData.beneficiary.name} ({formData.beneficiary.relationship})</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Enroll in {product.name}</h2>
          </div>
        </div>
        <p className="text-gray-600">{product.description}</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex-1 text-center ${
                s.number <= step ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                s.number <= step ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {s.number < step ? '' : s.icon}
              </div>
              <p className="text-xs">{s.title}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !formData.termsAccepted}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Enrollment</span>
                </>
              )}
            </button>
          )}
        </div>

        {step === 1 && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel enrollment
          </button>
        )}
      </form>
    </div>
  );
};

export default InsuranceEnrollForm;
