'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LiveChart } from '@/components/dashboard/LiveChart';
import {
  Wind,
  Download,
  AlertTriangle,
  Flame,
  ShieldCheck,
  HelpCircle,
  Cpu,
  FileWarning,
} from 'lucide-react';
import { MonitoringSettings, SensorReading } from '@/lib/types';

export default function GasMonitoringPage() {
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
  const gasAdc = latestReading ? latestReading.gasAdc : 115;
  const threshold = settings?.gasWarning ?? 400;
  const isHazard = gasAdc >= threshold;

  return (
    <DashboardShell
      title="Gas Sensor ADC Telemetry & Air Quality"
      subtitle="Raw analog-to-digital converter (0-1023) conductivity readings from the Arduino MQ sensor circuit."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gas Monitoring' }]}
      actions={
        <a
          href="/api/export?type=readings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Gas Log (CSV)</span>
        </a>
      }
    >
      {/* Important Engineering Calibration Disclaimer Banner */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-6 flex items-start gap-3">
        <FileWarning className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-amber-300 block mb-0.5">
            Engineering Precision Notice: Raw ADC Metric (0-1023)
          </strong>
          This interface strictly visualizes uncalibrated analog voltage conversion from the MQ gas sensor on Arduino pin A0.
          It does <strong>not</strong> represent calibrated CO₂ ppm, nor does it measure environmental greenhouse gas emissions.
          Chemo-resistive tin-dioxide (SnO₂) sensors exhibit broad cross-sensitivity to volatile organic compounds (VOCs), hydrogen, and smoke particles.
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Current Gas Reading</span>
            <Wind className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mb-1">
            {gasAdc} <span className="text-sm font-normal text-slate-400">/ 1023 ADC</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Voltage equivalent: {((gasAdc * 5.0) / 1023).toFixed(2)}V
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Configured Critical Limit</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mb-1">
            ≥ {threshold} ADC
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Triggers Red LED (D2) and Piezo Buzzer (D4)
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Condition Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono mb-1 ${
              isHazard ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {isHazard ? 'SMOKE / GAS HAZARD' : 'CLEAN AIR BASELINE'}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {isHazard ? 'Immediate containment recommended' : 'Conductivity within clean room range'}
          </p>
        </div>
      </div>

      {/* Main Gas Sensor ADC Chart */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-amber-400" />
              <span>Raw Sensor Voltage Progression (ADC 0-1023)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous analog telemetry. Red dashed line indicates the configured threshold ({threshold} ADC).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Window: Last {readings.length} readings
          </span>
        </div>

        <LiveChart
          data={readings.map((r) => ({
            timestamp: r.timestamp,
            value: r.gasAdc,
          }))}
          dataKey="value"
          name="Gas ADC"
          unit="ADC"
          color="#F59E0B"
          gradientId="gasMainGrad"
          criticalThreshold={threshold}
          height={300}
          minDomain={0}
          maxDomain={1023}
        />
      </div>

      {/* Technical Calibration & Physical Limitations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Hardware Circuit & Pin Connection</span>
          </h3>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Sensor Model:</span>
              <span className="text-white">MQ-2 / MQ-135 Gas Sensor Breakout</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Arduino Pin:</span>
              <span className="text-cyan-400">Analog Pin A0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">ADC Resolution:</span>
              <span className="text-white">10-bit (1024 discrete steps, 0 to 5.0V)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Pre-heat Time:</span>
              <span className="text-white">24 hours minimum recommended for SnO₂ stabilization</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Sensor Behavior & Cross-Sensitivity</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The sensing material exhibits decreased internal resistance (Rs) in the presence of deoxidizing gases. Because the internal heater resistance changes with ambient room temperature and relative humidity, true chemical concentration quantification requires an environmental calibration chamber and a dual-channel NDIR reference sensor.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
