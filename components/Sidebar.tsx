import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Warehouse, 
  DollarSign, 
  ClipboardList, 
  FileText, 
  PieChart, 
  Upload, 
  Download, 
  Trash2,
  Wallet
} from 'lucide-react';
import { ViewName } from '../types';

interface SidebarProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onNavigate, 
  onImport, 
  onExport, 
  onClear,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navItems: { view: ViewName; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { view: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { view: 'farms', label: 'Farms', icon: <Warehouse size={20} /> },
    { view: 'accounts', label: 'Accounts', icon: <Wallet size={20} /> },
    { view: 'sales', label: 'Sales', icon: <DollarSign size={20} /> },
    { view: 'receivables', label: 'Receivables', icon: <ClipboardList size={20} /> },
    { view: 'vouchers', label: 'Vouchers', icon: <FileText size={20} /> },
    { view: 'reports', label: 'Reports', icon: <PieChart size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen
      `}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent uppercase leading-tight">
            AL REHMAN POULTRY FARMS
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => {
                    onNavigate(item.view);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${activeView === item.view 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Data Management</h3>
          <button 
            onClick={onImport}
            className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors"
          >
            <Upload size={16} />
            <span>Import Data</span>
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={onExport}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-green-400 py-2 rounded-lg text-sm transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button 
              onClick={onClear}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-800 hover:bg-red-900/30 text-red-400 py-2 rounded-lg text-sm transition-colors"
            >
              <Trash2 size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};