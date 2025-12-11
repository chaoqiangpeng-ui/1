import React, { useState, useEffect, useMemo } from 'react';
import { Part, PartHealth, PartStatus, ChatMessage } from './types';
import { PartCard } from './components/PartCard';
import { AIAdvisor } from './components/AIAdvisor';
import { AddPartModal } from './components/AddPartModal';
import { ConfirmModal } from './components/ConfirmModal';
import { getMaintenanceAdvice } from './services/geminiService';
import { 
  Plus, 
  Settings, 
  LayoutGrid, 
  List as ListIcon, 
  Zap,
  Activity,
  Filter,
  Monitor,
  Wrench
} from 'lucide-react';

// Seed Data
const INITIAL_PARTS: Part[] = [
  { id: '1', machineId: 'M-01', name: 'Engine Air Filter', category: 'Engine', installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(), lifespanDays: 365 }, 
  { id: '2', machineId: 'M-01', name: 'Brake Pads (Front)', category: 'Brakes', installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), lifespanDays: 730 }, 
  { id: '3', machineId: 'M-02', name: 'Synthetic Oil', category: 'Engine', installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 170).toISOString(), lifespanDays: 180 }, 
  { id: '4', machineId: 'M-02', name: 'Timing Belt', category: 'Transmission', installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1000).toISOString(), lifespanDays: 1800 }, 
  { id: '5', machineId: 'M-03', name: 'Cabin Filter', category: 'HVAC', installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(), lifespanDays: 365 }, 
];

const STORAGE_KEY = 'partlife_manager_data';

