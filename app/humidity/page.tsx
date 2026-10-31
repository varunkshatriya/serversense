'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Droplets,
  Download,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { MonitoringSettings, SensorReading } from '@/lib/types';

export default function HumidityMonitoringPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);

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
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const humidity = latestReading ? latestReading.humidityPercent : 48;
  const lowLimit = settings?.humidityLow ?? 30;
  const highLimit = settings?.humidityHigh ?? 70;

  const isLowViolation = humidity < lowLimit;
  const isHighViolation = humidity > highLimit;
  const isOutOfRange = isLowViolation || isHighViolation;

  const countOutOfRange = readings.filter(
    (r) => r.humidityPercent < lowLimit || r.humidityPercent > highLimit
  ).length;
  const percentOutOfRange = readings.length > 0 ? Math.round((countOutOfRange / readings.length) * 100) : 0;

  return (
    <DashboardShell
      title="Relative Humidity & Electrostatic Risk Monitoring"
      subtitle="Rack-level humidity tracking with ESD risk detection (<30% RH) and condensation boundaries (>70% RH)."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Humidity Monitoring' }]}
      actions={
        <div className="flex items-center gap-2">
          {/* Simulated Input Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>SIMULATED INPUT (A1 POTENTIOMETER)</span>
          </div>

          <a
            href="/api/export?type=readings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      }
    >
      {/* Simulation Lineage Callout */}
      <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-300 block mb-0.5">
            Hardware Architecture Note: Potentiometer Emulation
          </strong>
          In the physical laboratory circuit, relative humidity is simulated via a linear 10kΩ potentiometer connected to Arduino pin A1 and mapped mathematically from 0–1023 ADC to 0–100% RH. This telemetry should not be confused with a physical capacitive hygrometer. The application is built with a future-proof data abstraction to seamlessly ingest real DHT22 or SHT31 I2C digital sensors without database or UI modifications.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Current Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mb-1">
            {humidity} <span className="text-sm font-normal text-slate-400">% RH</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Acceptable envelope: {lowLimit}% – {highLimit}% RH
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Time Outside Range</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mb-1">
            {percentOutOfRange}%
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {countOutOfRange} of {readings.length} captured samples
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Envelope Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono mb-1 ${
              isLowViolation
                ? 'text-amber-400'
                : isHighViolation
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {isLowViolation
              ? 'LOW (ESD RISK)'
              : isHighViolation
              ? 'HIGH (CONDENSATION)'
              : 'COMPLIANT'}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {isOutOfRange ? 'Warning threshold excursion' : 'Within ASHRAE recommended range'}
          </p>
        </div>
      </div>

      {/* Main Humidity Chart */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Relative Humidity Trend & Safe Band Boundaries</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target operating band: {lowLimit}% (lower bound) to {highLimit}% (upper bound).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Window: Last {readings.length} readings
          </span>
        </div>

        <LiveChart
          data={readings.map((r) => ({
            timestamp: r.timestamp,
            value: r.humidityPercent,
          }))}
          dataKey="value"
          name="Humidity"
          unit="%"
          color="#06B6D4"
          gradientId="humidityMainGrad"
          warningThreshold={highLimit}
          height={300}
          minDomain={0}
          maxDomain={100}
        />
      </div>

      {/* Risk Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Low Humidity Risks (&lt;30% RH)</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dry air drastically accelerates electrostatic discharge (ESD) accumulation across server chassis and technician clothing. Static potentials exceeding 1,000V can permanently damage sensitive CMOS circuitry, network PHY transceiver chips, and PCIe motherboard traces without visible sparking.
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-rose-400" />
            <span>High Humidity Risks (&gt;70% RH)</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Moisture accumulation approaching dew point temperatures causes micro-condensation inside server power supplies and copper heatsink fins. Over time, high humidity causes galvanic corrosion, conductive anodic filament (CAF) growth across PCB vias, and tape drive read errors.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
