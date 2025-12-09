
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print:p-0 print:bg-white print:block">
      {/* 
        Updated layout:
        1. max-h-[90vh]: Ensures modal doesn't exceed screen height
        2. flex flex-col: Allows header to stay fixed while body scrolls
      */}
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up print:shadow-none print:w-full print:max-w-none print:max-h-none print:h-auto`}>
        {/* Header - Fixed at top */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 print:hidden flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body - Scrollable */}
        {/* Removed p-5 to allow children to control padding (e.g. for full width gray background in vouchers) */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
