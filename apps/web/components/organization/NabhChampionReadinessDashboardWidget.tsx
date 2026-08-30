'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Award,
  Search,
  Filter,
  CheckSquare,
  FileText,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Info,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { nabhReadinessStore } from '../../lib/mocks/nabhReadinessStore';
import { NabhChecklistItem, NabhChapterChampionProfile } from '../../lib/data/nabhReadinessChecklistData';
import { useAuth } from '../../lib/auth/AuthContext';
import { NabhTaskAutoGeneratorModal } from './NabhTaskAutoGeneratorModal';

interface Props {
  className?: string;
  condensed?: boolean;
}

export const NabhChampionReadinessDashboardWidget: React.FC<Props> = ({ className = '', condensed = false }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<NabhChecklistItem[]>(() => nabhReadinessStore.getChecklist());
  const champions = useMemo(() => nabhReadinessStore.getChampions(), []);
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);
  const [isAutoGeneratorOpen, setIsAutoGeneratorOpen] = useState(false);

  // Evidence / Sign-off Modal
  const [activeItemForSignOff, setActiveItemForSignOff] = useState<NabhChecklistItem | null>(null);
  const [signOffRemarks, setSignOffRemarks] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if logged-in user is a Chapter Champion
  const userChampionChapters = useMemo(() => {
    if (!user) return [];
    return champions.filter(
      (c) =>
        c.championId === user.id ||
        (user.name && c.championName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) ||
        (user.role === 'MANAGING_DIRECTOR' && (c.chapter === 'ROM' || c.chapter === 'PSQ')) ||
        (user.role === 'DIRECTOR_QUALITY' && (c.chapter === 'IPC' || c.chapter === 'PSQ'))
    );
  }, [user, champions]);

  const isUserAChampion = userChampionChapters.length > 0;

  // Filtered Checklist
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Chapter filter
      if (selectedChapter !== 'ALL' && item.chapter !== selectedChapter) {
        return false;
      }

      // My tasks filter
      if (onlyMyTasks) {
        const isMyItem =
          item.championId === user?.id ||
          (user?.name && item.championName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) ||
          (user?.role === 'MANAGING_DIRECTOR' && item.chapter === 'ROM') ||
          (user?.role === 'DIRECTOR_QUALITY' && (item.chapter === 'IPC' || item.chapter === 'PSQ'));
        if (!isMyItem) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesChamp = item.championName.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesChamp && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedChapter, onlyMyTasks, statusFilter, searchQuery, user]);

  const summary = useMemo(() => nabhReadinessStore.getReadinessSummary(), [items]);

  const handleToggleStatus = (item: NabhChecklistItem) => {
    let nextStatus: NabhChecklistItem['status'] = 'IN_PROGRESS';
    if (item.status === 'PENDING') nextStatus = 'IN_PROGRESS';
    else if (item.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else if (item.status === 'COMPLETED') nextStatus = 'VERIFIED';
    else if (item.status === 'VERIFIED') nextStatus = 'PENDING';

    const updated = nabhReadinessStore.updateItemStatus(
      item.id,
      nextStatus,
      item.remarks,
      user?.name || 'Authorized Auditor'
    );

    if (updated) {
      setItems([...nabhReadinessStore.getChecklist()]);
      setToastMessage(`Updated ${item.code} status to ${nextStatus}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleConfirmSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemForSignOff) return;

    const updated = nabhReadinessStore.updateItemStatus(
      activeItemForSignOff.id,
      'VERIFIED',
      signOffRemarks || activeItemForSignOff.remarks || 'Verified against NABH 6th Edition evidence protocol.',
      user?.name || 'Director of Quality / MD'
    );

    if (updated) {
      setItems([...nabhReadinessStore.getChecklist()]);
      setToastMessage(`Item "${activeItemForSignOff.code}" successfully VERIFIED and signed off!`);
      setActiveItemForSignOff(null);
      setSignOffRemarks('');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden ${className}`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-white to-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                NABH 6th Edition
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                Chapter Champions To-Dos &amp; Verification
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Accreditation Readiness Checklist
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
              Mandatory verification tasks assigned to 10 Chapter Champions for the upcoming NABH 6th Edition assessment.
            </p>
          </div>

          {/* Readiness Score Widget */}
          <div className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shrink-0 shadow-2xs">
            <div className="text-center px-3 border-r border-slate-200">
              <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Overall Score</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-blue-600">{summary.readinessPercent}%</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">{summary.verified} of {summary.total} Verified</p>
            </div>

            <div className="text-center px-3">
              <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">Ready / Active</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-emerald-600">{summary.verified + summary.completed}</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold">{summary.inProgress} In-Progress</p>
            </div>

            <div className="text-center px-3 border-l border-slate-200">
              <p className="text-[10px] uppercase text-amber-600 font-bold tracking-wider">Pending Tasks</p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-2xl font-black text-amber-600">{summary.pending}</span>
              </div>
              <p className="text-[10px] text-amber-700 font-semibold">Action Required</p>
            </div>
          </div>
        </div>

        {/* Chapter Progress Meters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          {summary.chapterBreakdown.map((cb) => {
            const isSelected = selectedChapter === cb.chapter;
            return (
              <button
                key={cb.chapter}
                onClick={() => setSelectedChapter(isSelected ? 'ALL' : cb.chapter)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-slate-900">{cb.chapter}</span>
                  <span className="text-[11px] font-black text-blue-700">{cb.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-blue-600 transition-all rounded-full"
                    style={{ width: `${cb.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 truncate font-medium">{cb.championName.split(' ')[0]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checklist, code, champion..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 w-48 sm:w-64 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Chapter Selector Dropdown */}
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-blue-600"
          >
            <option value="ALL">All 10 Chapters ({items.length} tasks)</option>
            {champions.map((c) => (
              <option key={c.chapter} value={c.chapter}>
                {c.chapter}: {c.chapterTitle} ({c.championName})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* My Tasks Toggle & Auto-Generator Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAutoGeneratorOpen(true)}
            className="px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Generate Tasks</span>
          </button>

          {isUserAChampion && (
            <button
              onClick={() => setOnlyMyTasks(!onlyMyTasks)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${
                onlyMyTasks
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Chapter Tasks ({userChampionChapters.map((c) => c.chapter).join(', ')})</span>
            </button>
          )}

          <span className="text-xs text-slate-500 font-bold px-2 py-1 bg-white border border-slate-200 rounded-xl">
            Showing {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* Checklist Tasks List */}
      <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">No checklist tasks match your filter</h4>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting All Chapters.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isVerified = item.status === 'VERIFIED';
            const isCompleted = item.status === 'COMPLETED';
            const isInProgress = item.status === 'IN_PROGRESS';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isVerified ? 'bg-emerald-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Interactive Checkbox Button */}
                  <button
                    onClick={() => handleToggleStatus(item)}
                    title={`Current: ${item.status}. Click to advance status.`}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isVerified
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isInProgress
                        ? 'bg-amber-100 border-amber-400 text-amber-800'
                        : 'bg-white border-slate-300 text-transparent hover:border-blue-500'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCompleted ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : isInProgress ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-200" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {item.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        Chap: {item.chapter}
                      </span>
                      {item.statutoryMandate && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                          Mandatory
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {item.dueDate}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Evidence & Champion Meta Bar */}
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <User className="w-3 h-3 text-blue-600" />
                        <span>Champion: {item.championName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Evidence: {item.evidenceRequired}</span>
                      </div>
                      {item.remarks && (
                        <div className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                          {item.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Verification Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isCompleted
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isInProgress
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.status}
                  </span>

                  {!isVerified && (
                    <button
                      onClick={() => {
                        setActiveItemForSignOff(item);
                        setSignOffRemarks(item.remarks || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sign Off</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sign Off & Verification Modal */}
      {activeItemForSignOff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  NABH 6th Edition Sign-Off
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Verify &amp; Sign Off Checklist Item
                </h3>
              </div>
              <button
                onClick={() => setActiveItemForSignOff(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-4 text-xs space-y-1.5">
              <p className="font-bold text-slate-800">
                [{activeItemForSignOff.code}] {activeItemForSignOff.title}
              </p>
              <p className="text-slate-600">{activeItemForSignOff.description}</p>
              <p className="text-blue-700 font-semibold pt-1 border-t border-slate-200">
                Required Evidence: {activeItemForSignOff.evidenceRequired}
              </p>
            </div>

            <form onSubmit={handleConfirmSignOff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auditor Sign-Off Remarks &amp; Evidence Confirmation
                </label>
                <textarea
                  rows={3}
                  value={signOffRemarks}
                  onChange={(e) => setSignOffRemarks(e.target.value)}
                  placeholder="e.g. Verified evidence logs during clinical rounds. All 6th edition criteria satisfied."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveItemForSignOff(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Official Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Autonomous Task Auto-Generator Modal */}
      <NabhTaskAutoGeneratorModal
        isOpen={isAutoGeneratorOpen}
        onClose={() => setIsAutoGeneratorOpen(false)}
        onTasksGenerated={(count) => {
          setItems([...nabhReadinessStore.getChecklist()]);
          setToastMessage(`Successfully generated ${count} NABH 6th Edition compliance tasks into active work queue!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
};
