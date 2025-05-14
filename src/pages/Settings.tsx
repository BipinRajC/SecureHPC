import React from 'react';
import { 
  User, Bell, Lock, Database, 
  Globe, RefreshCw, Sliders, FileText
} from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-neutral-400 mt-1">Configure system preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex flex-col items-center pb-4 border-b border-neutral-800">
              <div className="w-20 h-20 rounded-full bg-primary-900 flex items-center justify-center mb-3">
                <User size={36} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-medium text-white">Security Admin</h2>
              <p className="text-sm text-neutral-400">admin@example.com</p>
              <button className="mt-4 btn-outline text-sm">Edit Profile</button>
            </div>
            
            <nav className="mt-4">
              <ul className="space-y-1">
                <li>
                  <a href="#account" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <User size={18} className="mr-3 text-neutral-400" />
                    <span>Account Settings</span>
                  </a>
                </li>
                <li>
                  <a href="#notifications" className="flex items-center px-3 py-2 text-white bg-primary-600 bg-opacity-20 rounded">
                    <Bell size={18} className="mr-3 text-primary-400" />
                    <span>Notifications</span>
                  </a>
                </li>
                <li>
                  <a href="#security" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <Lock size={18} className="mr-3 text-neutral-400" />
                    <span>Security & Privacy</span>
                  </a>
                </li>
                <li>
                  <a href="#database" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <Database size={18} className="mr-3 text-neutral-400" />
                    <span>Database Connections</span>
                  </a>
                </li>
                <li>
                  <a href="#api" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <Globe size={18} className="mr-3 text-neutral-400" />
                    <span>API Settings</span>
                  </a>
                </li>
                <li>
                  <a href="#backup" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <RefreshCw size={18} className="mr-3 text-neutral-400" />
                    <span>Backup & Restore</span>
                  </a>
                </li>
                <li>
                  <a href="#advanced" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <Sliders size={18} className="mr-3 text-neutral-400" />
                    <span>Advanced Settings</span>
                  </a>
                </li>
                <li>
                  <a href="#logs" className="flex items-center px-3 py-2 text-neutral-200 rounded hover:bg-background-light">
                    <FileText size={18} className="mr-3 text-neutral-400" />
                    <span>System Logs</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card mb-6" id="notifications">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-primary-400" />
              Notification Settings
            </h2>
            
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Assessment Completed</span>
                      <span className="text-xs text-neutral-500">Get notified when an assessment finishes</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Critical Issues Detected</span>
                      <span className="text-xs text-neutral-500">Urgent alerts for critical compliance issues</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Weekly Summary</span>
                      <span className="text-xs text-neutral-500">Weekly report of compliance status</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-3">System Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Dashboard Alerts</span>
                      <span className="text-xs text-neutral-500">Show alerts on the dashboard</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Tool Integration Status</span>
                      <span className="text-xs text-neutral-500">Get notified when a tool connection changes</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Notification Recipients</h3>
                <div className="mb-4">
                  <label className="block text-sm text-neutral-400 mb-1">
                    Additional Email Recipients
                  </label>
                  <textarea 
                    className="input w-full h-20 font-mono"
                    placeholder="Enter email addresses, one per line"
                    defaultValue="security-team@example.com&#10;admin@example.com"
                  ></textarea>
                  <p className="text-xs text-neutral-500 mt-1">
                    These email addresses will receive copies of all enabled notifications
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button className="btn-outline">Cancel</button>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
          
          <div className="card" id="advanced">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Sliders size={20} className="mr-2 text-primary-400" />
              Advanced Settings
            </h2>
            
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-3">Assessment Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">
                      Default Assessment Timeout (minutes)
                    </label>
                    <input 
                      type="number" 
                      className="input w-full md:w-64"
                      defaultValue="60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">
                      Assessment Concurrency Limit
                    </label>
                    <select className="select w-full md:w-64">
                      <option value="1">1 (Sequential)</option>
                      <option value="2">2</option>
                      <option value="3" selected>3</option>
                      <option value="4">4</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-3">Data Retention</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">
                      Keep Historical Assessment Data For
                    </label>
                    <select className="select w-full md:w-64">
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90" selected>90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Auto-Archive Old Assessments</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Performance Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">
                      Dashboard Refresh Interval (seconds)
                    </label>
                    <input 
                      type="number" 
                      className="input w-full md:w-64"
                      defaultValue="30"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <span className="text-neutral-200 mr-2">Enable Background Processing</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button className="btn-outline">Reset to Defaults</button>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;