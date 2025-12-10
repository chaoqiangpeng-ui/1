
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
