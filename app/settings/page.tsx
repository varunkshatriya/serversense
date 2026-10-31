'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Thermometer,
  Wind,
  Droplets,
  Clock,
  Zap,
} from 'lucide-react';
import { MonitoringSettings, SimulationScenario } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [tempWarn, setTempWarn] = useState<number>(30);
  const [tempCrit, setTempCrit] = useState<number>(35);
  const [gasWarn, setGasWarn] = useState<number>(400);
  const [humLow, setHumLow] = useState<number>(30);
  const [humHigh, setHumHigh] = useState<number>(70);
  const [intervalSec, setIntervalSec] = useState<number>(2);
  const [scenario, setScenario] = useState<SimulationScenario>('normal');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');
  const [powerWatts, setPowerWatts] = useState<number>(2400);
  const [emissionFactor, setEmissionFactor] = useState<number>(0.475);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setSettings(d);
            setTempWarn(d.temperatureWarning);
            setTempCrit(d.temperatureCritical);
            setGasWarn(d.gasWarning);
            setHumLow(d.humidityLow);
            setHumHigh(d.humidityHigh);
            setIntervalSec(d.refreshIntervalSeconds);
            setScenario(d.simulationScenario);
            setTimeFormat(d.timeFormat);
            setPowerWatts(d.powerRatingWatts);
            setEmissionFactor(d.gridEmissionFactorKgPerKwh);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    // Validation checks
    if (tempCrit <= tempWarn) {
      setErrorMsg('Critical temperature threshold must be strictly greater than warning threshold.');
      return;
    }

    if (humHigh <= humLow) {
      setErrorMsg('Upper humidity threshold must be strictly greater than lower humidity threshold.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatureWarning: tempWarn,
          temperatureCritical: tempCrit,
          gasWarning: gasWarn,
          humidityLow: humLow,
          humidityHigh: humHigh,
          refreshIntervalSeconds: intervalSec,
          simulationScenario: scenario,
          timeFormat,
          powerRatingWatts: powerWatts,
          gridEmissionFactorKgPerKwh: emissionFactor,
          soundEnabled: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Failed to update settings');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (confirm('Restore all thresholds and telemetry settings to factory defaults?')) {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore_defaults' }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setTempWarn(d.temperatureWarning);
          setTempCrit(d.temperatureCritical);
          setGasWarn(d.gasWarning);
          setHumLow(d.humidityLow);
          setHumHigh(d.humidityHigh);
          setIntervalSec(d.refreshIntervalSeconds);
          setScenario(d.simulationScenario);
          setTimeFormat(d.timeFormat);
          setPowerWatts(d.powerRatingWatts);
          setEmissionFactor(d.gridEmissionFactorKgPerKwh);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <DashboardShell
      title="System Settings & Threshold Tuning"
      subtitle="Configure temperature trip points, gas ADC triggers, humidity boundaries, and simulation dynamics."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
    >
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Settings successfully validated and synchronized to store.</span>
          </div>
        )}

        {/* Temperature Thresholds */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span>Thermal Safety Thresholds (°C)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">
                Warning Threshold (Elevated):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="60"
                  value={tempWarn}
                  onChange={(e) => setTempWarn(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
                <span className="text-slate-400">°C</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 30.0°C</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Critical Threshold (Buzzer & Red LED):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="25"
                  max="80"
                  value={tempCrit}
                  onChange={(e) => setTempCrit(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                />
                <span className="text-slate-400">°C</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 35.0°C (Must be &gt; Warning)</span>
            </div>
          </div>
        </div>

        {/* Gas & Humidity Thresholds */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Wind className="w-4 h-4 text-amber-400" />
            <span>Gas & Humidity Limits</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">
                Gas Sensor ADC Limit:
              </label>
              <input
                type="number"
                min="100"
                max="1000"
                value={gasWarn}
                onChange={(e) => setGasWarn(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 400 ADC (0-1023)</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Humidity Lower Limit (ESD Risk):
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={humLow}
                onChange={(e) => setHumLow(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 30% RH</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Humidity Upper Limit (Condensation):
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={humHigh}
                onChange={(e) => setHumHigh(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 70% RH</span>
            </div>
          </div>
        </div>

        {/* General Dashboard & Engine Settings */}
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Dashboard Refresh & Simulation Scenarios</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Telemetry Poll Rate:</label>
              <select
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value={1}>1 Second</option>
                <option value={2}>2 Seconds (Nominal)</option>
                <option value={5}>5 Seconds</option>
                <option value={10}>10 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Default Simulation Scenario:</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as SimulationScenario)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="normal">Nominal Operating Baseline</option>
                <option value="heatwave_hvac">HVAC Failure Overheat</option>
                <option value="gas_leak">Combustible Gas Spike</option>
                <option value="humidity_drift">Potentiometer Humidity Drift</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Time Format:</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as any)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="24h">24-Hour Military Format</option>
                <option value="12h">12-Hour AM/PM Format</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Factory Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Validating & Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
