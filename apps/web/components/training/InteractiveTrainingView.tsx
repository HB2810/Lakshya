'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Circle,
  Briefcase,
  Heart,
  Shield,
  Lock,
  ArrowRight,
  TrendingUp,
  Target,
  BookOpen,
  HelpCircle,
  Smartphone,
  Check,
  PlayCircle,
  ExternalLink,
  Award,
  Layers,
} from 'lucide-react';
import { Card } from '../ui/Card';

type TrainingModule = {
  id: string;
  track: 'work' | 'personal';
  trackTitle: string;
  title: string;
  duration: string;
  summary: string;
  keyTakeaways: string[];
  actionLink: {
    label: string;
    href: string;
  };
  steps: {
    title: string;
    description: string;
  }[];
};

const trainingCurriculum: TrainingModule[] = [
  // --- TRACK 1: STAVYA HOSPITAL WORK MASTERY ---
  {
    id: 'TR-WORK-1',
    track: 'work',
    trackTitle: 'Hospital Operations',
    title: '1. Navigating My Day & Next Action Spotlight',
    duration: '3 mins',
    summary: 'How to start your morning shift, view active assignments, and review urgent hospital directives without cognitive overload.',
    keyTakeaways: [
      'Your My Day dashboard prioritizes your single most critical next action.',
      'Check your active shift hours and pending leave approvals at a glance.',
      'Review pending department decisions before commencing clinical rounds.',
    ],
    actionLink: { label: 'Open My Day', href: '/overview' },
    steps: [
      { title: 'Check Shift Status', description: 'View your scheduled shift timings and duty campus.' },
      { title: 'Review Urgent Spotlight', description: 'Focus on the top priority task assigned to you.' },
      { title: 'Acknowledge Decisions', description: 'Confirm or respond to pending department questions.' },
    ],
  },
  {
    id: 'TR-WORK-2',
    track: 'work',
    trackTitle: 'Hospital Operations',
    title: '2. RACI Commitments & Execution Queue',
    duration: '4 mins',
    summary: 'Mastering the RACI accountability framework: Responsible (R), Accountable (A), Consulted (C), and Informed (I).',
    keyTakeaways: [
      'R = You execute the work; A = The single owner accountable for the outcome.',
      'C = Your clinical input is consulted; I = You are kept updated on progress.',
      'Mark tasks complete with completion notes for automatic audit trails.',
    ],
    actionLink: { label: 'Go to My Work', href: '/execution' },
    steps: [
      { title: 'Filter by Your Role', description: 'Switch between Responsible, Accountable, or Consulted queues.' },
      { title: 'Update Task Progress', description: 'Log progress percentage and mark milestones complete.' },
      { title: 'View RACI Badges', description: 'Verify accountability owners before delegating tasks.' },
    ],
  },
  {
    id: 'TR-WORK-3',
    track: 'work',
    trackTitle: 'Hospital Operations',
    title: '3. Meeting Decisions & Action Register',
    duration: '3 mins',
    summary: 'How executive decisions, clinical committee minutes, and MD instructions are converted into structured execution tasks.',
    keyTakeaways: [
      'Meetings automatically generate actionable tasks with accountable owners.',
      'Track decision outcomes: Approved, In-Review, or Returned for amendment.',
      'Every action item is traceable back to its originating meeting.',
    ],
    actionLink: { label: 'View Meetings', href: '/meetings' },
    steps: [
      { title: 'Open Meeting Agenda', description: 'Review scheduled clinical and executive committee agendas.' },
      { title: 'Inspect Decisions Log', description: 'Read documented outcomes and rationale.' },
      { title: 'Track Resulting Tasks', description: 'See linked tasks generated from meeting decisions.' },
    ],
  },
  {
    id: 'TR-WORK-4',
    track: 'work',
    trackTitle: 'Hospital Operations',
    title: '4. NABH 6th Edition Protocols & Clinical SOPs',
    duration: '4 mins',
    summary: 'Accessing approved hospital SOPs, departmental checklists, and NABH compliance standards safely.',
    keyTakeaways: [
      'Search and read hospital-wide standard operating procedures anytime.',
      'Quality leads and chapter champions manage readiness checklists.',
      'Standard employees execute their assigned audit checklist tasks cleanly.',
    ],
    actionLink: { label: 'Browse Policies & SOPs', href: '/policies' },
    steps: [
      { title: 'Search Protocol Catalog', description: 'Filter SOPs by department or NABH chapter.' },
      { title: 'Review Acknowledgment', description: 'Confirm reading of updated clinical safety guidelines.' },
      { title: 'Audit Evidence', description: 'View attached compliance documentation.' },
    ],
  },
  {
    id: 'TR-WORK-5',
    track: 'work',
    trackTitle: 'Hospital Operations',
    title: '5. Flagging Stuck / Need & Exception Escalation',
    duration: '3 mins',
    summary: 'Never let a clinical or administrative task remain quietly blocked without timely assistance.',
    keyTakeaways: [
      'Flagging a task as Stuck requires specifying what is needed and who can help.',
      'Escalations are contextual, not arbitrary overdue timers.',
      'Department heads receive immediate alerts to unblock dependencies.',
    ],
    actionLink: { label: 'Open Execution Queue', href: '/execution' },
    steps: [
      { title: 'Select Blocked Task', description: 'Click "I am Stuck / Need Help" on any active task.' },
      { title: 'Specify Requirement', description: 'Select who can provide the missing approval or resource.' },
      { title: 'Resolve Blocker', description: 'Clear blocker once assistance is received.' },
    ],
  },

  // --- TRACK 2: PERSONAL COMPANION & PRIVACY MASTERY ---
  {
    id: 'TR-LIFE-1',
    track: 'personal',
    trackTitle: 'Personal Companion',
    title: '6. Ask One AI Companion for Work & Life',
    duration: '3 mins',
    summary: 'Your intelligent assistant for answering hospital SOP queries, shift questions, and organizing your personal rhythm.',
    keyTakeaways: [
      'Ask questions in natural language about policies, leave, or tasks.',
      'Ask One respects your privacy boundary and keeps personal chats private.',
      'Use 1-tap quick action pills for fast answers.',
    ],
    actionLink: { label: 'Try Ask One', href: '/ask-one' },
    steps: [
      { title: 'Ask a Policy Question', description: 'Type "What is our OT data security policy?".' },
      { title: 'Check Shift / Leave', description: 'Ask "What is my current leave balance?".' },
      { title: 'Navigate Easily', description: 'Click suggested quick-action buttons in responses.' },
    ],
  },
  {
    id: 'TR-LIFE-2',
    track: 'personal',
    trackTitle: 'Personal Companion',
    title: '7. Everyday Wellbeing & Wearable Device Sync',
    duration: '4 mins',
    summary: 'Syncing your health metrics from Apple Health, Samsung Health, or Google Fit directly into your local private vault.',
    keyTakeaways: [
      'Connect Apple Watch, Galaxy Watch, or Google Fit in 1 click.',
      'Tap "Sync Devices" to pull steps, sleep, and resting heart rate.',
      'Zero-Cloud Pass: Your health data is NEVER sent to hospital servers or HR.',
    ],
    actionLink: { label: 'Open Health Journal', href: '/health' },
    steps: [
      { title: 'Choose Your Provider', description: 'Connect Apple Health, Samsung Health, or Google Fit.' },
      { title: 'Tap "Sync Devices"', description: 'Pull the latest steps, sleep, and heart rate metrics.' },
      { title: 'Log Daily Mood', description: 'Check in with your personal state of mind.' },
    ],
  },
  {
    id: 'TR-LIFE-3',
    track: 'personal',
    trackTitle: 'Personal Companion',
    title: '8. Money Clarity & 1-Click Budgeting',
    duration: '3 mins',
    summary: 'Simple personal budgeting and savings target tracking without complicated finance jargon or linked bank accounts.',
    keyTakeaways: [
      'Use 1-tap spending buttons (+₹100, +₹500, +₹1,000) to log expenses in seconds.',
      'See your remaining monthly budget gauge and 50/30/20 guide.',
      'Track annual savings milestones with 100% device privacy.',
    ],
    actionLink: { label: 'Open Money Clarity', href: '/wealth' },
    steps: [
      { title: 'Select Budget Preset', description: 'Choose your monthly budget target (e.g. ₹50k/mo).' },
      { title: 'Log Expenses with 1-Tap', description: 'Tap quick expense pills as you spend.' },
      { title: 'Watch Savings Grow', description: 'Add deposits to your annual savings target.' },
    ],
  },
  {
    id: 'TR-LIFE-4',
    track: 'personal',
    trackTitle: 'Personal Companion',
    title: '9. Life Beyond Work & Habit Rhythms',
    duration: '3 mins',
    summary: 'Nurturing personal habits, reading goals, family time, and private reminders separate from your work profile.',
    keyTakeaways: [
      'Maintain weekly personal rhythm rings (e.g. 20 mins reading, family calls).',
      'Create private reminders that stay on your device.',
      'Personal achievements never impact employee appraisal metrics.',
    ],
    actionLink: { label: 'Open Life Goals', href: '/life' },
    steps: [
      { title: 'Add a Habit Goal', description: 'Create personal goals like outdoor running or reading.' },
      { title: 'Check In Weekly', description: 'Complete habits and observe your weekly rhythm ring.' },
      { title: 'Add Private Reminders', description: 'Keep personal to-dos safe and confidential.' },
    ],
  },
  {
    id: 'TR-LIFE-5',
    track: 'personal',
    trackTitle: 'Personal Companion',
    title: '10. Privacy Control Centre & Data Ownership',
    duration: '3 mins',
    summary: 'Understanding the Two-Lane Privacy Model, downloading your private JSON backup, and clearing local device storage.',
    keyTakeaways: [
      'Lane 1 (Personal Vault): Health, wealth, habits stay locally on your device.',
      'Lane 2 (Hospital Workspace): Tasks, shifts, policies stay on the hospital server.',
      'Export or wipe your local data anytime with 1 click.',
    ],
    actionLink: { label: 'Open Privacy Centre', href: '/privacy' },
    steps: [
      { title: 'Inspect Two-Lane Map', description: 'See what data is local vs hospital governed.' },
      { title: 'Export JSON Backup', description: 'Download your personal health and budget data.' },
      { title: 'Manage Cache', description: 'Clear local browser vault whenever needed.' },
    ],
  },
];

