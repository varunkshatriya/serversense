'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import { Severity } from '@/lib/types';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  status?: Severity;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  badge?: string;
  minMax?: { min: number; max: number };
  thresholdNote?: string;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
}

export function KpiCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  status = 'NORMAL',
  trend,
  trendLabel,
  badge,
  minMax,
  thresholdNote,
  accentColor = 'cyan',
}: KpiCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          border: 'border-rose-500/40 hover:border-rose-500',
          badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          glow: 'shadow-rose-950/20',
        };
      case 'WARNING':
        return {
          border: 'border-amber-500/40 hover:border-amber-500',
          badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          glow: 'shadow-amber-950/20',
        };
      case 'NORMAL':
      default:
        return {
          border: 'border-[#1E293B] hover:border-slate-700',
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          glow: 'shadow-cyan-950/10',
        };
    }
  };

  const getAccentIconBg = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cyan':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <div
      className={`rounded-xl bg-[#0F172A] border ${statusStyle.border} p-5 shadow-lg transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${getAccentIconBg()}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {title}
            </span>
          </div>

          {badge && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${statusStyle.badgeBg}`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Primary Metric Value */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>

        {/* Min/Max or Subtitle */}
        {minMax && (
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-400">
            <span>Min: <strong className="text-slate-200">{minMax.min}°C</strong></span>
            <span>•</span>
            <span>Max: <strong className="text-slate-200">{minMax.max}°C</strong></span>
          </div>
        )}

        {subtitle && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{subtitle}</p>}
      </div>

      {/* Footer / Threshold Note / Trend */}
      <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
        {trend && (
          <div className="flex items-center gap-1 font-mono">
            {trend === 'up' ? (
              <span className="flex items-center text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Rising</span>
              </span>
            ) : trend === 'down' ? (
              <span className="flex items-center text-cyan-400">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Falling</span>
              </span>
            ) : (
              <span className="flex items-center text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                <span>Stable</span>
              </span>
            )}
            {trendLabel && <span className="text-slate-400 text-[11px] ml-1">({trendLabel})</span>}
          </div>
        )}

        {thresholdNote && (
          <span className="text-[11px] text-slate-400 font-mono ml-auto">
            {thresholdNote}
          </span>
        )}
      </div>
    </div>
  );
}
