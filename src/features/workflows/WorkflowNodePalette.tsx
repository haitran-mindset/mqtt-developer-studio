import React from 'react';
import {
  Send,
  Inbox,
  Clock,
  Radio,
  CheckCircle2,
  GitBranch,
  Repeat,
  Variable,
  FileSearch,
  Terminal,
  StopCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileCheck,
  Flag,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkflowStepType } from '@/core/workflow/types';

interface WorkflowNodePaletteProps {
  onAddNode: (stepType: WorkflowStepType, label: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PaletteItem {
  type: WorkflowStepType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const PALETTE_GROUPS: { groupName: string; items: PaletteItem[] }[] = [
  {
    groupName: 'Flow Triggers & Entry',
    items: [
      {
        type: 'start_label',
        label: 'Start Flow Label',
        icon: <Flag className="h-3.5 w-3.5 text-fuchsia-400" />,
        desc: 'Named flow start with random color & themed border',
      },
    ],
  },
  {
    groupName: 'MQTT Messaging',
    items: [
      { type: 'publish', label: 'Publish Message', icon: <Send className="h-3.5 w-3.5 text-cyan-400" />, desc: 'Publish topic & payload' },
      { type: 'subscribe', label: 'Subscribe Topic', icon: <Inbox className="h-3.5 w-3.5 text-emerald-400" />, desc: 'Subscribe and await SUBACK' },
      { type: 'unsubscribe', label: 'Unsubscribe', icon: <Inbox className="h-3.5 w-3.5 text-zinc-400" />, desc: 'Remove topic subscription' },
      { type: 'wait_for_message', label: 'Wait for Message', icon: <Radio className="h-3.5 w-3.5 text-yellow-400" />, desc: 'Listen with correlation & timeout' },
    ],
  },
  {
    groupName: 'Flow & Branching',
    items: [
      { type: 'condition', label: 'Conditional Branch', icon: <GitBranch className="h-3.5 w-3.5 text-orange-400" />, desc: 'IF / ELSE based on variables' },
      { type: 'loop', label: 'Repeat / Loop', icon: <Repeat className="h-3.5 w-3.5 text-indigo-400" />, desc: 'Iterate N times' },
      { type: 'delay', label: 'Delay / Wait', icon: <Clock className="h-3.5 w-3.5 text-amber-400" />, desc: 'Pause for N milliseconds' },
      { type: 'switch_connection', label: 'Switch Broker', icon: <RefreshCw className="h-3.5 w-3.5 text-blue-400" />, desc: 'Switch active MQTT connection' },
    ],
  },
  {
    groupName: 'Variables & Assertions',
    items: [
      { type: 'set_variable', label: 'Set Variable', icon: <Variable className="h-3.5 w-3.5 text-teal-400" />, desc: 'Assign value to context' },
      { type: 'extract_variable', label: 'Extract Variable', icon: <FileSearch className="h-3.5 w-3.5 text-teal-300" />, desc: 'Extract field via JSONPath' },
      { type: 'validate_payload', label: 'Validate Payload', icon: <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />, desc: 'Assert payload values' },
      { type: 'validate_schema', label: 'JSON Schema Validator', icon: <FileCheck className="h-3.5 w-3.5 text-blue-400" />, desc: 'Validate payload with JSON Schema' },
    ],
  },
  {
    groupName: 'Control & Telemetry',
    items: [
      { type: 'log', label: 'Log Message', icon: <Terminal className="h-3.5 w-3.5 text-zinc-400" />, desc: 'Print message to console' },
      { type: 'stop', label: 'Stop Workflow', icon: <StopCircle className="h-3.5 w-3.5 text-zinc-400" />, desc: 'Graceful completion' },
      { type: 'fail', label: 'Fail Workflow', icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />, desc: 'Abort with error reason' },
    ],
  },
];

export const WorkflowNodePalette: React.FC<WorkflowNodePaletteProps> = ({
  onAddNode,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto py-2.5 items-center select-none shrink-0 transition-all duration-200">
        {/* Expand Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg mb-2"
          title="Expand Step Palette"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="w-6 h-[1px] bg-zinc-800 mb-2" />

        {/* Step Icons List for 1-Click Quick Add */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          {PALETTE_GROUPS.flatMap((g) => g.items).map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddNode(item.type, item.label)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900/60 border border-zinc-800/90 hover:border-cyan-500/60 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-all relative group"
              title={`${item.label} (${item.desc}) - Click to add`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto p-3 space-y-4 select-none shrink-0 transition-all duration-200">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
        <div>
          <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Step Palette
          </h3>
          <p className="text-[11px] text-zinc-500">Click to add node to canvas</p>
        </div>

        {onToggleCollapse && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Collapse Step Palette"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {PALETTE_GROUPS.map((grp) => (
        <div key={grp.groupName} className="space-y-1.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
            {grp.groupName}
          </span>

          <div className="space-y-1">
            {grp.items.map((item) => (
              <div
                key={item.type}
                onClick={() => onAddNode(item.type, item.label)}
                className="flex items-center justify-between p-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-cyan-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-zinc-800">{item.icon}</div>
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block group-hover:text-cyan-400 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">{item.desc}</span>
                  </div>
                </div>

                <Plus className="h-3.5 w-3.5 text-zinc-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
