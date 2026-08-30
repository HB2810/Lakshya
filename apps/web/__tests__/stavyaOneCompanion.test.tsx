import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  loadPrivateState,
  savePrivateState,
  clearPrivateState,
  exportPrivateState,
} from '../lib/services/privateVault';
import { stavyaGateway } from '../lib/services/stavyaGateway';
import { AskOneView } from '../components/companion/AskOneView';
import { HealthJournalView } from '../components/companion/HealthJournalView';
import { WealthBudgetView } from '../components/companion/WealthBudgetView';
import { LifeGoalsView } from '../components/companion/LifeGoalsView';
import { PrivacyCentreView } from '../components/companion/PrivacyCentreView';
import { Sidebar } from '../components/layout/Sidebar';
import { AuthProvider } from '../lib/auth/AuthContext';
import { StavyaOneLogo } from '../components/brand/StavyaOneLogo';
import { InteractiveTrainingView } from '../components/training/InteractiveTrainingView';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/overview',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Stavya One Companion & Private Vault Architecture Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Private Vault Service & Storage Boundary', () => {
    it('loads default private state when localStorage is empty', () => {
      const state = loadPrivateState();
      expect(state.health.sleepHours).toBeGreaterThan(0);
      expect(state.wealth.monthlyBudget).toBeGreaterThan(0);
      expect(state.lifeGoals.length).toBeGreaterThan(0);
      expect(state.personalTasks.length).toBeGreaterThan(0);
    });

    it('persists and reloads updated private state safely', () => {
      const state = loadPrivateState();
      state.health.sleepHours = 8.5;
      state.wealth.spent = 25000;
      savePrivateState(state);

      const reloaded = loadPrivateState();
      expect(reloaded.health.sleepHours).toBe(8.5);
      expect(reloaded.wealth.spent).toBe(25000);
    });

    it('clears private state on user demand', () => {
      const state = loadPrivateState();
      state.health.waterGlasses = 12;
      savePrivateState(state);
      expect(localStorage.getItem('stavya-one-private-v1')).toBeDefined();

      clearPrivateState();
      expect(localStorage.getItem('stavya-one-private-v1')).toBeNull();
    });

    it('exports private state as JSON blob without throwing', () => {
      const state = loadPrivateState();
      expect(() => exportPrivateState(state)).not.toThrow();
    });
  });

  describe('2. Stavya Gateway Work Boundary', () => {
    it('fetches employee work snapshot from work gateway', async () => {
      const snapshot = await stavyaGateway.getMyWorkSnapshot();
      expect(snapshot.employee.displayName).toBeDefined();
      expect(snapshot.tasks.length).toBeGreaterThan(0);
      expect(snapshot.decisions.length).toBeGreaterThan(0);
      expect(snapshot.shift.time).toBeDefined();
    });

    it('submits work decision responses with immutable status outcome', async () => {
      const updated = await stavyaGateway.submitDecision('DEC-201', 'approved');
      expect(updated.id).toBe('DEC-201');
      expect(updated.status).toBe('approved');
    });

    it('proves private health/wealth data does not exist in work snapshot', async () => {
      const snapshot = await stavyaGateway.getMyWorkSnapshot();
      expect((snapshot as any).health).toBeUndefined();
      expect((snapshot as any).wealth).toBeUndefined();
      expect((snapshot as any).lifeGoals).toBeUndefined();
    });
  });

  describe('3. Ask One AI Companion Component', () => {
    it('renders Ask One with initial greeting and quick action pills', () => {
      render(
        <AuthProvider>
          <AskOneView />
        </AuthProvider>
      );

      expect(screen.getAllByText(/Ask One/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Private Vault Active/i)).toBeDefined();
      expect(screen.getByText(/Check my pending leave & shift/i)).toBeDefined();
      expect(screen.getByText(/Review my assigned NABH & RACI tasks/i)).toBeDefined();
    });

    it('responds to user questions and suggests relevant platform navigation', () => {
      render(
        <AuthProvider>
          <AskOneView />
        </AuthProvider>
      );

      const input = screen.getByPlaceholderText(/Ask about hospital policies/i);
      fireEvent.change(input, { target: { value: 'What is my current shift and leave status?' } });

      const sendBtn = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendBtn);

      expect(screen.getByText(/Your work profile currently shows active General Duty/i)).toBeDefined();
      expect(screen.getByText(/Go to My Work/i)).toBeDefined();
    });
  });

  describe('4. Health Journal & Wearable Device Sync Component', () => {
    it('renders wellbeing sliders, device integrations, and health privacy disclaimer', () => {
      render(<HealthJournalView />);

      expect(screen.getByText(/Everyday Wellbeing/i)).toBeDefined();
      expect(screen.getByText(/Link Smart Devices & Wearables/i)).toBeDefined();
      expect(screen.getAllByText(/Apple Health/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Samsung Health/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Google Health Connect/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Resting Heart Rate/i)).toBeDefined();
      expect(screen.getByText(/Zero-Cloud Wearable Privacy Pass/i)).toBeDefined();

      // Change mood
      fireEvent.click(screen.getByRole('button', { name: 'Excellent' }));
      const updatedState = loadPrivateState();
      expect(updatedState.health.mood).toBe('Excellent');
    });

    it('connects and disconnects wearable device providers', () => {
      render(<HealthJournalView />);

      const connectBtns = screen.getAllByRole('button', { name: /Connect|Linked/i });
      expect(connectBtns.length).toBeGreaterThanOrEqual(4);

      // Toggle Samsung Health connect
      fireEvent.click(connectBtns[1]);
      const updated = loadPrivateState();
      expect(updated.health.connectedDevices[1].connected).toBe(true);
    });

    it('triggers wearable device sync action and updates metrics in local vault', async () => {
      render(<HealthJournalView />);

      const syncBtn = screen.getByRole('button', { name: /Sync Devices/i });
      fireEvent.click(syncBtn);

      await waitFor(() => {
        expect(screen.getByText(/Synced latest biometric metrics from Apple/i)).toBeDefined();
      });
    });
  });

  describe('5. Wealth & Budget Clarity Component', () => {
    it('renders budget remaining, savings progress, 1-tap loggers and 50/30/20 guide', () => {
      render(<WealthBudgetView />);

      expect(screen.getByText(/Simple Personal Budget/i)).toBeDefined();
      expect(screen.getByText(/1-Tap Quick Expense Logger/i)).toBeDefined();
      expect(screen.getByText(/Monthly Budget Left/i)).toBeDefined();
      expect(screen.getAllByText(/Annual Savings Goal/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/50 \/ 30 \/ 20 Simplified Rhythm Guide/i)).toBeDefined();
      expect(screen.getByText(/Zero-Bank-Link Financial Privacy/i)).toBeDefined();

      // Tap quick expense button
      const snackBtn = screen.getByRole('button', { name: /\+₹100 \(Snack\/Tea\)/i });
      fireEvent.click(snackBtn);

      const updated = loadPrivateState();
      expect(updated.wealth.spent).toBeGreaterThan(19800);
    });
  });

  describe('6. Life Goals & Habits Component', () => {
    it('renders personal rhythm ring, habit checklist, and allows adding private reminders', () => {
      render(<LifeGoalsView />);

      expect(screen.getByText(/Life Beyond Work/i)).toBeDefined();
      expect(screen.getByText(/Weekly Personal Rhythm/i)).toBeDefined();
      expect(screen.getByText(/My Personal Rhythm/i)).toBeDefined();

      // Add a private reminder
      const reminderInput = screen.getByPlaceholderText(/Add a private personal reminder/i);
      fireEvent.change(reminderInput, { target: { value: 'Buy ergonomic spine lumbar support' } });

      const addBtn = screen.getByRole('button', { name: 'Add' });
      fireEvent.click(addBtn);

      expect(screen.getByText(/Buy ergonomic spine lumbar support/i)).toBeDefined();
    });
  });

  describe('7. Privacy Control Centre Component', () => {
    it('renders dual-zone architecture map and data management controls', () => {
      render(<PrivacyCentreView />);

      expect(screen.getByText(/Your Privacy & Data Boundary/i)).toBeDefined();
      expect(screen.getByText(/LANE 1: PERSONAL VAULT/i)).toBeDefined();
      expect(screen.getByText(/LANE 2: STAVYA WORKSPACE/i)).toBeDefined();
      expect(screen.getByText(/Export My Private Data/i)).toBeDefined();
      expect(screen.getByText(/Clear Personal Vault/i)).toBeDefined();
    });
  });

  describe('8. Sidebar Navigation & Branding', () => {
    it('renders StavyaOne brand logo and 3-tier navigation sections', () => {
      render(
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      );

      expect(screen.getByText('Stavya')).toBeDefined();
      expect(screen.getByText('One')).toBeDefined();
      expect(screen.getByText(/YOUR DAY/i)).toBeDefined();
      expect(screen.getByText(/PRIVATE SPACE/i)).toBeDefined();
      expect(screen.getByText(/HOSPITAL & GOVERNANCE/i)).toBeDefined();

      // Verify companion items in sidebar
      expect(screen.getByText('Ask One')).toBeDefined();
      expect(screen.getByText('Health')).toBeDefined();
      expect(screen.getByText('Wealth')).toBeDefined();
      expect(screen.getByText('Life')).toBeDefined();
      expect(screen.getByText('Privacy')).toBeDefined();
      expect(screen.getByText('Training & Guide')).toBeDefined();
    });
  });

  describe('9. StavyaOneLogo Component Variants', () => {
    it('renders full, compact, and mark logo variants with custom sizes', () => {
      const { rerender } = render(<StavyaOneLogo variant="full" size="xl" showSubtitle={true} />);
      expect(screen.getByText('Stavya')).toBeDefined();
      expect(screen.getByText('One')).toBeDefined();
      expect(screen.getByText(/Operating System/i)).toBeDefined();

      rerender(<StavyaOneLogo variant="compact" size="sm" showSubtitle={false} />);
      expect(screen.getByText('Stavya')).toBeDefined();
      expect(screen.getByText('One')).toBeDefined();
      expect(screen.queryByText(/Operating System/i)).toBeNull();

      rerender(<StavyaOneLogo variant="mark" size="md" />);
      expect(screen.queryByText('Stavya')).toBeNull();
    });
  });

  describe('10. Interactive Training & Platform Tutorial Hub', () => {
    it('renders StavyaOne Academy with Two-Track curriculum and progress tracker', () => {
      render(<InteractiveTrainingView />);

      expect(screen.getByText(/STAVYAONE ACADEMY/i)).toBeDefined();
      expect(screen.getByText(/Platform Training & Tutorial/i)).toBeDefined();
      expect(screen.getByText(/Track 1: Stavya Work/i)).toBeDefined();
      expect(screen.getByText(/Track 2: Personal Life/i)).toBeDefined();

      // Verify module rendering
      expect(screen.getByText(/1. Navigating My Day & Next Action Spotlight/i)).toBeDefined();
      expect(screen.getByText(/6. Ask One AI Companion for Work & Life/i)).toBeDefined();
      expect(screen.getByText(/7. Everyday Wellbeing & Wearable Device Sync/i)).toBeDefined();
      expect(screen.getByText(/8. Money Clarity & 1-Click Budgeting/i)).toBeDefined();
    });

    it('filters curriculum by work and personal tracks', () => {
      render(<InteractiveTrainingView />);

      const workTab = screen.getByRole('button', { name: /Track 1: Stavya Work/i });
      fireEvent.click(workTab);

      expect(screen.getByText(/1. Navigating My Day/i)).toBeDefined();
      expect(screen.queryByText(/6. Ask One AI Companion for Work & Life/i)).toBeNull();
    });
  });
});
