'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Shield,
  Bot,
  User as UserIcon,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Briefcase,
  Heart,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Card } from '../ui/Card';

type ChatItem = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    href: string;
  };
};

export const AskOneView: React.FC = () => {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [chat, setChat] = useState<ChatItem[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      text: `Good day, ${user.name.split(' ')[0]}. I am Ask One, your work and personal companion at Stavya Spine Hospital. How can I assist you with your day, priorities, or wellbeing?`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    { label: 'Check my pending leave & shift', icon: Briefcase, prompt: 'What is my current shift and leave status?' },
    { label: 'Review my assigned NABH & RACI tasks', icon: Target, prompt: 'Show my urgent work items and NABH audit tasks' },
    { label: 'Log today’s health & sleep check-in', icon: Heart, prompt: 'How do I log my sleep and daily water intake in the Health journal?' },
    { label: 'Review monthly personal budget plan', icon: TrendingUp, prompt: 'How does my private monthly budget stay confidential?' },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!query) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const lower = query.toLowerCase();
    let reply = "I’ve recorded that in your local device session. For live AI multi-agent orchestration, Stavya One provides secure deterministic workflows.";
    let action: ChatItem['suggestedAction'] | undefined = undefined;

    if (lower.includes('leave') || lower.includes('shift') || lower.includes('duty')) {
      reply = "Your work profile currently shows active General Duty (09:00–18:00) with 14 available annual leave days and 1 pending department approval.";
      action = { label: 'Go to My Work', href: '/execution' };
    } else if (lower.includes('nabh') || lower.includes('raci') || lower.includes('task') || lower.includes('work')) {
      reply = "Your assigned commitments and department tasks are synchronized in your execution workspace with full RACI accountability.";
      action = { label: 'Open Execution Queue', href: '/execution' };
    } else if (lower.includes('health') || lower.includes('sleep') || lower.includes('water') || lower.includes('mood')) {
      reply = "Your health journal is strictly private to this browser storage and is never transmitted to hospital management. You can log sleep, steps, and hydration anytime.";
      action = { label: 'Open Health Journal', href: '/health' };
    } else if (lower.includes('budget') || lower.includes('money') || lower.includes('wealth') || lower.includes('savings')) {
      reply = "Your personal wealth & savings plan is kept in your device-only Personal Vault. It is completely isolated from hospital payroll and HR.";
      action = { label: 'Open Money Clarity', href: '/wealth' };
    } else if (lower.includes('privacy') || lower.includes('vault') || lower.includes('data')) {
      reply = "Stavya One operates on a strict two-lane privacy model: Hospital Work data is role-governed on the server, while your Personal Vault remains on this device.";
      action = { label: 'View Privacy Map', href: '/privacy' };
    }

    const assistantMsg: ChatItem = {
      id: `asst-${Date.now() + 1}`,
      role: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedAction: action,
    };

    setChat((prev) => [...prev, userMsg, assistantMsg]);
    setInputMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              STAVYA ONE COMPANION
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private Vault Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ask One
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Your daily work and life assistant for Stavya Spine Hospital. Answers work directives, policy questions, and helps you organize personal wellbeing privately.
          </p>
        </div>
      </div>

      {/* Quick Action Prompt Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {quickPrompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.prompt)}
              className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all shadow-2xs group flex items-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900 truncate">
                  {p.label}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {p.prompt}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Chat Messages Stream */}
      <Card className="p-4 sm:p-6 shadow-xs border-slate-200 bg-white rounded-3xl space-y-4 min-h-[360px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
          {chat.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {item.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 space-y-2 shadow-2xs ${
                  item.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-none'
                }`}
              >
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {item.text}
                </p>

                {item.suggestedAction && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <a
                      href={item.suggestedAction.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs transition-colors"
                    >
                      <span>{item.suggestedAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] text-slate-400">
                      {item.timestamp}
                    </span>
                  </div>
                )}

                {!item.suggestedAction && (
                  <span
                    className={`text-[10px] block text-right mt-1 ${
                      item.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.timestamp}
                  </span>
                )}
              </div>

              {item.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs mt-0.5">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-3 border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about hospital policies, shift schedules, health goals, or privacy..."
            className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </Card>
    </div>
  );
};
