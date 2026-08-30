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
  Copy,
  Check,
  Mic,
  AlertTriangle,
  FileText,
  Activity,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const userNameFirst = (user?.name || 'Stavyan').split(' ')[0];

  const [chat, setChat] = useState<ChatItem[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      text: `Good day, ${userNameFirst}. I am Ask One, your work and clinical companion at Stavya Spine Hospital.\n\nAsk me anything about emergency codes, NABH 6th Edition SOPs, shift handovers, or your private health & financial planner.`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    { label: 'Check my pending leave & shift', icon: Briefcase, prompt: 'What is my current shift and leave status?' },
    { label: 'Review my assigned NABH & RACI tasks', icon: Target, prompt: 'Show my urgent work items and NABH audit tasks' },
    { label: '🚨 Emergency Codes (Code Blue/Red)', icon: AlertTriangle, prompt: 'What are the emergency codes at Stavya (Code Blue, Code Red, Code Pink)?' },
    { label: '🧼 OT Sterilization & Pre-op SOP', icon: FileText, prompt: 'Show the pre-operative surgical safety checklist and autoclave SOP' },
    { label: '📝 Shift Handover Best Practice', icon: Activity, prompt: 'What format should I use for nursing and clinical shift handovers?' },
    { label: '💧 Private Health & Sleep Vault', icon: Heart, prompt: 'How does my health tracker and wearable data stay strictly private?' },
  ];

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    // Simulate speech-to-text input after 2 seconds
    setTimeout(() => {
      setInputMessage('What is the emergency extension for Code Blue cardiac arrest?');
      setIsListening(false);
    }, 1800);
  };

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
    let reply = "I’ve recorded that in your local device session. Stavya One provides secure, deterministic workflows for clinical and operational intelligence.";
    let action: ChatItem['suggestedAction'] | undefined = undefined;

    if (lower.includes('leave') || (lower.includes('shift') && lower.includes('status'))) {
      reply = "Your work profile currently shows active General Duty (09:00–18:00) with 14 available annual leave days and 1 pending department approval.";
      action = { label: 'Go to My Work', href: '/execution' };
    } else if (lower.includes('code blue') || lower.includes('emergency') || lower.includes('code red') || lower.includes('code pink') || lower.includes('fire')) {
      reply = `🚨 **STAVYA SPINE EMERGENCY DIRECTIVES**\n\n• **CODE BLUE (Cardiac Arrest / Medical Emergency):** Dial Ext **2222**. Crash Cart & Anaesthesia Stat Team activated.\n• **CODE RED (Fire / Smoke Alert):** Dial Ext **1111**. R.A.C.E. Protocol (Rescue, Alarm, Contain, Extinguish/Evacuate).\n• **CODE PINK (Infant / Child Security Alert):** Dial Ext **3333**. Hospital perimeter locked down.\n• **CODE YELLOW (Internal Disaster / Medical Gas / Power):** Dial Ext **4444**.\n• **CODE BLACK (Hazardous Spill):** Dial Ext **5555**.`;
      action = { label: 'Go to My Day / Emergency Protocol', href: '/overview' };
    } else if (lower.includes('sop') || lower.includes('steriliz') || lower.includes('pre-op') || lower.includes('autoclave') || lower.includes('policy') || lower.includes('checklist')) {
      reply = `📋 **NABH PRE-OPERATIVE SURGICAL SAFETY & STERILIZATION SOP**\n\n1. **Sign In (Before Induction):** Verify 2 patient identifiers (Name & UHID), surgical site marking by operating surgeon, and informed consent.\n2. **Time Out (Before Incision):** Confirm all team members, antibiotic prophylaxis administered within 60 mins, sterile autoclave indicators verified (Class 5/6 chemical strip + biological spore test).\n3. **Sign Out (Before Leaving OT):** Instrument & swab counts verified 100% matched, specimen labeled with 2 identifiers.`;
      action = { label: 'Open Policies & SOP Library', href: '/policies' };
    } else if (lower.includes('handover') || lower.includes('shift') || lower.includes('memo') || lower.includes('vitals')) {
      reply = `📝 **SBAR SHIFT HANDOVER GUIDELINE (NABH Standard)**\n\n• **S (Situation):** Bed number, patient name, UHID, operating spine surgeon, post-op day.\n• **B (Background):** Surgical procedure performed (e.g. L4-L5 Microdiscectomy), past medical history.\n• **A (Assessment):** Current vitals (BP, SpO2, HR), drain output (ml), neurological limb motor/sensory status, pain score (1–10).\n• **R (Recommendation):** Next medication due time, pending labs, mobilization plan.`;
      action = { label: 'Post Shift Handover Memo', href: '/overview' };
    } else if (lower.includes('rca') || lower.includes('5-why') || lower.includes('fishbone') || lower.includes('incident') || lower.includes('quality') || lower.includes('capa')) {
      reply = `🔍 **QUALITY & ROOT CAUSE ANALYSIS (RCA)**\n\nStavya One supports structured Ishikawa Fishbone diagrams, 5-Why root cause cascades, and FMEA (Failure Mode and Effects Analysis) risk engines to deploy lasting CAPA solutions.`;
      action = { label: 'Open Quality & RCA Studio', href: '/rca' };
    } else if (lower.includes('nabh') || lower.includes('raci') || lower.includes('task') || lower.includes('work')) {
      reply = "Your assigned commitments and department tasks are synchronized in your execution workspace with full RACI accountability.";
      action = { label: 'Open Execution Queue', href: '/execution' };
    } else if (lower.includes('health') || lower.includes('sleep') || lower.includes('water') || lower.includes('mood') || lower.includes('vault') || lower.includes('private')) {
      reply = `🔒 **STRICT PRIVATE VAULT GUARANTEE**\n\nYour personal health logs, sleep tracking, wearable sync data, and budget calculations are stored locally in your browser's private vault.\n\nThey are **never** transmitted to hospital servers or accessible by management.`;
      action = { label: 'Open Health Journal', href: '/health' };
    } else if (lower.includes('budget') || lower.includes('money') || lower.includes('wealth') || lower.includes('savings')) {
      reply = `Your personal wealth & savings plan is kept in your device-only Personal Vault. It is completely isolated from hospital payroll and HR.`;
      action = { label: 'Open Money Clarity', href: '/wealth' };
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
              STAVYAONE COMPANION
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
            Your clinical, operational, and personal wellbeing assistant. Instant hospital emergency directives, SOP checklists, shift workflows, and private health insights.
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
              className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 rounded-2xl text-left transition-all shadow-2xs group flex items-center gap-3 cursor-pointer active-press"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
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
      <Card className="p-4 sm:p-6 shadow-xs border-slate-200/90 bg-white rounded-3xl space-y-4 min-h-[360px] flex flex-col justify-between">
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
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 space-y-2.5 shadow-2xs relative group ${
                  item.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-none'
                }`}
              >
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {item.text}
                </p>

                {item.suggestedAction && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <a
                      href={item.suggestedAction.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs transition-colors active-press"
                    >
                      <span>{item.suggestedAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.id, item.text)}
                        className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded transition-colors"
                        title="Copy text"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                )}

                {!item.suggestedAction && (
                  <div className="flex items-center justify-between pt-1">
                    {item.role === 'assistant' ? (
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.id, item.text)}
                        className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded transition-colors flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === item.id ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-[10px]">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <div />
                    )}
                    <span
                      className={`text-[10px] ${
                        item.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.timestamp}
                    </span>
                  </div>
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
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isListening ? 'Listening...' : 'Voice Input'}
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? 'Listening to voice...' : 'Ask about hospital policies, shift schedules, health goals, or privacy...'}
            className="flex-1 px-4 py-3 text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active-press"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </Card>
    </div>
  );
};
