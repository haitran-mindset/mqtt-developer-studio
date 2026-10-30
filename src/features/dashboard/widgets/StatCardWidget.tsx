import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';
import type { DashboardWidgetConfig, TelemetryPoint } from '@/core/dashboard/types';

interface StatCardWidgetProps {
  config: DashboardWidgetConfig;
  data?: TelemetryPoint[];
  latestValue?: number | string;
}

export const StatCardWidget: React.FC<StatCardWidgetProps> = ({
  config,
  data = [],
  latestValue,
}) => {
  // Delta calculation compared to previous point
  const { delta, deltaPercentage, trend } = useMemo(() => {
    if (data.length < 2) return { delta: 0, deltaPercentage: 0, trend: 'neutral' as const };
    const curr = typeof data[data.length - 1].value === 'number'
      ? (data[data.length - 1].value as number)
      : parseFloat(String(data[data.length - 1].value));

    const prev = typeof data[data.length - 2].value === 'number'
      ? (data[data.length - 2].value as number)
      : parseFloat(String(data[data.length - 2].value));

    if (isNaN(curr) || isNaN(prev)) return { delta: 0, deltaPercentage: 0, trend: 'neutral' as const };

    const diff = curr - prev;
    const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;

    return {
      delta: diff,
      deltaPercentage: pct,
      trend: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
    };
  }, [data]);

  const displayVal = useMemo(() => {
    if (latestValue === undefined || latestValue === null) return '--';
    if (typeof latestValue === 'number') {
      return Number.isInteger(latestValue) ? latestValue.toString() : latestValue.toFixed(2);
    }
    return String(latestValue);
  }, [latestValue]);

  return (
    <div className="flex flex-col justify-between h-full py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          Current Telemetry
        </span>

        {/* Trend Delta Pill */}
        {trend !== 'neutral' && (
          <div
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(deltaPercentage).toFixed(1)}%</span>
          </div>
        )}
        {trend === 'neutral' && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
            <Minus className="h-3 w-3" />
            <span>0.0%</span>
          </div>
        )}
      </div>

      {/* Hero Number */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight font-mono text-zinc-100">
            {displayVal}
          </span>
          {config.unit && (
            <span className="text-base font-semibold font-mono text-cyan-400">
              {config.unit}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60">
        <span>History: {data.length} pts</span>
        <span>
          {data.length > 0
            ? new Date(data[data.length - 1].timestamp).toLocaleTimeString()
            : 'No events yet'}
        </span>
      </div>
    </div>
  );
};
