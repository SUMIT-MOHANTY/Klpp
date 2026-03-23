import React, { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// Types for claim data structure
interface ClaimFormData {
  policyNumber: string;
  insuredName: string;
  incidentDate: string;
  incidentType: string;
  incidentLocation: string;
  description: string;
  estimatedDamage: string;
  contactEmail: string;
  contactPhone: string;
}

interface FileUpload {
  file: File;
  preview: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// Main Claim File Form Component
const ClaimFileForm: React.FC = () => {
  const [formData, setFormData] = useState<ClaimFormData>({
    policyNumber: '',
    insuredName: '',
    incidentDate: '',
    incidentType: '',
    incidentLocation: '',
    description: '',
    estimatedDamage: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Incident type options
  const incidentTypes = [
    'Vehicle Accident',
    'Property Damage',
    'Theft',
    'Natural Disaster',
    'Fire',
    'Vandalism',
    'Other',
  ];

  // Handle input changes
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.policyNumber.trim()) newErrors.policyNumber = 'Policy number is required';
    if (!formData.insuredName.trim()) newErrors.insuredName = 'Insured name is required';
    if (!formData.incidentDate) newErrors.incidentDate = 'Incident date is required';
    if (!formData.incidentType) newErrors.incidentType = 'Please select incident type';
    if (!formData.incidentLocation.trim()) newErrors.incidentLocation = 'Incident location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.estimatedDamage || parseFloat(formData.estimatedDamage) <= 0) {
      newErrors.estimatedDamage = 'Valid damage amount is required';
    }
    if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Valid email address is required';
    }
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone number is required';
    else if (!/^[\d\s\-\+\(\)\.]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList) => {
    const newFiles: FileUpload[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} exceeds 10MB limit`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        alert(`File ${file.name} must be JPG, PNG, or PDF`);
        continue;
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '/pdf-icon.svg';
      newFiles.push({ file, preview });
    }
    setAttachments(prev => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call - replace with actual endpoint
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add attachments
      attachments.forEach(({ file }) => {
        formDataToSend.append('attachments', file);
      });

      // Replace with actual API endpoint
      const response = await fetch('/api/claims', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit claim');
      }

      const result = await response.json();
      console.log('Claim submitted successfully:', result);
      setSubmitStatus('success');

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          policyNumber: '',
          insuredName: '',
          incidentDate: '',
          incidentType: '',
          incidentLocation: '',
          description: '',
          estimatedDamage: '',
          contactEmail: '',
          contactPhone: '',
        });
        setAttachments([]);
        setErrors({});
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error submitting claim:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isSubmitting && submitStatus === 'idle') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Form component rendering based on submission status
  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Claim Submitted Successfully!</h3>
        <p className="text-gray-600">Your claim has been filed. We'll notify you via email with updates.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">File Insurance Claim</h2>

      {/* Policy Information */}
      <div className="space-y-6">
        {/* Policy Number */}
        <div>
          <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Policy Number *
          </label>
          <input
            type="text"
            id="policyNumber"
            name="policyNumber"
            value={formData.policyNumber}
            onChange={handleInputChange}
            placeholder="e.g., POL-12345678"
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              errors.policyNumber ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {errors.policyNumber && <p className="text-sm text-red-600 mt-1">{errors.policyNumber}</p>}
        </div>

        {/* Insured Name */}
        <div>
          <label htmlFor="insuredName" className="block text-sm font-medium text-gray-700 mb-2">
            Insured Name *
          </label>
          <input
            type="text"
            id="insuredName"
            name="insuredName"
            value={formData.insuredName}
            onChange={handleInputChange}
            placeholder="Full name as on policy"
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              errors.insuredName ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {errors.insuredName && <p className="text-sm text-red-600 mt-1">{errors.insuredName}</p>}
        </div>

        {/* Incident Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="incidentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Incident Date *
            </label>
            <input
              type="date"
              id="incidentDate"
              name="incidentDate"
              value={formData.incidentDate}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md transition-colors ${
                errors.incidentDate ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.incidentDate && <p className="text-sm text-red-600 mt-1">{errors.incidentDate}</p>}
          </div>

          <div>
            <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-2">
              Incident Type *
            </label>
            <select
              id="incidentType"
              name="incidentType"
              value={formData.incidentType}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md transition-colors ${
                errors.incidentType ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            >
              <option value="">Select type</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.incidentType && <p className="text-sm text-red-600 mt-1">{errors.incidentType}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="incidentLocation" className="block text-sm font-medium text-gray-700 mb-2">
            Incident Location *
          </label>
          <input
            type="text"
            id="incidentLocation"
            name="incidentLocation"
            value={formData.incidentLocation}
            onChange={handleInputChange}
            placeholder="Address where incident occurred"
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              errors.incidentLocation ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {errors.incidentLocation && <p className="text-sm text-red-600 mt-1">{errors.incidentLocation}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Incident Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            maxLength={1000}
            placeholder="Provide detailed description of the incident"
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Estimated Damage */}
        <div>
          <label htmlFor="estimatedDamage" className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Damage Amount *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
            <input
              type="number"
              id="estimatedDamage"
              name="estimatedDamage"
              value={formData.estimatedDamage}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full pl-8 pr-3 py-2 border rounded-md transition-colors ${
                errors.estimatedDamage ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>
          {errors.estimatedDamage && <p className="text-sm text-red-600 mt-1">{errors.estimatedDamage}</p>}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-md transition-colors ${
                errors.contactEmail ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.contactEmail && <p className="text-sm text-red-600 mt-1">{errors.contactEmail}</p>}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone *
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              placeholder="(123) 456-7890"
              className={`w-full px-3 py-2 border rounded-md transition-colors ${
                errors.contactPhone ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.contactPhone && <p className="text-sm text-red-600 mt-1">{errors.contactPhone}</p>}
          </div>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Documents
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your files here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, PDF up to 10MB
              </p>
            </div>
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Attached Files ({attachments.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-600 truncate block">{attachment.file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">
              Failed to submit claim. Please try again or contact support.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                policyNumber: '',
                insuredName: '',
                incidentDate: '',
                incidentType: '',
                incidentLocation: '',
                description: '',
                estimatedDamage: '',
                contactEmail: '',
                contactPhone: '',
              });
              setAttachments([]);
              setErrors({});
            }}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Reset Form
          </button>
        </div>
      </div>
    </form>
  );
};

export default ClaimFileForm;
