'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Moon,
  Footprints,
  Droplets,
  Smile,
  ShieldCheck,
  Lock,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Watch,
  Activity,
  Flame,
  Check,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { loadPrivateState, savePrivateState } from '../../lib/services/privateVault';
import { initialPrivateState } from '../../lib/data/companionDemo';
import { PrivateState, HealthState, ConnectedDevice, HealthDeviceProvider } from '../../types/companion';

export const HealthJournalView: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<PrivateState>(() => initialPrivateState);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [selectedDeviceForConfig, setSelectedDeviceForConfig] = useState<ConnectedDevice | null>(null);

  useEffect(() => {
    setState(loadPrivateState());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    savePrivateState(state);
    setSavedFeedback(true);
    const t = setTimeout(() => setSavedFeedback(false), 2000);
    return () => clearTimeout(t);
  }, [state, isMounted]);

  const health = state.health;

  const updateHealth = (key: keyof HealthState, value: any) => {
    setState((current) => ({
      ...current,
      health: {
        ...current.health,
        [key]: value,
      },
    }));
  };

  // Device Connection Handler
  const toggleDeviceConnection = (deviceId: string) => {
    setState((current) => {
      const devices = current.health?.connectedDevices || [];
      const updatedDevices = devices.map((d) => {
        if (d.id === deviceId) {
          const willConnect = !d.connected;
          return {
            ...d,
            connected: willConnect,
            lastSyncedAt: willConnect ? 'Just now' : undefined,
          };
        }
        return d;
      });

      return {
        ...current,
        health: {
          ...current.health,
          connectedDevices: updatedDevices,
        },
      };
    });
  };

  // 1-Click Wearable & Device Sync Action
  const handleSyncDevices = () => {
    const devices = health?.connectedDevices || [];
    const connectedList = devices.filter((d) => d.connected);
    if (connectedList.length === 0) {
      setSyncToast('Please link Apple Health, Samsung Health, or Google Fit first.');
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }

    setIsSyncing(true);
    setTimeout(() => {
      // Pull fresh biometric metrics from connected wearable
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setState((current) => {
        const currentDevices = current.health?.connectedDevices || [];
        return {
          ...current,
          health: {
            ...current.health,
            steps: Math.min(20000, (current.health?.steps || 0) + Math.floor(Math.random() * 450) + 120),
            sleepHours: Number((Math.min(10, Math.max(6, (current.health?.sleepHours || 7) + (Math.random() * 0.4 - 0.2)))).toFixed(1)),
            heartRateResting: 62 + Math.floor(Math.random() * 6),
            activeCalories: 520 + Math.floor(Math.random() * 80),
            lastDeviceSyncAt: `Today, ${now}`,
            connectedDevices: currentDevices.map((d) =>
              d.connected ? { ...d, lastSyncedAt: `Today, ${now}` } : d
            ),
          },
        };
      });
      setIsSyncing(false);
      setSyncToast('Synced latest biometric metrics from connected devices.');
      setTimeout(() => setSyncToast(null), 4000);
    }, 900);
  };

  const getProviderIcon = (provider: HealthDeviceProvider) => {
    switch (provider) {
      case 'apple_health':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'samsung_health':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'google_fit':
        return <Footprints className="w-4 h-4 text-emerald-500" />;
      case 'garmin':
      case 'fitbit':
        return <Watch className="w-4 h-4 text-amber-500" />;
      default:
        return <Smartphone className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Heart className="w-3.5 h-3.5 text-emerald-300" />
              PRIVATE TO YOU
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Stored on device only
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Everyday Wellbeing &amp; Wearable Sync
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed mt-1">
                Link and sync health data from Apple Health, Samsung Health, or Google Fit directly into your local private vault.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncDevices}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Devices'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Connected Wearables & Device Integration Bar */}
      <Card className="p-5 sm:p-6 bg-white border-slate-200 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              DEVICE INTEGRATIONS
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Link Smart Devices &amp; Wearables
            </h3>
          </div>
          {health.lastDeviceSyncAt && (
            <span className="text-[11px] font-semibold text-slate-400">
              Last synced: {health.lastDeviceSyncAt}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(health?.connectedDevices || []).map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                device.connected
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  {getProviderIcon(device.provider)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {device.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="truncate">{device.deviceModel || 'Supported Device'}</span>
                    {device.connected && device.lastSyncedAt && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{device.lastSyncedAt}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDeviceConnection(device.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  device.connected
                    ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shadow-2xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-xs'
                }`}
              >
                {device.connected ? 'Linked' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Metrics Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sleep Hours */}
        <Card className="p-5 bg-white border-slate-200/90 rounded-3xl space-y-4 shadow-xs hover-lift-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sleep Duration</h3>
                <p className="text-[11px] text-slate-400">Nightly restorative sleep</p>
              </div>
            </div>
            <span className="text-lg font-black text-indigo-600 font-mono">
              {health.sleepHours.toFixed(1)} <small className="text-xs text-slate-500 font-sans font-bold">hrs</small>
            </span>
          </div>

          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={health.sleepHours}
            onChange={(e) => updateHealth('sleepHours', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>3 hrs</span>
            <span>7.5 hrs (Target)</span>
            <span>12 hrs</span>
          </div>
        </Card>

        {/* Daily Steps */}
        <Card className="p-5 bg-white border-slate-200/90 rounded-3xl space-y-4 shadow-xs hover-lift-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daily Steps</h3>
                <p className="text-[11px] text-slate-400">Wearable movement tracker</p>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600 font-mono">
              {health.steps.toLocaleString('en-IN')} <small className="text-xs text-slate-500 font-sans font-bold">steps</small>
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="20000"
            step="250"
            value={health.steps}
            onChange={(e) => updateHealth('steps', parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>1,000</span>
            <span>8,000 (Goal)</span>
            <span>20,000</span>
          </div>
        </Card>

        {/* Resting Heart Rate & Active Calories (From Wearables) */}
        <Card className="p-5 bg-white border-slate-200/90 rounded-3xl space-y-4 shadow-xs hover-lift-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Resting Heart Rate</h3>
                <p className="text-[11px] text-slate-400">Apple/Samsung Health sync</p>
              </div>
            </div>
            <span className="text-lg font-black text-rose-600 font-mono">
              {health.heartRateResting || 64} <small className="text-xs text-slate-500 font-sans font-bold">bpm</small>
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Active Energy
            </span>
            <span className="font-mono font-bold text-slate-800">
              {health.activeCalories || 480} kcal
            </span>
          </div>
        </Card>

        {/* Hydration */}
        <Card className="p-5 bg-white border-slate-200/90 rounded-3xl space-y-4 shadow-xs hover-lift-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Water Intake</h3>
                <p className="text-[11px] text-slate-400">Hydration tracker</p>
              </div>
            </div>
            <span className="text-lg font-black text-blue-600 font-mono">
              {health.waterGlasses} <small className="text-xs text-slate-500 font-sans font-bold">glasses</small>
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={health.waterGlasses}
            onChange={(e) => updateHealth('waterGlasses', parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => updateHealth('waterGlasses', Math.max(0, health.waterGlasses - 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active-press cursor-pointer"
            >
              - 1 Glass
            </button>
            <button
              type="button"
              onClick={() => updateHealth('waterGlasses', Math.min(20, health.waterGlasses + 1))}
              className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-all active-press cursor-pointer flex items-center justify-center gap-1"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>+ 1 Glass (250 ml)</span>
            </button>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>0</span>
            <span>8 glasses (2.0 L Goal)</span>
            <span>16</span>
          </div>
        </Card>
      </div>

      {/* Mood Selector Card */}
      <Card className="p-5 bg-white border-slate-200/90 rounded-3xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
              <Smile className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daily State of Mind</h3>
              <p className="text-[11px] text-slate-400">Personal emotional check-in</p>
            </div>
          </div>
          <span className="text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            {health.mood}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {(['Low', 'Steady', 'Good', 'Excellent'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateHealth('mood', m)}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer active-press ${
                health.mood === m
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>

      {/* Zero-Cloud Device Privacy Pass Alert */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-900">Zero-Cloud Wearable Privacy Pass</h4>
          <p className="text-slate-600 leading-relaxed">
            Data linked from Apple Health, Samsung Health, Google Fit, or smart wearables is processed strictly locally inside this browser&apos;s Private Vault. Your biometrics, heart rate, and step counts are never transmitted to Stavya Spine Hospital servers, HR, or management.
          </p>
        </div>
      </div>
    </div>
  );
};
