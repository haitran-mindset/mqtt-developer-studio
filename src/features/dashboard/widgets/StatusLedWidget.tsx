import React, { useMemo } from 'react';
import type { DashboardWidgetConfig, StatusLedMapping } from '@/core/dashboard/types';

interface StatusLedWidgetProps {
  config: DashboardWidgetConfig;
  latestValue?: number | string;
}

const COLOR_CLASSES: Record<StatusLedMapping['color'], { bg: string; ring: string; text: string; glow: string }> = {
  emerald: {
    bg: 'bg-emerald-500',
    ring: 'border-emerald-500/30 bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.45)]',
  },
  amber: {
    bg: 'bg-amber-500',
    ring: 'border-amber-500/30 bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.45)]',
  },
  rose: {
    bg: 'bg-rose-500',
    ring: 'border-rose-500/30 bg-rose-500/10',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.45)]',
  },
  cyan: {
    bg: 'bg-cyan-500',
    ring: 'border-cyan-500/30 bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.45)]',
  },
  zinc: {
    bg: 'bg-zinc-500',
    ring: 'border-zinc-500/30 bg-zinc-500/10',
    text: 'text-zinc-400',
    glow: 'shadow-none',
  },
};

export const StatusLedWidget: React.FC<StatusLedWidgetProps> = ({ config, latestValue }) => {
  const mappings = config.statusMappings || [];

  const matchedMapping = useMemo(() => {
    if (latestValue === undefined || latestValue === null) return null;
    const strVal = String(latestValue).trim().toLowerCase();

    // Find custom mapping
    const found = mappings.find(
      (m) => m.value.trim().toLowerCase() === strVal
    );
    if (found) return found;

    // Fallback standard mappings
    if (['1', 'true', 'on', 'online', 'ok', 'active', 'armed'].includes(strVal)) {
      return { value: strVal, label: 'Active / OK', color: 'emerald' as const };
    }
    if (['warn', 'warning', 'standby', 'idle', 'paused'].includes(strVal)) {
      return { value: strVal, label: 'Warning / Idle', color: 'amber' as const };
    }
    if (['0', 'false', 'off', 'offline', 'error', 'fault', 'alarm', 'tripped'].includes(strVal)) {
      return { value: strVal, label: 'Offline / Fault', color: 'rose' as const };
    }

    return { value: strVal, label: String(latestValue), color: 'cyan' as const };
  }, [latestValue, mappings]);

  const colorStyles = matchedMapping
    ? COLOR_CLASSES[matchedMapping.color] || COLOR_CLASSES.cyan
    : COLOR_CLASSES.zinc;

  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
      {/* Beacon Light */}
      <div className="relative flex items-center justify-center my-2">
        <div
          className={`absolute w-12 h-12 rounded-full ${colorStyles.ring} border animate-pulse`}
        />
        <div
          className={`w-6 h-6 rounded-full ${colorStyles.bg} ${colorStyles.glow} transition-all duration-300 relative z-10 flex items-center justify-center`}
        >
          <div className="w-2 h-2 rounded-full bg-white/70" />
        </div>
      </div>

      {/* Label and Raw Value */}
      <div className="text-center mt-2">
        <h4 className={`text-base font-bold font-mono ${colorStyles.text}`}>
          {matchedMapping ? matchedMapping.label : 'Waiting for state...'}
        </h4>
        <span className="text-[11px] font-mono text-zinc-500">
          Raw: {latestValue !== undefined && latestValue !== null ? String(latestValue) : '--'}
        </span>
      </div>
    </div>
  );
};
