import React from 'react';
import { UserRole } from '../types';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  theme: string;
  companyName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentRole, 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  setIsMobileOpen,
  theme,
  companyName
}) => {
  
  const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-center border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center font-bold text-xl tracking-tight">
            <span className="text-white">TELEE</span>
            <span className="text-blue-500">X</span>
            <span className="text-white relative">
                PRO
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 rounded-full"></span>
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? `bg-${theme}-600 text-white shadow-lg shadow-${theme}-900/50 transform translate-x-1` 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : `text-${theme}-400 group-hover:text-white`}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 shadow-inner border border-slate-700/50">
             <p className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wider">Current Role</p>
             <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full bg-${theme}-500 animate-pulse`}></div>
                 <p className={`text-sm font-bold text-white`}>{currentRole}</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};