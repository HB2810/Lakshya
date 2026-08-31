import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicHospitalOrgChart } from '../components/organization/DynamicHospitalOrgChart';
import { ScopedOrgTree } from '../components/leader/ScopedOrgTree';
import { MOCK_ORG_TREE, getScopedMockOrgTree } from '../lib/mocks/organizationMock';
import { INITIAL_WORK_ITEMS } from '../lib/mocks/workItemMock';
import OrganizationPage from '../app/(app)/organization/page';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('LAKSHYA Dynamic Org Chart & Hierarchy Suite', () => {
  it('renders DynamicHospitalOrgChart with 211 staff header, governance, and expanded hierarchy', () => {
    render(
      <AuthProvider>
        <DynamicHospitalOrgChart workItems={INITIAL_WORK_ITEMS} />
      </AuthProvider>
    );

    expect(screen.getByText('Hospital Organizational Operating Structure')).toBeDefined();
    expect(screen.getByText(/211 Verified Personnel/i)).toBeDefined();
    expect(screen.getAllByText('Dr. Bharat Rajendraprasad Dave').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dr. Mirant Bharat Dave').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Expand All' }));

    expect(screen.getAllByText('Junior Consultants').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nursing Leadership').length).toBeGreaterThan(0);
  });

  it('filters staff by search keyword in DynamicHospitalOrgChart', () => {
    render(
      <AuthProvider>
        <DynamicHospitalOrgChart workItems={INITIAL_WORK_ITEMS} />
      </AuthProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search staff, code, unit/i);
    fireEvent.change(searchInput, { target: { value: 'Brijesh' } });

    expect(screen.getAllByText('Brijesh Hasmukhkumar Bhatt').length).toBeGreaterThan(0);
  });

  it('opens staff detail drawer when clicking a member card', () => {
    render(
      <AuthProvider>
        <DynamicHospitalOrgChart workItems={INITIAL_WORK_ITEMS} />
      </AuthProvider>
    );

    const staffNodes = screen.getAllByText('Brijesh Hasmukhkumar Bhatt');
    fireEvent.click(staffNodes[0]);

    expect(screen.getAllByText('CNO · ICN · NABH Lead').length).toBeGreaterThan(0);
    expect(screen.getByText(/Assigned Execution Tasks/i)).toBeDefined();
    expect(screen.getByText(/Reporting Hierarchy/i)).toBeDefined();
  });

  it('renders ScopedOrgTree with all positions and occupant badges', () => {
    const onSelect = vi.fn();
    render(
      <ScopedOrgTree
        treeData={MOCK_ORG_TREE}
        onSelectNode={onSelect}
        title="Hospital Organization Hierarchy (Org Chart)"
      />
    );

    expect(screen.getByText('Hospital Organization Hierarchy (Org Chart)')).toBeDefined();
    expect(screen.getByText('Managing Director & Chief Spine Surgeon')).toBeDefined();
    expect(screen.getByText('Dr. Rohan Sharma')).toBeDefined();
  });

  it('renders Leader departmental scope tree correctly', () => {
    const leaderScopedTree = getScopedMockOrgTree('usr-dh-003', 'LEADER');
    render(
      <ScopedOrgTree
        treeData={leaderScopedTree}
        title="Departmental Scope & Reporting Hierarchy"
      />
    );

    expect(screen.getByText('Departmental Scope & Reporting Hierarchy')).toBeDefined();
    expect(screen.getByText('Head of Spine Surgery Department')).toBeDefined();
  });

  it('restricts Organization access for standard Stavyan role', async () => {
    render(
      <AuthProvider>
        <OrganizationPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Organization Access Restricted')).toBeDefined();
      expect(screen.getByText('Return to My Day')).toBeDefined();
    });
  });
});
