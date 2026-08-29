import { WorkItem, WorkItemActivity, WorkItemStatus, WorkItemPriority, BlockerDetails, WorkItemPatchPayload } from '../../types/workItem';

export const INITIAL_WORK_ITEMS: WorkItem[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(fn => fn());

export let canonicalWorkItems: WorkItem[] = [];

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
      raci: item.raci || null,
      edc: item.edc || null,
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

  patchWorkItem(id: string, patch: WorkItemPatchPayload, authorName = 'Lakshya User'): WorkItem {
    const item = canonicalWorkItems.find(w => w.id === id);
    if (!item) throw new Error('WorkItem not found');

    const nowIso = new Date().toISOString();
    const activity: WorkItemActivity = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      authorId: item.owner_id || 'usr-stav-101',
      authorName,
      type: patch.raci ? 'RACI_CHANGE' : 'PROGRESS_UPDATE',
      note: patch.update_note || 'Work item updated.',
    };
    const nextOwnerId = patch.raci?.responsible_id || patch.owner_id || item.owner_id;
    const nextOwnerName = patch.raci?.responsible_name || patch.owner_name || item.owner_name;

    canonicalWorkItems = canonicalWorkItems.map(w => w.id === id ? {
      ...w,
      ...patch,
      owner_id: nextOwnerId,
      owner_name: nextOwnerName,
      updated_at: nowIso,
      version: w.version + 1,
      activity_history: [activity, ...(w.activity_history || [])],
    } : w);
    notify();
    return canonicalWorkItems.find(w => w.id === id)!;
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
