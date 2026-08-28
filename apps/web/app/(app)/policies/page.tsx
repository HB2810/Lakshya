'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  ShieldCheck,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  Sparkles,
  Eye,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { PolicySOPItem, PolicyCategory } from '../../../types/policy';
import { policyStore } from '../../../lib/mocks/policyMock';
import { useAuth } from '../../../lib/auth/AuthContext';

const CATEGORY_LABELS: Record<PolicyCategory | 'ALL', string> = {
  ALL: 'All Policies & SOPs',
  SURGICAL_OT: 'Surgical & OT',
  INFECTION_CONTROL: 'Infection Control',
  CLINICAL_PROTOCOL: 'Clinical Protocols',
  NURSING: 'Nursing & Wards',
  IT_DATA_SECURITY: 'IT & Data Security',
  BIOMEDICAL_SAFETY: 'Biomedical Safety',
  ADMINISTRATIVE: 'Administrative & HR',
};

export default function PoliciesPage() {
  const { user, can } = useAuth();
  const isAuthor = can('dashboard.md.read') || user.role === 'ADMIN' || user.role === 'MANAGING_DIRECTOR';
  const [policies, setPolicies] = useState<PolicySOPItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPolicyForView, setSelectedPolicyForView] = useState<PolicySOPItem | null>(null);

  // New SOP Form State
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PolicyCategory>('SURGICAL_OT');
  const [newDepartment, setNewDepartment] = useState('Spine Surgery & OT');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newSummary, setNewSummary] = useState('');
  const [newGuideline1, setNewGuideline1] = useState('');
  const [newGuideline2, setNewGuideline2] = useState('');
  const [isNABH, setIsNABH] = useState(true);

  const refreshData = () => {
    setPolicies([...policyStore.getPolicies()]);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = policyStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const guidelines = [newGuideline1, newGuideline2].filter(g => g.trim().length > 0);

    policyStore.addPolicy({
      code: newCode.trim() || `SOP-STV-${String(policies.length + 1).padStart(3, '0')}`,
      title: newTitle.trim(),
      category: newCategory,
      department: newDepartment.trim(),
      version: newVersion.trim() || 'v1.0',
      contentSummary: newSummary.trim() || 'Standard operating protocol approved for Stavya Spine Hospital.',
      keyGuidelines: guidelines.length > 0 ? guidelines : ['Mandatory hospital compliance required.'],
      isNABHMandatory: isNABH,
    });

    setShowAddModal(false);
    setNewCode('');
    setNewTitle('');
    setNewSummary('');
    setNewGuideline1('');
    setNewGuideline2('');
  };

  const filteredPolicies = policies.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contentSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const nabhCount = policies.filter(p => p.isNABHMandatory).length;
  const activeCount = policies.filter(p => p.status === 'ACTIVE').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. POLICIES & SOPS EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Clinical Governance & NABH Protocols
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Stavya Spine Hospital
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Hospital Policies & Standard Operating Procedures (SOPs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative clinical protocols, surgical safety checklists, and institutional governance guidelines.
          </p>
        </div>

        {isAuthor && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload / Author New SOP</span>
          </button>
        )}
      </div>

      {/* 2. STATS PILL ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Protocols</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{policies.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Approved library</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">NABH Mandatory</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">{nabhCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">100% compliant</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Active In Effect</p>
          <p className="text-2xl font-black text-blue-600 mt-0.5">{activeCount}</p>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Operational</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Annual Audit Cycle</p>
          <p className="text-2xl font-black text-purple-600 mt-0.5">2026-27</p>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Up to date</p>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by policy title, SOP code, keyword, or department..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 shrink-0">
            Showing {filteredPolicies.length} of {policies.length} documents
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              'ALL',
              'SURGICAL_OT',
              'INFECTION_CONTROL',
              'CLINICAL_PROTOCOL',
              'NURSING',
              'IT_DATA_SECURITY',
              'BIOMEDICAL_SAFETY',
            ] as const
          ).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* 4. POLICIES & SOPS DOCUMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.map(sop => (
          <div
            key={sop.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {sop.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {sop.version}
                  </span>
                </div>

                {sop.isNABHMandatory && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    NABH Mandatory
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {sop.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {sop.contentSummary}
              </p>

              {/* Key Guidelines Bullet Points */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Key Operational Directives:
                </p>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  {sop.keyGuidelines.map((guideline, idx) => (
                    <li key={idx} className="leading-tight">
                      {guideline}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card Footer: Metadata & Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="space-y-0.5">
                <p className="text-[11px]">
                  Dept: <strong className="text-slate-800">{sop.department}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  Review: {sop.reviewDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPolicyForView(sop)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. MODAL: VIEW POLICY DETAILS */}
      {selectedPolicyForView && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedPolicyForView.code} ({selectedPolicyForView.version})
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedPolicyForView.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPolicyForView(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Summary Scope</p>
                <p className="text-slate-700 leading-relaxed mt-0.5">{selectedPolicyForView.contentSummary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Author</span>
                  <p className="font-bold text-slate-800">{selectedPolicyForView.author}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Approver</span>
                  <p className="font-bold text-slate-800">{selectedPolicyForView.approver}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Effective Date</span>
                  <p className="font-mono text-slate-800">{selectedPolicyForView.effectiveDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Next Review</span>
                  <p className="font-mono text-slate-800">{selectedPolicyForView.reviewDate}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mandatory Guidelines</p>
                <ul className="mt-1 space-y-1 list-disc pl-4 text-slate-800">
                  {selectedPolicyForView.keyGuidelines.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPolicyForView(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD / AUTHOR NEW SOP */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload / Author Hospital SOP</h3>
                <p className="text-xs text-slate-500">Register standard protocol into institutional governance.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    SOP Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="e.g. SOP-SPINE-OT-03"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={e => setNewVersion(e.target.value)}
                    placeholder="e.g. v1.0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Policy / SOP Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Spine OT Sterile Drape & Laminar Airflow Protocol"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as PolicyCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="SURGICAL_OT">Surgical & OT</option>
                    <option value="INFECTION_CONTROL">Infection Control</option>
                    <option value="CLINICAL_PROTOCOL">Clinical Protocols</option>
                    <option value="NURSING">Nursing & Wards</option>
                    <option value="IT_DATA_SECURITY">IT & Data Security</option>
                    <option value="BIOMEDICAL_SAFETY">Biomedical Safety</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    placeholder="e.g. Spine Surgery / OT"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Scope Summary
                </label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Explain the clinical or operational intent of this SOP..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Key Directive #1
                </label>
                <input
                  type="text"
                  value={newGuideline1}
                  onChange={e => setNewGuideline1(e.target.value)}
                  placeholder="Mandatory directive 1..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Key Directive #2
                </label>
                <input
                  type="text"
                  value={newGuideline2}
                  onChange={e => setNewGuideline2(e.target.value)}
                  placeholder="Mandatory directive 2..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nabhCheck"
                  checked={isNABH}
                  onChange={e => setIsNABH(e.target.checked)}
                  className="rounded text-slate-900"
                />
                <label htmlFor="nabhCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mandatory for NABH Hospital Accreditation Audit
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Policy to Governance Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
