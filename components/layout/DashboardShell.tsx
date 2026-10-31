'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardStats } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  breadcrumbs = [{ label: 'Dashboard', href: '/' }],
  actions,
}: DashboardShellProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Poll for background telemetry sync
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/readings?limit=1');
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setStats(json.data.stats);
          }
        }
      } catch {
        // graceful offline fallback
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar activeAlertCount={stats?.activeAlertCount ?? 0} />

      {/* Main Content Pane */}
      <div className="flex-1 ml-20 lg:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <Header
          isHardwareConnected={stats?.isHardwareConnected ?? false}
          buzzerActive={stats?.buzzerActive ?? false}
          activeAlertCount={stats?.activeAlertCount ?? 0}
          overallStatus={stats?.overallStatus ?? 'NORMAL'}
        />

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {/* Breadcrumb & Action Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-mono">
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                    {bc.href ? (
                      <Link href={bc.href} className="hover:text-cyan-400 transition-colors">
                        {bc.label}
                      </Link>
                    ) : (
                      <span className="text-slate-200">{bc.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
              )}
            </div>

            {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
          </div>

          {/* Child Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
