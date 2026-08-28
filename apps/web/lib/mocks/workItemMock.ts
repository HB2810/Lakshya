import { WorkItem, WorkItemActivity, WorkItemStatus, WorkItemPriority, BlockerDetails, WorkItemPatchPayload } from '../../types/workItem';

export const INITIAL_WORK_ITEMS: WorkItem[] = [
  {
    id: 'wi-001',
    organization_id: 'org-stavya-001',
    title: 'Verify OPD Network Stability & PACS Gateway Sync',
    description: 'Benchmark PACS image transfer speed on consultation room terminals and ensure zero packet drop during peak hours.',
    status: 'in_progress',
    priority: 'urgent',
    owner_id: 'usr-stav-101',
    owner_name: 'Priyesh Shah',
    created_by: 'Dr. Rohan Sharma',
    due_at: '2026-08-28T18:00:00Z',
    progressPercent: 60,
    source_type: 'MEETING',
    source_title: 'Daily Spine Surgery Operations Sync',
    origin_meeting_id: 'mtg-001',
    activity_history: [
      {
        id: 'act-1',
        timestamp: '2026-08-28T09:30:00Z',
        authorId: 'usr-dh-003',
        authorName: 'Dr. Rohan Sharma',
        type: 'CREATED',
        note: 'Assigned during morning clinical sync.',
      },
      {
        id: 'act-2',
        timestamp: '2026-08-28T10:15:00Z',
        authorId: 'usr-stav-101',
        authorName: 'Priyesh Shah',
        type: 'STATUS_CHANGE',
        previousStatus: 'todo',
        newStatus: 'in_progress',
        note: 'Started telemetry capture on OPD Block B switch.',
      },
      {
        id: 'act-3',
        timestamp: '2026-08-28T11:45:00Z',
        authorId: 'usr-stav-101',
        authorName: 'Priyesh Shah',
        type: 'PROGRESS_UPDATE',
        progressPercent: 60,
        note: 'PACS Gateway latency is within 120ms. Conducting stress test.',
      },
    ],
    created_at: '2026-08-28T09:30:00Z',
    updated_at: '2026-08-28T11:45:00Z',
    version: 3,
  },
  {
    id: 'wi-002',
    organization_id: 'org-stavya-001',
    title: 'Configure STAT Pre-Op Surgical Antibiotic Route in EMR Queue',
    description: 'Implement automated audio-visual priority flag in inpatient pharmacy queue 90 minutes prior to scheduled surgical incision.',
    status: 'todo',
    priority: 'high',
    owner_id: 'usr-stav-101',
    owner_name: 'Priyesh Shah',
    created_by: 'Managing Director',
    due_at: '2026-08-28T20:00:00Z',
    progressPercent: 0,
    source_type: 'STRATEGY',
    source_title: 'Q3 Spine Surgery Flow Optimization (Milestone #4)',
    activity_history: [
      {
        id: 'act-4',
        timestamp: '2026-08-28T08:00:00Z',
        authorId: 'usr-md-001',
        authorName: 'Managing Director',
        type: 'CREATED',
        note: 'Derived from CAPA Action Plan for OT-2 antibiotic delay RCA.',
      },
    ],
    created_at: '2026-08-28T08:00:00Z',
    updated_at: '2026-08-28T08:00:00Z',
    version: 1,
  },
  {
    id: 'wi-003',
    organization_id: 'org-stavya-001',
    title: 'Dual Barcode Scanner Firmware Calibration for CSSD Tray Checkpoint',
    description: 'Update firmware on 2D matrix barcode scanners in CSSD sterilization intake to support new titanium cage batch labels.',
    status: 'blocked',
    priority: 'high',
    owner_id: 'usr-stav-101',
    owner_name: 'Priyesh Shah',
    created_by: 'Amit Patel',
    due_at: '2026-08-27T17:00:00Z', // Overdue & Blocked
    progressPercent: 30,
    blocked_at: '2026-08-27T16:00:00Z',
    blocked_reason: 'Waiting for vendor OEM firmware patch from hardware distributor.',
    blocker_details: {
      reason: 'OEM vendor package v4.2 not yet signed by hardware manufacturer.',
      needDescription: 'Vendor tech support escalation required for proprietary driver unlock key.',
      helpedByPersonOrDept: 'Amit Patel (Biomedical Lead) / Vendor Support',
      urgency: 'HIGH',
      reportedAt: '2026-08-27T16:00:00Z',
    },
    source_type: 'MANUAL',
    source_title: 'Direct Assignment',
    activity_history: [
      {
        id: 'act-5',
        timestamp: '2026-08-26T14:00:00Z',
        authorId: 'usr-phy-006',
        authorName: 'Amit Patel',
        type: 'CREATED',
        note: 'Direct maintenance task.',
      },
      {
        id: 'act-6',
        timestamp: '2026-08-27T16:00:00Z',
        authorId: 'usr-stav-101',
        authorName: 'Priyesh Shah',
        type: 'BLOCKER_REPORTED',
        note: 'Blocked: OEM firmware package v4.2 download link expired from distributor portal.',
      },
    ],
    created_at: '2026-08-26T14:00:00Z',
    updated_at: '2026-08-27T16:00:00Z',
    version: 2,
  },
  {
    id: 'wi-004',
    organization_id: 'org-stavya-001',
    title: 'Submit Quarterly IT Hardware & Server Room UPS Maintenance Log',
    description: 'Complete quarterly battery health inspection and secondary generator failover check for server racks.',
    status: 'todo',
    priority: 'medium',
    owner_id: 'usr-stav-101',
    owner_name: 'Priyesh Shah',
    created_by: 'Priyesh Shah',
    due_at: '2026-08-30T17:00:00Z',
    progressPercent: 0,
    source_type: 'MANUAL',
    source_title: 'Self-Scheduled Work Item',
    activity_history: [
      {
        id: 'act-7',
        timestamp: '2026-08-27T10:00:00Z',
        authorId: 'usr-stav-101',
        authorName: 'Priyesh Shah',
        type: 'CREATED',
        note: 'Routine self-created operational task.',
      },
    ],
    created_at: '2026-08-27T10:00:00Z',
    updated_at: '2026-08-27T10:00:00Z',
    version: 1,
  },
  {
    id: 'wi-005',
    organization_id: 'org-stavya-001',
    title: 'Calibrate OPD Touchscreen Token Dispatch Kiosk in Waiting Lounge',
    description: 'Recalibrate touch sensitivity and replace thermal printer receipt paper roll at Kiosk Station 2.',
    status: 'completed',
    priority: 'low',
    owner_id: 'usr-stav-101',
    owner_name: 'Priyesh Shah',
    created_by: 'Ananya Patel',
    due_at: '2026-08-26T17:00:00Z',
    completed_at: '2026-08-26T16:20:00Z',
    progressPercent: 100,
    source_type: 'MEETING',
    source_title: 'OPD Flow & Patient Experience Review',
    origin_meeting_id: 'mtg-002',
    activity_history: [
      {
        id: 'act-8',
        timestamp: '2026-08-26T11:00:00Z',
        authorId: 'usr-mgr-004',
        authorName: 'Ananya Patel',
        type: 'CREATED',
        note: 'Assigned in OPD review meeting.',
      },
      {
        id: 'act-9',
        timestamp: '2026-08-26T16:20:00Z',
        authorId: 'usr-stav-101',
        authorName: 'Priyesh Shah',
        type: 'COMPLETED',
        note: 'Kiosk 2 calibrated, printed 20 test tokens successfully.',
      },
    ],
    created_at: '2026-08-26T11:00:00Z',
    updated_at: '2026-08-26T16:20:00Z',
    version: 2,
  },
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export let canonicalWorkItems: WorkItem[] = [...INITIAL_WORK_ITEMS];

export const workItemStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getWorkItems(filters?: { owner_id?: string; status?: string }): WorkItem[] {
    let result = [...canonicalWorkItems];
    if (filters?.owner_id) {
      result = result.filter(w => w.owner_id === filters.owner_id);
    }
    if (filters?.status) {
      result = result.filter(w => w.status === filters.status);
    }
    return result;
  },

  getWorkItemById(id: string): WorkItem | undefined {
    return canonicalWorkItems.find(w => w.id === id);
  },

  createWorkItem(item: Partial<WorkItem>, authorName = 'Priyesh Shah'): WorkItem {
    const id = `wi-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newItem: WorkItem = {
      id,
      organization_id: item.organization_id || 'org-stavya-001',
      title: item.title || 'Untitled Work Item',
      description: item.description || '',
      parent_id: item.parent_id || null,
      status: item.status || 'todo',
      priority: item.priority || 'medium',
      owner_id: item.owner_id || 'usr-stav-101',
      owner_name: item.owner_name || authorName,
      created_by: authorName,
      due_at: item.due_at || new Date(Date.now() + 86400000).toISOString(),
      progressPercent: item.progressPercent || 0,
      source_type: item.source_type || 'MANUAL',
      source_title: item.source_title || 'Self-Created Task',
      activity_history: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          authorId: item.owner_id || 'usr-stav-101',
          authorName,
          type: 'CREATED',
          note: item.description || 'Work item created.',
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
      version: 1,
    };

    canonicalWorkItems = [newItem, ...canonicalWorkItems];
    notify();
    return newItem;
  },

  updateStatus(id: string, newStatus: WorkItemStatus, authorName = 'Priyesh Shah', note?: string): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const previousStatus = item.status;
    const nowIso = new Date().toISOString();

    const activity: WorkItemActivity = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: newStatus === 'completed' ? 'COMPLETED' : 'STATUS_CHANGE',
      previousStatus,
      newStatus,
      note: note || `Status changed from ${previousStatus.toUpperCase()} to ${newStatus.toUpperCase()}.`,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: newStatus,
        completed_at: newStatus === 'completed' ? nowIso : w.completed_at,
        progressPercent: newStatus === 'completed' ? 100 : w.progressPercent,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  updateProgress(id: string, progressPercent: number, note?: string, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const newStatus: WorkItemStatus = progressPercent >= 100 ? 'completed' : item.status === 'todo' ? 'in_progress' : item.status;

    const activity: WorkItemActivity = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: progressPercent >= 100 ? 'COMPLETED' : 'PROGRESS_UPDATE',
      progressPercent,
      newStatus,
      note: note || `Progress updated to ${progressPercent}%.`,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        progressPercent,
        status: newStatus,
        completed_at: progressPercent >= 100 ? nowIso : w.completed_at,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  reportBlocker(id: string, blocker: Omit<BlockerDetails, 'reportedAt'>, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const fullBlocker: BlockerDetails = {
      ...blocker,
      reportedAt: nowIso,
    };

    const activity: WorkItemActivity = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'BLOCKER_REPORTED',
      newStatus: 'blocked',
      note: `Blocker: ${blocker.reason}. Need: ${blocker.needDescription}`,
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: 'blocked',
        blocked_at: nowIso,
        blocked_reason: blocker.reason,
        blocker_details: fullBlocker,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },

  resolveBlocker(id: string, resolutionNote?: string, authorName = 'Priyesh Shah'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();

    const activity: WorkItemActivity = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: 'BLOCKER_RESOLVED',
      newStatus: 'in_progress',
      note: resolutionNote || 'Blocker resolved. Resuming active execution.',
    };

    canonicalWorkItems = canonicalWorkItems.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        status: 'in_progress',
        blocked_at: null,
        blocked_reason: null,
        activity_history: [activity, ...(w.activity_history || [])],
        updated_at: nowIso,
        version: w.version + 1,
      };
    });

    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
  },
};
