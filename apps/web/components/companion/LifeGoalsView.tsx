'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Lock,
  Quote,
  Clock,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, savePrivateState } from '../../lib/services/privateVault';
import { PrivateState, LifeGoal, WorkTask } from '../../types/companion';

export const LifeGoalsView: React.FC = () => {
  const [state, setState] = useState<PrivateState>(() => loadPrivateState());
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCadence, setNewGoalCadence] = useState('Weekly');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  useEffect(() => {
    savePrivateState(state);
  }, [state]);

  const toggleGoal = (id: string) => {
    setState((current) => ({
      ...current,
      lifeGoals: current.lifeGoals.map((g) =>
        g.id === id ? { ...g, done: !g.done } : g
      ),
    }));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: LifeGoal = {
      id: `LIFE-${Date.now()}`,
      title: newGoalTitle.trim(),
      cadence: newGoalCadence,
      done: false,
    };

    setState((current) => ({
      ...current,
      lifeGoals: [newGoal, ...current.lifeGoals],
    }));

    setNewGoalTitle('');
    setIsAddGoalOpen(false);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    const newReminder: WorkTask = {
      id: `PRIVATE-${Date.now()}`,
      title: newReminderTitle.trim(),
      dueLabel: 'Personal',
      status: 'todo',
      source: 'Personal',
    };

    setState((current) => ({
      ...current,
      personalTasks: [newReminder, ...current.personalTasks],
    }));

    setNewReminderTitle('');
  };

  const toggleReminder = (id: string) => {
    setState((current) => ({
      ...current,
      personalTasks: current.personalTasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
      ),
    }));
  };

  const completedGoalsCount = state.lifeGoals.filter((g) => g.done).length;
  const totalGoals = Math.max(1, state.lifeGoals.length);
  const goalProgressPct = Math.round((completedGoalsCount / totalGoals) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-purple-300" />
              PRIVATE TO YOU
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Personal device vault
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Life Beyond Work
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/80 max-w-xl leading-relaxed">
            Personal goals, habits, and private reminders that stay completely separate from your employee performance profile.
          </p>
        </div>
      </div>

      {/* Grid: Quote & Rhythm Ring */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Quote Card */}
        <Card className="sm:col-span-2 p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl space-y-3 shadow-xs border-slate-800 relative">
          <Quote className="w-8 h-8 text-purple-400/30 absolute top-4 right-4" />
          <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-100 italic">
            “A good week has room for clinical focus, personal rest, physical health, and connection with loved ones.”
          </p>
          <p className="text-xs text-purple-300 font-bold tracking-wide uppercase">
            Consistency over perfection
          </p>
        </Card>

        {/* Goal Rhythm Metric */}
        <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-2 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-600 transition-all duration-500"
                strokeDasharray={`${goalProgressPct}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-black text-slate-900 font-mono">
              {completedGoalsCount}/{state.lifeGoals.length}
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-800">Weekly Personal Rhythm</h3>
          <p className="text-[11px] text-slate-400">{goalProgressPct}% checked in this week</p>
        </Card>
      </div>

      {/* Goals & Habits List */}
      <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">
              HABITS & GOALS
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              My Personal Rhythm
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsAddGoalOpen(!isAddGoalOpen)}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors border border-purple-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Goal</span>
          </button>
        </div>

        {isAddGoalOpen && (
          <form onSubmit={handleAddGoal} className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g. 20 minutes of restorative reading or exercise"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-purple-200 rounded-xl text-slate-900 focus:outline-none"
              />
              <select
                value={newGoalCadence}
                onChange={(e) => setNewGoalCadence(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-purple-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Twice weekly">Twice weekly</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {state.lifeGoals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                goal.done
                  ? 'bg-purple-50/60 border-purple-200/80 text-purple-900'
                  : 'bg-slate-50 hover:bg-white border-slate-200/80 text-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    goal.done ? 'bg-purple-600 text-white' : 'border-2 border-slate-300 group-hover:border-purple-500'
                  }`}
                >
                  {goal.done && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <p className={`text-xs font-bold ${goal.done ? 'line-through text-purple-800/70' : 'text-slate-900'}`}>
                    {goal.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold">{goal.cadence}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Private Reminders List */}
      <Card className="p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            PERSONAL REMINDERS
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Private Notes &amp; Reminders
          </h3>
        </div>

        <form onSubmit={handleAddReminder} className="flex gap-2">
          <input
            type="text"
            value={newReminderTitle}
            onChange={(e) => setNewReminderTitle(e.target.value)}
            placeholder="Add a private personal reminder (e.g. Schedule dental appointment)..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!newReminderTitle.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          {state.personalTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleReminder(t.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                t.status === 'done'
                  ? 'bg-slate-50/80 border-slate-200 text-slate-400 line-through'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${t.status === 'done' ? 'bg-slate-300' : 'bg-purple-600'}`} />
                <span>{t.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">{t.dueLabel}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
