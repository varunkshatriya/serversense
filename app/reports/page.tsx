'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  FileText,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
} from 'lucide-react';
import { SensorReading, Severity } from '@/lib/types';

export default function HistoricalReportsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof SensorReading>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/readings?limit=250');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setReadings(json.data.readings);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Filter readings
  const filtered = readings.filter((r) => {
    if (statusFilter !== 'ALL' && r.overallStatus !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDevice = r.deviceId.toLowerCase().includes(term);
      const matchId = r.id.toLowerCase().includes(term);
      const matchTemp = r.temperatureC.toString().includes(term);
      const matchGas = r.gasAdc.toString().includes(term);
      if (!matchDevice && !matchId && !matchTemp && !matchGas) return false;
    }
    return true;
  });

  // Sort readings
  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined || valB === undefined) return 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedReadings = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: keyof SensorReading) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const normalCount = readings.filter((r) => r.overallStatus === 'NORMAL').length;
  const warnCount = readings.filter((r) => r.overallStatus === 'WARNING').length;
  const critCount = readings.filter((r) => r.overallStatus === 'CRITICAL').length;

  return (
    <DashboardShell
      title="Historical Telemetry Audit & Reports"
      subtitle="Searchable sensor database archive, source classification (simulated vs hardware), and CSV compliance exports."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Historical Reports' }]}
      actions={
        <a
          href="/api/export?type=readings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-mono font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Filtered Dataset (CSV)</span>
        </a>
      }
    >
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4 text-xs font-mono">
          <span className="text-slate-400 block mb-1">Archived Readings</span>
          <span className="text-2xl font-bold text-white">{readings.length}</span>
        </div>
        <div className="rounded-xl bg-[#0F172A] border border-emerald-500/30 p-4 text-xs font-mono">
          <span className="text-emerald-400 block mb-1">Normal Packets</span>
          <span className="text-2xl font-bold text-emerald-400">{normalCount}</span>
        </div>
        <div className="rounded-xl bg-[#0F172A] border border-amber-500/30 p-4 text-xs font-mono">
          <span className="text-amber-400 block mb-1">Warning Events</span>
          <span className="text-2xl font-bold text-amber-400">{warnCount}</span>
        </div>
        <div className="rounded-xl bg-[#0F172A] border border-rose-500/30 p-4 text-xs font-mono">
          <span className="text-rose-400 block mb-1">Critical Excursions</span>
          <span className="text-2xl font-bold text-rose-400">{critCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono flex-1">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, Device, Value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">NORMAL Only</option>
            <option value="WARNING">WARNING Only</option>
            <option value="CRITICAL">CRITICAL Only</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Sources</option>
            <option value="simulation">SIMULATION Only</option>
            <option value="hardware">HARDWARE Only</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing {sorted.length} matching records
        </div>
      </div>

      {/* Main Historical Table */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] border-b border-[#1E293B] text-slate-400 text-[11px]">
              <tr>
                <th
                  onClick={() => toggleSort('timestamp')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Timestamp (UTC/Local)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('deviceId')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Device ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('temperatureC')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Temperature</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('gasAdc')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Gas (Raw ADC)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('humidityPercent')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Sim. Humidity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Source Lineage</th>
                <th
                  onClick={() => toggleSort('overallStatus')}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {pagedReadings.map((r) => (
                <tr key={r.id} className="hover:bg-[#1E293B]/30 transition-colors">
                  <td className="p-3.5 text-slate-300">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-slate-400">{r.deviceId}</td>
                  <td className="p-3.5 text-slate-100 font-semibold">{r.temperatureC}°C</td>
                  <td className="p-3.5 text-amber-300 font-semibold">{r.gasAdc} / 1023</td>
                  <td className="p-3.5 text-cyan-300 font-semibold">{r.humidityPercent}%</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        r.source === 'hardware'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {r.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        r.overallStatus === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : r.overallStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div>
          Page {currentPage} of {totalPages} ({sorted.length} total readings)
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
