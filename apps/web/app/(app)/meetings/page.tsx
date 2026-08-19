'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckSquare, Plus, FileText, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/States';
import { Meeting, Decision } from '../../../types/meeting';
import { meetingStore } from '../../../lib/mocks/meetingsMock';
import { CreateMeetingModal } from '../../../components/modals/CreateMeetingModal';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const refreshData = () => {
    setMeetings([...meetingStore.getMeetings()]);
    setDecisions([...meetingStore.getDecisions()]);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = meetingStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-workspace-border rounded-lg p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Meetings & Decision Register</h2>
          <p className="text-xs text-text-secondary mt-1">
            Traceable meeting management: Major, Cross Functional, 1:1, Decisions & Action Commitments.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsMeetingModalOpen(true)}>
          Schedule Meeting
        </Button>
      </div>

      {/* Meetings Grid */}
      {meetings.length === 0 ? (
        <EmptyState
          title="No Scheduled Meetings"
          description="Schedule a meeting to log decisions and automatically generate action commitments."
          action={<Button size="sm" onClick={() => setIsMeetingModalOpen(true)}>+ Schedule Meeting</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map(m => (
            <div
              key={m.id}
              onClick={() => setSelectedMeeting(m)}
              className="bg-white border border-workspace-border rounded-lg p-5 shadow-card hover:border-brand-blue transition-colors cursor-pointer space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{m.type.replace('_', ' ')}</Badge>
                  <StatusBadge status={m.status} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-text-primary line-clamp-2">{m.title}</h3>
                <div className="space-y-1 text-xs text-text-muted">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" />
                    <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.locationOrLink}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Organizer: {m.organizerUserName}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-workspace-border flex items-center justify-between text-xs font-semibold text-brand-blue">
                <span>{m.decisions.length} Decisions Recorded</span>
                <span>View Details &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Decisions Register */}
      <Card title="Official Decisions Register">
        {decisions.length === 0 ? (
          <EmptyState
            title="No Decisions Logged"
            description="Decisions recorded during meetings will be listed here with automated commitment linkages."
          />
        ) : (
          <div className="space-y-4">
            {decisions.map(d => (
              <div key={d.id} className="p-4 bg-slate-50 border border-workspace-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-blue text-xs">{d.code}</span>
                  <StatusBadge status={d.status} size="sm" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">{d.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{d.context}</p>
                <div className="pt-2 border-t border-slate-200 text-xs text-text-muted flex items-center justify-between">
                  <span>Decision Maker: {d.decisionMakerUserName}</span>
                  <span>Approved By: {d.approvedByUserName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MEETING DRAWER */}
      {selectedMeeting && (
        <Drawer
          isOpen={Boolean(selectedMeeting)}
          onClose={() => setSelectedMeeting(null)}
          title={selectedMeeting.title}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="primary">{selectedMeeting.type}</Badge>
              <p className="text-xs text-text-muted">Organizer: {selectedMeeting.organizerUserName}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Agenda Topics</h4>
              <ul className="space-y-1 text-xs text-text-secondary list-disc pl-4">
                {selectedMeeting.agendaItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* CREATE MEETING MODAL */}
      <CreateMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
