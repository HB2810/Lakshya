'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { executionStore } from '../../lib/mocks/executionMock';

interface CreateCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateCommitmentModal: React.FC<CreateCommitmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'MD_INSTRUCTION' | 'MEETING_DECISION' | 'MONTHLY_PRIORITY'>('MD_INSTRUCTION');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [responsibleName, setResponsibleName] = useState('Ananya Patel (Operations Manager)');
  const [accountableName, setAccountableName] = useState('Het Bhatt (MD Office Lead)');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 604800000).toISOString().split('T')[0]);
  const [autoGenerateTasks, setAutoGenerateTasks] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    executionStore.addCommitment({
      title,
      description,
      sourceType,
      priority,
      responsibleName,
      accountableName,
      dueDate,
    }, autoGenerateTasks);

    setTitle('');
    setDescription('');
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Organizational Commitment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Commitment Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Deploy OPD Queue Display System"
          required
        />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Description & Scope
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Define the scope and expected outcome..."
            className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={e => setSourceType(e.target.value as any)}
              className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
            >
              <option value="MD_INSTRUCTION">Direct MD Instruction</option>
              <option value="MEETING_DECISION">Meeting Decision</option>
              <option value="MONTHLY_PRIORITY">Monthly Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full p-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Responsible Owner (R)"
            value={responsibleName}
            onChange={e => setResponsibleName(e.target.value)}
          />
          <Input
            label="Accountable Owner (A)"
            value={accountableName}
            onChange={e => setAccountableName(e.target.value)}
          />
        </div>

        <Input
          label="Target Completion Date"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />

        {/* Automation Option */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md flex items-center gap-3">
          <input
            type="checkbox"
            id="autoTasks"
            checked={autoGenerateTasks}
            onChange={e => setAutoGenerateTasks(e.target.checked)}
            className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
          />
          <label htmlFor="autoTasks" className="text-xs text-text-primary cursor-pointer">
            <span className="font-bold text-brand-blue">Automate Execution Tasks: </span>
            Automatically derive milestone execution tasks and assign RACI matrices.
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Commitment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
