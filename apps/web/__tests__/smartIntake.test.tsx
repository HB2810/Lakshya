import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartIntakeBox } from '../components/intake/SmartIntakeBox';
import { ReviewablePlanCard } from '../components/intake/ReviewablePlanCard';
import { apiClient } from '../lib/api/client';
import { ReviewablePlan } from '../types/workItem';

describe('Vertical Slice 02 Smart Intake & Plan Approval Components', () => {
  it('SmartIntakeBox disables button when input text length is less than 3', () => {
    const onPlanGenerated = vi.fn();
    render(<SmartIntakeBox onPlanGenerated={onPlanGenerated} />);

    const button = screen.getByRole('button', { name: /structure work/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText(/example:/i);
    fireEvent.change(textarea, { target: { value: 'ab' } });
    expect(button.disabled).toBe(true);

    fireEvent.change(textarea, { target: { value: 'Prepare OT Review' } });
    expect(button.disabled).toBe(false);
  });

  it('SmartIntakeBox calls apiClient.workItems.intake on submit', async () => {
    const onPlanGenerated = vi.fn();
    const mockPlan: ReviewablePlan = {
      title: 'Prepare OT Review',
      priority: 'high',
      items: [{ client_id: '1', title: 'Collect OPD data', priority: 'medium' }],
    };

    vi.spyOn(apiClient.workItems, 'intake').mockResolvedValueOnce({ plan: mockPlan });

    render(<SmartIntakeBox onPlanGenerated={onPlanGenerated} />);

    const textarea = screen.getByPlaceholderText(/example:/i);
    fireEvent.change(textarea, { target: { value: 'Prepare OT Review' } });

    const button = screen.getByRole('button', { name: /structure work/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiClient.workItems.intake).toHaveBeenCalledWith('Prepare OT Review');
      expect(onPlanGenerated).toHaveBeenCalledWith(mockPlan);
    });
  });

  it('ReviewablePlanCard renders structured plan and submits approved payload', async () => {
    const mockPlan: ReviewablePlan = {
      title: 'Initial Title',
      description: 'Initial Description',
      priority: 'medium',
      items: [
        { client_id: 'sub-1', title: 'Subtask 1', priority: 'low' },
        { client_id: 'sub-2', title: 'Subtask 2', priority: 'high' },
      ],
    };

    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <ReviewablePlanCard
        initialPlan={mockPlan}
        onApprove={onApprove}
        onCancel={onCancel}
      />
    );

    // Verify main title and subtasks render
    const mainTitleInput = screen.getByDisplayValue('Initial Title');
    expect(mainTitleInput).toBeDefined();
    expect(screen.getByDisplayValue('Subtask 1')).toBeDefined();
    expect(screen.getByDisplayValue('Subtask 2')).toBeDefined();

    // Edit main title
    fireEvent.change(mainTitleInput, { target: { value: 'Edited Main Title' } });

    // Click Approve & Create
    const approveButton = screen.getByRole('button', { name: /approve & create/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Edited Main Title',
          description: 'Initial Description',
          priority: 'medium',
          items: expect.arrayContaining([
            expect.objectContaining({ title: 'Subtask 1' }),
            expect.objectContaining({ title: 'Subtask 2' }),
          ]),
        })
      );
    });
  });

  it('ReviewablePlanCard allows adding and removing subtasks', async () => {
    const mockPlan: ReviewablePlan = {
      title: 'Main Goal',
      priority: 'medium',
      items: [{ client_id: 'sub-1', title: 'Subtask 1', priority: 'medium' }],
    };

    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <ReviewablePlanCard
        initialPlan={mockPlan}
        onApprove={onApprove}
        onCancel={onCancel}
      />
    );

    // Click Add Subtask
    const addButton = screen.getByRole('button', { name: /\+ add subtask/i });
    fireEvent.click(addButton);

    // There should now be 2 subtask rows
    const subtaskInputs = screen.getAllByPlaceholderText(/subtask title\.\.\./i);
    expect(subtaskInputs.length).toBe(2);

    // Fill in new subtask title
    fireEvent.change(subtaskInputs[1], { target: { value: 'New Subtask 2' } });

    // Remove first subtask
    const removeButtons = screen.getAllByTitle('Remove subtask');
    fireEvent.click(removeButtons[0]);

    // Click Approve & Create
    const approveButton = screen.getByRole('button', { name: /approve & create/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Main Goal',
          items: [
            expect.objectContaining({ title: 'New Subtask 2' }),
          ],
        })
      );
    });
  });

  it('ReviewablePlanCard triggers cancel callback when Cancel button is clicked', () => {
    const mockPlan: ReviewablePlan = {
      title: 'Task Title',
      priority: 'medium',
      items: [],
    };

    const onApprove = vi.fn();
    const onCancel = vi.fn();

    render(
      <ReviewablePlanCard
        initialPlan={mockPlan}
        onApprove={onApprove}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel \/ start over/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
