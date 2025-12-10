export enum PartStatus {
  Good = 'GOOD',
  Warning = 'WARNING',
  Critical = 'CRITICAL'
}

export interface Part {
  id: string;
  machineId: string; // Identifier for the specific machine (e.g., "M-01")
  name: string;
  category: string;
  installDate: string; // ISO Date String
  lifespanDays: number;
  notes?: string;
}

export interface PartHealth {
  daysElapsed: number;
  daysRemaining: number;
  percentageUsed: number;
  status: PartStatus;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}