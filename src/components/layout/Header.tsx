import React from 'react';
import { Bell, Menu, Shield, Settings, Search, Menu as MenuIcon, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const Header: React.FC = () => {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="bg-background-card border-b border-neutral-800 py-3 px-4 shadow-nav">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input 
              type="search" 
              placeholder="Search..."
              className="bg-background-light pl-10 pr-4 py-2 rounded-md border border-neutral-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none w-64"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center text-sm p-2 rounded bg-primary-800 hover:bg-primary-700 text-white"
            onClick={() => { window.location.href = 'http://localhost:5173/wazuh-result'; }}
          >
            <ShieldAlert size={16} className="mr-1" />
            <span className="hidden md:inline">Wazuh Dashboard</span>
          </button>
          
          <button className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          
          <button className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300">
            <Settings size={20} />
          </button>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white">
              <Shield size={16} />
            </div>
            <span className="ml-2 text-sm font-medium hidden md:block">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;