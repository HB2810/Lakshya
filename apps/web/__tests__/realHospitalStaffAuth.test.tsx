import { describe, it, expect } from 'vitest';
import {
  hospitalStaffAuthStore,
  DEFAULT_HOSPITAL_PASSWORD,
} from '../lib/auth/hospitalStaffAuth';
import { STAVYA_STAFF_DATABASE } from '../lib/data/stavyaHospitalOrgData';

describe('LAKSHYA 214 Real Hospital Staff Authentication Suite', () => {
  it('initializes all 214 real employee accounts from the hospital database', () => {
    const accounts = hospitalStaffAuthStore.getAllAccounts();
    expect(accounts.length).toBe(214);
  });

  describe('1. Key Governance Leadership Logins', () => {
    it('authenticates Managing Director Dr. Mirant Bharat Dave by code, email, and name', () => {
      // 1. By Code
      const byCode = hospitalStaffAuthStore.authenticate('STAVYA-001', DEFAULT_HOSPITAL_PASSWORD);
      expect(byCode.name).toContain('Dr. Mirant');
      expect(byCode.role).toBe('MANAGING_DIRECTOR');
      expect(byCode.tier).toBe('GOVERNANCE');

      // 2. By Email
      const byEmail = hospitalStaffAuthStore.authenticate('mirant@stavyaspine.com', '1234');
      expect(byEmail.id).toBe(byCode.id);

      // 3. By Name
      const byName = hospitalStaffAuthStore.authenticate('Dr. Mirant Bharat Dave', DEFAULT_HOSPITAL_PASSWORD);
      expect(byName.id).toBe(byCode.id);
    });

    it('authenticates Founder & Chairman Dr. Bharat Rajendraprasad Dave', () => {
      const byName = hospitalStaffAuthStore.authenticate('Dr. Bharat Rajendraprasad Dave', DEFAULT_HOSPITAL_PASSWORD);
      expect(byName.role).toBe('MASTER');
      expect(byName.tier).toBe('GOVERNANCE');
    });

    it('authenticates Co-Founder Amita Bharat Dave', () => {
      const account = hospitalStaffAuthStore.authenticate('Amita Bharat Dave', DEFAULT_HOSPITAL_PASSWORD);
      expect(account.role).toBe('MASTER');
      expect(account.tier).toBe('GOVERNANCE');
    });

    it('authenticates Director of Quality Dr. Akruti Mirant Dave', () => {
      const account = hospitalStaffAuthStore.authenticate('Dr. Akruti Mirant Dave', DEFAULT_HOSPITAL_PASSWORD);
      expect(account.role).toBe('DIRECTOR_QUALITY');
      expect(account.tier).toBe('GOVERNANCE');
    });

    it('authenticates MD Office Lead Het Bhatt', () => {
      const account = hospitalStaffAuthStore.authenticate('Het Hasmukhkumar Bhatt', DEFAULT_HOSPITAL_PASSWORD);
      expect(account.role).toBe('MD_OFFICE');
      expect(account.tier).toBe('GOVERNANCE');
    });
  });

  describe('2. Frontline Employees & Operational Staff Logins', () => {
    it('authenticates every single one of the 214 hospital staff members by their unique Staff ID with default password', () => {
      const rawStaffList = Object.values(STAVYA_STAFF_DATABASE);

      rawStaffList.forEach((staff) => {
        const authResult = hospitalStaffAuthStore.authenticate(staff.id, DEFAULT_HOSPITAL_PASSWORD);
        expect(authResult).toBeDefined();
        expect(authResult.name).toBe(staff.name);
        expect(authResult.departmentName).toBeDefined();
        expect(authResult.designation).toBeDefined();
        expect(authResult.loginId).toBeDefined();
      });
    });

    it('authenticates staff by numeric code variations and raw IDs', () => {
      const sample = hospitalStaffAuthStore.authenticate('113', '1234');
      expect(sample).toBeDefined();

      const byRawId = hospitalStaffAuthStore.authenticate('e000', DEFAULT_HOSPITAL_PASSWORD);
      expect(byRawId).toBeDefined();
    });
  });

  describe('3. Search and Tier Filtering', () => {
    it('filters staff by tier correctly', () => {
      const governance = hospitalStaffAuthStore.getAccountsByTier('GOVERNANCE');
      expect(governance.length).toBeGreaterThanOrEqual(4);

      const champions = hospitalStaffAuthStore.searchAccounts('', 'CHAMPIONS');
      expect(champions.length).toBe(7);
      expect(champions.some(c => c.chapterAssigned === 'AAC & IMS')).toBe(true);
    });

    it('searches staff by keyword', () => {
      const results = hospitalStaffAuthStore.searchAccounts('Biomedical');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.toLowerCase().includes('priyesh') || r.departmentName.toLowerCase().includes('biomedical') || r.designation.toLowerCase().includes('biomedical'))).toBe(true);
    });
  });

  describe('4. Password Validation and Management', () => {
    it('rejects invalid passwords', () => {
      expect(() => {
        hospitalStaffAuthStore.authenticate('STAVYA-001', 'wrong_password_999');
      }).toThrow(/Invalid credentials/);
    });

    it('allows updating employee password', () => {
      const account = hospitalStaffAuthStore.authenticate('STAVYA-113', DEFAULT_HOSPITAL_PASSWORD);
      hospitalStaffAuthStore.updatePassword(account.id, 'NewSecurePass@2026');

      const reauth = hospitalStaffAuthStore.authenticate(account.id, 'NewSecurePass@2026');
      expect(reauth).toBeDefined();
      expect(reauth.password).toBe('NewSecurePass@2026');
    });
  });
});
