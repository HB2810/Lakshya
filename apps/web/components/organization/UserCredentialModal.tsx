'use client';

import React, { useState } from 'react';
import { X, Key, Shield, User, Mail, Building2, Check, Lock } from 'lucide-react';
import { User as UserType, Persona } from '../../types/auth';
import { Department } from '../../types/organization';

interface UserCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSaveUser: (userData: {
    name: string;
    email: string;
    password?: string;
    role: Persona;
    departmentId: string;
    departmentName: string;
  }) => void;
  editUser?: UserType | null;
}

export const UserCredentialModal: React.FC<UserCredentialModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSaveUser,
  editUser,
}) => {
  const [name, setName] = useState(editUser?.name || '');
  const [email, setEmail] = useState(editUser?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Persona>(editUser?.role || 'EMPLOYEE');
  const [deptId, setDeptId] = useState(editUser?.departmentId || (departments[0]?.id ?? ''));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === deptId);
    onSaveUser({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      role,
      departmentId: deptId,
      departmentName: dept?.name || 'General Operations',
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editUser ? 'Update Staff Account & Credentials' : 'Create Staff Account & Credentials'}
                </h3>
                <p className="text-xs text-slate-500">
                  Administrator &amp; Master Security Access Management
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Mehta"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Official Hospital Email (Login Username)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. r.mehta@stavyaspine.com"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                {editUser ? 'New Password (Leave blank to keep existing)' : 'Initial Password'}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editUser ? '••••••••' : 'Enter strong password (min 8 chars)'}
                  required={!editUser}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  System Persona / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Persona)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Standard Staff)</option>
                  <option value="LEADER">LEADER (Department Head)</option>
                  <option value="MD">MD (Managing Director)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                  <option value="MASTER">MASTER (Executive Master)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Hospital Department
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {editUser ? 'Update Account' : 'Save Account & Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
