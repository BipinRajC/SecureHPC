import React, { useState } from 'react';
import useFrameworkStore from '../store/frameworkStore';
import { X, Upload, Download } from 'lucide-react';
import axios from 'axios';

interface CreateFrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateFrameworkModal: React.FC<CreateFrameworkModalProps> = ({ isOpen, onClose }) => {
  const { addCustomFramework, fetchFrameworks } = useFrameworkStore();
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    controls: [] as any[],
    supportedTools: ['wazuh', 'openscap', 'lynis'] as string[]
  });
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    try {
      const content = await file.text();
      let controls = JSON.parse(content);
      
      // If controls is an array, use it directly
      // If it's an object with properties, wrap it in an array
      if (!Array.isArray(controls)) {
        if (typeof controls === 'object' && controls !== null) {
          controls = [controls];
        } else {
          throw new Error('Invalid controls format. Expected an array or object.');
        }
      }
      
      console.log('Parsed controls:', controls);
      setFormData(prev => ({ ...prev, controls }));
      setJsonFile(file);
      setError(null);
    } catch (err) {
      console.error('JSON parsing error:', err);
      setError('Invalid JSON file. Please check the file format.');
    }
  };

  const handleDownloadSample = async () => {
    try {
      // Create a detailed sample controls array
      const sampleControls = [
        {
          "id": "CTRL-001",
          "title": "Strong Authentication",
          "description": "Implement strong authentication mechanisms for all systems",
          "severity": "high",
          "category": "Authentication",
          "requirements": [
            "Multi-factor authentication for admin accounts",
            "Password complexity enforcement",
            "Regular credential rotation"
          ],
          "remediation": "Configure identity provider with MFA and strong password policies",
          "automated": true
        },
        {
          "id": "CTRL-002",
          "title": "Data Encryption",
          "description": "Ensure all sensitive data is encrypted at rest and in transit",
          "severity": "critical",
          "category": "Data Protection",
          "requirements": [
            "TLS 1.2+ for all communications",
            "AES-256 for data at rest",
            "Key management processes"
          ],
          "remediation": "Implement encryption solutions and proper key management",
          "automated": true
        }
      ];
      
      // Create a blob from the JSON data
      const blob = new Blob([JSON.stringify(sampleControls, null, 2)], { 
        type: 'application/json' 
      });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-framework-controls.json';
      
      // Append to the document, click it, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading sample:', err);
      setError('Failed to download sample file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      if (!formData.name || !formData.version || !formData.description) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.controls || formData.controls.length === 0) {
        throw new Error('Please upload a controls file');
      }

      const frameworkData = {
        ...formData,
        status: 'not-assessed' as 'not-assessed' | 'in-progress' | 'completed' | 'compliant' | 'non-compliant',
        compliantCount: 0,
        totalControls: formData.controls.length,
      };
      
      console.log('Framework data to submit:', frameworkData);
      
      try {
        // Try with the store method first
        await addCustomFramework(frameworkData);
        await fetchFrameworks(); // Refresh the frameworks list
        onClose();
      } catch (storeError) {
        console.error('Store error:', storeError);
        
        // Fall back to direct API call
        try {
          const response = await axios.post('http://localhost:3001/api/frameworks', frameworkData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Framework created successfully:', response.data);
          await fetchFrameworks(); // Refresh the frameworks list
          onClose();
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          throw new Error(
            apiError.response?.data?.message || 
            `API error: ${apiError.message}`
          );
        }
      }
    } catch (err) {
      console.error('Framework creation error:', err);
      let errorMessage = 'Failed to create framework';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        // Handle axios error
        const axiosError = err as any;
        errorMessage = axiosError.response?.data?.message || 
                      `Request failed with status ${axiosError.response?.status}: ${axiosError.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Framework</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Framework Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              placeholder="e.g., HPC Security Standard"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Version *
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              className="input w-full"
              placeholder="e.g., 1.0.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input w-full h-24"
              placeholder="Describe the purpose and scope of this framework..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Controls File (JSON) *
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex-1">
                <div className="input flex items-center cursor-pointer">
                  <Upload size={18} className="text-neutral-400 mr-2" />
                  <span className="text-neutral-400">
                    {jsonFile ? jsonFile.name : 'Upload JSON file'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Upload a JSON file containing the framework controls.
              <button 
                onClick={handleDownloadSample} 
                type="button"
                className="text-primary-400 hover:text-primary-300 ml-1 inline-flex items-center"
              >
                <Download size={12} className="mr-1" />
                Download sample
              </button>
            </p>
          </div>

          {error && (
            <div className="text-error-500 text-sm p-3 bg-error-500 bg-opacity-10 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Framework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFrameworkModal; 