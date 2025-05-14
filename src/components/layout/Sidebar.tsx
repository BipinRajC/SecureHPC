import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, GitMerge, Settings, 
  Database, Clock, History, PlusCircle, X,
  ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const Sidebar: React.FC = () => {
  const { sidebarOpen, closeSidebar } = useAppStore();

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/frameworks', icon: <Shield size={20} />, label: 'Compliance Frameworks' },
    { to: '/custom-frameworks', icon: <PlusCircle size={20} />, label: 'Custom Frameworks' },
    { to: '/integrations', icon: <GitMerge size={20} />, label: 'Tool Integrations' },
    { to: '/wazuh-result', icon: <ShieldAlert size={20} />, label: 'Wazuh Dashboard' },
    { to: '/assessments', icon: <Database size={20} />, label: 'Assessment Results' },
    { to: '/scheduled', icon: <Clock size={20} />, label: 'Scheduled Assessments' },
    { to: '/historical', icon: <History size={20} />, label: 'Historical Data' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside 
      className={`bg-background-card border-r border-neutral-800 w-64 fixed inset-y-0 left-0 z-30 lg:relative transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <Shield className="text-primary-500" size={24} />
            <h1 className="text-xl font-bold text-white">SecureHPC</h1>
          </div>
          <button 
            onClick={closeSidebar} 
            className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-300 hover:bg-background-light hover:text-white'
                    }`
                  }
                  onClick={() => window.innerWidth < 1024 && closeSidebar()}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-secondary-700 flex items-center justify-center">
              <span className="text-white font-medium">SC</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Security Center</p>
              <p className="text-xs text-neutral-400">Enterprise Edition</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;