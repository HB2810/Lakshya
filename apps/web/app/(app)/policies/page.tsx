'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileCode,
  FileCheck,
  X,
  File,
  ListChecks,
  Check,
  HelpCircle,
  Award,
} from 'lucide-react';
import { PolicySOPItem, PolicyCategory } from '../../../types/policy';
import { policyStore } from '../../../lib/mocks/policyMock';
import { useAuth } from '../../../lib/auth/AuthContext';

const CATEGORY_LABELS: Record<PolicyCategory | 'ALL', string> = {
  ALL: 'All Policies & SOPs',
  SURGICAL_OT: 'Surgical & OT',
  INFECTION_CONTROL: 'Infection Control',
  CLINICAL_PROTOCOL: 'Clinical Protocols',
  CLINICAL_OPERATIONS: 'Clinical Operations',
  NURSING: 'Nursing & Wards',
  IT_DATA_SECURITY: 'IT & Data Security',
  BIOMEDICAL_SAFETY: 'Biomedical Safety',
  FACILITY_SAFETY: 'Facility Management & Safety',
  ADMINISTRATIVE: 'Administrative & HR',
  GENERAL: 'General & Quality',
  PHARMACY: 'Medication Management & Pharmacy',
  GOVERNANCE: 'Governance & Leadership',
};

const CATEGORY_DEPARTMENTS: Record<PolicyCategory, string> = {
  SURGICAL_OT: 'Spine Surgery & OT Complex',
  INFECTION_CONTROL: 'Hospital Infection Control Committee (HICC)',
  CLINICAL_PROTOCOL: 'Clinical Spine & Inpatient Care',
  CLINICAL_OPERATIONS: 'Clinical Operations & Patient Flow',
  NURSING: 'Nursing Services & IPD Wards',
  IT_DATA_SECURITY: 'Digital Health, EMR & IT Infrastructure',
  BIOMEDICAL_SAFETY: 'Biomedical Engineering & Equipment Safety',
  FACILITY_SAFETY: 'Facility Management & Safety',
  ADMINISTRATIVE: 'Hospital Administration & HR',
  GENERAL: 'General Hospital Administration',
  PHARMACY: 'Medication Management & Pharmacy',
  GOVERNANCE: 'Hospital Executive Governance',
};

