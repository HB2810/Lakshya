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
  lastSyncedAt: "Stavya One Active Session",
};

export const initialPrivateState: PrivateState = {
  health: { sleepHours: 7.5, steps: 7240, waterGlasses: 6, mood: "Good" },
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
