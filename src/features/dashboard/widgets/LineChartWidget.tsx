import React, { useMemo } from 'react';
import type { DashboardWidgetConfig, TelemetryPoint } from '@/core/dashboard/types';

interface LineChartWidgetProps {
  config: DashboardWidgetConfig;
  data?: TelemetryPoint[];
  latestValue?: number | string;
}

const COLOR_MAP: Record<string, { stroke: string; fill: string; badge: string; text: string }> = {
  cyan: {
    stroke: '#06b6d4',
    fill: 'url(#gradient-cyan)',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    text: 'text-cyan-400',
  },
  emerald: {
    stroke: '#10b981',
    fill: 'url(#gradient-emerald)',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  violet: {
    stroke: '#8b5cf6',
    fill: 'url(#gradient-violet)',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    text: 'text-violet-400',
  },
  amber: {
    stroke: '#f59e0b',
    fill: 'url(#gradient-amber)',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
  },
  rose: {
    stroke: '#f43f5e',
    fill: 'url(#gradient-rose)',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    text: 'text-rose-400',
  },
};

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({
  config,
  data = [],
  latestValue,
}) => {
  const colorKey = config.color || 'cyan';
  const color = COLOR_MAP[colorKey] || COLOR_MAP.cyan;

  // Extract numerical series
  const numericPoints = useMemo(() => {
    return data
      .map((p) => (typeof p.value === 'number' ? p.value : parseFloat(String(p.value))))
      .filter((v) => !isNaN(v));
  }, [data]);

  const { minVal, maxVal, avgVal, latestNumeric } = useMemo(() => {
    if (numericPoints.length === 0) {
      const fallback = typeof latestValue === 'number' ? latestValue : parseFloat(String(latestValue || 0));
      return {
        minVal: config.min ?? 0,
        maxVal: config.max ?? 100,
        avgVal: isNaN(fallback) ? 0 : fallback,
        latestNumeric: isNaN(fallback) ? null : fallback,
      };
    }

    const min = config.min !== undefined ? config.min : Math.min(...numericPoints);
    const max = config.max !== undefined ? config.max : Math.max(...numericPoints);
    // Add small buffer if min === max
    const adjMax = max === min ? min + 10 : max;
    const sum = numericPoints.reduce((acc, v) => acc + v, 0);
    const avg = sum / numericPoints.length;
    const cur = numericPoints[numericPoints.length - 1];

    return {
      minVal: min,
      maxVal: adjMax,
      avgVal: avg,
      latestNumeric: cur,
    };
  }, [numericPoints, latestValue, config.min, config.max]);

  // Generate SVG coordinates (width=300, height=100, padding=12)
  const width = 300;
  const height = 90;
  const padTop = 10;
  const padBottom = 14;
  const chartHeight = height - padTop - padBottom;

  const { pathD, areaD, latestCoord } = useMemo(() => {
    if (numericPoints.length < 2) {
      return { pathD: '', areaD: '', latestCoord: null };
    }

    const range = maxVal - minVal || 1;
    const stepX = width / (numericPoints.length - 1);

    const coords = numericPoints.map((val, idx) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      const ratio = (clamped - minVal) / range;
      const x = idx * stepX;
      const y = height - padBottom - ratio * chartHeight;
      return { x, y };
    });

    // Build smooth bezier path
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = coords[coords.length - 1];
    const area = `${d} L ${last.x} ${height - padBottom} L ${coords[0].x} ${height - padBottom} Z`;

    return { pathD: d, areaD: area, latestCoord: last };
  }, [numericPoints, minVal, maxVal, width, height, chartHeight, padBottom]);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header Metric Summary */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-zinc-100">
            {latestNumeric !== null ? latestNumeric.toFixed(1) : '--'}
          </span>
          {config.unit && (
            <span className="text-sm font-semibold text-zinc-400 font-mono">
              {config.unit}
            </span>
          )}
        </div>

        {/* Quick Min/Max/Avg Stat Pills */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <span className="text-zinc-500">Min: <strong className="text-zinc-300 font-normal">{minVal.toFixed(0)}</strong></span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">Avg: <strong className="text-zinc-300 font-normal">{avgVal.toFixed(1)}</strong></span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">Max: <strong className="text-zinc-300 font-normal">{maxVal.toFixed(0)}</strong></span>
        </div>
      </div>

      {/* SVG Vector Chart */}
      <div className="w-full relative h-[90px] rounded-lg bg-zinc-950/60 border border-zinc-800/40 p-1 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${colorKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color.stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color.stroke} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1={padTop}
            x2={width}
            y2={padTop}
            stroke="#27272a"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />
          <line
            x1="0"
            y1={padTop + chartHeight / 2}
            x2={width}
            y2={padTop + chartHeight / 2}
            stroke="#27272a"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />
          <line
            x1="0"
            y1={height - padBottom}
            x2={width}
            y2={height - padBottom}
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill={color.fill} />}

          {/* Bezier Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color.stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Glowing Head Point */}
          {latestCoord && (
            <g>
              <circle
                cx={latestCoord.x}
                cy={latestCoord.y}
                r="6"
                fill={color.stroke}
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={latestCoord.x}
                cy={latestCoord.y}
                r="3.5"
                fill="#ffffff"
                stroke={color.stroke}
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {numericPoints.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Waiting for telemetry stream...
          </div>
        )}
      </div>
    </div>
  );
};
