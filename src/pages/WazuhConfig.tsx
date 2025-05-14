import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useComplianceStore } from '../store/complianceStore';

interface WazuhConfigFormData {
  apiUrl: string;
  username: string;
  password: string;
}

const WazuhConfig: React.FC = () => {
  const navigate = useNavigate();
  const { setWazuhCredentials } = useComplianceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<WazuhConfigFormData>({
    defaultValues: {
      apiUrl: 'https://10.108.206.16:55000',
      username: 'wazuh',
      password: '',
    }
  });

  const onSubmit = async (data: WazuhConfigFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionSuccess(false);

      // Make sure the API URL has no trailing slash
      const formattedApiUrl = data.apiUrl.replace(/\/$/, '');
      
      console.log('Connecting to Wazuh API at:', formattedApiUrl);
      
      // Test connection to Wazuh API
      const response = await axios.post('http://localhost:3001/api/tools/wazuh/configure', {
        apiUrl: formattedApiUrl,
        username: data.username,
        password: data.password
      });

      if (response.data.status === 'ok') {
        console.log('Wazuh API connection successful:', response.data);
        
        // Store credentials in state for later use
        setWazuhCredentials({
          apiUrl: formattedApiUrl,
          username: data.username,
          password: data.password
        });
        
        setConnectionSuccess(true);
        
        // Short delay before redirecting to ensure state is updated
        setTimeout(() => {
          console.log('Redirecting to Wazuh result page...');
          
          // Direct navigation - most reliable method
          document.location.href = 'http://localhost:5173/wazuh-result';
        }, 1500);
      } else {
        setError('Failed to connect to Wazuh API.');
      }
    } catch (error: any) {
      console.error('Error connecting to Wazuh API:', error);
      setError(error.response?.data?.message || error.message || 'Failed to connect to Wazuh API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Wazuh Integration Configuration</h1>
          <p className="text-neutral-400 mt-1">Configure connection to your Wazuh server</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <ShieldAlert className="h-5 w-5 text-primary-500 mr-2" />
                <h2 className="text-lg font-medium text-white">Wazuh API Credentials</h2>
              </div>
              
              <p className="text-neutral-300 text-sm mb-4">
                Enter your Wazuh server details to connect to the Wazuh REST API. 
                The integration requires API credentials with sufficient permissions.
              </p>
              
              {error && (
                <div className="bg-error-900 border border-error-700 text-error-300 p-3 rounded mb-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {connectionSuccess && (
                <div className="bg-success-900 border border-success-700 text-success-300 p-3 rounded mb-4 flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Successfully connected to Wazuh API! Redirecting to dashboard...</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiUrl" className="block text-sm font-medium text-neutral-300 mb-1">
                      Wazuh API URL
                    </label>
                    <input
                      id="apiUrl"
                      type="text"
                      placeholder="https://your-wazuh-server:55000"
                      className={`input w-full ${errors.apiUrl ? 'border-error-500' : ''}`}
                      {...register('apiUrl', { required: 'API URL is required' })}
                    />
                    {errors.apiUrl && (
                      <p className="text-error-500 text-xs mt-1">{errors.apiUrl.message}</p>
                    )}
                    <p className="text-neutral-500 text-xs mt-1">Include protocol (https://), hostname and port (default: 55000)</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-1">
                        API Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        placeholder="wazuh"
                        className={`input w-full ${errors.username ? 'border-error-500' : ''}`}
                        {...register('username', { required: 'Username is required' })}
                      />
                      {errors.username && (
                        <p className="text-error-500 text-xs mt-1">{errors.username.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
                        API Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••••"
                        className={`input w-full ${errors.password ? 'border-error-500' : ''}`}
                        {...register('password', { required: 'Password is required' })}
                      />
                      {errors.password && (
                        <p className="text-error-500 text-xs mt-1">{errors.password.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      className="btn-outline mr-3"
                      onClick={() => window.location.href = 'http://localhost:5173/integrations'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : 'Connect & Configure'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="card h-fit">
          <h3 className="text-lg font-medium text-white mb-4">Connection Help</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">API Authentication</h4>
              <p className="text-neutral-400">
                Wazuh API uses JWT authentication tokens which expire every 15 minutes. 
                This integration will automatically refresh your token in the background.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">Required Permissions</h4>
              <p className="text-neutral-400">
                The user account must have permissions to read agents, SCA results, 
                and system information for full functionality.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">API Endpoint Format</h4>
              <p className="text-neutral-400">
                Enter the full URL including https:// and port 55000.
                Example: https://10.108.206.16:55000
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-200 mb-1">Testing the Connection</h4>
              <p className="text-neutral-400">
                When you click "Connect & Configure", the system will test the connection
                to ensure your credentials work properly.
              </p>
            </div>
            
            <div className="pt-4 border-t border-neutral-800 mt-4">
              <h4 className="font-medium text-neutral-200 mb-1">Need Help?</h4>
              <p className="text-neutral-400">
                Check the <a href="#" className="text-primary-400 hover:text-primary-300">Wazuh Documentation</a> or
                contact your security administrator for credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WazuhConfig; 