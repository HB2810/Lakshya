'use client';

import { STAVYA_STAFF_DATABASE, HospitalStaffMember } from './stavyaHospitalOrgData';

const STORAGE_KEY = 'stavya_hospital_org_data_v1';

type Listener = () => void;

class DynamicOrgStore {
  private staffMap: Record<string, HospitalStaffMember>;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.staffMap = { ...STAVYA_STAFF_DATABASE };
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          this.staffMap = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load org data from localStorage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.staffMap));
    } catch (e) {
      console.warn('Could not save org data to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in org store subscriber:', err);
      }
    });
  }

  public getStaffList(): HospitalStaffMember[] {
    return Object.values(this.staffMap);
  }

  public getStaffMap(): Record<string, HospitalStaffMember> {
    return { ...this.staffMap };
  }

  public getStaffById(id: string): HospitalStaffMember | undefined {
    return this.staffMap[id];
  }

  public getStaffByName(name: string): HospitalStaffMember | undefined {
    const lower = name.toLowerCase().trim();
    return Object.values(this.staffMap).find((s) => s.name.toLowerCase().trim() === lower);
  }

  /**
   * MD Action: Change Reporting Manager (Re-parents node in org tree)
   */
  public updateStaffSupervisor(staffId: string, newSupervisorName: string, reason?: string): boolean {
    const staff = this.staffMap[staffId];
    if (!staff) return false;
    this.staffMap[staffId] = {
      ...staff,
      reports: newSupervisorName.trim(),
      note: reason ? `${reason} (Reassigned: ${new Date().toLocaleDateString()})` : staff.note,
    };
    this.saveToStorage();
    return true;
  }

  /**
   * MD Action: Transfer Unit/Department & optionally update supervisor
   */
  public updateStaffUnit(staffId: string, newUnit: string, newSupervisorName?: string, reason?: string): boolean {
    const staff = this.staffMap[staffId];
    if (!staff) return false;
    this.staffMap[staffId] = {
      ...staff,
      unit: newUnit.trim(),
      reports: newSupervisorName !== undefined ? newSupervisorName.trim() : staff.reports,
      note: reason ? `${reason} (Transferred: ${new Date().toLocaleDateString()})` : staff.note,
    };
    this.saveToStorage();
    return true;
  }

  /**
   * MD Action: Edit Staff Position & Profile details
   */
  public updateStaffDetails(staffId: string, updates: Partial<HospitalStaffMember>): boolean {
    const staff = this.staffMap[staffId];
    if (!staff) return false;
    this.staffMap[staffId] = {
      ...staff,
      ...updates,
    };
    this.saveToStorage();
    return true;
  }

  /**
   * MD Action: Add New Hospital Staff / Position
   */
  public addStaffMember(newStaff: Omit<HospitalStaffMember, 'id'>): HospitalStaffMember {
    const newId = `usr-stav-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const fullStaff: HospitalStaffMember = {
      ...newStaff,
      id: newId,
    };
    this.staffMap[newId] = fullStaff;
    this.saveToStorage();
    return fullStaff;
  }

  /**
   * MD Action: Remove Staff Member / Position
   */
  public removeStaffMember(staffId: string): boolean {
    if (!this.staffMap[staffId]) return false;
    delete this.staffMap[staffId];
    this.saveToStorage();
    return true;
  }

  /**
   * Reset Org to Factory Baseline
   */
  public resetToDefault() {
    this.staffMap = { ...STAVYA_STAFF_DATABASE };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }
}

export const dynamicOrgStore = new DynamicOrgStore();
