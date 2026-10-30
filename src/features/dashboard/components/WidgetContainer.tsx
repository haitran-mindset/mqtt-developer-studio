import React from 'react';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { DashboardWidgetConfig } from '@/core/dashboard/types';

interface WidgetContainerProps {
  config: DashboardWidgetConfig;
  hasRecentData?: boolean;
  onEdit: (config: DashboardWidgetConfig) => void;
  onDuplicate: (config: DashboardWidgetConfig) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  config,
  hasRecentData,
  onEdit,
  onDuplicate,
  onDelete,
  children,
}) => {
  // Determine grid column span classes
  const colSpanClass =
    config.colSpan === 2
      ? 'col-span-1 md:col-span-2'
      : config.colSpan === 3
      ? 'col-span-1 md:col-span-3'
      : config.colSpan === 4
      ? 'col-span-1 md:col-span-4'
      : 'col-span-1';

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/60 ${colSpanClass} min-h-[190px]`}
    >
      {/* Widget Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {/* Live activity beacon */}
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                hasRecentData
                  ? 'bg-emerald-400 ring-2 ring-emerald-500/20 animate-pulse'
                  : 'bg-zinc-600'
              }`}
              title={hasRecentData ? 'Receiving telemetry' : 'Idle / No data yet'}
            />
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {config.title}
            </h3>
          </div>

          {/* Topic & Path Subtitle */}
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-zinc-400 truncate">
            <Radio className="h-3 w-3 shrink-0 text-cyan-400" />
            <span className="truncate">{config.topic}</span>
            {config.jsonPath && (
              <span className="text-zinc-500 truncate" title={`Path: ${config.jsonPath}`}>
                [{config.jsonPath}]
              </span>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem
              onClick={() => onEdit(config)}
              className="gap-2 cursor-pointer text-xs focus:bg-zinc-800 focus:text-zinc-100"
            >
              <Pencil className="h-3.5 w-3.5 text-cyan-400" />
              Edit Widget
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(config)}
              className="gap-2 cursor-pointer text-xs focus:bg-zinc-800 focus:text-zinc-100"
            >
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => onDelete(config.id)}
              className="gap-2 cursor-pointer text-xs text-rose-400 focus:bg-rose-950/40 focus:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Widget Body */}
      <div className="flex-1 flex flex-col justify-center">{children}</div>
    </div>
  );
};
