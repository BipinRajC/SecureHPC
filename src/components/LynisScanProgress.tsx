import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface LynisScanProgressProps {
  jobId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

const LynisScanProgress: React.FC<LynisScanProgressProps> = ({
  jobId,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'starting' | 'running' | 'completed' | 'error' | 'not_running'>('starting');
  const [message, setMessage] = useState('Initializing scan...');
  const [partialResults, setPartialResults] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let pollInterval: any = null;
    
    // Start polling for progress updates
    if (isPolling) {
      pollInterval = setInterval(async () => {
        try {
          const response = await axios.get('http://localhost:3001/api/tools/lynis/progress');
          
          if (response.data.status === 'ok') {
            const scanStatus = response.data.progress;
            
            // Update local state with progress info
            setProgress(scanStatus.progress || 0);
            setStatus(scanStatus.status);
            setMessage(scanStatus.message || 'Running scan...');
            
            if (scanStatus.partial_results) {
              setPartialResults(scanStatus.partial_results);
            }
            
            // If the scan is complete, stop polling and call the onComplete callback
            if (scanStatus.status === 'completed') {
              setIsPolling(false);
              if (onComplete && scanStatus.partial_results) {
                onComplete(scanStatus.partial_results);
              }
            }
            
            // If there's an error, stop polling and call the onError callback
            if (scanStatus.status === 'error') {
              setIsPolling(false);
              if (onError) {
                onError(scanStatus.message || 'An error occurred during the scan');
              }
            }
          }
        } catch (error) {
          console.error('Error polling for scan progress:', error);
          // Don't stop polling on network errors, just try again
        }
      }, 1000); // Poll every second for real-time updates
    }
    
    // Clean up the polling interval
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, jobId, onComplete, onError]);
  
  // Helper function to get status indicator icon
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'starting':
      case 'running':
        return <Loader2 className="text-blue-500 animate-spin" size={20} />;
      case 'not_running':
        return <Clock className="text-gray-500" size={20} />;
      default:
        return <Loader2 className="text-blue-500 animate-spin" size={20} />;
    }
  };
  
  return (
    <div className="bg-background-light p-4 rounded-lg border border-neutral-800 mb-4">
      <div className="flex items-center mb-2">
        {getStatusIcon()}
        <span className="ml-2 text-lg font-medium text-white">
          Lynis Security Scan {status === 'completed' ? 'Completed' : 'in Progress'}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-neutral-400">{message}</span>
          <span className="text-neutral-300">{progress}%</span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2.5">
          <div 
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {partialResults && (
        <div className="mt-4">
          <h3 className="text-white font-medium mb-2">Partial Results</h3>
          
          {partialResults.hardening_index && (
            <div className="flex items-center mb-2">
              <div className="w-32 text-neutral-400">Hardening Index:</div>
              <div className="text-primary-400 font-medium">{partialResults.hardening_index}</div>
            </div>
          )}
          
          {partialResults.tests_performed && (
            <div className="flex items-center mb-2">
              <div className="w-32 text-neutral-400">Tests Performed:</div>
              <div className="text-primary-400 font-medium">{partialResults.tests_performed}</div>
            </div>
          )}
          
          {partialResults.suggestions && (
            <div className="flex items-center mb-2">
              <div className="w-32 text-neutral-400">Suggestions:</div>
              <div className="text-yellow-500 font-medium">{partialResults.suggestions}</div>
            </div>
          )}
          
          {partialResults.warnings && (
            <div className="flex items-center mb-2">
              <div className="w-32 text-neutral-400">Warnings:</div>
              <div className="text-red-500 font-medium">{partialResults.warnings}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LynisScanProgress; 