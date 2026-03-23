import React, { useState } from 'react';
import { Upload, Calendar, FileText, AlertCircle } from 'lucide-react';

interface ClaimFormData {
  policyNumber: string;
  claimType: string;
  incidentDate: string;
  incidentDescription: string;
  estimatedAmount: string;
  documents: File[];
}

interface ClaimFileFormProps {
  onSubmit?: (formData: ClaimFormData) => void;
  isLoading?: boolean;
}

export const ClaimFileForm: React.FC<ClaimFileFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ClaimFormData>({
    policyNumber: '',
    claimType: '',
    incidentDate: '',
    incidentDescription: '',
    estimatedAmount: '',
    documents: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required';
    }

    if (!formData.claimType) {
      newErrors.claimType = 'Please select a claim type';
    }

    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    } else {
      const selectedDate = new Date(formData.incidentDate);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.incidentDate = 'Incident date cannot be in the future';
      }
    }

    if (!formData.incidentDescription.trim()) {
      newErrors.incidentDescription = 'Incident description is required';
    } else if (formData.incidentDescription.length < 10) {
      newErrors.incidentDescription = 'Please provide more details (minimum 10 characters)';
    }

    if (!formData.estimatedAmount || parseFloat(formData.estimatedAmount) <= 0) {
      newErrors.estimatedAmount = 'Please enter a valid estimated amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.documents.length > 5) {
      setErrors(documents => ({ ...documents, documents: 'Maximum 5 documents allowed' }));
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setErrors(documents => ({
        ...documents,
        documents: 'Only PDF, JPG, and PNG files are allowed'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files].slice(0, 5)
    }));
    setErrors(prev => ({ ...prev, documents: '' }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default submission handler
        console.log('Submitting claim:', formData);
        // Reset form after successful submission
        setFormData({
          policyNumber: '',
          claimType: '',
          incidentDate: '',
          incidentDescription: '',
          estimatedAmount: '',
          documents: []
        });
      }
    } catch (error) {
      console.error('Claim submission failed:', error);
      setErrors({ submit: 'Failed to submit claim. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">File a New Claim</h2>
        <p className="text-gray-600 mt-2">Please provide all required information for your insurance claim</p>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-red-800 font-medium">Error</h4>
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Policy Number *
          </label>
          <input
            type="text"
            id="policyNumber"
            name="policyNumber"
            value={formData.policyNumber}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.policyNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., POL-12345678"
          />
          {errors.policyNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.policyNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="claimType" className="block text-sm font-medium text-gray-700 mb-1">
            Claim Type *
          </label>
          <select
            id="claimType"
            name="claimType"
            value={formData.claimType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.claimType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select claim type</option>
            <option value="automobile">Automobile Accident</option>
            <option value="property">Property Damage</option>
            <option value="health">Health/Medical</option>
            <option value="life">Life Insurance</option>
            <option value="theft">Theft/Loss</option>
            <option value="liability">Liability</option>
            <option value="other">Other</option>
          </select>
          {errors.claimType && (
            <p className="mt-1 text-sm text-red-600">{errors.claimType}</p>
          )}
        </div>

        <div>
          <label htmlFor="incidentDate" className="block text-sm font-medium text-gray-700 mb-1">
            Incident Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              id="incidentDate"
              name="incidentDate"
              value={formData.incidentDate}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]} className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.incidentDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.incidentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.incidentDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="estimatedAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Claim Amount ($) *
          </label>
          <input
            type="number"
            id="estimatedAmount"
            name="estimatedAmount"
            value={formData.estimatedAmount}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.estimatedAmount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.estimatedAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.estimatedAmount}</p>
          )}
        </div>

        <div>
          <label htmlFor="incidentDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Incident Description *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              id="incidentDescription"
              name="incidentDescription"
              value={formData.incidentDescription}
              onChange={handleInputChange}
              rows={4}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                errors.incidentDescription ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe what happened in detail..."
            />
          </div>
          {errors.incidentDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.incidentDescription}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include: what happened, when, where, and any involved parties
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supporting Documents
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-gray-400">
            <input
              type="file"
              id="documents"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label
                  htmlFor="documents"
                  className="cursor-pointer text-lg font-medium text-blue-600 hover:text-blue-500"
                >
                  Upload documents
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  or drag and drop to attach
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">PDF, PNG, JPG up to 5MB each</p>
            </div>
          </div>

          {errors.documents && (
            <p className="mt-1 text-sm text-red-600">{errors.documents}</p>
          )}

          {formData.documents.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Attached Documents:</h4>
              {formData.documents.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                >
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-sm text-red-600 hover:text-red-700 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || isLoading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting || isLoading ? 'Submitting Claim...' : 'Submit Claim'}
        </button>
      </div>

      <div className="text-center text-xs text-gray-500 mt-4">
        By submitting this claim, you confirm that all provided information is accurate
      </div>
    </form>
  );
};