const App: React.FC = () => {
  // Initialize state from LocalStorage if available, otherwise use seed data
  const [parts, setParts] = useState<Part[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Failed to load data from storage", error);
    }
    return INITIAL_PARTS;
  });

  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter States
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedPartName, setSelectedPartName] = useState<string>('all');
  
  // Modal State Management
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // State for replacement confirmation
  const [partToReplace, setPartToReplace] = useState<string>('all');

  // --- Persistence Effect ---
  // Save to LocalStorage whenever 'parts' changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  }, [parts]);

  // --- Logic ---

  const calculateHealth = (part: Part): PartHealth => {
    const installed = new Date(part.installDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - installed.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const percentageUsed = (daysElapsed / part.lifespanDays) * 100;
    const daysRemaining = part.lifespanDays - daysElapsed;

    let status = PartStatus.Good;
    if (percentageUsed >= 100) status = PartStatus.Critical;
    else if (percentageUsed >= 85) status = PartStatus.Warning;

    return { daysElapsed, daysRemaining, percentageUsed, status };
  };

  const partsHealth = useMemo(() => {
    const healthMap: Record<string, PartHealth> = {};
    parts.forEach(p => {
      healthMap[p.id] = calculateHealth(p);
    });
    return healthMap;
  }, [parts]);

  // Extract unique machine IDs for filter
  const uniqueMachines = useMemo(() => {
    const machines = new Set(parts.map(p => p.machineId));
    return Array.from(machines).sort();
  }, [parts]);

  // Extract unique part names for filter
  const uniquePartNames = useMemo(() => {
    const names = new Set(parts.map(p => p.name));
    return Array.from(names).sort();
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const machineMatch = selectedMachine === 'all' || p.machineId === selectedMachine;
      const partMatch = selectedPartName === 'all' || p.name === selectedPartName;
      return machineMatch && partMatch;
    });
  }, [parts, selectedMachine, selectedPartName]);

  // --- Handlers ---

  const handleInitiateReplace = (id: string) => {
    setPartToReplace(id);
  };

  const handleConfirmReplace = () => {
    if (!partToReplace || partToReplace === 'all') return;

    setParts(prevParts => prevParts.map(part => {
      if (part.id === partToReplace) {
        return { ...part, installDate: new Date().toISOString() };
      }
      return part;
    }));
    setPartToReplace('all');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPart(null);
    setIsModalOpen(true);
  };

  const openEditModal = (part: Part) => {
    setModalMode('edit');
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const openCloneModal = (part: Part) => {
    setModalMode('clone');
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const handleSavePart = (data: { id?: string; machineId: string; name: string; category: string; lifespanDays: number; installDate: string }) => {
    if (modalMode === 'edit' && data.id) {
      // Update existing part
      setParts(prevParts => prevParts.map(p => 
        p.id === data.id 
          ? { 
              ...p, 
              machineId: data.machineId, 
              name: data.name, 
              category: data.category, 
              lifespanDays: data.lifespanDays, 
              installDate: data.installDate 
            }
          : p
      ));
    } else {
      // Create new part (Create or Clone)
      const newPart: Part = {
        id: Math.random().toString(36).substr(2, 9),
        machineId: data.machineId,
        name: data.name,
        category: data.category,
        installDate: data.installDate, // Use the provided date (often 'today' for clones, but user editable)
        lifespanDays: data.lifespanDays
      };
      setParts([...parts, newPart]);
      
      // If filtering by a specific machine, and the new part isn't in it, maybe switch filter?
      // Or if we added a new machine ID, selecting it might be nice.
      if (selectedMachine !== 'all' && selectedMachine !== data.machineId) {
        setSelectedMachine(data.machineId);
      }
    }
    setIsModalOpen(false);
  };

  const handleAiMessage = async (text: string) => {
    const newUserMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsAiLoading(true);

    try {
      const advice = await getMaintenanceAdvice(parts, partsHealth, text);
      const newAiMsg: ChatMessage = { role: 'model', text: advice, timestamp: Date.now() };
      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't reach the server.", timestamp: Date.now() }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Stats for Dashboard ---
  const healthValues = Object.values(partsHealth) as PartHealth[];
  const criticalCount = healthValues.filter(h => h.status === PartStatus.Critical).length;
  const warningCount = healthValues.filter(h => h.status === PartStatus.Warning).length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PartLife <span className="text-indigo-600">Manager</span></h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <button 
              onClick={() => setIsAdvisorOpen(true)}
              className="hidden sm:flex items-center space-x-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>AI Advisor</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Parts</p>
              <p className="text-3xl font-bold text-slate-800">{parts.length}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-full">
              <Settings className="w-6 h-6 text-slate-400" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Critical Attention</p>
              <p className="text-3xl font-bold text-rose-600">{criticalCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-full">
              <Activity className="w-6 h-6 text-rose-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Warnings</p>
              <p className="text-3xl font-bold text-amber-500">{warningCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <Activity className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Inventory</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            
            {/* Filters Group */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {/* Machine Filter */}
              <div className="relative group flex-1 sm:flex-none">
                <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm text-sm text-slate-700 min-w-[140px]">
                  <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <select 
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-full appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="all">All Machines</option>
                    {uniqueMachines.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Part Name Filter */}
              <div className="relative group flex-1 sm:flex-none">
                <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm text-sm text-slate-700 min-w-[140px]">
                  <Wrench className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <select 
                    value={selectedPartName}
                    onChange={(e) => setSelectedPartName(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none w-full appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="all">All Parts</option>
                    {uniquePartNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Part</span>
            </button>
          </div>
        </div>

        {/* Part List / Grid */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredParts.map(part => (
            <PartCard 
              key={part.id} 
              part={part} 
              health={partsHealth[part.id]} 
              onReplace={handleInitiateReplace} 
              onEdit={openEditModal}
              onClone={openCloneModal}
            />
          ))}
        </div>

        {filteredParts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No parts found</h3>
            <p className="text-slate-500 mt-1">
              {parts.length === 0 
                ? "Add a part to start tracking its lifetime."
                : "No parts match your current filters."
              }
            </p>
             <button 
              onClick={() => { setSelectedMachine('all'); setSelectedPartName('all'); }}
              className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* Mobile FAB for AI */}
      <button 
        onClick={() => setIsAdvisorOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-600/30 z-40 active:scale-90 transition-transform"
      >
        <Zap className="w-6 h-6" />
      </button>

      {/* AI Sidebar */}
      {isAdvisorOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" 
            onClick={() => setIsAdvisorOpen(false)}
          />
          <AIAdvisor 
            isOpen={isAdvisorOpen} 
            onClose={() => setIsAdvisorOpen(false)}
            messages={chatMessages}
            onSendMessage={handleAiMessage}
            isLoading={isAiLoading}
          />
        </>
      )}

      {/* Unified Add/Edit/Clone Modal */}
      <AddPartModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePart}
        initialMachineId={selectedMachine}
        initialData={selectedPart}
        mode={modalMode}
      />

      {/* Replacement Confirmation Modal */}
      <ConfirmModal 
        isOpen={partToReplace !== 'all'}
        onClose={() => setPartToReplace('all')}
        onConfirm={handleConfirmReplace}
        title="Confirm Replacement"
        message="Are you sure you want to replace this part? This will reset the installation date to today and 0% wear."
        confirmText="Yes, Replace It"
      />

    </div>
  );
};

export default App;