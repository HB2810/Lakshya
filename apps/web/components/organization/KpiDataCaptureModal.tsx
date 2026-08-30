'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Save,
  Link2,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NabhQualityIndicator, KpiDataSource } from '../../lib/data/stavyaNabhData';
import { useAuth } from '../../lib/auth/AuthContext';

interface KpiDataCaptureModalProps {
  indicator: NabhQualityIndicator | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedIndicator: NabhQualityIndicator, captureAudit: KpiCaptureAuditRecord) => void;
}

export interface KpiCaptureAuditRecord {
  kpiId: string;
  kpiCode: string;
  auditPeriod: string;
  auditDate: string;
  rawNumerator: number;
  rawDenominator: number;
  calculatedValue: number;
  resultingStatus: 'GREEN' | 'AMBER' | 'RED';
  registerReference: string;
  collectorNotes: string;
  evidenceRef: string;
  capturedByRole: string;
  capturedByName: string;
  capturedById: string;
  capturedAt: string;
}

export function KpiDataCaptureModal({
  indicator,
  isOpen,
  onClose,
  onSave,
}: KpiDataCaptureModalProps) {
  const { user } = useAuth();

  const [auditPeriod, setAuditPeriod] = useState('August 2026');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().substring(0, 10));
  const [rawNumerator, setRawNumerator] = useState<number | ''>('');
  const [rawDenominator, setRawDenominator] = useState<number | ''>('');
  const [registerReference, setRegisterReference] = useState('');
  const [collectorNotes, setCollectorNotes] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize values when indicator changes
  useEffect(() => {
    if (indicator) {
      setRawNumerator('');
      setRawDenominator('');
      setRegisterReference(`${indicator.chapter}-REG-${new Date().getFullYear()}-FOLIO-`);
      setCollectorNotes('');
      setEvidenceRef('');
      setSaveSuccess(false);
    }
  }, [indicator]);

  if (!isOpen || !indicator) return null;

  const ds = indicator.dataSource;

  // Calculate actual value from formula
  const num = typeof rawNumerator === 'number' ? rawNumerator : 0;
  const den = typeof rawDenominator === 'number' ? rawDenominator : 0;

  let calculatedActual = 0;
  if (indicator.unit === 'PERCENTAGE') {
    calculatedActual = den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0;
  } else if (indicator.unit === 'RATE_PER_1000') {
    calculatedActual = den > 0 ? Number(((num / den) * 1000).toFixed(2)) : 0;
  } else if (indicator.unit === 'TIME_MIN' || indicator.unit === 'TIME_HOURS' || indicator.unit === 'TIME_SEC') {
    calculatedActual = den > 0 ? Number((num / den).toFixed(1)) : num;
  } else {
    calculatedActual = den > 0 ? Number((num / den).toFixed(2)) : num;
  }

  // Determine status
  let calculatedStatus: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
  if (indicator.isHigherBetter) {
    if (calculatedActual >= indicator.warningThreshold) {
      calculatedStatus = 'GREEN';
    } else if (calculatedActual >= indicator.criticalThreshold) {
      calculatedStatus = 'AMBER';
    } else {
      calculatedStatus = 'RED';
    }
  } else {
    if (calculatedActual <= indicator.warningThreshold) {
      calculatedStatus = 'GREEN';
    } else if (calculatedActual <= indicator.criticalThreshold) {
      calculatedStatus = 'AMBER';
    } else {
      calculatedStatus = 'RED';
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawNumerator === '' || rawDenominator === '') {
      alert('Please enter valid Numerator and Denominator values.');
      return;
    }

    const auditRecord: KpiCaptureAuditRecord = {
      kpiId: indicator.id,
      kpiCode: indicator.code,
      auditPeriod,
      auditDate,
      rawNumerator: Number(rawNumerator),
      rawDenominator: Number(rawDenominator),
      calculatedValue: calculatedActual,
      resultingStatus: calculatedStatus,
      registerReference: registerReference.trim() || 'VERIFIED-REG-ENTRY',
      collectorNotes: collectorNotes.trim(),
      evidenceRef: evidenceRef.trim() || 'Verified physical register log',
      capturedByRole: user?.role || ds?.dataCollectorRole || 'Quality Auditor',
      capturedByName: user?.name || ds?.dataCollectorName || 'Hospital Staff',
      capturedById: user?.id || ds?.dataCollectorId || 'e069',
      capturedAt: new Date().toISOString(),
    };

    const updatedIndicator: NabhQualityIndicator = {
      ...indicator,
      actualValue: calculatedActual,
      status: calculatedStatus,
      lastAuditDate: auditDate,
    };

    onSave(updatedIndicator, auditRecord);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const getUnitSymbol = () => {
    switch (indicator.unit) {
      case 'PERCENTAGE': return '%';
      case 'RATE_PER_1000': return ' / 1,000 pt-days';
      case 'TIME_MIN': return ' mins';
      case 'TIME_HOURS': return ' hrs';
      case 'TIME_SEC': return ' secs';
      case 'SCORE': return ' pts';
      case 'COUNT': return ' cases';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-lg uppercase tracking-wider backdrop-blur-xs">
                {indicator.code}
              </span>
              <span className="px-2 py-0.5 bg-blue-900/40 text-blue-100 text-[10px] font-bold rounded-lg uppercase">
                Chapter {indicator.chapter}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-100 text-[10px] font-bold rounded-lg border border-emerald-400/30">
                {indicator.category.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white mt-1">
              {indicator.name}
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
              Point-of-Care Statutory Data Entry &amp; Mathematical Calculation Terminal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source System & Register Metadata Box */}
        <div className="bg-slate-50 border-b border-slate-200 p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Auditable Source of Data Capture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Primary Source System
              </div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{ds?.sourceSystem || 'Hospital HIMS EMR Engine'}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Physical / Digital Register
              </div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>{ds?.sourceRegister || `${indicator.chapter} Quality Audit Register`}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Designated Collector Role
              </div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{ds?.dataCollectorRole || indicator.leadRole}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Capture Method &amp; Frequency
              </div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {ds?.captureMethod?.replace(/_/g, ' ') || 'HYBRID AUDIT'} ({indicator.frequency})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Capture Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Audit Period & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Period</span>
              </label>
              <select
                value={auditPeriod}
                onChange={e => setAuditPeriod(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="August 2026">August 2026 (Current Cycle)</option>
                <option value="July 2026">July 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="Q3 2026">Q3 2026 Comprehensive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Data Entry Date</span>
              </label>
              <input
                type="date"
                value={auditDate}
                onChange={e => setAuditDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Raw Numerator and Denominator Inputs */}
          <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Raw Operational Counts</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-700">
                Formula: {indicator.formula}
              </span>
            </div>

            {/* Numerator */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Numerator (N)
                </label>
                <span className="text-[10px] text-slate-500 font-medium italic">
                  Origin: {ds?.numeratorSource || indicator.numerator}
                </span>
              </div>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 48"
                value={rawNumerator}
                onChange={e => setRawNumerator(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {indicator.numerator}
              </p>
            </div>

            {/* Denominator */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Denominator (D)
                </label>
                <span className="text-[10px] text-slate-500 font-medium italic">
                  Origin: {ds?.denominatorSource || indicator.denominator}
                </span>
              </div>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 50"
                value={rawDenominator}
                onChange={e => setRawDenominator(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {indicator.denominator}
              </p>
            </div>
          </div>

          {/* Computed Live Result Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Computed Indicator Result</span>
              <span className="text-[11px] font-semibold text-slate-500">
                Target: {indicator.targetValue} {getUnitSymbol()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {rawNumerator !== '' && rawDenominator !== '' ? calculatedActual : '—'}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {getUnitSymbol()}
                </span>
              </div>

              {rawNumerator !== '' && rawDenominator !== '' && (
                <div
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                    calculatedStatus === 'GREEN'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : calculatedStatus === 'AMBER'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {calculatedStatus === 'GREEN' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>
                    {calculatedStatus === 'GREEN'
                      ? 'Complies with Benchmark'
                      : calculatedStatus === 'AMBER'
                      ? 'Warning Threshold Breached'
                      : 'Critical Non-Compliance'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Audit Verification Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span>Physical Register Reference / Folio</span>
              </label>
              <input
                type="text"
                value={registerReference}
                onChange={e => setRegisterReference(e.target.value)}
                placeholder="e.g. OT-REG-2026-AUG-FOLIO-44"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Evidence File / Digital Reference</span>
              </label>
              <input
                type="text"
                value={evidenceRef}
                onChange={e => setEvidenceRef(e.target.value)}
                placeholder="e.g. HICC-AUG-2026-SIGNED.pdf"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Collector Audit Notes / Observations
            </label>
            <textarea
              rows={2}
              value={collectorNotes}
              onChange={e => setCollectorNotes(e.target.value)}
              placeholder="e.g. Verified by scrub nurse and checked against 48 major spine surgery cases."
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">
              Verified by: <strong className="text-slate-700">{ds?.verificationAuthority || 'Director Quality'}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saveSuccess}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Captured &amp; Synchronized!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Submit Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
