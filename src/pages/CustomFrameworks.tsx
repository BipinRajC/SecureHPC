import React from 'react';
import { useComplianceStore } from '../store/complianceStore';
import { 
  Shield, FileEdit, Plus, PlusCircle, 
  ClipboardCheck, Copy, Upload, Download
} from 'lucide-react';

const CustomFrameworks: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Compliance Frameworks</h1>
          <p className="text-neutral-400 mt-1">Create and manage custom security compliance frameworks</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn-primary">
            <PlusCircle size={18} className="mr-2" />
            Create New Framework
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Your Custom Frameworks</h2>
            
            <div className="bg-background-light p-5 rounded-lg border border-neutral-800 mb-4">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <Shield size={18} className="text-primary-500 mr-2" />
                    <h3 className="font-medium text-white">HPC Security Standard</h3>
                  </div>
                  <p className="text-sm text-neutral-300 mt-1 mb-3">
                    Custom framework for High Performance Computing environments
                  </p>
                </div>
                <div className="text-sm text-neutral-400">
                  v1.0
                </div>
              </div>
              
              <div className="mb-3 text-xs text-neutral-400">
                35 controls • Created on Jan 10, 2025
              </div>
              
              <div className="flex justify-between">
                <div className="space-x-2">
                  <button className="btn-outline py-1 px-3 text-sm inline-flex items-center">
                    <FileEdit size={14} className="mr-1" />
                    Edit
                  </button>
                  <button className="btn-outline py-1 px-3 text-sm inline-flex items-center">
                    <Copy size={14} className="mr-1" />
                    Duplicate
                  </button>
                </div>
                <button className="btn-primary py-1 px-3 text-sm">Run Assessment</button>
              </div>
            </div>
            
            <div className="border border-dashed border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background-card flex items-center justify-center mb-3">
                <Plus size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Create a Custom Framework</h3>
              <p className="text-sm text-neutral-400 text-center mb-4 max-w-md">
                Define your own security controls and compliance requirements tailored to your specific needs
              </p>
              <button className="btn-primary">Start Creating</button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center mr-3">
                  <PlusCircle size={20} className="text-primary-500" />
                </div>
                <div>
                  <div className="font-medium text-white">Create Framework</div>
                  <div className="text-xs text-neutral-400">Start from scratch</div>
                </div>
              </button>
              
              <button className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center">
                <div className="w-10 h-10 rounded-full bg-secondary-900 flex items-center justify-center mr-3">
                  <Upload size={20} className="text-secondary-500" />
                </div>
                <div>
                  <div className="font-medium text-white">Import Framework</div>
                  <div className="text-xs text-neutral-400">Upload JSON or XML file</div>
                </div>
              </button>
              
              <button className="w-full py-3 px-4 bg-background-light rounded-lg text-left hover:bg-neutral-800 transition-colors flex items-center">
                <div className="w-10 h-10 rounded-full bg-accent-900 flex items-center justify-center mr-3">
                  <ClipboardCheck size={20} className="text-accent-500" />
                </div>
                <div>
                  <div className="font-medium text-white">From Template</div>
                  <div className="text-xs text-neutral-400">Start from a template</div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-4">Framework Resources</h2>
            <div className="space-y-2 mb-4">
              <a href="#" className="block text-primary-400 hover:text-primary-300 py-2">
                <Download size={16} className="inline-block mr-2" />
                Framework Creation Guide
              </a>
              <a href="#" className="block text-primary-400 hover:text-primary-300 py-2">
                <Download size={16} className="inline-block mr-2" />
                Control Examples
              </a>
              <a href="#" className="block text-primary-400 hover:text-primary-300 py-2">
                <Download size={16} className="inline-block mr-2" />
                Framework JSON Schema
              </a>
              <a href="#" className="block text-primary-400 hover:text-primary-300 py-2">
                <Download size={16} className="inline-block mr-2" />
                Best Practices Documentation
              </a>
            </div>
            <p className="text-sm text-neutral-400">
              Need help creating custom frameworks? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFrameworks;