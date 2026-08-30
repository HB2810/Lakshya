import type { PrivateState, WorkSnapshot } from "../../types/companion";

export const demoWorkSnapshot: WorkSnapshot = {
  employee: {
    displayName: "Priyesh Shah",
    role: "Systems Engineer & IT Lead",
    department: "Facilities & IT Engineering",
  },
  shift: { label: "General Shift", time: "09:00–18:00", location: "Stavya Spine Hospital — Main Campus" },
  leave: { available: 14, pending: 1 },
  training: { completed: 8, total: 10, next: "NABH 6th Edition Fire & Safety In-Service Drill" },
  tasks: [
    { id: "WORK-101", title: "Acknowledge updated surgical data security policy", dueLabel: "Today", status: "todo", source: "Stavya Platform" },
    { id: "WORK-102", title: "Complete biomedical asset validation", dueLabel: "Due Friday", status: "todo", source: "Stavya Platform" },
    { id: "WORK-103", title: "Confirm next week OT IT standby availability", dueLabel: "This week", status: "done", source: "Stavya Platform" },
  ],
  decisions: [
    {
      id: "DEC-201",
      kind: "QUESTION",
      title: "Can you attend the Friday OT Technical Review at 4 PM?",
      reason: "Your department lead needs confirmation before publishing the schedule.",
      status: "unapproved",
    },
    {
      id: "DEC-202",
      kind: "DECISION",
      title: "Submit your annual conference leave request?",
      reason: "Nothing is transmitted to HR until you review and confirm.",
      status: "unapproved",
    },
  ],
  lastSyncedAt: "StavyaOne Active Session",
};

export const initialPrivateState: PrivateState = {
  health: {
    sleepHours: 7.5,
    steps: 7240,
    waterGlasses: 6,
    mood: "Good",
    heartRateResting: 64,
    activeCalories: 480,
    autoSyncEnabled: true,
    lastDeviceSyncAt: "Today, 08:30 AM",
    connectedDevices: [
      {
        id: "DEV-APPLE-1",
        provider: "apple_health",
        name: "Apple Health (iPhone & Apple Watch)",
        deviceModel: "Apple Watch Series 9",
        connected: true,
        lastSyncedAt: "10 mins ago",
        syncMetrics: ["steps", "sleep", "heart_rate"],
      },
      {
        id: "DEV-SAMSUNG-1",
        provider: "samsung_health",
        name: "Samsung Health (Galaxy Watch / Phone)",
        deviceModel: "Galaxy Watch 6",
        connected: false,
        lastSyncedAt: undefined,
        syncMetrics: ["steps", "sleep", "heart_rate", "water"],
      },
      {
        id: "DEV-GOOGLE-1",
        provider: "google_fit",
        name: "Google Health Connect / Android Fit",
        deviceModel: "Android Device Connect",
        connected: false,
        lastSyncedAt: undefined,
        syncMetrics: ["steps", "sleep"],
      },
      {
        id: "DEV-GARMIN-1",
        provider: "garmin",
        name: "Garmin Connect & Wearables",
        deviceModel: "Forerunner",
        connected: false,
        lastSyncedAt: undefined,
        syncMetrics: ["steps", "heart_rate", "sleep"],
      },
    ],
  },
  wealth: { monthlyBudget: 45000, spent: 19800, savingsGoal: 150000, saved: 92000 },
  lifeGoals: [
    { id: "LIFE-1", title: "Read spine clinical tech journal for 20 mins", cadence: "Daily", done: true },
    { id: "LIFE-2", title: "Call family & parents", cadence: "Twice weekly", done: false },
    { id: "LIFE-3", title: "Plan weekend restorative outdoor run", cadence: "Weekly", done: false },
  ],
  personalTasks: [
    { id: "PRIVATE-1", title: "Evening 30-minute mindfulness walk", dueLabel: "Today", status: "todo", source: "Personal" },
  ],
};
