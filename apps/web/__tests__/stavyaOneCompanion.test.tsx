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

  describe('4. Health Journal Component', () => {
    it('renders wellbeing sliders and health boundary safety disclaimer', () => {
      render(<HealthJournalView />);

      expect(screen.getByText(/Everyday Wellbeing/i)).toBeDefined();
      expect(screen.getByText(/Sleep Duration/i)).toBeDefined();
      expect(screen.getByText(/Daily Steps/i)).toBeDefined();
      expect(screen.getByText(/Water Intake/i)).toBeDefined();
      expect(screen.getByText(/Daily State of Mind/i)).toBeDefined();
      expect(screen.getByText(/Health Boundary Contract/i)).toBeDefined();

      // Change mood
      fireEvent.click(screen.getByRole('button', { name: 'Excellent' }));
      const updatedState = loadPrivateState();
      expect(updatedState.health.mood).toBe('Excellent');
    });
  });

  describe('5. Wealth & Budget Clarity Component', () => {
    it('renders budget remaining, savings progress, and number inputs', () => {
      render(<WealthBudgetView />);

      expect(screen.getByText(/Money Clarity/i)).toBeDefined();
      expect(screen.getByText(/Monthly Budget Left/i)).toBeDefined();
      expect(screen.getByText(/Annual Savings Target/i)).toBeDefined();
      expect(screen.getByText(/Financial Boundary Notice/i)).toBeDefined();

      // Update budget input
      const budgetInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(budgetInputs[0], { target: { value: '60000' } });

      const updatedState = loadPrivateState();
      expect(updatedState.wealth.monthlyBudget).toBe(60000);
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
    it('renders Stavya One brand and 3-tier navigation sections', () => {
      render(
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      );

      expect(screen.getByText(/Stavya One/i)).toBeDefined();
      expect(screen.getByText(/YOUR DAY/i)).toBeDefined();
      expect(screen.getByText(/PRIVATE SPACE/i)).toBeDefined();
      expect(screen.getByText(/HOSPITAL & GOVERNANCE/i)).toBeDefined();

      // Verify companion items in sidebar
      expect(screen.getByText('Ask One')).toBeDefined();
      expect(screen.getByText('Health')).toBeDefined();
      expect(screen.getByText('Wealth')).toBeDefined();
      expect(screen.getByText('Life')).toBeDefined();
      expect(screen.getByText('Privacy')).toBeDefined();
    });
  });
});
