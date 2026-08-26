'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { CreateMeetingModal } from '../../../components/modals/CreateMeetingModal';

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

interface EventItem {
  id: string;
  title: string;
  type: 'WEEKLY' | 'DAILY' | 'ONE_ON_ONE' | 'STRATEGY' | 'MILESTONE_REVIEW';
  startTime: string;
  endTime: string;
  date: string;
  organizer: string;
  location: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  syncStatus: 'SYNCHRONIZED' | 'SYNC_PENDING' | 'SYNC_FAILED';
  isInstant?: boolean;
}

const MOCK_EVENTS: EventItem[] = [
  {
    id: 'evt-101',
    title: 'Executive Leadership Weekly Sync',
    type: 'WEEKLY',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    date: '2026-08-26',
    organizer: 'Het Bhatt (MD)',
    location: 'MD Boardroom & Google Meet',
    status: 'IN_PROGRESS',
    syncStatus: 'SYNCHRONIZED',
  },
  {
    id: 'evt-102',
    title: 'OPD Flow & Patient Experience Review',
    type: 'MILESTONE_REVIEW',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    date: '2026-08-26',
    organizer: 'Dr. Priyesh Shah (HOD OPD)',
    location: 'Conference Room 2',
    status: 'SCHEDULED',
    syncStatus: 'SYNCHRONIZED',
  },
  {
    id: 'evt-103',
    title: 'Instant 1:1 Operations Briefing',
    type: 'ONE_ON_ONE',
    startTime: '11:45 AM',
    endTime: '12:15 PM',
    date: '2026-08-26',
    organizer: 'Het Bhatt (MD)',
    location: 'MD Office Direct',
    status: 'IN_PROGRESS',
    syncStatus: 'NOT_SYNCED' as any,
    isInstant: true,
  },
  {
    id: 'evt-104',
    title: 'Financial Q3 Strategic Priority Review',
    type: 'STRATEGY',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    date: '2026-08-27',
    organizer: 'Ananya Patel (MD Office Lead)',
    location: 'Strategy War Room',
    status: 'SCHEDULED',
    syncStatus: 'SYNC_PENDING',
  },
  {
    id: 'evt-105',
    title: 'Nursing Department Weekly CFT Review',
    type: 'WEEKLY',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    date: '2026-08-28',
    organizer: 'Dr. Rajesh Verma (HOD Clinical)',
    location: 'Main Auditorium',
    status: 'SCHEDULED',
    syncStatus: 'SYNCHRONIZED',
  },
];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedDate, setSelectedDate] = useState('August 2026');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const getSyncBadge = (status: string, isInstant?: boolean) => {
    if (isInstant) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Instant (Internal Only)
        </span>
      );
    }
    switch (status) {
      case 'SYNCHRONIZED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Google Synced
          </span>
        );
      case 'SYNC_PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Outbox Syncing
          </span>
        );
      case 'SYNC_FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Sync Conflict
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">LAKSHYA Unified Calendar</h1>
              <p className="text-sm text-slate-500">
                Scheduled meetings, strategic review dates & two-way Google Calendar synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className="w-4 h-4" /> Re-Sync
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white shadow-md shadow-brand-blue/20"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Controls Bar: View Toggles, Date Navigation & Filters */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800">{selectedDate}</span>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          >
            <option value="ALL">All Event Types</option>
            <option value="WEEKLY">Weekly Meetings</option>
            <option value="ONE_ON_ONE">1:1 Meetings</option>
            <option value="STRATEGY">Strategic Reviews</option>
            <option value="MILESTONE_REVIEW">Milestone Reviews</option>
          </select>
        </div>
      </Card>

      {/* Main Calendar View Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Agenda / Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Today & Upcoming Schedule (Asia/Kolkata)
          </h2>

          {MOCK_EVENTS.map((event) => (
            <Card
              key={event.id}
              className={`p-5 transition-all hover:shadow-md border-l-4 ${
                event.status === 'IN_PROGRESS'
                  ? 'border-l-emerald-500 bg-emerald-50/20'
                  : 'border-l-brand-blue bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {event.date}
                    </span>
                    <span className="text-xs font-bold text-slate-300">•</span>
                    <span className="text-xs font-semibold text-brand-blue">
                      {event.startTime} - {event.endTime}
                    </span>
                    {getSyncBadge(event.syncStatus, event.isInstant)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 hover:text-brand-blue cursor-pointer">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{event.organizer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {event.status === 'IN_PROGRESS' ? (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm">
                      Join Live Meeting
                    </Button>
                  ) : (
                    <Button variant="outline" className="text-xs font-semibold border-slate-200 hover:bg-slate-50">
                      View Prep
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Sidebar Status & Integrations Info */}
        <div className="space-y-6">
          <Card className="p-5 border-slate-200 bg-slate-900 text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Google Calendar Integration
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-200">
                Connected: <span className="text-white">md.office@stavyaspine.com</span>
              </div>
              <p className="text-xs text-slate-400">
                Scheduled meetings automatically trigger background Google outbox invitations.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Outbox Queue: <strong className="text-emerald-400">0 Pending</strong></span>
              <span>Last Sync: <strong>Just now</strong></span>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-blue" /> Two-Way Controlled Sync Rules
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>LAKSHYA is authoritative for meeting agendas, priorities & O&O items.</li>
              <li>Instant meetings are excluded from external calendar sync.</li>
              <li>External date/time changes trigger organizer verification.</li>
            </ul>
          </Card>
        </div>
      </div>

      <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