export const InteractiveTrainingView: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<string[]>(['TR-WORK-1', 'TR-LIFE-1']);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stavyaone-training-completed');
      if (saved) {
        setCompletedModules(JSON.parse(saved));
      }
    } catch {}
    setIsMounted(true);
  }, []);

  const [activeFilter, setActiveFilter] = useState<'all' | 'work' | 'personal'>('all');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>('TR-WORK-1');

  const toggleModuleComplete = (id: string) => {
    setCompletedModules((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('stavyaone-training-completed', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const filteredCurriculum = trainingCurriculum.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.track === activeFilter;
  });

  const completionPct = Math.round((completedModules.length / trainingCurriculum.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              STAVYAONE ACADEMY
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Work + Life Interactive Guide
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Platform Training &amp; Tutorial
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mt-1">
                A step-by-step master guide on executing clinical commitments at Stavya Spine Hospital and using your private personal companion for everyday wellbeing.
              </p>
            </div>

            {/* Progress Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center font-mono">
                {completionPct}%
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">
                  {completedModules.length} of {trainingCurriculum.length} Complete
                </p>
                <p className="text-[10px] text-slate-300">
                  {completionPct === 100 ? '🎉 All Modules Mastered' : 'Progress saved automatically'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Modules ({trainingCurriculum.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('work')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'work'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Track 1: Stavya Work (5)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('personal')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'personal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Track 2: Personal Life (5)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Click any module to read key takeaways &amp; steps
        </span>
      </div>

      {/* Curriculum Module Cards */}
      <div className="space-y-3">
        {filteredCurriculum.map((module) => {
          const isDone = completedModules.includes(module.id);
          const isExpanded = expandedModuleId === module.id;
          const isWork = module.track === 'work';

          return (
            <Card
              key={module.id}
              className={`p-5 rounded-3xl border transition-all shadow-xs ${
                isDone
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleModuleComplete(module.id)}
                    className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 hover:border-slate-500 bg-white'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div
                    onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    className="cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isWork
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {module.trackTitle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        ⏱ {module.duration}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-bold mt-1 ${
                        isDone ? 'text-slate-600 line-through' : 'text-slate-900'
                      }`}
                    >
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {module.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={module.actionLink.href}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                  >
                    <span>{module.actionLink.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Expanded Lesson Drawer */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Takeaways */}
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Key Institutional Principles
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {module.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step-by-Step Walkthrough */}
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Step-by-Step Practice
                      </h4>
                      <div className="space-y-2 text-xs">
                        {module.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{step.title}</p>
                              <p className="text-slate-500 text-[11px]">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => toggleModuleComplete(module.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isDone
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isDone ? 'Mark as Incomplete' : 'Mark Lesson Complete'}</span>
                    </button>

                    <Link
                      href={module.actionLink.href}
                      className="inline-flex sm:hidden items-center gap-1 text-xs font-bold text-blue-600"
                    >
                      <span>{module.actionLink.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
