export type Section = "today" | "chat" | "work" | "health" | "wealth" | "life" | "privacy";

export type WorkTask = {
  id: string;
  title: string;
  dueLabel: string;
  status: "todo" | "done";
  source: "Stavya Platform" | "Personal";
};

export type Decision = {
  id: string;
  kind: "QUESTION" | "TASK" | "DECISION";
  title: string;
  reason: string;
  status: "unapproved" | "approved" | "returned";
};

export type WorkSnapshot = {
  employee: { displayName: string; role: string; department: string };
  shift: { label: string; time: string; location: string };
  leave: { available: number; pending: number };
  training: { completed: number; total: number; next: string };
  tasks: WorkTask[];
  decisions: Decision[];
  lastSyncedAt: string;
};

export type HealthDeviceProvider =
  | 'apple_health'
  | 'samsung_health'
  | 'google_fit'
  | 'garmin'
  | 'fitbit';

export type ConnectedDevice = {
  id: string;
  provider: HealthDeviceProvider;
  name: string;
  connected: boolean;
  lastSyncedAt?: string;
  deviceModel?: string;
  syncMetrics: ('steps' | 'sleep' | 'heart_rate' | 'water')[];
};

export type HealthState = {
  sleepHours: number;
  steps: number;
  waterGlasses: number;
  mood: "Low" | "Steady" | "Good" | "Excellent";
  heartRateResting?: number;
  activeCalories?: number;
  connectedDevices: ConnectedDevice[];
  autoSyncEnabled: boolean;
  lastDeviceSyncAt?: string;
};

export type WealthState = {
  monthlyBudget: number;
  spent: number;
  savingsGoal: number;
  saved: number;
};

export type LifeGoal = {
  id: string;
  title: string;
  cadence: string;
  done: boolean;
};

export type PrivateState = {
  health: HealthState;
  wealth: WealthState;
  lifeGoals: LifeGoal[];
  personalTasks: WorkTask[];
};
