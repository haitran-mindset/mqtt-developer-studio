import React, { useMemo } from 'react';
import type { DashboardWidgetConfig } from '@/core/dashboard/types';

interface GaugeWidgetProps {
  config: DashboardWidgetConfig;
  latestValue?: number | string;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({ config, latestValue }) => {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const range = max - min || 1;

  const numericValue = useMemo(() => {
    if (latestValue === undefined || latestValue === null) return null;
    const num = typeof latestValue === 'number' ? latestValue : parseFloat(String(latestValue));
    return isNaN(num) ? null : num;
  }, [latestValue]);

  const percentage = useMemo(() => {
    if (numericValue === null) return 0;
    const clamped = Math.max(min, Math.min(max, numericValue));
    return (clamped - min) / range;
  }, [numericValue, min, max, range]);

  // SVG Gauge calculations
  // Angle arc: from 150 deg to 390 deg (240 deg total arc)
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Total circumference for full circle = 2 * PI * r
  const circumference = 2 * Math.PI * radius;
  // Arc length for 240 degrees:
  const arcLength = (240 / 360) * circumference;
  // Dash offset for filled portion:
  const filledLength = arcLength * percentage;
  const strokeDashoffset = arcLength - filledLength;

  // Threshold color
  const color = useMemo(() => {
    if (percentage > 0.85) return '#f43f5e'; // Rose / Danger
    if (percentage > 0.65) return '#f59e0b'; // Amber / Warning
    if (config.color === 'emerald') return '#10b981';
    if (config.color === 'violet') return '#8b5cf6';
    if (config.color === 'amber') return '#f59e0b';
    return '#06b6d4'; // Default cyan
  }, [percentage, config.color]);

  return (
    <div className="flex flex-col items-center justify-center h-full relative py-1">
      {/* SVG Radial Gauge */}
      <div className="relative w-[150px] h-[120px] flex items-center justify-center overflow-visible">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[150deg] overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Value Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Readout Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-2xl font-black font-mono tracking-tight text-zinc-100">
            {numericValue !== null ? numericValue.toFixed(1) : '--'}
          </span>
          {config.unit && (
            <span className="text-[11px] font-mono font-medium text-zinc-400 mt-0.5">
              {config.unit}
            </span>
          )}
        </div>
      </div>

      {/* Footer Min and Max labels */}
      <div className="w-full flex items-center justify-between px-4 text-[10px] font-mono text-zinc-500 -mt-2">
        <span>{min}</span>
        <span className="text-zinc-600">{(percentage * 100).toFixed(0)}%</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
