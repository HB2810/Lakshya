'use client';

import React from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { TeamExecutionHub } from '../../../components/leader/TeamExecutionHub';
import { Card } from '../../../components/ui/Card';
import { Users, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TeamExecutionPage() {
  const { user } = useAuth();

  const role = user?.role || 'EMPLOYEE';
  const isGovernance = role === 'MD' || role === 'MANAGING_DIRECTOR' || role === 'MD_OFFICE' || role === 'MASTER' || role === 'ADMIN';
  const isLeader = role === 'LEADER' || role === 'LEADERS' || role === 'DIRECTOR_QUALITY';
  const isHOD = role === 'DEPARTMENT_HEAD' || role === 'MANAGER' || (user?.roleTitle && (user.roleTitle.toLowerCase().includes('incharge') || user.roleTitle.toLowerCase().includes('head')));

  const hasTeamAuthority = isGovernance || isLeader || isHOD;

  if (!hasTeamAuthority) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <Card className="p-8 bg-white border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-black text-slate-900">
              Personal Employee Execution Space
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              As an individual contributor, you are in the <strong>Employee Execution Tier</strong>. You have direct access to your personal work queue and deliverables.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Only your assigned work items are visible to you.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You can submit deliverables for Incharge verification anytime.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/execution"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-all active-press"
            >
              <span>Go to My Work Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <TeamExecutionHub />;
}
