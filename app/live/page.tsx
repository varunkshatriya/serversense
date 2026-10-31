'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Clock,
  Radio,
  Flame,
  Droplets,
  Thermometer,
  Zap,
} from 'lucide-react';
import { DashboardStats, MonitoringSettings, SensorReading, SimulationScenario } from '@/lib/types';

export default function LiveMonitoringPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>('normal');
  const [refreshInterval, setRefreshInterval] = useState<number>(2);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/readings?limit=60&tick=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setReadings(json.data.readings);
          setStats(json.data.stats);
          setSettings(json.data.settings);
          setIsSimRunning(json.data.simulationRunning);
          setCurrentScenario(json.data.scenario);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleTogglePlay = async () => {
    const action = isSimRunning ? 'pause' : 'start';
    await fetch('/api/simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setIsSimRunning(!isSimRunning);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset simulation readings and restore nominal baseline?')) {
      await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      fetchData();
    }
  };

  const handleScenarioChange = async (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    await fetch('/api/simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scenario', scenario }),
    });
    fetchData();
  };

  const current = stats?.currentReading || {
    temperatureC: 24.2,
    gasAdc: 115,
    humidityPercent: 48,
    overallStatus: 'NORMAL' as const,
    timestamp: '2026-10-31T12:00:00.000Z',
    source: 'simulation' as const,
    deviceId: 'server-room-01',
  };

  return (
    <DashboardShell
      title="Live Telemetry Console"
      subtitle="High-frequency telemetry stream with live scenario injection and pause/resume simulation controls."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Live Monitoring' }]}
      actions={
        <div className="flex items-center gap-2">
          {/* Simulation Mode Indicator */}
          {!stats?.isHardwareConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>SIMULATION ACTIVE</span>
            </div>
          )}

          {/* Start/Pause Control */}
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              isSimRunning
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
            }`}
          >
            {isSimRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimRunning ? 'Pause Engine' : 'Resume Engine'}</span>
          </button>

          {/* Reset Control */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        </div>
      }
    >
      {/* Simulation Scenario Bar & Refresh Rate Selector */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Test Scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'normal', label: 'Nominal Baseline (23.5°C)' },
              { id: 'heatwave_hvac', label: 'HVAC Failure (>35°C CRITICAL)' },
              { id: 'gas_leak', label: 'Gas / Smoke Outgassing (>400 ADC)' },
              { id: 'humidity_drift', label: 'Potentiometer Drift (<30% or >70%)' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id as SimulationScenario)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  currentScenario === sc.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-400">Stream Rate:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-[#1E293B] border border-[#334155] rounded px-2 py-1 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400"
          >
            <option value={1}>1.0s (Fast)</option>
            <option value={2}>2.0s (Nominal)</option>
            <option value={5}>5.0s (Battery Save)</option>
          </select>
        </div>
      </div>

      {/* Live Gauges Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Live Temperature Gauge */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span>Current Temperature</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                current.temperatureC >= (settings?.temperatureCritical ?? 35)
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : current.temperatureC >= (settings?.temperatureWarning ?? 30)
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {current.temperatureC >= (settings?.temperatureCritical ?? 35)
                ? 'CRITICAL OVERHEAT'
                : current.temperatureC >= (settings?.temperatureWarning ?? 30)
                ? 'WARNING ELEVATED'
                : 'NORMAL'}
            </span>
          </div>

          <div className="text-4xl font-extrabold font-mono text-white mb-2">
            {current.temperatureC.toFixed(1)} <span className="text-lg font-normal text-slate-400">°C</span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            TMP36 Sensor on Pin A3 • Delta: {stats?.tempTrend === 'up' ? '+0.2°C/min' : stats?.tempTrend === 'down' ? '-0.2°C/min' : 'Steady'}
          </p>
        </div>

        {/* Live Gas ADC Gauge */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Gas Sensor Conductivity</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                current.gasAdc >= (settings?.gasWarning ?? 400)
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {current.gasAdc >= (settings?.gasWarning ?? 400) ? 'COMBUSTION HAZARD' : 'SAFE / CLEAN'}
            </span>
          </div>

          <div className="text-4xl font-extrabold font-mono text-white mb-2">
            {current.gasAdc} <span className="text-lg font-normal text-slate-400">/ 1023 ADC</span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            MQ Gas Analog on Pin A0 • Uncalibrated ADC (Warning: ≥{settings?.gasWarning ?? 400})
          </p>
        </div>

        {/* Live Humidity Gauge */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Relative Humidity</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              POTENTIOMETER A1
            </span>
          </div>

          <div className="text-4xl font-extrabold font-mono text-white mb-2">
            {current.humidityPercent} <span className="text-lg font-normal text-slate-400">%</span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Safe Envelope: {settings?.humidityLow ?? 30}% - {settings?.humidityHigh ?? 70}% RH
          </p>
        </div>
      </div>

      {/* 60-Minute Real-Time Trend Chart */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Sensor Telemetry Window (Last 60 Readings)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates deterministically every {refreshInterval} seconds. Yellow line denotes 30°C Warning, Red line denotes 35°C Critical.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Latest Packet: {new Date(current.timestamp).toLocaleTimeString()}
          </div>
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
          gradientId="liveTempGrad"
          warningThreshold={settings?.temperatureWarning ?? 30}
          criticalThreshold={settings?.temperatureCritical ?? 35}
          height={320}
          minDomain={15}
          maxDomain={45}
        />
      </div>

      {/* Live Event Stream Table */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Live Ingested Telemetry Packets</span>
        </h3>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[#0F172A] border-b border-[#1E293B] text-slate-400 text-[11px]">
              <tr>
                <th className="py-2">Packet Timestamp</th>
                <th className="py-2">Device</th>
                <th className="py-2">Temperature (°C)</th>
                <th className="py-2">Gas Raw (ADC)</th>
                <th className="py-2">Pot Humidity (%)</th>
                <th className="py-2">Source</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {[...readings].reverse().slice(0, 15).map((r) => (
                <tr key={r.id} className="hover:bg-[#1E293B]/30 transition-colors">
                  <td className="py-2 text-slate-300">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 text-slate-400">{r.deviceId}</td>
                  <td className="py-2 text-slate-100 font-semibold">{r.temperatureC}°C</td>
                  <td className="py-2 text-amber-300">{r.gasAdc}</td>
                  <td className="py-2 text-cyan-300">{r.humidityPercent}%</td>
                  <td className="py-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        r.source === 'hardware'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        r.overallStatus === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : r.overallStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {r.overallStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
