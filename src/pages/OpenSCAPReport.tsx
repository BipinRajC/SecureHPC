import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useComplianceStore } from '../store/complianceStore';

const OpenSCAPReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { 
    openscapReportHtml, 
    error,
    loading: storeLoading,
    runOpenScapScan
  } = useComplianceStore();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      
      try {
        // Run the OpenSCAP scan if not already done
        if (!openscapReportHtml) {
          await runOpenScapScan();
        }
      } catch (err) {
        console.error('Error fetching OpenSCAP report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [openscapReportHtml, runOpenScapScan]);

  const handleRescan = async () => {
    setLoading(true);
    try {
      await runOpenScapScan();
    } catch (err) {
      console.error('Error rescanning:', err);
    } finally {
      setLoading(false);
    }
  };

  const openReportInBrowser = () => {
    // Check if window exists (browser environment)
    if (typeof window !== 'undefined' && openscapReportHtml) {
      // In browser - create a temporary file and open in new tab
      const blob = new Blob([openscapReportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // For command-line context, we show the command in loading area
      // The actual xdg-open command would be executed server-side in a real app
      console.log('Command that would run in terminal: xdg-open oval-$(lsb_release -cs).html');
    }
  };

  const isLoading = loading || storeLoading.openscapRunning;
  const reportError = error?.openscapScan;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/integrations')} 
            className="mr-4 btn-outline py-1 px-3"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Tools
          </button>
          <h1 className="text-2xl font-bold text-white">OpenSCAP OVAL Report</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            className="btn-outline py-1 px-3" 
            onClick={handleRescan}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-1 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-1" />
                Rescan
              </>
            )}
          </button>
          <button 
            className="btn-secondary py-1 px-3"
            onClick={openReportInBrowser}
            disabled={isLoading || !openscapReportHtml}
          >
            <ExternalLink size={16} className="mr-1" />
            Open Report
          </button>
          <button 
            className="btn-primary py-1 px-3"
            onClick={() => {
              if (openscapReportHtml) {
                // Create a blob and download it
                const blob = new Blob([openscapReportHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `openscap-oval-report-${new Date().toISOString().split('T')[0]}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
            disabled={isLoading || !openscapReportHtml}
          >
            <Download size={16} className="mr-1" />
            Download Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="animate-pulse text-primary-400 mb-4">
            Running OVAL Security Assessment...
          </div>
          <div className="text-sm text-neutral-400 max-w-md">
            <p className="mb-2">Executing:</p>
            <pre className="bg-background-light p-2 rounded text-left text-xs overflow-x-auto mb-2">
              wget https://security-metadata.canonical.com/oval/com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
            </pre>
            <pre className="bg-background-light p-2 rounded text-left text-xs overflow-x-auto mb-2">
              bzip2 -d com.ubuntu.$(lsb_release -cs).usn.oval.xml.bz2
            </pre>
            <pre className="bg-background-light p-2 rounded text-left text-xs overflow-x-auto mb-2">
              oscap oval eval --report oval-$(lsb_release -cs).html com.ubuntu.$(lsb_release -cs).usn.oval.xml
            </pre>
            <pre className="bg-background-light p-2 rounded text-left text-xs overflow-x-auto">
              xdg-open oval-$(lsb_release -cs).html
            </pre>
          </div>
        </div>
      ) : reportError ? (
        <div className="text-center py-8 text-error-500">
          <AlertTriangle size={40} className="mx-auto mb-2" />
          <p>{reportError}</p>
        </div>
      ) : openscapReportHtml ? (
        <div className="bg-white rounded-lg overflow-hidden">
          <iframe
            title="OpenSCAP OVAL Report"
            srcDoc={openscapReportHtml}
            className="w-full h-[85vh] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          <p>No OVAL report available. Click "Rescan" to generate a new security assessment.</p>
        </div>
      )}
    </div>
  );
};

export default OpenSCAPReport; 