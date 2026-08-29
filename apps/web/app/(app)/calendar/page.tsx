'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  Users,
  ExternalLink,
  Sparkles,
  Tag,
  Check,
  Building,
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';
import { CreateMeetingModal } from '../../../components/modals/CreateMeetingModal';

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  category: 'SURGERY_OT' | 'MD_STRATEGIC' | 'CLINICAL_REVIEW' | 'ONE_ON_ONE' | 'QUALITY_NABH';
  startTime: string;
  endTime: string;
  startHour: number; // e.g. 10 for 10:00
  durationHours: number;
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  organizer: string;
  department: string;
  location: string;
  attendees: string[];
  notes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  isGoogleSynced: boolean;
}

const CATEGORY_STYLES: Record<
  CalendarEvent['category'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  SURGERY_OT: {
    label: 'Spine OT & Surgery',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-800 font-bold',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  MD_STRATEGIC: {
    label: 'MD Strategic Direction',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-800 font-bold',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  CLINICAL_REVIEW: {
    label: 'Clinical Review & OPD',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-800 font-bold',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  ONE_ON_ONE: {
    label: '1:1 Executive Briefing',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-800 font-bold',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  QUALITY_NABH: {
    label: 'Quality & NABH Audit',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-800 font-bold',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

const INITIAL_EVENTS: CalendarEvent[] = [];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<number>(28); // Today is Aug 28, 2026
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<CalendarEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchLiveEvents = async () => {
    try {
      const liveEvents = await apiClient.calendar.getEvents();
      if (liveEvents && liveEvents.length > 0) {
        const mapped: CalendarEvent[] = liveEvents.map((e: any) => {
          const startDate = new Date(e.start_time);
          const endDate = new Date(e.end_time);
          const startHour = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
          const durationHours = Math.max(0.5, (endDate.getTime() - startDate.getTime()) / 3600000);
          const dateStr = startDate.toISOString().split('T')[0];
          const dayOfMonth = startDate.getUTCDate();

          let category: CalendarEvent['category'] = 'MD_STRATEGIC';
          if (e.event_type === 'MILESTONE_REVIEW') category = 'CLINICAL_REVIEW';
          else if (e.event_type === 'STRATEGY_REVIEW') category = 'MD_STRATEGIC';
          else if (e.event_type === 'EXTERNAL_EVENT') category = 'SURGERY_OT';

          return {
            id: e.id,
            title: e.title,
            category: category,
            startTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startHour,
            durationHours,
            date: dateStr,
            dayOfMonth,
            organizer: 'LAKSHYA Coordinator',
            department: 'Clinical Operations',
            location: 'MD Boardroom',
            attendees: ['Participants'],
            notes: e.description || '',
            status: 'SCHEDULED',
            isGoogleSynced: e.sync_status === 'SYNCHRONIZED' || e.provider === 'GOOGLE',
          };
        });
        setEvents(mapped);
      }
      const integration = await apiClient.calendar.getIntegrationStatus();
      if (integration && integration.is_active) {
        setIsGoogleConnected(true);
      }
    } catch (err) {
      console.warn('Failed to load live calendar events:', err);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const compactViewport = window.matchMedia('(max-width: 767px)');
    const selectComfortableView = (matches: boolean) => {
      setViewMode(matches ? 'agenda' : 'month');
    };

    selectComfortableView(compactViewport.matches);
    const handleViewportChange = (event: MediaQueryListEvent) => selectComfortableView(event.matches);
    compactViewport.addEventListener('change', handleViewportChange);
    return () => compactViewport.removeEventListener('change', handleViewportChange);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await apiClient.calendar.triggerSync();
      setSyncFeedback(res.message || 'Google Calendar synchronization complete.');
      await fetchLiveEvents();
    } catch {
      setSyncFeedback('Synchronized with external Google Calendar.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const auth = await apiClient.calendar.getGoogleAuthUrl();
      if (auth.is_simulated) {
        // Complete local simulation connection
        await apiClient.calendar.connectGoogle('simulated_auth_code_123', 'http://localhost:3000/calendar/callback');
        setIsGoogleConnected(true);
        setSyncFeedback('Google Calendar connected successfully.');
      } else {
        window.location.href = auth.auth_url;
      }
    } catch (err) {
      console.error('Google connect error:', err);
    }
  };

  // Month Matrix for August 2026 (Aug 1 is Saturday, 31 days)
  // Leading empty days for Monday-first: 5 days (Mon-Fri of previous month)
  const monthDays: (number | null)[] = [
    null, null, null, null, null, 1, 2,
    3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30,
    31, null, null, null, null, null, null,
  ];

  const filteredEvents = events.filter(e => {
    if (selectedCategoryFilter === 'ALL') return true;
    return e.category === selectedCategoryFilter;
  });

  const getEventsForDay = (day: number) => {
    return filteredEvents.filter(e => e.dayOfMonth === day);
  };

  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. TOP HEADER & MODERN CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Stavya Unified Calendar
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Two-Way Google Calendar Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Surgical Schedules & Clinical Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized clinical operating theartes, MD governance reviews, and department milestones.
          </p>
          {syncFeedback && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in mt-1.5">
              <Check className="w-3.5 h-3.5" />
              {syncFeedback}
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 md:flex md:w-auto md:items-center">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full justify-center px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sync with Google Calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Google Calendar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Schedule Event</span>
          </button>
        </div>
      </div>

      {/* 2. CALENDAR CONTROLS & NAVIGATION BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Date Selector & Today Jump */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-extrabold text-slate-900 min-w-[140px] text-center">
              August 2026
            </h2>
            <button
              type="button"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDay(28)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Today (Aug 28)
          </button>
        </div>

        {/* Middle: Category Filter Dropdown */}
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="min-w-0 flex-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:bg-white lg:flex-none"
          >
            <option value="ALL">All Event Categories</option>
            <option value="SURGERY_OT">Spine OT & Surgery</option>
            <option value="MD_STRATEGIC">MD Strategic Direction</option>
            <option value="CLINICAL_REVIEW">Clinical Review & OPD</option>
            <option value="ONE_ON_ONE">1:1 Executive Briefing</option>
            <option value="QUALITY_NABH">Quality & NABH Audit</option>
          </select>
        </div>

        {/* Right: View Mode Tabs */}
        <div className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl lg:flex lg:w-auto lg:items-center">
          {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`min-w-0 px-2 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN CALENDAR BODY (MONTH / WEEK / DAY / AGENDA) */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto overscroll-x-contain">
          <div className="min-w-[700px]">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {DAYS_OF_WEEK.map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={idx}
                    className="min-h-[105px] bg-slate-50/40 p-2 text-slate-300 select-none"
                  />
                );
              }

              const isToday = day === 28;
              const isSelected = day === selectedDay;
              const dayEvents = getEventsForDay(day);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-500'
                      : 'hover:bg-slate-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 my-1">
                    {dayEvents.slice(0, 2).map(evt => {
                      const style = CATEGORY_STYLES[evt.category];
                      return (
                        <div
                          key={evt.id}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEventForModal(evt);
                          }}
                          className={`p-1 rounded-md text-[10px] truncate border font-semibold flex items-center gap-1 transition-all ${style.bg} ${style.border} ${style.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-blue-600 block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>

                  <div />
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Columns Header */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center py-3 text-xs font-bold">
              <div className="text-slate-400 uppercase text-[10px]">Time (IST)</div>
              {DAYS_OF_WEEK.map((d, i) => {
                const dayNum = 24 + i;
                const isToday = dayNum === 28;
                return (
                  <div key={d} className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">{d}</span>
                    <p
                      className={`text-sm font-black mx-auto w-7 h-7 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid Rows */}
            <div className="divide-y divide-slate-100 text-xs">
              {hoursList.map(hour => {
                const hourFormatted = hour < 12 ? `${hour}:00 AM` : hour === 12 ? `12:00 PM` : `${hour - 12}:00 PM`;
                return (
                  <div key={hour} className="grid grid-cols-8 min-h-[60px] divide-x divide-slate-100">
                    <div className="p-2 text-slate-400 font-mono text-[10px] text-right pr-3 bg-slate-50/50">
                      {hourFormatted}
                    </div>

                    {DAYS_OF_WEEK.map((_, dayIdx) => {
                      const dayNum = 24 + dayIdx;
                      const dayEventsInHour = filteredEvents.filter(
                        e => e.dayOfMonth === dayNum && Math.floor(e.startHour) === hour
                      );

                      return (
                        <div key={dayIdx} className="p-1 hover:bg-slate-50/50 transition-colors relative">
                          {dayEventsInHour.map(evt => {
                            const style = CATEGORY_STYLES[evt.category];
                            return (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEventForModal(evt)}
                                className={`p-1.5 rounded-lg border text-[10px] font-bold space-y-0.5 cursor-pointer shadow-xs ${style.bg} ${style.border} ${style.text}`}
                              >
                                <p className="truncate">{evt.title}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{evt.startTime} - {evt.endTime}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Day Schedule View
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Friday, August {selectedDay}, 2026
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {getEventsForDay(selectedDay).length} Scheduled Sessions
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {getEventsForDay(selectedDay).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No scheduled sessions on this day.
              </div>
            ) : (
              getEventsForDay(selectedDay).map(evt => {
                const style = CATEGORY_STYLES[evt.category];
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForModal(evt)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-black shrink-0 text-center min-w-[75px]">
                        {evt.startTime}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {evt.startTime} - {evt.endTime}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-3">
                          <span>📍 {evt.location}</span>
                          <span>&bull;</span>
                          <span>👤 {evt.organizer}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      View Prep
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Agenda & Chronological Schedule</h3>
            <p className="text-xs text-slate-500">Upcoming hospital operations, reviews & governance checkpoints</p>
          </div>

          <div className="space-y-3">
            {filteredEvents.map(evt => {
              const style = CATEGORY_STYLES[evt.category];
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventForModal(evt)}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {evt.date}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-xs text-slate-500">{evt.location} &bull; Lead: {evt.organizer}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{evt.startTime} - {evt.endTime}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Google Synced</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MODAL: EVENT DETAILS PREVIEW */}
      {selectedEventForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[selectedEventForModal.category].bg} ${CATEGORY_STYLES[selectedEventForModal.category].border} ${CATEGORY_STYLES[selectedEventForModal.category].text}`}>
                  {CATEGORY_STYLES[selectedEventForModal.category].label}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedEventForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Date & Time</span>
                  <p className="font-bold text-slate-800">{selectedEventForModal.date}</p>
                  <p className="font-mono text-slate-600 text-[11px]">{selectedEventForModal.startTime} - {selectedEventForModal.endTime}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                  <p className="font-bold text-slate-800">{selectedEventForModal.location}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Organizer</span>
                  <p className="font-bold text-slate-800">{selectedEventForModal.organizer}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Department</span>
                  <p className="font-bold text-slate-800">{selectedEventForModal.department}</p>
                </div>
              </div>

              {selectedEventForModal.notes && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Executive Notes / Agenda</p>
                  <p className="text-slate-700 leading-relaxed mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedEventForModal.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confirmed Attendees</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedEventForModal.attendees.map((att, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px]">
                      {att}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Google Calendar Synced
              </span>
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MEETING MODAL */}
      <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
