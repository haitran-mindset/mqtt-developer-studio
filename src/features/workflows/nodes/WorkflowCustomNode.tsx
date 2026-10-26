import React, { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
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
  Power,
  Copy,
  Trash2,
  FileCheck,
  Flag,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowStepType } from '@/core/workflow/types';
import { getRandomFlowColor } from '@/core/workflow/flowColors';

const STEP_ICONS: Record<WorkflowStepType, React.ReactNode> = {
  start_label: <Flag className="h-3.5 w-3.5 text-fuchsia-400" />,
  publish: <Send className="h-3.5 w-3.5 text-cyan-400" />,
  subscribe: <Inbox className="h-3.5 w-3.5 text-emerald-400" />,
  unsubscribe: <Inbox className="h-3.5 w-3.5 text-zinc-400" />,
  delay: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  wait_for_message: <Radio className="h-3.5 w-3.5 text-yellow-400" />,
  validate_payload: <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />,
  validate_schema: <FileCheck className="h-3.5 w-3.5 text-blue-400" />,
  set_variable: <Variable className="h-3.5 w-3.5 text-teal-400" />,
  extract_variable: <FileSearch className="h-3.5 w-3.5 text-teal-300" />,
  condition: <GitBranch className="h-3.5 w-3.5 text-orange-400" />,
  loop: <Repeat className="h-3.5 w-3.5 text-indigo-400" />,
  log: <Terminal className="h-3.5 w-3.5 text-zinc-400" />,
  stop: <StopCircle className="h-3.5 w-3.5 text-zinc-400" />,
  fail: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />,
  switch_connection: <RefreshCw className="h-3.5 w-3.5 text-blue-400" />,
};

