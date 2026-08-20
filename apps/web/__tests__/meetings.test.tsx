import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeetingList } from '../components/meetings/MeetingList';
import { MeetingIntakeModal } from '../components/modals/MeetingIntakeModal';
import { apiClient } from '../lib/api/client';
import { Meeting } from '../types/meeting';

describe('SSIE Meeting Engine Integration Frontend Components', () => {
  it('MeetingList renders meetings and triggers onExtractWork on click', () => {
    const mockMeetings: Meeting[] = [
      {
        id: 'meet-001',
        organization_id: 'org-001',
        title: 'Weekly Clinical Review',
        meeting_date: '2026-09-01',
        start_time: '10:00 AM',
        duration_minutes: 60,
        status: 'scheduled',
        created_by: 'user-001',
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-20T10:00:00Z',
        version: 1,
      },
    ];

    const onExtractWork = vi.fn();

    render(
      <MeetingList
        meetings={mockMeetings}
        onExtractWork={onExtractWork}
      />
    );

    expect(screen.getByText('Weekly Clinical Review')).toBeDefined();
    expect(screen.getByText('2026-09-01 (10:00 AM)')).toBeDefined();

    const extractBtn = screen.getByRole('button', { name: /\+ extract work items/i });
    fireEvent.click(extractBtn);

    expect(onExtractWork).toHaveBeenCalledWith(mockMeetings[0]);
  });

  it('MeetingIntakeModal calls extractWork and submits approved work with meeting provenance', async () => {
    const mockMeetings: Meeting[] = [
      {
        id: 'meet-001',
        organization_id: 'org-001',
        title: 'IT Infrastructure Sync',
        meeting_date: '2026-09-02',
        start_time: '11:00 AM',
        duration_minutes: 30,
        status: 'completed',
        created_by: 'user-001',
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-20T10:00:00Z',
        version: 1,
      },
    ];

    const mockPlan = {
      title: 'Action Plan: IT Infrastructure Sync',
      priority: 'high' as const,
      items: [
        { client_id: 'dec-1', title: 'Upgrade Core Switch', priority: 'high' as const },
      ],
    };

    vi.spyOn(apiClient.meetings, 'list').mockResolvedValueOnce({ items: mockMeetings, total: 1 });
    vi.spyOn(apiClient.meetings, 'extractWork').mockResolvedValueOnce({ plan: mockPlan });
    vi.spyOn(apiClient.workItems, 'approve').mockResolvedValueOnce({ items: [], total: 2 });

    const onClose = vi.fn();
    const onWorkCreated = vi.fn();

    render(
      <MeetingIntakeModal
        isOpen={true}
        onClose={onClose}
        onWorkCreated={onWorkCreated}
      />
    );

    // Wait for meeting list to load inside modal
    await waitFor(() => {
      expect(screen.getByText(/IT Infrastructure Sync — 2026-09-02/i)).toBeDefined();
    });

    // Click Extract Candidate Work Plan button
    const extractBtn = screen.getByRole('button', { name: /extract candidate work plan/i });
    fireEvent.click(extractBtn);

    // Wait for candidate plan to render in ReviewablePlanCard
    await waitFor(() => {
      expect(screen.getByDisplayValue('Action Plan: IT Infrastructure Sync')).toBeDefined();
      expect(screen.getByDisplayValue('Upgrade Core Switch')).toBeDefined();
    });

    // Click Approve & Create
    const approveBtn = screen.getByRole('button', { name: /approve & create/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(apiClient.workItems.approve).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Action Plan: IT Infrastructure Sync',
          origin_meeting_id: 'meet-001',
          source_type: 'meeting',
        })
      );
      expect(onClose).toHaveBeenCalled();
      expect(onWorkCreated).toHaveBeenCalled();
    });
  });
});
