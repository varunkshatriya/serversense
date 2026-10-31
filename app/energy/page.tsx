'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Zap,
  Leaf,
  Download,
  AlertCircle,
  Sliders,
  Calculator,
  Server,
  Clock,
  Info,
} from 'lucide-react';
import { calculateEnergyAndEmissions, generateEnergyTimeline } from '@/lib/energy';

export default function EnergyCarbonPage() {
  const [powerWatts, setPowerWatts] = useState<number>(2400); // 2.4 kW rack load
  const [durationHours, setDurationHours] = useState<number>(24);
  const [serverCount, setServerCount] = useState<number>(1);
  const [pue, setPue] = useState<number>(1.25); // PUE
  const [emissionFactor, setEmissionFactor] = useState<number>(0.475); // kg CO2e / kWh

  // Recalculate metrics on input changes
  const estimate = useMemo(() => {
    return calculateEnergyAndEmissions({
      powerWatts,
      durationHours,
      emissionFactorKgPerKwh: emissionFactor,
      serverCount,
      pue,
    });
  }, [powerWatts, durationHours, emissionFactor, serverCount, pue]);

  // Generate 24-point load curve inside useEffect
  const [timelineData, setTimelineData] = useState<{ timestamp: string; value: number }[]>([]);

  useEffect(() => {
    const data = generateEnergyTimeline(powerWatts * pue * serverCount, emissionFactor, 24).map((pt) => ({
      timestamp: pt.timestamp,
      value: pt.energyKwh,
    }));
    setTimelineData(data);
  }, [powerWatts, pue, serverCount, emissionFactor]);

  return (
    <DashboardShell
      title="Energy Consumption & Carbon Footprint Modeling"
      subtitle="Engineering models for rack power draw, thermal PUE overhead, and Scope 2 GHG greenhouse emissions."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Energy & Carbon' }]}
      actions={
        <div className="flex items-center gap-2">
          {/* Setup Required / Simulation Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>MODEL ESTIMATE • NO HARDWARE CT POWER METER</span>
          </div>

          <a
            href="/api/export?type=energy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Energy Report (CSV)</span>
          </a>
        </div>
      }
    >
      {/* Explicit Disclaimer Banner */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/60 p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white block mb-0.5">
            Data Source & Instrumentation Limitations
          </strong>
          {estimate.limitations} This module allows data center managers to model energy footprint using standard power specifications and PUE metrics.
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Power Draw (PUE Adj)</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mb-1">
            {estimate.powerWatts.toLocaleString()} <span className="text-sm font-normal text-slate-400">Watts</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {(estimate.powerWatts / 1000).toFixed(2)} kW continuous load
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-cyan-500/30 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Energy Consumed</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-cyan-400 mb-1">
            {estimate.energyKwh.toLocaleString()} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Over {durationHours} hour window
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-emerald-500/30 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Estimated Carbon Footprint</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mb-1">
            {estimate.carbonKgCo2e.toLocaleString()} <span className="text-sm font-normal text-slate-400">kg CO₂e</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Scope 2 GHG equivalent
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Grid Carbon Intensity</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mb-1">
            {emissionFactor} <span className="text-sm font-normal text-slate-400">kg/kWh</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Standard grid mix factor
          </p>
        </div>
      </div>

      {/* Interactive Parameter Configuration & Calculation Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Configuration Panel */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Power & Emissions Parameters</span>
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Base Rack Load:</span>
                <span className="text-cyan-400 font-bold">{powerWatts} W</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={powerWatts}
                onChange={(e) => setPowerWatts(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Server Rack Count:</span>
                <span className="text-cyan-400 font-bold">{serverCount} Rack(s)</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={serverCount}
                onChange={(e) => setServerCount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Data Center PUE (Efficiency):</span>
                <span className="text-cyan-400 font-bold">{pue.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.05"
                max="2.0"
                step="0.05"
                value={pue}
                onChange={(e) => setPue(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">1.0 = 100% efficient cooling, 1.25 = modern data center</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Calculation Window:</span>
                <span className="text-cyan-400 font-bold">{durationHours} Hours</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[1, 24, 168, 720].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => setDurationHours(hrs)}
                    className={`py-1 rounded text-center transition-colors ${
                      durationHours === hrs
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-[#1E293B] text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {hrs === 1 ? '1h' : hrs === 24 ? '1d' : hrs === 168 ? '7d' : '30d'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Grid Emission Factor:</span>
                <span className="text-emerald-400 font-bold">{emissionFactor} kg CO₂e/kWh</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="1.5"
                value={emissionFactor}
                onChange={(e) => setEmissionFactor(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Energy Projection Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>24-Hour Projected Energy Consumption Curve</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulated dynamic compute workload and thermal cooling coefficient variation.
                </p>
              </div>
            </div>

            <LiveChart
              data={timelineData}
              dataKey="value"
              name="Energy"
              unit="kWh"
              color="#10B981"
              gradientId="energyGrad"
              height={260}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B] flex flex-wrap gap-4 text-xs font-mono text-slate-400">
            <div>
              Formula: <span className="text-white">Energy (kWh) = (Power (W) × PUE × Hours) / 1000</span>
            </div>
            <div>
              Emissions: <span className="text-emerald-400">CO₂e (kg) = Energy (kWh) × Emission Factor</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
