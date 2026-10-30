import React, { useRef } from 'react';
import {
  Plus,
  LayoutDashboard,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/core/store/dashboardStore';
import { DEFAULT_DASHBOARD_PRESETS } from '@/core/dashboard/defaultDashboardPresets';
import { useStudioStore } from '@/app/store/studioStore';
import { useDataStore } from '@/core/store/dataStore';
import { toast } from 'sonner';

interface DashboardSidebarProps {
  onAddNewWidget?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onAddNewWidget }) => {
  const { widgets, loadPreset, exportDashboard, importDashboard, resetToDefault, setAddModalOpen } =
    useDashboardStore();
  const activeConnectionId = useStudioStore((state) => state.activeConnectionId);
  const profiles = useDataStore((state) => state.connectionProfiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = profiles.find((p) => p.id === activeConnectionId);

  const handleExport = () => {
    const jsonStr = exportDashboard();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mqtt-dashboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dashboard layout exported to JSON');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDashboard(content);
      if (success) {
        toast.success('Dashboard imported successfully');
      } else {
        toast.error('Invalid dashboard configuration file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border-r border-zinc-800/80 p-3 space-y-4 overflow-y-auto">
      {/* Header & Quick Action */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100">Live Dashboard</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'}
          </span>
        </div>

        <Button
          onClick={onAddNewWidget || (() => setAddModalOpen(true))}
          className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm shadow-cyan-950/50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Widget
        </Button>
      </div>

      {/* Connection Indicator */}
      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            Broker Stream
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              activeProfile ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
        </div>
        <div className="text-[11px] font-mono text-zinc-300 truncate">
          {activeProfile ? activeProfile.name : 'No active broker'}
        </div>
        <p className="text-[10px] text-zinc-500 leading-tight">
          Widgets automatically subscribe to telemetry topics on the active broker.
        </p>
      </div>

      {/* Preset Templates */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Preset Dashboards
        </div>

        <div className="space-y-1.5">
          {DEFAULT_DASHBOARD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                loadPreset(preset.id);
                toast.success(`Loaded preset: ${preset.name}`);
              }}
              className="w-full text-left p-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700/80 transition-all"
            >
              <div className="text-xs font-semibold text-zinc-200">{preset.name}</div>
              <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Import / Export & Reset Actions */}
      <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-1">
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          Layout Management
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="w-full text-xs h-8 border-zinc-800 text-zinc-300 hover:bg-zinc-800 gap-1.5"
          >
            <Download className="h-3 w-3 text-cyan-400" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs h-8 border-zinc-800 text-zinc-300 hover:bg-zinc-800 gap-1.5"
          >
            <Upload className="h-3 w-3 text-cyan-400" />
            Import
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetToDefault();
            toast.info('Dashboard reset to default template');
          }}
          className="w-full text-xs h-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 gap-1.5 mt-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
};
