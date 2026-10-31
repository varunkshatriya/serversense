'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  AlertTriangle,
  FileText,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeAlertCount?: number;
}

export function Sidebar({ activeAlertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Live Monitoring', href: '/live', icon: Activity },
    { label: 'Temperature Analytics', href: '/temperature', icon: Thermometer },
    { label: 'Gas Monitoring', href: '/gas', icon: Wind },
    { label: 'Humidity Monitoring', href: '/humidity', icon: Droplets },
    { label: 'Energy & Carbon', href: '/energy', icon: Zap },
    {
      label: 'Alerts & Incidents',
      href: '/alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
    },
    { label: 'Historical Reports', href: '/reports', icon: FileText },
    { label: 'Device Management', href: '/devices', icon: Cpu },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-[#1E293B] bg-[#0B1120] flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1E293B]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Server className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                  ServerSense <span className="text-xs text-cyan-400 font-mono">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-tight">Rack Telemetry & Safety</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-[#0F172A] hover:text-white border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 truncate text-xs font-medium tracking-wide">
                    {item.label}
                  </span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1E293B]">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-[11px] overflow-hidden">
              <p className="text-slate-200 font-semibold truncate">Target: Rack Alpha</p>
              <p className="text-slate-400 font-mono text-[10px]">FW: v1.2.4-senser</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
