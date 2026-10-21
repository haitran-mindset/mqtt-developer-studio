import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
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
} from 'lucide-react';
import type { WorkflowStepType } from '@/core/workflow/types';

const STEP_ICONS: Record<WorkflowStepType, React.ReactNode> = {
  publish: <Send className="h-3.5 w-3.5 text-cyan-400" />,
  subscribe: <Inbox className="h-3.5 w-3.5 text-emerald-400" />,
  unsubscribe: <Inbox className="h-3.5 w-3.5 text-zinc-400" />,
  delay: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  wait_for_message: <Radio className="h-3.5 w-3.5 text-yellow-400" />,
  validate_payload: <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />,
  set_variable: <Variable className="h-3.5 w-3.5 text-teal-400" />,
  extract_variable: <FileSearch className="h-3.5 w-3.5 text-teal-300" />,
  condition: <GitBranch className="h-3.5 w-3.5 text-orange-400" />,
  loop: <Repeat className="h-3.5 w-3.5 text-indigo-400" />,
  log: <Terminal className="h-3.5 w-3.5 text-zinc-400" />,
  stop: <StopCircle className="h-3.5 w-3.5 text-zinc-400" />,
  fail: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />,
  switch_connection: <RefreshCw className="h-3.5 w-3.5 text-blue-400" />,
};

export const WorkflowCustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const stepType = (nodeData.stepType as WorkflowStepType) || 'publish';
  const status = String(nodeData.status || 'idle');
  const label = String(nodeData.label || stepType);
  const config = (nodeData.config as Record<string, any>) || {};

  // Status styles
  let statusBorder = 'border-zinc-800';
  let statusBg = 'bg-zinc-900/90';

  if (status === 'running') {
    statusBorder = 'border-cyan-400 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400';
    statusBg = 'bg-cyan-950/40';
  } else if (status === 'success') {
    statusBorder = 'border-emerald-500 shadow-sm shadow-emerald-500/20';
  } else if (status === 'failed') {
    statusBorder = 'border-rose-500 shadow-sm shadow-rose-500/20';
  } else if (selected) {
    statusBorder = 'border-cyan-500/80';
  }

  // Summary snippet
  let summary = '';
  if (stepType === 'publish') summary = config.topic || 'Publish message';
  else if (stepType === 'subscribe') summary = config.topic || 'Subscribe topic';
  else if (stepType === 'delay') summary = `${config.delayMs || 1000}ms delay`;
  else if (stepType === 'wait_for_message') summary = config.topic || 'Wait for message';
  else if (stepType === 'validate_payload') summary = `${config.assertionField} ${config.operator || '=='} ${config.expectedValue ?? ''}`;
  else if (stepType === 'set_variable') summary = `${config.varName} = ${config.varValue}`;
  else if (stepType === 'condition') summary = config.expression || 'true';
  else if (stepType === 'loop') summary = `Repeat ${config.count || 1} times`;
  else if (stepType === 'log') summary = config.message || 'Log message';

  return (
    <div
      className={`w-64 rounded-xl border ${statusBorder} ${statusBg} p-3 text-xs shadow-xl transition-all font-sans relative backdrop-blur-md`}
    >
      {/* Top Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 bg-zinc-500 border border-zinc-950 !top-[-5px]"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-zinc-800 border border-zinc-700/60">
            {STEP_ICONS[stepType] || <Send className="h-3.5 w-3.5" />}
          </div>
          <span className="font-semibold text-zinc-100 truncate text-[12px] max-w-[130px]">
            {label}
          </span>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
            status === 'running'
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
              : status === 'success'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : status === 'failed'
              ? 'bg-rose-950 text-rose-400 border border-rose-800'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Node Body / Summary */}
      <div className="font-mono text-[11px] text-zinc-400 bg-zinc-950/60 border border-zinc-850 rounded px-2 py-1 truncate">
        {summary || stepType}
      </div>

      {nodeData.lastError && (
        <div className="text-[10px] text-rose-400 font-mono mt-1.5 truncate">
          Error: {String(nodeData.lastError)}
        </div>
      )}

      {/* Output Handles */}
      {stepType === 'condition' ? (
        <div className="flex justify-between mt-2 pt-1 border-t border-zinc-850 text-[10px] font-mono">
          <div className="relative">
            <span className="text-emerald-400">TRUE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              className="w-2.5 h-2.5 bg-emerald-500 border border-zinc-950 !bottom-[-5px] left-3"
            />
          </div>
          <div className="relative">
            <span className="text-rose-400">FALSE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              className="w-2.5 h-2.5 bg-rose-500 border border-zinc-950 !bottom-[-5px] right-3"
            />
          </div>
        </div>
      ) : stepType === 'loop' ? (
        <div className="flex justify-between mt-2 pt-1 border-t border-zinc-850 text-[10px] font-mono">
          <div className="relative">
            <span className="text-indigo-400">BODY</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="loop_body"
              className="w-2.5 h-2.5 bg-indigo-500 border border-zinc-950 !bottom-[-5px] left-3"
            />
          </div>
          <div className="relative">
            <span className="text-zinc-400">DONE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="loop_end"
              className="w-2.5 h-2.5 bg-zinc-500 border border-zinc-950 !bottom-[-5px] right-3"
            />
          </div>
        </div>
      ) : stepType !== 'stop' && stepType !== 'fail' ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2.5 h-2.5 bg-cyan-500 border border-zinc-950 !bottom-[-5px]"
        />
      ) : null}
    </div>
  );
});

WorkflowCustomNode.displayName = 'WorkflowCustomNode';
