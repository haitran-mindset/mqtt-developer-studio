import React from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Save,
  FolderOpen,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkflowDefinition } from '@/core/db/types';

interface WorkflowRunControlsProps {
  isRunning: boolean;
  onRun: () => void;
  onAbort: () => void;
  onReset: () => void;
  onSave: () => void;
  onNewWorkflow?: () => void;
  onRenameWorkflow?: () => void;
  onDuplicateWorkflow?: () => void;
  onDeleteWorkflow?: () => void;
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
  onRenameWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  workflows,
  currentWorkflow,
  onSelectWorkflow,
  statusText,
}) => {
  return (
    <div className="h-11 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between select-none shrink-0 text-xs">
      {/* Left: Workflow Picker & Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Workflow:</span>
          {workflows.length > 0 ? (
            <Select
              value={currentWorkflow?.id || ''}
              onValueChange={(val) => {
                const selected = workflows.find((w) => w.id === val);
                if (selected) onSelectWorkflow(selected);
              }}
            >
              <SelectTrigger className="h-7 min-w-[170px] max-w-[240px] text-xs font-sans">
                <SelectValue placeholder="Select workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id} className="text-xs font-sans">
                    {wf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-zinc-500 italic">No workflows</span>
          )}
        </div>

        {onRenameWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRenameWorkflow}
            disabled={!currentWorkflow || isRunning}
            className="h-7 text-xs flex items-center gap-1 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50"
            title="Edit Workflow Name"
          >
            <Pencil className="h-3 w-3" />
            <span>Rename</span>
          </Button>
        )}

        {onDuplicateWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicateWorkflow}
            disabled={!currentWorkflow || isRunning}
            className="h-7 text-xs flex items-center gap-1 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50"
            title="Duplicate Current Workflow"
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate</span>
          </Button>
        )}

        {onDeleteWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDeleteWorkflow}
            disabled={!currentWorkflow || isRunning}
            className="h-7 text-xs flex items-center gap-1 text-zinc-300 hover:text-rose-400 hover:border-rose-500/50"
            title="Delete Current Workflow"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={!currentWorkflow || isRunning}
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
          disabled={!currentWorkflow || isRunning}
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
            disabled={!currentWorkflow}
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
