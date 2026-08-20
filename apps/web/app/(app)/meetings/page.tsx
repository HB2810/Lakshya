'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MeetingList } from '../../../components/meetings/MeetingList';
import { MeetingExecutionBoard } from '../../../components/meetings/MeetingExecutionBoard';
import { CreateMeetingModal } from '../../../components/modals/CreateMeetingModal';
import { MeetingIntakeModal } from '../../../components/modals/MeetingIntakeModal';
import { ReviewablePlanCard } from '../../../components/intake/ReviewablePlanCard';
import { apiClient } from '../../../lib/api/client';
import { Meeting } from '../../../types/meeting';
import { ReviewablePlan, ApprovePlanPayload } from '../../../types/workItem';
import { User } from '../../../types/auth';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<ReviewablePlan | null>(null);
  const [planMeetingId, setPlanMeetingId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.organization.getUsers();
      setUsers(res);
    } catch {
      // ignore
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.meetings.list();
      setMeetings(res.items || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchMeetings();
  }, [fetchUsers, fetchMeetings]);

  const handleExtractWork = async (meeting: Meeting) => {
    try {
      const rec = await apiClient.meetings.extractWork(meeting.id);
      setActivePlan(rec.plan);
      setPlanMeetingId(meeting.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract work.';
      alert(msg);
    }
  };

  const handleApprovePlan = async (payload: ApprovePlanPayload) => {
    setIsApproving(true);
    try {
      const res = await apiClient.workItems.approve({
        ...payload,
        origin_meeting_id: planMeetingId,
        source_type: 'meeting',
      });
      setActivePlan(null);
      setPlanMeetingId(undefined);
      setSuccessMessage(`Successfully approved and created ${res.items.length} work item(s) from meeting.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve plan.';
      alert(msg);
    } finally {
      setIsApproving(false);
    }
  };

  if (selectedMeetingId) {
    return (
      <div className="space-y-6">
        <MeetingExecutionBoard
          meetingId={selectedMeetingId}
          users={users}
          onExtractWork={(id) => {
            const m = meetings.find(item => item.id === id);
            if (m) handleExtractWork(m);
          }}
          onBack={() => setSelectedMeetingId(null)}
        />

        {activePlan && (
          <Card title="Candidate Work Plan Review">
            <ReviewablePlanCard
              initialPlan={activePlan}
              users={users}
              originMeetingId={planMeetingId}
              sourceType="meeting"
              onApprove={handleApprovePlan}
              onCancel={() => setActivePlan(null)}
              isLoading={isApproving}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">SSIE Meetings Hub</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Operational meetings, live agenda & decision logging, and direct work extraction into SSIE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsExtractModalOpen(true)}>
            + Add Work from Meeting
          </Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            Schedule Meeting
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* Active Candidate Plan Review if any */}
      {activePlan && (
        <Card title="Candidate Work Plan Review">
          <ReviewablePlanCard
            initialPlan={activePlan}
            users={users}
            originMeetingId={planMeetingId}
            sourceType="meeting"
            onApprove={handleApprovePlan}
            onCancel={() => setActivePlan(null)}
            isLoading={isApproving}
          />
        </Card>
      )}

      {/* Meetings List */}
      <Card title="Scheduled & Past Operational Meetings">
        <MeetingList
          meetings={meetings}
          isLoading={isLoading}
          onExtractWork={handleExtractWork}
          onSelectMeeting={(m) => setSelectedMeetingId(m.id)}
          onScheduleClick={() => setIsCreateModalOpen(true)}
        />
      </Card>

      {/* Modals */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMeetings}
      />

      <MeetingIntakeModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        users={users}
        onWorkCreated={fetchMeetings}
      />
    </div>
  );
}
