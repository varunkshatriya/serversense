'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Volume2,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { AlertIncident } from '@/lib/types';

export default function AlertsIncidentsPage() {
  const [incidents, setIncidents] = useState<AlertIncident[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [filterSensor, setFilterSensor] = useState<'ALL' | 'TEMPERATURE' | 'GAS' | 'HUMIDITY'>('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIncidents(json.data.incidents);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'acknowledge' | 'resolve') => {
    try {
      setIsUpdating(id);
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterSensor !== 'ALL' && inc.sensorType !== filterSensor) return false;
    return true;
  });

  const activeCritical = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const activeWarning = incidents.filter((i) => i.severity === 'WARNING' && i.status !== 'RESOLVED').length;
  const totalResolved = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <DashboardShell
      title="Environmental Alerts & Incident Management"
      subtitle="Threshold excursion events, severity routing, alarm acknowledgment, and incident resolution audit trail."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Alerts & Incidents' }]}
      actions={
        <a
          href="/api/export?type=alerts"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Incidents (CSV)</span>
        </a>
      }
    >
      {/* Visual Buzzer & Triage Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-rose-500/40 p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
              Active Critical Excursions
            </span>
            <span className="text-3xl font-extrabold font-mono text-white">
              {activeCritical}
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Requires immediate physical triage</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-amber-500/40 p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
              Active Warning Alerts
            </span>
            <span className="text-3xl font-extrabold font-mono text-white">
              {activeWarning}
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Elevated thermal / humidity drift</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Resolved Incidents
            </span>
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalResolved}
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Historical incident log preserved</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="bg-[#1E293B] border border-[#334155] rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#1E293B] border border-[#334155] rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="ACTIVE">ACTIVE (Unacknowledged)</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {/* Sensor Filter */}
          <select
            value={filterSensor}
            onChange={(e) => setFilterSensor(e.target.value as any)}
            className="bg-[#1E293B] border border-[#334155] rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Sensors</option>
            <option value="TEMPERATURE">Temperature (TMP36 A3)</option>
            <option value="GAS">Combustible Gas (MQ A0)</option>
            <option value="HUMIDITY">Humidity (Pot A1)</option>
          </select>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto mb-3" />
            <p className="text-white font-semibold text-sm">No incidents match current filter criteria.</p>
            <p className="text-slate-400 text-[11px] mt-1">Environmental telemetry is currently compliant or filtered out.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B1120] border-b border-[#1E293B] text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Sensor</th>
                  <th className="p-3.5">Measured / Threshold</th>
                  <th className="p-3.5">Incident Reason</th>
                  <th className="p-3.5">First Seen / Last Seen</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/40">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#1E293B]/30 transition-colors">
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-slate-200 font-semibold">{inc.sensorType}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="text-white font-bold">{inc.measuredValue}</span>
                      <span className="text-slate-400"> (limit: {inc.threshold})</span>
                    </td>
                    <td className="p-3.5 text-slate-200 max-w-sm">
                      <p className="leading-snug">{inc.message}</p>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400">
                      <div>First: {new Date(inc.firstSeenAt).toLocaleTimeString()}</div>
                      <div>Last: {new Date(inc.lastSeenAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          inc.status === 'ACTIVE'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : inc.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {inc.status === 'ACTIVE' && (
                        <button
                          disabled={isUpdating === inc.id}
                          onClick={() => handleAction(inc.id, 'acknowledge')}
                          className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-colors text-[11px]"
                        >
                          Acknowledge
                        </button>
                      )}
                      {inc.status !== 'RESOLVED' && (
                        <button
                          disabled={isUpdating === inc.id}
                          onClick={() => handleAction(inc.id, 'resolve')}
                          className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-colors text-[11px]"
                        >
                          Resolve
                        </button>
                      )}
                      {inc.status === 'RESOLVED' && (
                        <span className="text-emerald-400 text-[11px] flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
