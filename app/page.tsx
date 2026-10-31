'use client';

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Thermometer,
  Wind,
  Droplets,
  HeartPulse,
  AlertTriangle,
  Cpu,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { AlertIncident, DashboardStats, MonitoringSettings, SensorReading } from '@/lib/types';

export default function OverviewPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [incidents, setIncidents] = useState<AlertIncident[]>([]);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      // Fetch readings with tick=true to advance simulation step smoothly
      const [readingsRes, alertsRes] = await Promise.all([
        fetch('/api/readings?limit=30&tick=true'),
        fetch('/api/alerts'),
      ]);

      if (readingsRes.ok) {
        const json = await readingsRes.json();
        if (json.success) {
          setReadings(json.data.readings);
          setStats(json.data.stats);
          setSettings(json.data.settings);
          setIsSimRunning(json.data.simulationRunning);
        }
      }

      if (alertsRes.ok) {
        const alertJson = await alertsRes.json();
        if (alertJson.success) {
          setIncidents(alertJson.data.incidents.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Error fetching dashboard telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulation = async () => {
    try {
      const action = isSimRunning ? 'pause' : 'start';
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setIsSimRunning(!isSimRunning);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSimulation = async () => {
    if (confirm('Reset simulation telemetry and restore baseline seed data?')) {
      await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      fetchData();
    }
  };

  const current = stats?.currentReading || {
    temperatureC: 24.2,
    gasAdc: 115,
    humidityPercent: 48,
    overallStatus: 'NORMAL' as const,
    timestamp: '2026-10-31T12:00:00.000Z',
  };

  const prev = stats?.previousReading;

  // Prepare chart series
  const tempChartData = readings.map((r) => ({
    timestamp: r.timestamp,
    value: r.temperatureC,
  }));

  const gasChartData = readings.map((r) => ({
    timestamp: r.timestamp,
    value: r.gasAdc,
  }));

  const humidityChartData = readings.map((r) => ({
    timestamp: r.timestamp,
    value: r.humidityPercent,
  }));

  return (
    <DashboardShell
      title="Server Room Environmental Overview"
      subtitle="Live multi-sensor telemetry, thermal thresholds, and automated incident prevention for Rack-Alpha."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Overview' }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              isSimRunning
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimRunning ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
          <button
            onClick={handleResetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      }
    >
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Temperature KPI */}
        <KpiCard
          title="Rack Temperature"
          value={current.temperatureC.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          status={
            current.temperatureC >= (settings?.temperatureCritical ?? 35)
              ? 'CRITICAL'
              : current.temperatureC >= (settings?.temperatureWarning ?? 30)
              ? 'WARNING'
              : 'NORMAL'
          }
          trend={stats?.tempTrend}
          trendLabel={prev ? `prev ${prev.temperatureC.toFixed(1)}°C` : undefined}
          minMax={stats ? { min: stats.minTemp, max: stats.maxTemp } : undefined}
          thresholdNote={`Warn: ${settings?.temperatureWarning ?? 30}°C | Crit: ${settings?.temperatureCritical ?? 35}°C`}
          badge={
            current.temperatureC >= (settings?.temperatureCritical ?? 35)
              ? 'CRITICAL'
              : current.temperatureC >= (settings?.temperatureWarning ?? 30)
              ? 'WARNING'
              : 'NORMAL'
          }
          accentColor="rose"
        />

        {/* Gas Sensor KPI */}
        <KpiCard
          title="Combustible Gas / Smoke"
          value={current.gasAdc}
          unit="ADC (0-1023)"
          icon={Wind}
          status={current.gasAdc >= (settings?.gasWarning ?? 400) ? 'CRITICAL' : 'NORMAL'}
          trend={stats?.gasTrend}
          trendLabel={prev ? `prev ${prev.gasAdc}` : undefined}
          thresholdNote={`Trigger: ≥${settings?.gasWarning ?? 400} ADC`}
          badge={current.gasAdc >= (settings?.gasWarning ?? 400) ? 'HAZARD' : 'SAFE'}
          subtitle="Uncalibrated raw analog conductivity (MQ sensor A0), not CO₂ ppm"
          accentColor="amber"
        />

        {/* Humidity KPI */}
        <KpiCard
          title="Potentiometer Humidity"
          value={current.humidityPercent}
          unit="%"
          icon={Droplets}
          status={
            current.humidityPercent < (settings?.humidityLow ?? 30) ||
            current.humidityPercent > (settings?.humidityHigh ?? 70)
              ? 'WARNING'
              : 'NORMAL'
          }
          trend={stats?.humidityTrend}
          trendLabel={prev ? `prev ${prev.humidityPercent}%` : undefined}
          thresholdNote={`Safe: ${settings?.humidityLow ?? 30}% - ${settings?.humidityHigh ?? 70}%`}
          badge="SIMULATED INPUT"
          subtitle="Mapped 0-100% via A1 potentiometer input"
          accentColor="cyan"
        />

        {/* System Health KPI */}
        <KpiCard
          title="System & Circuit Health"
          value={stats?.overallStatus ?? 'NORMAL'}
          icon={HeartPulse}
          status={stats?.overallStatus ?? 'NORMAL'}
          thresholdNote={`Uptime: ${Math.floor((stats?.uptimeSeconds ?? 0) / 60)}m ${
            (stats?.uptimeSeconds ?? 0) % 60
          }s`}
          badge={stats?.isHardwareConnected ? 'HARDWARE ONLINE' : 'SIMULATION MODE'}
          subtitle={
            stats?.activeAlertCount === 0
              ? '0 active alerts • Sensors nominal'
              : `${stats?.activeAlertCount} active environmental incident(s)`
          }
          accentColor={
            stats?.overallStatus === 'CRITICAL'
              ? 'rose'
              : stats?.overallStatus === 'WARNING'
              ? 'amber'
              : 'emerald'
          }
        />
      </div>

      {/* Primary Charts Row: Large Live Temperature + Smaller Gas & Humidity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Large Temperature Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span>Live Thermal Gradient & Threshold Tracking</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuous real-time temperature curve with warning (30°C) and critical (35°C) limits
              </p>
            </div>
            <Link
              href="/temperature"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium font-mono"
            >
              <span>Deep Analytics</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <LiveChart
            data={tempChartData}
            dataKey="value"
            name="Temperature"
            unit="°C"
            color="#38BDF8"
            gradientId="overviewTempGrad"
            warningThreshold={settings?.temperatureWarning ?? 30}
            criticalThreshold={settings?.temperatureCritical ?? 35}
            height={280}
            minDomain={15}
            maxDomain={45}
          />
        </div>

        {/* Side Stack: Gas & Humidity mini-charts */}
        <div className="space-y-6">
          {/* Gas Sensor Chart */}
          <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                <span>Raw Gas Sensor ADC (A0)</span>
              </h4>
              <Link href="/gas" className="text-[11px] text-amber-400 hover:underline font-mono">
                Inspect
              </Link>
            </div>
            <LiveChart
              data={gasChartData}
              dataKey="value"
              name="Gas ADC"
              unit="ADC"
              color="#F59E0B"
              gradientId="overviewGasGrad"
              criticalThreshold={settings?.gasWarning ?? 400}
              height={105}
              minDomain={50}
              maxDomain={700}
            />
          </div>

          {/* Humidity Chart */}
          <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulated Humidity (A1)</span>
              </h4>
              <Link href="/humidity" className="text-[11px] text-cyan-400 hover:underline font-mono">
                Inspect
              </Link>
            </div>
            <LiveChart
              data={humidityChartData}
              dataKey="value"
              name="Humidity"
              unit="%"
              color="#06B6D4"
              gradientId="overviewHumGrad"
              warningThreshold={settings?.humidityHigh ?? 70}
              height={105}
              minDomain={10}
              maxDomain={100}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Alert Incidents + Device Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents Panel */}
        <div className="lg:col-span-2 rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Active Environmental Incidents</h3>
            </div>
            <Link
              href="/alerts"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
            >
              <span>Manage All ({stats?.activeAlertCount ?? 0})</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {incidents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <ShieldAlert className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">All telemetry within safe baseline.</p>
              <p className="text-[11px] text-slate-400 mt-1">No pending warnings or critical overheat alarms.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E293B] text-slate-400 text-[11px]">
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Sensor</th>
                    <th className="pb-2">Value / Limit</th>
                    <th className="pb-2">Trigger Reason</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/50">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#1E293B]/30 transition-colors">
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{inc.sensorType}</td>
                      <td className="py-2.5 text-slate-200">
                        {inc.measuredValue} / {inc.threshold}
                      </td>
                      <td className="py-2.5 text-slate-300 max-w-xs truncate" title={inc.message}>
                        {inc.message}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            inc.status === 'ACTIVE'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device Status Summary */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Microcontroller Link</span>
              </h3>
              <Link href="/devices" className="text-xs text-cyan-400 hover:underline font-mono">
                Pinout & Port
              </Link>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]">
                <span className="text-slate-400">Target Board:</span>
                <span className="text-slate-200 font-semibold">Arduino UNO R3</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]">
                <span className="text-slate-400">Connection Mode:</span>
                <span
                  className={
                    stats?.isHardwareConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                  }
                >
                  {stats?.isHardwareConnected ? 'USB Serial Gateway' : 'Deterministic Simulation'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]">
                <span className="text-slate-400">Baud Rate:</span>
                <span className="text-slate-300">9600 baud</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1E293B]">
                <span className="text-slate-400">Buzzer (D4):</span>
                <span className={stats?.buzzerActive ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'}>
                  {stats?.buzzerActive ? 'SOUNDING ALARM' : 'QUIET'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Data Freshness:</span>
                <span className="text-cyan-400">Active Stream (2s)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B]">
            <Link
              href="/live"
              className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-colors"
            >
              <span>Open Dedicated Live Monitoring Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
