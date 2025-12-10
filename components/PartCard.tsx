import React from 'react';
import { Part, PartHealth, PartStatus } from '../types';
import { RefreshCw, AlertTriangle, CheckCircle, AlertOctagon, Calendar, Clock, Monitor, Pencil, Copy } from 'lucide-react';

interface PartCardProps {
  part: Part;
  health: PartHealth;
  onReplace: (id: string) => void;
  onEdit: (part: Part) => void;
  onClone: (part: Part) => void;
}

export const PartCard: React.FC<PartCardProps> = ({ part, health, onReplace, onEdit, onClone }) => {
  
  const getStatusColor = (status: PartStatus) => {
    switch (status) {
      case PartStatus.Good: return 'bg-emerald-500';
      case PartStatus.Warning: return 'bg-amber-500';
      case PartStatus.Critical: return 'bg-rose-500';
    }
  };

  const getStatusIcon = (status: PartStatus) => {
    switch (status) {
      case PartStatus.Good: return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case PartStatus.Warning: return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case PartStatus.Critical: return <AlertOctagon className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col group relative">
      <div className="p-5 flex-1">
        
        {/* Header with Machine ID badge and Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-2">
            <div className="flex gap-2 mb-2 flex-wrap items-center">
              <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                <Monitor className="w-3 h-3 mr-1" />
                {part.machineId}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {part.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{part.name}</h3>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="bg-slate-50 p-2 rounded-full flex-shrink-0">
              {getStatusIcon(health.status)}
            </div>
          </div>
        </div>

        {/* Action Buttons (Visible on hover or mobile) */}
        <div className="absolute top-4 right-14 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <button 
             onClick={() => onEdit(part)}
             className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
             title="Edit Part"
           >
             <Pencil className="w-4 h-4" />
           </button>
           <button 
             onClick={() => onClone(part)}
             className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
             title="Clone to other machine"
           >
             <Copy className="w-4 h-4" />
           </button>
        </div>

        <div className="space-y-4">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Wear Level</span>
              <span className="font-medium text-slate-700">{health.percentageUsed.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${getStatusColor(health.status)}`} 
                style={{ width: `${Math.min(health.percentageUsed, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center text-slate-500 mb-1">
                <Calendar className="w-3 h-3 mr-1" /> Installed
              </div>
              <div className="font-medium text-slate-700">
                {new Date(part.installDate).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center text-slate-500 mb-1">
                <Clock className="w-3 h-3 mr-1" /> Remaining
              </div>
              <div className={`font-medium ${health.daysRemaining < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {health.daysRemaining} days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 p-4 border-t border-slate-100">
        <button
          onClick={() => onReplace(part.id)}
          className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm transition-colors duration-200 active:bg-slate-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Replace & Reset Date</span>
        </button>
      </div>
    </div>
  );
};