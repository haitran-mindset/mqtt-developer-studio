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
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  onOpenTemplates?: () => void;
  onExportWorkflow?: () => void;
  onImportWorkflow?: () => void;
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
  onOpenTemplates,
  onExportWorkflow,
  onImportWorkflow,
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

        {onOpenTemplates && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenTemplates}
            disabled={isRunning}
            className="h-7 text-xs flex items-center gap-1.5 text-cyan-400 border-cyan-800/60 bg-cyan-950/20 hover:bg-cyan-950/40 font-medium"
            title="Browse Workflow Templates Library"
          >
            <Sparkles className="h-3 w-3" />
            <span>Templates</span>
          </Button>
        )}

        {/* Separator */}
        <Separator orientation="vertical" className="h-4 bg-zinc-800 mx-0.5" />

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

        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={!currentWorkflow || isRunning}
          className="h-7 text-xs flex items-center gap-1.5 font-medium text-emerald-300 border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 hover:text-emerald-100 hover:border-emerald-400 shadow-sm shadow-emerald-950/30 transition-all"
          title="Save Changes to Local Database"
        >
          <Save className="h-3.5 w-3.5 text-emerald-400" />
          <span>Save</span>
        </Button>

        {onDeleteWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDeleteWorkflow}
            disabled={!currentWorkflow || isRunning}
            className="h-7 text-xs flex items-center gap-1.5 font-medium text-rose-300 border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 hover:text-rose-100 hover:border-rose-400 shadow-sm shadow-rose-950/30 transition-all"
            title="Delete Current Workflow"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Delete</span>
          </Button>
        )}
      </div>

      {/* Right: Export/Import, Reset, Run/Abort */}
      <div className="flex items-center gap-2">
        {statusText && (
          <span className="text-[11px] font-mono text-zinc-400 mr-1">{statusText}</span>
        )}

        {/* Standalone Export & Import buttons placed beside Reset */}
        {onExportWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExportWorkflow}
            disabled={!currentWorkflow || isRunning}
            className="h-7 text-xs flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-950/30 border-zinc-800"
            title="Export Current Workflow to .json file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>
        )}

        {onImportWorkflow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onImportWorkflow}
            disabled={isRunning}
            className="h-7 text-xs flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 border-zinc-800"
            title="Import Workflow from .json file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import</span>
          </Button>
        )}

        <Separator orientation="vertical" className="h-4 bg-zinc-800 mx-0.5" />

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
