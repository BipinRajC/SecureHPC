import React, { useEffect, useState } from 'react';
import { FileText, Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityAnalysis: React.FC = () => {
  const [lynisScore, setLynisScore] = useState<number | null>(null);
  const [openScapScore, setOpenScapScore] = useState<number | null>(null);
  const [lynisData, setLynisData] = useState<{
    tests: number;
    suggestions: number;
    warnings: number;
    lastRun: string | null;
    categories: Record<string, { pass: number; fail: number }> | null;
  }>({
    tests: 0,
    suggestions: 0,
    warnings: 0,
    lastRun: null,
    categories: null
  });
  
  useEffect(() => {
    // Check if we have Lynis data in localStorage
    const lynisScoreStr = localStorage.getItem('lynis_score');
    const openScapScoreStr = localStorage.getItem('openscap_score');
    
    if (lynisScoreStr) {
      setLynisScore(parseInt(lynisScoreStr, 10));
      
      // Get additional Lynis data
      const tests = parseInt(localStorage.getItem('lynis_tests') || '0', 10);
      const suggestions = parseInt(localStorage.getItem('lynis_suggestions') || '0', 10);
      const warnings = parseInt(localStorage.getItem('lynis_warnings') || '0', 10);
      const lastRun = localStorage.getItem('lynis_last_run');
      
      // Try to get categories data
      let categories = null;
      try {
        const categoriesJson = localStorage.getItem('lynis_categories');
        if (categoriesJson) {
          categories = JSON.parse(categoriesJson);
        }
      } catch (e) {
        console.error('Error parsing Lynis categories:', e);
      }
      
      setLynisData({
        tests,
        suggestions,
        warnings,
        lastRun,
        categories
      });
    }
    
    if (openScapScoreStr) {
      setOpenScapScore(parseInt(openScapScoreStr, 10));
    }
  }, []);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-500';
    if (score >= 70) return 'text-success-400';
    if (score >= 50) return 'text-warning-400';
    return 'text-error-500';
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };
  
  const shouldShowLynisData = lynisScore !== null;
  const shouldShowOpenScapData = openScapScore !== null;
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Security Analysis</h2>
        {(shouldShowLynisData || shouldShowOpenScapData) && (
          <Link to="/assessments" className="text-primary-400 hover:text-primary-300 text-sm">
            View Details
          </Link>
        )}
      </div>
      
      {(!shouldShowLynisData && !shouldShowOpenScapData) ? (
        <div className="text-center py-6">
          <FileText className="mx-auto h-8 w-8 text-neutral-500 mb-2" />
          <p className="text-neutral-500">No security analysis data available</p>
          <Link to="/integrations" className="btn-outline mt-4 inline-block">
            Run Security Scan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shouldShowLynisData && (
            <div className="p-4 bg-background-light rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-white flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-primary-400" />
                  Lynis Security Audit
                </h3>
                <div className={`font-bold text-lg ${getScoreColor(lynisScore)}`}>
                  {lynisScore}/100
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-background rounded-md">
                  <div className="text-neutral-400 text-xs mb-1">Tests</div>
                  <div className="text-white font-medium">{lynisData.tests}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-md">
                  <div className="text-neutral-400 text-xs mb-1">Suggestions</div>
                  <div className="text-warning-400 font-medium">{lynisData.suggestions}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-md">
                  <div className="text-neutral-400 text-xs mb-1">Warnings</div>
                  <div className="text-error-500 font-medium">{lynisData.warnings}</div>
                </div>
              </div>
              
              {lynisData.categories && (
                <div className="mt-3">
                  <h4 className="text-sm text-neutral-300 mb-2">Category Results</h4>
                  <div className="space-y-2">
                    {Object.entries(lynisData.categories).slice(0, 4).map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between text-xs">
                        <div className="capitalize text-neutral-300">
                          {category.replace('_', ' ')}
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-success-500" />
                            <span className="text-neutral-400">{data.pass}</span>
                          </div>
                          <div className="flex items-center">
                            <XCircle className="h-3 w-3 mr-1 text-error-500" />
                            <span className="text-neutral-400">{data.fail}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-neutral-500 mt-3">
                Last scan: {formatDate(lynisData.lastRun)}
              </div>
            </div>
          )}
          
          {shouldShowOpenScapData && (
            <div className="p-4 bg-background-light rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-white flex items-center">
                  <ShieldAlert className="mr-2 h-4 w-4 text-primary-400" />
                  OpenSCAP Compliance
                </h3>
                <div className={`font-bold text-lg ${getScoreColor(openScapScore)}`}>
                  {openScapScore}%
                </div>
              </div>
              <div className="text-xs text-neutral-500 mt-3">
                NIST SP 800-53 Standard Compliance
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityAnalysis; 