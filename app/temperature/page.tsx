'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Thermometer,
  Download,
  AlertTriangle,
  Flame,
  Clock,
  BarChart3,
  TrendingUp,
  Info,
} from 'lucide-react';
import { MonitoringSettings, SensorReading } from '@/lib/types';

export default function TemperatureAnalyticsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('1h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/readings?limit=60');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setReadings(json.data.readings);
            setSettings(json.data.settings);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const warnThreshold = settings?.temperatureWarning ?? 30;
  const critThreshold = settings?.temperatureCritical ?? 35;

  // Calculate statistics
  let min = readings.length > 0 ? readings[0].temperatureC : 0;
  let max = readings.length > 0 ? readings[0].temperatureC : 0;
  let peakTimestamp = readings.length > 0 ? readings[0].timestamp : '';
  let sum = 0;
  let countAboveWarn = 0;
  let countAboveCrit = 0;

  for (const r of readings) {
    if (r.temperatureC < min) min = r.temperatureC;
    if (r.temperatureC > max) {
      max = r.temperatureC;
      peakTimestamp = r.timestamp;
    }
    sum += r.temperatureC;
    if (r.temperatureC >= critThreshold) {
      countAboveCrit++;
    } else if (r.temperatureC >= warnThreshold) {
      countAboveWarn++;
    }
  }

  const avg = readings.length > 0 ? sum / readings.length : 0;
  const percentAboveWarn = readings.length > 0 ? Math.round((countAboveWarn / readings.length) * 100) : 0;
  const percentAboveCrit = readings.length > 0 ? Math.round((countAboveCrit / readings.length) * 100) : 0;

  // Distribution buckets: <22°C, 22-26°C (Optimal), 26-30°C (Warm), 30-35°C (Warning), >35°C (Critical)
  const distribution = [
    { label: '<22°C (Cool)', count: readings.filter((r) => r.temperatureC < 22).length, color: 'bg-cyan-500' },
    { label: '22-26°C (Optimal)', count: readings.filter((r) => r.temperatureC >= 22 && r.temperatureC < 26).length, color: 'bg-emerald-500' },
    { label: '26-30°C (Warm)', count: readings.filter((r) => r.temperatureC >= 26 && r.temperatureC < 30).length, color: 'bg-blue-400' },
    { label: '30-35°C (Warning)', count: readings.filter((r) => r.temperatureC >= 30 && r.temperatureC < 35).length, color: 'bg-amber-500' },
    { label: '≥35°C (Critical)', count: readings.filter((r) => r.temperatureC >= 35).length, color: 'bg-rose-500' },
  ];

  return (
    <DashboardShell
      title="Temperature Analytics & Overheat Prevention"
      subtitle="Statistical thermal analysis, ASHRAE thermal compliance envelopes, and threshold violation metrics."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Temperature Analytics' }]}
      actions={
        <div className="flex items-center gap-2">
          {/* Timeframe Filter */}
          <div className="flex bg-[#0F172A] border border-[#1E293B] rounded-lg p-0.5 text-xs font-mono">
            {(['1h', '24h', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  timeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <a
            href="/api/export?type=temperature"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      }
    >
      {/* 4 Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Average Rack Temp</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mb-1">
            {avg.toFixed(1)}°C
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Range: {min.toFixed(1)}°C — {max.toFixed(1)}°C
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Peak Recorded Temp</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mb-1">
            {max.toFixed(1)}°C
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            At: {peakTimestamp ? new Date(peakTimestamp).toLocaleTimeString() : 'N/A'}
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-amber-500/30 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Time Above Warning (≥{warnThreshold}°C)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mb-1">
            {percentAboveWarn}%
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {countAboveWarn} of {readings.length} reading samples
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-rose-500/30 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Time Above Critical (≥{critThreshold}°C)</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-400 mb-1">
            {percentAboveCrit}%
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {countAboveCrit} samples triggered hardware buzzer
          </p>
        </div>
      </div>

      {/* Main Temperature Trend Chart */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Continuous Thermal Trend & Excursion Boundaries</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Warning threshold at {warnThreshold}°C, Critical emergency threshold at {critThreshold}°C.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Window: Last {readings.length} data samples
          </span>
        </div>

        <LiveChart
          data={readings.map((r) => ({
            timestamp: r.timestamp,
            value: r.temperatureC,
          }))}
          dataKey="value"
          name="Temperature"
          unit="°C"
          color="#38BDF8"
          gradientId="analyticsTempGrad"
          warningThreshold={warnThreshold}
          criticalThreshold={critThreshold}
          height={320}
          minDomain={15}
          maxDomain={45}
        />
      </div>

      {/* Distribution Histogram & Engineering Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Breakdown */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Thermal Distribution Profile</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {distribution.map((bucket, idx) => {
              const pct = readings.length > 0 ? (bucket.count / readings.length) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>{bucket.label}</span>
                    <span className="text-slate-400">{bucket.count} samples ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#1E293B] overflow-hidden">
                    <div
                      className={`h-full ${bucket.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engineering Guidelines & Standards */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>ASHRAE Thermal Guidelines Compliance</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                • <strong className="text-emerald-400">Recommended Server Inlet (18°C - 27°C):</strong> Optimal reliability and lifespan for compute nodes and enterprise hard drives.
              </p>
              <p>
                • <strong className="text-amber-400">Allowable Server Inlet (A1/A2 Class, 27°C - 32°C):</strong> Fans ramp up significantly; efficiency begins to drop, power consumption increases by ~8-12%.
              </p>
              <p>
                • <strong className="text-rose-400">Thermal Shutdown Risk (&gt;35°C):</strong> High risk of processor thermal throttling, RAM bit flips, and premature SSD/HDD wear. Immediate airflow investigation required.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300">
            <strong>Data Lineage Note:</strong> Readings originate from the TMP36 analog temperature sensor on Arduino Pin A3. In simulation mode, realistic thermodynamics and sinusoidal thermal waves are applied.
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
