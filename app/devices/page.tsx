'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  Cpu,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Cable,
} from 'lucide-react';
import { DeviceInfo } from '@/lib/types';

export default function DeviceManagementPage() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchDevice = async () => {
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDevice(json.data.device);
          setIsConnected(json.data.isConnected);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDevice();
    const interval = setInterval(fetchDevice, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <DashboardShell
      title="Hardware Device & Serial Gateway Management"
      subtitle="Microcontroller connection state, Arduino UNO R3 pinout mapping, and local telemetry bridge setup."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Device Management' }]}
      actions={
        <button
          onClick={fetchDevice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Poll Gateway State</span>
        </button>
      }
    >
      {/* Device Status Header Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hardware Link Status
            </span>
            <Cable className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2.5 my-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span
              className={`text-xl font-bold font-mono ${
                isConnected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isConnected ? 'HARDWARE ONLINE' : 'SIMULATION MODE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {isConnected
              ? 'Receiving active packets via USB serial'
              : 'Physical Arduino serial stream not detected. Emulating telemetry.'}
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Microcontroller
            </span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white my-2">
            {device?.boardType || 'Arduino UNO R3'}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Firmware: <span className="text-cyan-400">{device?.firmwareVersion || '1.2.4-senser'}</span> • Baud: 9600
          </p>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Telemetry Ingestion Gateway
            </span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 my-2">
            POST /api/readings
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Last seen: {device?.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'Awaiting hardware packet'}
          </p>
        </div>
      </div>

      {/* Arduino UNO Pinout Diagram & Map */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Arduino UNO R3 Wiring Pinout Architecture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Circuit pin assignments preserved strictly from hardware schematic.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Validated Schematic
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] border-b border-[#1E293B] text-slate-400 text-[11px]">
              <tr>
                <th className="p-3">Component</th>
                <th className="p-3">Arduino Pin</th>
                <th className="p-3">Interface Type</th>
                <th className="p-3">Function / Protocol Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {(device?.pinout || []).map((p, idx) => (
                <tr key={idx} className="hover:bg-[#1E293B]/30 transition-colors">
                  <td className="p-3 text-white font-semibold">{p.component}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {p.pin}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{p.type}</td>
                  <td className="p-3 text-slate-300">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Guided Setup for Gateway Bridge */}
      <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Local Serial-to-HTTP Gateway Instructions</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Standard web browsers cannot directly open physical USB COM ports without explicit serial permissions. Use our bundled Node.js gateway bridge to forward Arduino 9600-baud serial data to the ServerSense API.
        </p>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-white mb-1">
                Flash Arduino Firmware
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                Open <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">scripts/arduino_serversense.ino</code> in the Arduino IDE and upload to your board on 9600 baud.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-white mb-1">
                Start Physical USB Serial Bridge
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                Run the bundled gateway script with your Arduino COM port (e.g., COM3 on Windows or /dev/ttyUSB0 on Linux):
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs font-mono text-cyan-300">
                <code>node scripts/gateway.js --port COM3 --baud 9600</code>
                <button
                  onClick={() => copyToClipboard('node scripts/gateway.js --port COM3 --baud 9600', 'cmd1')}
                  className="p-1 hover:text-white"
                  title="Copy command"
                >
                  {copiedCmd === 'cmd1' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-white mb-1">
                Optional: Test Hardware Gateway Mode Without Physical Board
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                If your physical board is currently disconnected, run the emulator to test hardware streaming packets into the dashboard:
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs font-mono text-emerald-300">
                <code>node scripts/gateway.js --test-hardware</code>
                <button
                  onClick={() => copyToClipboard('node scripts/gateway.js --test-hardware', 'cmd2')}
                  className="p-1 hover:text-white"
                  title="Copy command"
                >
                  {copiedCmd === 'cmd2' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