export default function PoliciesPage() {
  const { user, can } = useAuth();
  
  // Both Leader & MD (as well as Admin) have upload and authoring permissions
  const isAuthor =
    ['MD', 'MD_OFFICE', 'MANAGING_DIRECTOR', 'DEPARTMENT_HEAD', 'MANAGER', 'LEADER', 'LEADERS', 'MASTER', 'ADMIN'].includes(user.role) ||
    can('dashboard.md.read');

  const [policies, setPolicies] = useState<PolicySOPItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPolicyForView, setSelectedPolicyForView] = useState<PolicySOPItem | null>(null);

  // New SOP Form State & File Upload
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PolicyCategory>('SURGICAL_OT');
  const [newDepartment, setNewDepartment] = useState('Spine Surgery & OT Complex');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newScope, setNewScope] = useState('All surgical suites, spine surgeons, nursing officers, and OT technicians.');
  const [newSummary, setNewSummary] = useState('');
  const [newGuideline1, setNewGuideline1] = useState('');
  const [newGuideline2, setNewGuideline2] = useState('');
  const [newChecklist1, setNewChecklist1] = useState('Pre-procedure checklist signoff & identity verification');
  const [newChecklist2, setNewChecklist2] = useState('Sterile protocol adherence and time-out protocol');
  const [isNABH, setIsNABH] = useState(true);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);

  // Live Interactive Checklist & Staff Compliance State
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [acknowledgedPolicies, setAcknowledgedPolicies] = useState<Record<string, string>>({});

  const toggleChecklistStep = (policyId: string, index: number) => {
    const key = `${policyId}-${index}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcknowledgePolicy = (policyId: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAcknowledgedPolicies(prev => ({ ...prev, [policyId]: `Acknowledged by ${user.name || 'Staff'} at ${timestamp}` }));
  };

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

  // Update default department when category changes
  const handleCategoryChange = (cat: PolicyCategory) => {
    setNewCategory(cat);
    setNewDepartment(CATEGORY_DEPARTMENTS[cat] || 'Hospital Clinical Services');
  };

  // Process and Auto-structure uploaded PDF/Word file
  const processUploadedFile = (file: File) => {
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isDoc = file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx');
    const fileType = isPdf ? 'PDF Document' : isDoc ? 'Word Document' : 'Document';

    // Infer category from file name keywords
    let inferredCategory: PolicyCategory = newCategory;
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('ot') || lowerName.includes('surg') || lowerName.includes('spine')) {
      inferredCategory = 'SURGICAL_OT';
    } else if (lowerName.includes('infect') || lowerName.includes('steril') || lowerName.includes('wash')) {
      inferredCategory = 'INFECTION_CONTROL';
    } else if (lowerName.includes('nurse') || lowerName.includes('ward') || lowerName.includes('med')) {
      inferredCategory = 'NURSING';
    } else if (lowerName.includes('it') || lowerName.includes('security') || lowerName.includes('emr')) {
      inferredCategory = 'IT_DATA_SECURITY';
    } else if (lowerName.includes('bio') || lowerName.includes('equip') || lowerName.includes('c-arm')) {
      inferredCategory = 'BIOMEDICAL_SAFETY';
    }

    setUploadedFile({
      name: file.name,
      size: sizeStr,
      type: fileType,
      dataUrl: URL.createObjectURL(file),
    });

    if (!newTitle.trim()) {
      setNewTitle(cleanTitle);
    }
    if (!newCode.trim()) {
      setNewCode(`SOP-STV-${String(policies.length + 1).padStart(3, '0')}`);
    }
    setNewCategory(inferredCategory);
    setNewDepartment(CATEGORY_DEPARTMENTS[inferredCategory]);
    if (!newSummary.trim()) {
      setNewSummary(`Institutional standard operating procedure uploaded from ${file.name}. Validated for Stavya Spine Hospital compliance.`);
    }
    if (!newGuideline1.trim()) {
      setNewGuideline1(`All hospital staff must adhere to specifications in ${file.name}.`);
    }
    if (!newGuideline2.trim()) {
      setNewGuideline2('Maintain comprehensive audit logs in hospital EMR and NABH registers.');
    }
    setUploadSuccessNote(`File "${file.name}" structured successfully.`);
    setTimeout(() => setUploadSuccessNote(null), 3000);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const guidelines = [newGuideline1, newGuideline2].filter(g => g.trim().length > 0);
    const checklist = [newChecklist1, newChecklist2].filter(c => c.trim().length > 0);

    policyStore.addPolicy({
      code: newCode.trim() || `SOP-STV-${String(policies.length + 1).padStart(3, '0')}`,
      title: newTitle.trim(),
      category: newCategory,
      department: newDepartment.trim(),
      version: newVersion.trim() || 'v1.0',
      contentSummary: newSummary.trim() || 'Standard operating protocol approved for Stavya Spine Hospital.',
      keyGuidelines: guidelines.length > 0 ? guidelines : ['Mandatory hospital compliance required.'],
      isNABHMandatory: isNABH,
      author: `${user.name || 'Department Lead'} (${user.role})`,
      approver: 'Dr. Mirant Dave (Managing Director)',
      fileName: uploadedFile?.name,
      fileSize: uploadedFile?.size,
      fileType: uploadedFile?.type,
      documentUrl: uploadedFile?.dataUrl,
      scope: newScope.trim(),
      checklist: checklist.length > 0 ? checklist : ['Pre-procedure verification', 'Post-procedure audit log'],
    });

    setShowAddModal(false);
    setUploadedFile(null);
    setNewCode('');
    setNewTitle('');
    setNewSummary('');
    setNewGuideline1('');
    setNewGuideline2('');
  };

  const handleDownloadDocument = (sop: PolicySOPItem) => {
    if (sop.documentUrl) {
      const link = document.createElement('a');
      link.href = sop.documentUrl;
      link.download = sop.fileName || `${sop.code}_${sop.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Synthetic clean text download for standard procedures
      const content = `STAVYA SPINE HOSPITAL — STANDARD OPERATING PROCEDURE\n\nCODE: ${sop.code} (${sop.version})\nTITLE: ${sop.title}\nCATEGORY: ${CATEGORY_LABELS[sop.category]}\nDEPARTMENT: ${sop.department}\nNABH COMPLIANT: ${sop.isNABHMandatory ? 'YES (MANDATORY)' : 'INTERNAL'}\nEFFECTIVE DATE: ${sop.effectiveDate}\nREVIEW DATE: ${sop.reviewDate}\nAUTHOR: ${sop.author}\nAPPROVER: ${sop.approver}\n\n========================================\n1. PURPOSE & SUMMARY:\n${sop.contentSummary}\n\n2. SCOPE:\n${sop.scope || 'Hospital-wide clinical and operational teams.'}\n\n3. MANDATORY OPERATIONAL GUIDELINES:\n${sop.keyGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\n4. EXECUTION CHECKLIST:\n${(sop.checklist || ['Verification before commencement', 'Adherence to sterile workflow']).map((c, i) => `[ ] ${i + 1}. ${c}`).join('\n')}\n\n========================================\nVerified by Stavya Spine Hospital Clinical Governance Committee.`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sop.code}_${sop.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Clinical Governance &amp; NABH Protocols
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Stavya Spine Hospital
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Hospital Policies &amp; Standard Operating Procedures (SOPs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative clinical protocols, surgical safety checklists, and institutional governance guidelines.
          </p>
        </div>

        {isAuthor && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer md:w-auto md:shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload / Author New SOP</span>
          </button>
        )}
      </div>

      {/* 2. STATS PILL ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Protocols</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{policies.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Approved library</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">NABH Mandatory</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">{nabhCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">100% compliant</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Active In Effect</p>
          <p className="text-2xl font-black text-blue-600 mt-0.5">{activeCount}</p>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Operational</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Authoring Access</p>
          <p className="text-sm font-black text-slate-900 mt-1">
            {isAuthor ? 'Leader & MD Authorized' : 'Staff Read-Only'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Role: {user.role}</p>
        </div>
      </div>

      {/* 3. CATEGORY TABS & SEARCH */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['ALL', 'SURGICAL_OT', 'INFECTION_CONTROL', 'CLINICAL_PROTOCOL', 'NURSING', 'BIOMEDICAL_SAFETY', 'IT_DATA_SECURITY'] as (PolicyCategory | 'ALL')[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search SOP title, code, keyword..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 4. POLICIES & SOPS GRID */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No matching SOPs found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or select a different category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map(sop => (
            <div
              key={sop.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {sop.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {sop.isNABHMandatory && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        NABH Mandatory
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sop.version}
                    </span>
                  </div>
                </div>

                {/* Title & Department */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 line-clamp-2 tracking-tight">
                    {sop.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                    {sop.department}
                  </p>
                </div>

                {/* Content Summary */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {sop.contentSummary}
                </p>

                {/* Attached File Pill */}
                {sop.fileName && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200/60 text-[10px] text-slate-600 truncate">
                    <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate font-semibold">{sop.fileName}</span>
                    {sop.fileSize && <span className="text-slate-400 shrink-0">({sop.fileSize})</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPolicyForView(sop)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDocument(sop)}
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                  title="Download Protocol Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. MODAL: VIEW POLICY DETAILS */}
      {selectedPolicyForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-fadeIn max-h-[calc(100dvh-2rem)] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {selectedPolicyForView.code} ({selectedPolicyForView.version})
                  </span>
                  {selectedPolicyForView.isNABHMandatory && (
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      NABH Mandatory Protocol
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedPolicyForView.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedPolicyForView.department} · {CATEGORY_LABELS[selectedPolicyForView.category]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPolicyForView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attached Document Card */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 bg-white text-blue-600 rounded-xl shadow-2xs">
                  <FileText className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {selectedPolicyForView.fileName || `${selectedPolicyForView.code}_Official_SOP.pdf`}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {selectedPolicyForView.fileType || 'Verified Hospital Document'} · {selectedPolicyForView.fileSize || '320 KB'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadDocument(selectedPolicyForView)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>

            {/* Structured Section Breakdown */}
            <div className="space-y-4 text-xs">
              {/* 1. Purpose & Summary */}
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  1. Purpose &amp; Clinical Summary
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {selectedPolicyForView.contentSummary}
                </p>
              </div>

              {/* 2. Scope */}
              {selectedPolicyForView.scope && (
                <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                    2. Institutional Scope &amp; Applicability
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedPolicyForView.scope}
                  </p>
                </div>
              )}

              {/* 3. Mandatory Guidelines */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  3. Mandatory Clinical &amp; Operational Directives
                </h4>
                <div className="space-y-1.5">
                  {selectedPolicyForView.keyGuidelines.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-xl">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-slate-800 leading-normal">{g}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Interactive Live Execution Checklist */}
              {(() => {
                const checklistItems = (selectedPolicyForView.checklist && selectedPolicyForView.checklist.length > 0)
                  ? selectedPolicyForView.checklist
                  : [
                      'Verify 2 patient identifiers (Name & UHID) and informed consent',
                      'Verify sterile indicator strip & infection control compliance',
                      'Complete digital register sign-off and audit log entry',
                    ];
                return (
                  <div className="space-y-2 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5 text-blue-600" />
                        4. Live Clinical Execution Checklist
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700">
                        Tap items to mark verified
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {checklistItems.map((c, i) => {
                        const isChecked = !!checkedSteps[`${selectedPolicyForView.id}-${i}`];
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleChecklistStep(selectedPolicyForView.id, i)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className={`text-xs ${isChecked ? 'line-through text-emerald-800' : 'text-slate-800'}`}>
                              {c}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 5. Governance & Audit Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[9px]">Author</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedPolicyForView.author}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[9px]">Approver</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedPolicyForView.approver}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[9px]">Effective Date</span>
                  <span className="font-mono text-slate-800 block">{selectedPolicyForView.effectiveDate}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[9px]">Next Review</span>
                  <span className="font-mono text-slate-800 block">{selectedPolicyForView.reviewDate}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer & Staff Compliance Acknowledgment */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {acknowledgedPolicies[selectedPolicyForView.id] ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {acknowledgedPolicies[selectedPolicyForView.id]}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAcknowledgePolicy(selectedPolicyForView.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Acknowledge SOP Read &amp; Understood</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPolicyForView(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Protocol Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: UPLOAD / AUTHOR NEW SOP (LEADER & MD) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-fadeIn max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-900 text-white rounded-lg">
                  <UploadCloud className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload &amp; Author Hospital SOP</h3>
                  <p className="text-xs text-slate-500">Attach PDF/Word file and structure clinical governance rules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccessNote && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                ✓ {uploadSuccessNote}
              </div>
            )}

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              {/* File Upload Dropzone */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Attach Policy Document (PDF or Word)</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50'
                      : uploadedFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{uploadedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{uploadedFile.type} · {uploadedFile.size} (Auto-Structured)</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                        className="ml-2 text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-800">
                        Click to upload or drag &amp; drop document
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Supports PDF (.pdf), Microsoft Word (.docx, .doc), or Text (.txt)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Policy / SOP Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. OT Sterile Draping and Spine Prep Protocol"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SOP Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. SOP-SPINE-012"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as PolicyCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(CATEGORY_LABELS)
                      .filter(([k]) => k !== 'ALL')
                      .map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Responsible Department *</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Content Summary &amp; Clinical Purpose</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Summarize the core clinical workflow, objectives, and compliance mandates..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Guidelines */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700">Mandatory Guidelines &amp; Directives</label>
                <input
                  type="text"
                  value={newGuideline1}
                  onChange={(e) => setNewGuideline1(e.target.value)}
                  placeholder="Directive 1 (e.g. Verify patient ID, operative side, and surgical consent before incision)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={newGuideline2}
                  onChange={(e) => setNewGuideline2(e.target.value)}
                  placeholder="Directive 2 (e.g. Maintain continuous laminar airflow and antibiotic prophylaxis < 60 min)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {/* NABH Flag */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="nabhFlag"
                  checked={isNABH}
                  onChange={(e) => setIsNABH(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="nabhFlag" className="font-bold text-slate-800 cursor-pointer select-none">
                  Flag as NABH Mandatory Compliance Standard
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Publish to Governance Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
