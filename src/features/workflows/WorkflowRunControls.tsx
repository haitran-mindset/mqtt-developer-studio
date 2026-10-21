import React from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Save,
  FolderOpen,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkflowDefinition } from '@/core/db/types';

interface WorkflowRunControlsProps {
  isRunning: boolean;
  onRun: () => void;
  onAbort: () => void;
  onReset: () => void;
  onSave: () => void;
  onNewWorkflow: () => void;
  workflows: WorkflowDefinition[];
  currentWorkflow: WorkflowDefinition | null;
  onSelectWorkflow: (wf: WorkflowDefinition) => void;
  statusText?: string;
}

export const WorkflowRunControls: React.FC<WorkflowRunControlsProps> = ({
  isRunning,
  onRun,
  onAbort,
  onReset,
  onSave,
  onNewWorkflow,
  workflows,
  currentWorkflow,
  onSelectWorkflow,
  statusText,
}) => {
  return (
    <div className="h-11 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between select-none shrink-0 text-xs">
      {/* Left: Workflow Picker & New */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-750 rounded-md px-2 py-1">
          <span className="text-[11px] text-zinc-400">Workflow:</span>
          <select
            value={currentWorkflow?.id || ''}
            onChange={(e) => {
              const selected = workflows.find((w) => w.id === e.target.value);
              if (selected) onSelectWorkflow(selected);
            }}
            className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id} className="bg-zinc-900 text-zinc-100">
                {wf.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onNewWorkflow}
          className="h-7 text-xs flex items-center gap-1 text-zinc-300"
          title="Create New Blank Workflow"
        >
          <Plus className="h-3 w-3" />
          <span>New</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          className="h-7 text-xs flex items-center gap-1 text-zinc-300"
          title="Save Changes to Local Database"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </Button>
      </div>

      {/* Right: Run, Abort, Reset */}
      <div className="flex items-center gap-2">
        {statusText && (
          <span className="text-[11px] font-mono text-zinc-400 mr-2">{statusText}</span>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          disabled={isRunning}
          className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
          title="Reset step status markers"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          <span>Reset</span>
        </Button>

        {isRunning ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onAbort}
            className="h-7 text-xs flex items-center gap-1 px-3 font-semibold"
          >
            <Square className="h-3 w-3" />
            <span>Abort Run</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="emerald"
            onClick={onRun}
            className="h-7 text-xs flex items-center gap-1 px-4 font-semibold shadow-md shadow-emerald-950/40"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Run Workflow</span>
          </Button>
        )}
      </div>
    </div>
  );
};
