'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface LiveChartProps {
  data: {
    timestamp: string;
    value: number;
    secondaryValue?: number;
  }[];
  dataKey: string;
  name: string;
  unit?: string;
  color?: string;
  gradientId?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  height?: number;
  minDomain?: number;
  maxDomain?: number;
  timeFormat?: string;
}

export function LiveChart({
  data,
  dataKey,
  name,
  unit = '',
  color = '#06B6D4',
  gradientId = 'colorMetric',
  warningThreshold,
  criticalThreshold,
  height = 260,
  minDomain,
  maxDomain,
}: LiveChartProps) {
  // Format timestamps for X Axis (e.g. HH:mm:ss)
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ width: '100%', height }} className="relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
          />

          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
            domain={[
              minDomain !== undefined ? minDomain : 'dataMin - 1',
              maxDomain !== undefined ? maxDomain : 'dataMax + 1',
            ]}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="rounded-lg bg-[#0F172A] border border-[#1E293B] shadow-xl p-2.5 text-xs font-mono">
                    <p className="text-slate-400 mb-1">
                      {item.payload.timestamp ? new Date(item.payload.timestamp).toLocaleString() : ''}
                    </p>
                    <p className="text-white font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span>{name}:</span>
                      <span className="text-cyan-400">{item.value} {unit}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          {warningThreshold !== undefined && (
            <ReferenceLine
              y={warningThreshold}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{
                value: `Warn (${warningThreshold}${unit})`,
                fill: '#F59E0B',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}

          {criticalThreshold !== undefined && (
            <ReferenceLine
              y={criticalThreshold}
              stroke="#F43F5E"
              strokeDasharray="4 4"
              label={{
                value: `Crit (${criticalThreshold}${unit})`,
                fill: '#F43F5E',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
