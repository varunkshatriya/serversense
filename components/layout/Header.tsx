'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Cpu,
  Radio,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  isHardwareConnected?: boolean;
  buzzerActive?: boolean;
  activeAlertCount?: number;
  overallStatus?: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export function Header({
  isHardwareConnected = false,
  buzzerActive = false,
  activeAlertCount = 0,
  overallStatus = 'NORMAL',
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Live updating clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#1E293B] px-6 flex items-center justify-between">
      {/* Left: Status Beacon */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-[#1E293B]">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                overallStatus === 'CRITICAL'
                  ? 'bg-rose-500'
                  : overallStatus === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                overallStatus === 'CRITICAL'
                  ? 'bg-rose-500'
                  : overallStatus === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="text-xs font-mono font-medium tracking-wider text-slate-300">
            SYSTEM: {overallStatus}
          </span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          <span>{currentTime || 'Synchronizing UTC...'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Hardware vs Simulation Status Indicator */}
        {isHardwareConnected ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>HARDWARE ONLINE (COM3)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>SIMULATION MODE</span>
          </div>
        )}

        {/* Simulated Buzzer Indicator */}
        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            buzzerActive && !soundMuted
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white'
          }`}
          title={
            buzzerActive
              ? 'Physical/Simulated Piezo Buzzer D4 is PULSING!'
              : 'Piezo Buzzer D4 Silent'
          }
        >
          {soundMuted ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : (
            <Volume2 className={`w-4 h-4 ${buzzerActive ? 'text-rose-400' : 'text-slate-400'}`} />
          )}
          <span className="hidden sm:inline">
            {buzzerActive ? (soundMuted ? 'BUZZER (MUTED)' : 'BUZZER ACTIVE') : 'BUZZER OK'}
          </span>
        </button>

        {/* Notifications & Incidents Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Active Incidents"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg">
                {activeAlertCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Incident Notifications
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {activeAlertCount} Active
                </span>
              </div>
              <div className="py-3 space-y-2 max-h-64 overflow-y-auto">
                {activeAlertCount === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All sensors within normal limits</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-300 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Active Telemetry Exception</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-tight">
                        Sensor threshold violation requires acknowledgment or resolution.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-[#1E293B]">
                <Link
                  href="/alerts"
                  onClick={() => setShowNotificationMenu(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <span>Open Alert Incident Center</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200">Ops Engineer</span>
            <span className="text-[10px] text-slate-400 font-mono">Duty Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
}
