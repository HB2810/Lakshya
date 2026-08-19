'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { meetingStore } from '../../lib/mocks/meetingsMock';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'MAJOR' | 'CROSS_FUNCTIONAL' | 'ONE_ON_ONE' | 'DEPARTMENTAL'>('MAJOR');
  const [locationOrLink, setLocationOrLink] = useState('MD Office Boardroom');
  const [agenda, setAgenda] = useState('');
  const [autoCreateCommitment, setAutoCreateCommitment] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    meetingStore.addMeeting({
      title,
      type,
      locationOrLink,
      agendaItems: agenda ? agenda.split('\n').filter(Boolean) : ['Executive Review'],
    }, autoCreateCommitment);

    setTitle('');
    setAgenda('');
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Operational Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Meeting Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Weekly MD Executive Review"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Meeting Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
            >
              <option value="MAJOR">Major Executive Review</option>
              <option value="CROSS_FUNCTIONAL">Cross-Functional Sync</option>
              <option value="ONE_ON_ONE">1:1 Management Sync</option>
              <option value="DEPARTMENTAL">Departmental Review</option>
            </select>
          </div>

          <Input
            label="Location / Teams Link"
            value={locationOrLink}
            onChange={e => setLocationOrLink(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Agenda Topics (One per line)
          </label>
          <textarea
            value={agenda}
            onChange={e => setAgenda(e.target.value)}
            rows={3}
            placeholder="Topic 1&#10;Topic 2..."
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
          />
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md flex items-center gap-3">
          <input
            type="checkbox"
            id="autoDecision"
            checked={autoCreateCommitment}
            onChange={e => setAutoCreateCommitment(e.target.checked)}
            className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
          />
          <label htmlFor="autoDecision" className="text-xs text-text-primary cursor-pointer">
            <span className="font-bold text-brand-blue">Auto-Generate Decision Commitment: </span>
            Automatically convert meeting decisions into tracked organizational commitments.
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Schedule & Create Meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
};
