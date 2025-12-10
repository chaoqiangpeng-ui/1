import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Part } from '../types';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; machineId: string; name: string; category: string; lifespanDays: number; installDate: string }) => void;
  initialMachineId?: string;
  initialData?: Part | null; // If present, we are editing or cloning
  mode?: 'create' | 'edit' | 'clone';
}

const CATEGORY_SUGGESTIONS = [
  'General',
  'Engine',
  'Hydraulics',
  'Electronics',
  'Transmission',
  'Brakes',
  'HVAC',
  'Filters',
  'Fluids',
  'Belts',
  'Sensors'
];

export const AddPartModal: React.FC<AddPartModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialMachineId, 
  initialData,
  mode = 'create'
}) => {
  const [machineId, setMachineId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [lifespan, setLifespan] = useState('');
  const [installDate, setInstallDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData && (mode === 'edit' || mode === 'clone')) {
        // Pre-fill form from existing data
        setMachineId(mode === 'clone' ? '' : initialData.machineId); // Clear machine ID on clone so user chooses
        setName(initialData.name);
        setCategory(initialData.category);
        setLifespan(initialData.lifespanDays.toString());
        
        // Format ISO date to YYYY-MM-DD for input
        try {
          const dateStr = mode === 'clone' 
            ? new Date().toISOString().split('T')[0] // Clone defaults to today
            : new Date(initialData.installDate).toISOString().split('T')[0]; // Edit uses existing
          setInstallDate(dateStr);
        } catch (e) {
          setInstallDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        // Reset for new entry
        setMachineId(initialMachineId === 'all' ? '' : (initialMachineId || ''));
        setName('');
        setCategory('General');
        setLifespan('');
        setInstallDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, initialMachineId, initialData, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !name || !lifespan || !installDate) return;
    
    onSave({
      id: mode === 'edit' ? initialData?.id : undefined, // Only pass ID if editing
      machineId,
      name,
      category,
      lifespanDays: Number(lifespan),
      installDate: new Date(installDate).toISOString()
    });
    onClose();
  };

  const getTitle = () => {
    if (mode === 'edit') return 'Edit Part Details';
    if (mode === 'clone') return 'Clone Part to New Machine';
    return 'Add New Part';
  };

  const getButtonText = () => {
    if (mode === 'edit') return 'Save Changes';
    if (mode === 'clone') return 'Clone Part';
    return 'Add Part';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">{getTitle()}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Machine ID</label>
            <input 
              type="text" 
              required
              value={machineId}
              onChange={e => setMachineId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder={mode === 'clone' ? "Enter new machine ID..." : "e.g. M-01"}
              autoFocus={mode === 'clone'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder="e.g. Hydraulic Pump"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
               <input 
                  type="text"
                  list="category-suggestions"
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                  placeholder="Select or type..."
                />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lifespan (Days)</label>
              <input 
                type="number" 
                required
                min="1"
                value={lifespan}
                onChange={e => setLifespan(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                placeholder="365"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Installation Date</label>
            <input 
              type="date" 
              required
              value={installDate}
              onChange={e => setInstallDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
            />
             {mode === 'edit' && (
              <p className="text-xs text-slate-500 mt-1">Warning: Changing this will recalculate current wear.</p>
            )}
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {getButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};