export const WorkflowCustomNode = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();
  const nodeData = data as Record<string, any>;
  const stepType = (nodeData.stepType as WorkflowStepType) || 'publish';
  const status = String(nodeData.status || 'idle');
  const label = String(nodeData.label || stepType);
  const config = (nodeData.config as Record<string, any>) || {};
  const isDisabled = Boolean(nodeData.disabled);

  const handleToggleDisabled = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                disabled: !isDisabled,
              },
            }
          : n
      )
    );
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const originalLabel = String(nodeData.label || stepType || 'Step');
    const newLabel = `${originalLabel} (Copy)`;

    setNodes((nds) => {
      const target = nds.find((n) => n.id === id);
      if (!target) return nds;

      const dupNode = {
        ...target,
        id: newId,
        position: {
          x: (target.position?.x ?? 200) + 40,
          y: (target.position?.y ?? 150) + 40,
        },
        selected: true,
        data: {
          ...JSON.parse(JSON.stringify(target.data || {})),
          label: newLabel,
          status: 'idle',
          lastError: undefined,
        },
      };

      return [...nds.map((n) => ({ ...n, selected: false })), dupNode];
    });
    toast.success(`Duplicated "${originalLabel}"`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    toast.info(`Deleted "${nodeData.label || stepType || 'Node'}"`);
  };

  const handleRandomizeColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newColor = getRandomFlowColor();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...(n.data.config || {}),
                  color: newColor,
                },
              },
            }
          : n
      )
    );
    toast.success('Randomized flow color');
  };

  const handleLabelChange = (newLabel: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                label: newLabel,
                config: {
                  ...(n.data.config || {}),
                  label: newLabel,
                },
              },
            }
          : n
      )
    );
  };

  // Specialized rendering for Start Flow Label node (Solid background, highlighted label, rotating icon)
  if (stepType === 'start_label') {
    const flowColor = (config.color as string) || '#06b6d4';
    const flowName = String(config.label || label || 'Start Flow');

    return (
      <div
        className={`w-64 rounded-xl border border-white/25 p-3 text-xs shadow-2xl transition-all font-sans relative select-none ${
          selected ? 'ring-2 ring-white shadow-2xl' : ''
        }`}
        style={{
          backgroundColor: flowColor,
          backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0.22) 100%)',
          boxShadow: `0 10px 25px -4px ${flowColor}70, 0 4px 12px -2px ${flowColor}40`,
        }}
      >
        {/* Header: Flow Start Badge & Quick Action Buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-black/35 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider border border-white/20 flex items-center gap-1 shadow-sm">
              <Flag className="h-3 w-3 fill-white text-white" />
              <span>FLOW START</span>
            </span>
          </div>

          {/* Actions: Rotate Color, Duplicate, Delete */}
          <div className="flex items-center gap-1 bg-black/25 rounded-md p-0.5 border border-white/20 backdrop-blur-xs">
            <button
              type="button"
              onClick={handleRandomizeColor}
              title="Rotate / Randomize flow color"
              className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-all hover:rotate-180 duration-300"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDuplicate}
              title="Duplicate flow trigger"
              className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={handleDelete}
              title="Delete flow trigger"
              className="p-1 rounded text-white/90 hover:text-rose-200 hover:bg-rose-500/30 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Highly Prominent Label Input */}
        <div className="relative">
          <input
            type="text"
            value={flowName}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Flow Label..."
            className="w-full bg-black/35 hover:bg-black/45 focus:bg-black/55 border border-white/30 focus:border-white/90 rounded-lg px-3 py-2 text-sm font-extrabold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-inner tracking-wide transition-all"
            title="Click to edit Flow Label"
          />
        </div>

        {/* Output Handle to connect downstream */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !border-2 !border-zinc-950 cursor-crosshair hover:!scale-150 transition-transform !bottom-[-8px]"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: `0 0 14px ${flowColor}, 0 0 4px #ffffff`,
          }}
          title="Connect from here to start this flow branch"
        />
      </div>
    );
  }

  // Downstream Flow Color (inherited from start_label node)
  const flowColor = nodeData.flowColor as string | undefined;

  // Status styles
  let statusBorder = 'border-zinc-800';
  let statusBg = 'bg-zinc-900/90';

  if (isDisabled) {
    statusBorder = 'border-dashed border-zinc-700/80';
    statusBg = 'bg-zinc-950/70 opacity-60 hover:opacity-100';
  } else if (status === 'running') {
    statusBorder = 'border-cyan-400 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400';
    statusBg = 'bg-cyan-950/40';
  } else if (status === 'success') {
    statusBorder = 'border-emerald-500 shadow-sm shadow-emerald-500/20';
  } else if (status === 'failed') {
    statusBorder = 'border-rose-500 shadow-sm shadow-rose-500/20';
  } else if (selected) {
    statusBorder = 'border-cyan-500/80';
  }

  // Custom border style for downstream nodes matching the start flow color
  const customNodeStyle: React.CSSProperties = {};
  if (flowColor && !isDisabled && status === 'idle' && !selected) {
    customNodeStyle.borderColor = flowColor;
    customNodeStyle.boxShadow = `0 0 14px ${flowColor}33`;
  }

  // Summary snippet
  let summary = '';
  if (stepType === 'publish') summary = config.topic || 'Publish message';
  else if (stepType === 'subscribe') summary = config.topic || 'Subscribe topic';
  else if (stepType === 'unsubscribe') summary = config.topic ? `Unsub: ${config.topic}` : 'Unsubscribe topic';
  else if (stepType === 'delay') summary = `${config.delayMs || 1000}ms delay`;
  else if (stepType === 'wait_for_message') summary = config.topic || 'Wait for message';
  else if (stepType === 'validate_payload') summary = `${config.assertionField} ${config.operator || '=='} ${config.expectedValue ?? ''}`;
  else if (stepType === 'validate_schema') {
    const raw = config.schema;
    let reqCount = '';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed?.required?.length) {
        reqCount = `${parsed.required.length} required fields`;
      }
    } catch (e) {}
    summary = config.targetVariable
      ? `Schema: ${config.targetVariable} (${reqCount || 'JSON'})`
      : `Schema: Payload (${reqCount || 'JSON'})`;
  }
  else if (stepType === 'set_variable') summary = `${config.varName} = ${config.varValue}`;
  else if (stepType === 'condition') summary = config.expression || 'true';
  else if (stepType === 'loop') summary = `Repeat ${config.count || 1} times`;
  else if (stepType === 'log') summary = config.message || 'Log message';

  return (
    <div
      className={`w-64 rounded-xl border ${statusBorder} ${statusBg} p-3 text-xs shadow-xl transition-all font-sans relative backdrop-blur-md`}
      style={customNodeStyle}
    >
      {/* Top Input Handle (Target / Incoming Connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !border-2 !border-zinc-950 cursor-crosshair hover:!scale-150 transition-transform !top-[-7px]"
        style={{
          backgroundColor: flowColor || '#22d3ee',
          boxShadow: `0 0 10px ${flowColor || 'rgba(34,211,238,0.9)'}`,
        }}
        title="Input (Receive connection from previous step)"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-zinc-800 border border-zinc-700/60">
            {STEP_ICONS[stepType] || <Send className="h-3.5 w-3.5" />}
          </div>
          <span className={`font-semibold text-zinc-100 truncate text-[12px] max-w-[85px] ${isDisabled ? 'line-through text-zinc-400' : ''}`}>
            {label}
          </span>
        </div>

        {/* Status Badge & Actions (Duplicate, Delete, Power) */}
        <div className="flex items-center gap-1">
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
              isDisabled
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                : status === 'running'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                : status === 'success'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : status === 'failed'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {isDisabled ? 'DISABLED' : status}
          </span>

          <button
            type="button"
            onClick={handleDuplicate}
            title="Duplicate step (Ctrl+D)"
            className="p-1 rounded text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
          >
            <Copy className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete step (Delete/Backspace)"
            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleToggleDisabled}
            title={isDisabled ? 'Enable step' : 'Disable step (will be skipped)'}
            className={`p-1 rounded transition-colors ${
              isDisabled
                ? 'text-amber-400 hover:text-emerald-400 bg-amber-950/40 hover:bg-emerald-950/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Power className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Node Body / Summary */}
      <div className="font-mono text-[11px] text-zinc-400 bg-zinc-950/60 border border-zinc-800 rounded px-2 py-1 truncate">
        {summary || stepType}
      </div>

      {nodeData.lastError && (
        <div className="text-[10px] text-rose-400 font-mono mt-1.5 truncate">
          Error: {String(nodeData.lastError)}
        </div>
      )}

      {/* Output Handles (Source / Connect to next step) */}
      {stepType === 'condition' ? (
        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-zinc-800 text-[10px] font-mono px-1">
          <div className="relative flex items-center gap-1">
            <span className="text-emerald-400 font-bold">TRUE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              className="!w-3.5 !h-3.5 !bg-emerald-400 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(52,211,153,0.9)] cursor-crosshair hover:!scale-150 transition-transform !bottom-[-7px] left-3"
              title="Connect when condition is TRUE"
            />
          </div>
          <div className="relative flex items-center gap-1">
            <span className="text-rose-400 font-bold">FALSE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              className="!w-3.5 !h-3.5 !bg-rose-400 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(244,63,94,0.9)] cursor-crosshair hover:!scale-150 transition-transform !bottom-[-7px] right-3"
              title="Connect when condition is FALSE"
            />
          </div>
        </div>
      ) : stepType === 'loop' ? (
        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-zinc-800 text-[10px] font-mono px-1">
          <div className="relative flex items-center gap-1">
            <span className="text-indigo-400 font-bold">BODY</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="loop_body"
              className="!w-3.5 !h-3.5 !bg-indigo-400 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(129,140,248,0.9)] cursor-crosshair hover:!scale-150 transition-transform !bottom-[-7px] left-4"
              title="Loop body (repeated steps)"
            />
          </div>
          <div className="relative flex items-center gap-1">
            <span className="text-zinc-400 font-bold">DONE</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="loop_end"
              className="!w-3.5 !h-3.5 !bg-zinc-400 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(161,161,170,0.9)] cursor-crosshair hover:!scale-150 transition-transform !bottom-[-7px] right-4"
              title="Loop completed"
            />
          </div>
        </div>
      ) : stepType !== 'stop' && stepType !== 'fail' ? (
        <div className="relative mt-1">
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-3.5 !h-3.5 !border-2 !border-zinc-950 cursor-crosshair hover:!scale-150 transition-transform !bottom-[-7px]"
            style={{
              backgroundColor: flowColor || '#22d3ee',
              boxShadow: `0 0 10px ${flowColor || 'rgba(34,211,238,0.9)'}`,
            }}
            title="Drag from here to connect to the next step"
          />
        </div>
      ) : null}
    </div>
  );
});

WorkflowCustomNode.displayName = 'WorkflowCustomNode';
