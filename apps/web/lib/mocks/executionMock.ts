import { Commitment, Task, StuckNeedItem, Escalation, RACIRole } from '../../types/execution';

// Initial zero baseline state
export let MOCK_COMMITMENTS: Commitment[] = [];
export let MOCK_TASKS: Task[] = [];
export let MOCK_STUCK_NEEDS: StuckNeedItem[] = [];
export let MOCK_ESCALATIONS: Escalation[] = [];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  listeners.forEach(fn => fn());
};

export const executionStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getCommitments() {
    return MOCK_COMMITMENTS;
  },

  getTasks() {
    return MOCK_TASKS;
  },

  getStuckNeeds() {
    return MOCK_STUCK_NEEDS;
  },

  getEscalations() {
    return MOCK_ESCALATIONS;
  },

  /**
   * Automated Commitment Creation with Auto-Task & RACI Generation
   */
  addCommitment(newCommitment: Partial<Commitment>, autoGenerateTasks = true): Commitment {
    const id = `cm-${Date.now()}`;
    const code = `CM-2026-${String(MOCK_COMMITMENTS.length + 1).padStart(3, '0')}`;
    
    const commitment: Commitment = {
      id,
      code,
      title: newCommitment.title || 'Untitled Commitment',
      description: newCommitment.description || '',
      monthlyPriorityId: newCommitment.monthlyPriorityId || 'mp-001',
      weeklyMilestoneId: newCommitment.weeklyMilestoneId || 'wm-001',
      sourceType: newCommitment.sourceType || 'MD_INSTRUCTION',
      sourceTitle: newCommitment.sourceTitle || 'Direct Management Directive',
      responsibleId: newCommitment.responsibleId || 'usr-mgr-004',
      responsibleName: newCommitment.responsibleName || 'Ananya Patel',
      accountableId: newCommitment.accountableId || 'usr-mdo-002',
      accountableName: newCommitment.accountableName || 'Het Bhatt',
      raci: newCommitment.raci || [
        { userId: newCommitment.responsibleId || 'usr-mgr-004', userName: newCommitment.responsibleName || 'Ananya Patel', userRoleTitle: 'Responsible Owner', departmentName: 'Operations', role: 'R' },
        { userId: newCommitment.accountableId || 'usr-mdo-002', userName: newCommitment.accountableName || 'Het Bhatt', userRoleTitle: 'Accountable Executive', departmentName: 'MD Office', role: 'A' },
      ],
      priority: newCommitment.priority || 'HIGH',
      status: 'IN_PROGRESS',
      progressPercent: 0,
      dueDate: newCommitment.dueDate || new Date(Date.now() + 604800000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      isStuck: false,
    };

    MOCK_COMMITMENTS.unshift(commitment);

    // Automated Task Management: Derive initial execution task and RACI
    if (autoGenerateTasks) {
      const taskId = `tk-${Date.now()}`;
      const taskCode = `TK-2026-${String(MOCK_TASKS.length + 1).padStart(3, '0')}`;
      const autoTask: Task = {
        id: taskId,
        code: taskCode,
        commitmentId: commitment.id,
        weeklyMilestoneId: commitment.weeklyMilestoneId,
        title: `Execute Initial Milestone: ${commitment.title}`,
        description: `Primary execution task automatically generated for commitment ${commitment.code}.`,
        assigneeId: commitment.responsibleId,
        assigneeName: commitment.responsibleName,
        assigneeRoleTitle: 'Responsible Lead',
        departmentId: 'dept-ops',
        departmentName: 'Hospital Operations',
        raci: commitment.raci,
        priority: commitment.priority,
        status: 'IN_PROGRESS',
        progressPercent: 0,
        dueDate: commitment.dueDate,
        estimatedHours: 10,
        loggedHours: 0,
        isStuck: false,
        hasDependency: false,
      };

      MOCK_TASKS.unshift(autoTask);
    }

    notify();
    return commitment;
  },

  /**
   * Manual Task Creation
   */
  addTask(newTask: Partial<Task>): Task {
    const id = `tk-${Date.now()}`;
    const code = `TK-2026-${String(MOCK_TASKS.length + 1).padStart(3, '0')}`;

    const task: Task = {
      id,
      code,
      commitmentId: newTask.commitmentId || '',
      weeklyMilestoneId: newTask.weeklyMilestoneId || '',
      title: newTask.title || 'Untitled Execution Task',
      description: newTask.description || '',
      assigneeId: newTask.assigneeId || 'usr-mgr-004',
      assigneeName: newTask.assigneeName || 'Ananya Patel',
      assigneeRoleTitle: newTask.assigneeRoleTitle || 'Task Assignee',
      departmentId: newTask.departmentId || 'dept-ops',
      departmentName: newTask.departmentName || 'Operations',
      raci: newTask.raci || [],
      priority: newTask.priority || 'MEDIUM',
      status: 'NOT_STARTED',
      progressPercent: 0,
      dueDate: newTask.dueDate || new Date(Date.now() + 432000000).toISOString().split('T')[0],
      estimatedHours: newTask.estimatedHours || 8,
      loggedHours: 0,
      isStuck: false,
      hasDependency: false,
    };

    MOCK_TASKS.unshift(task);

    // Update parent commitment stats
    if (task.commitmentId) {
      const parent = MOCK_COMMITMENTS.find(c => c.id === task.commitmentId);
      if (parent) {
        const parentTasks = MOCK_TASKS.filter(t => t.commitmentId === parent.id);
        const totalProgress = parentTasks.reduce((acc, t) => acc + t.progressPercent, 0);
        parent.progressPercent = Math.round(totalProgress / parentTasks.length);
      }
    }

    notify();
    return task;
  },

  /**
   * Automated Blocker / Stuck Reporting & Escalation Calculation
   */
  reportStuck(taskId: string, reasonCategory: string, reasonDetails: string, needDescription: string, businessImpact: string): StuckNeedItem {
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.isStuck = true;
    task.status = 'BLOCKED';

    const stuckId = `sn-${Date.now()}`;
    const stuckItem: StuckNeedItem = {
      id: stuckId,
      taskId: task.id,
      taskTitle: task.title,
      reportedByUserId: task.assigneeId,
      reportedByUserName: task.assigneeName,
      stuckReasonCategory: reasonCategory as any,
      stuckReasonDetails: reasonDetails,
      needDescription: needDescription,
      providedByUserId: 'usr-mdo-002',
      providedByUserName: 'Het Bhatt (MD Office Lead)',
      requiredByDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      businessImpact: businessImpact,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    MOCK_STUCK_NEEDS.unshift(stuckItem);

    // Automated Escalation Engine: Calculate level based on priority & category
    const level = task.priority === 'CRITICAL' ? 3 : (task.priority === 'HIGH' ? 2 : 1);
    const levelNames: Record<number, string> = {
      1: 'L1 — Department / Supervisor',
      2: 'L2 — Management / Escalated',
      3: 'L3 — MD Office Executive',
    };

    const escalation: Escalation = {
      id: `esc-${Date.now()}`,
      code: `ESC-2026-${String(MOCK_ESCALATIONS.length + 1).padStart(3, '0')}`,
      targetType: 'TASK',
      targetId: task.id,
      targetTitle: task.title,
      level,
      levelName: levelNames[level],
      reason: reasonDetails,
      impact: businessImpact,
      reportedByUserId: task.assigneeId,
      reportedByUserName: task.assigneeName,
      assignedToUserId: 'usr-mdo-002',
      assignedToUserName: 'Het Bhatt (MD Office)',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    MOCK_ESCALATIONS.unshift(escalation);

    // Flag parent commitment as stuck
    if (task.commitmentId) {
      const parent = MOCK_COMMITMENTS.find(c => c.id === task.commitmentId);
      if (parent) {
        parent.isStuck = true;
        parent.status = 'BLOCKED';
        parent.stuckReason = reasonDetails;
        parent.escalationLevel = level;
      }
    }

    notify();
    return stuckItem;
  },

  /**
   * Reset store back to zero items
   */
  resetToZero() {
    MOCK_COMMITMENTS = [];
    MOCK_TASKS = [];
    MOCK_STUCK_NEEDS = [];
    MOCK_ESCALATIONS = [];
    notify();
  },
};
