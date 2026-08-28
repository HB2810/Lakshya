import { describe, it, expect } from 'vitest';
import { policyStore } from '../lib/mocks/policyMock';

describe('LAKSHYA Hospital Policies & SOPs Governance Hub Suite', () => {
  it('loads the default active clinical and NABH policies', () => {
    const policies = policyStore.getPolicies();
    expect(policies.length).toBeGreaterThanOrEqual(5);

    const surgicalSop = policies.find(p => p.category === 'SURGICAL_OT');
    expect(surgicalSop).toBeDefined();
    expect(surgicalSop?.isNABHMandatory).toBe(true);
    expect(surgicalSop?.keyGuidelines.length).toBeGreaterThan(0);
  });

  it('creates and attaches a new SOP to institutional governance', () => {
    const initialCount = policyStore.getPolicies().length;

    const created = policyStore.addPolicy({
      code: 'SOP-SPINE-OT-99',
      title: 'Emergency Intra-Op Spine Cord Monitoring Alarm Protocol',
      category: 'SURGICAL_OT',
      department: 'Spine Surgery & Neuro-Physiology',
      version: 'v1.0',
      contentSummary: 'Standardized action tree when intra-operative evoked potentials drop by > 50%.',
      keyGuidelines: [
        'Immediate surgeon alert and blood pressure elevation to MAP > 85 mmHg',
        'Verify pedicle screw placement with intra-op 3D C-arm fluoroscopy',
      ],
      isNABHMandatory: true,
    });

    expect(created.id).toBeDefined();
    expect(policyStore.getPolicies().length).toBe(initialCount + 1);
    expect(created.code).toBe('SOP-SPINE-OT-99');
    expect(created.status).toBe('ACTIVE');
  });
});
