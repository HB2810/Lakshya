'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckSquare, Plus, FileText, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Modal';
import { apiClient } from '../../../lib/api/client';
import { Meeting, Decision } from '../../../types/meeting';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    Promise.all([apiClient.meetings.getMeetings(), apiClient.meetings.getDecisions()]).then(
      ([mRes, dRes]) => {
        setMeetings(mRes);
        setDecisions(dRes);
      }
    );
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
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Schedule Meeting
        </Button>
      </div>

      {/* Meetings Grid */}
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
                  <span>19 Aug 2026, 14:00 AM</span>
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
              <span>View Details $\rightarrow$</span>
            </div>
          </div>
        ))}
      </div>

      {/* Official Decisions Register */}
      <Card title="Official Decision Register">
        <div className="space-y-3">
          {decisions.map(d => (
            <div key={d.id} className="p-4 bg-slate-50 border border-workspace-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-brand-blue text-xs">{d.code}</span>
                  <StatusBadge status={d.status} size="sm" />
                </div>
                <span className="text-xs text-text-muted">Approved: {d.approvedAt}</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary">{d.title}</h4>
              <p className="text-xs text-text-secondary">{d.context}</p>
              <div className="p-2.5 bg-white border border-workspace-border rounded text-xs text-brand-blue font-semibold">
                Impact: {d.impactSummary}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Meeting Drawer */}
      {selectedMeeting && (
        <Drawer
          isOpen={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          title={selectedMeeting.title}
          subtitle={`Meeting Type: ${selectedMeeting.type}`}
        >
          <div className="space-y-6 text-xs">
            {/* Agenda Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-text-primary uppercase tracking-wider">Agenda</h4>
              <ul className="space-y-1.5 list-disc pl-4 text-text-secondary">
                {selectedMeeting.agendaItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <h4 className="font-bold text-text-primary uppercase tracking-wider">Participants</h4>
              <div className="space-y-1.5">
                {selectedMeeting.participants.map(p => (
                  <div key={p.userId} className="p-2 bg-slate-50 border border-workspace-border rounded flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{p.userName}</p>
                      <p className="text-[10px] text-text-muted">{p.userRoleTitle} ({p.departmentName})</p>
                    </div>
                    <Badge variant={p.attended ? 'success' : 'neutral'}>
                      {p.attended ? 'Attended' : 'Invited'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-workspace-border flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedMeeting(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
