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
  Undo2,
  Redo2,
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
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
    <div className="border-b border-zinc-800 bg-zinc-900/50 select-none shrink-0 text-xs">
      {/* Row 1: Workflow Management (Selection, Templates, Rename, Duplicate, Save, Delete) */}
      <div className="min-h-10 px-2 sm:px-4 py-1.5 flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/60 bg-zinc-900/80 gap-2">
        {/* Left: Workflow Selection & Templates */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-zinc-400 font-medium">Workflow:</span>
            {workflows.length > 0 ? (
              <Select
                value={currentWorkflow?.id || ''}
                onValueChange={(val) => {
                  const selected = workflows.find((w) => w.id === val);
                  if (selected) onSelectWorkflow(selected);
                }}
              >
                <SelectTrigger className="h-7 w-[160px] sm:min-w-[180px] sm:max-w-[260px] text-xs font-sans">
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
              className="h-7 text-xs flex items-center gap-1.5 text-cyan-400 border-cyan-800/60 bg-cyan-950/20 hover:bg-cyan-950/40 font-medium shrink-0"
              title="Browse Workflow Templates Library"
            >
              <Sparkles className="h-3 w-3" />
              <span>Templates</span>
            </Button>
          )}
        </div>

        {/* Right: Actions (Rename, Duplicate, Save, Delete) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 justify-between md:justify-end">
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

          <Separator orientation="vertical" className="h-4 bg-zinc-800 mx-0.5" />

          {onUndo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUndo}
              disabled={!canUndo || isRunning}
              className="h-7 text-xs flex items-center gap-1 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-40 disabled:hover:text-zinc-300 disabled:hover:border-zinc-800 transition-colors"
              title="Undo last change (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          )}

          {onRedo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRedo}
              disabled={!canRedo || isRunning}
              className="h-7 text-xs flex items-center gap-1 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-40 disabled:hover:text-zinc-300 disabled:hover:border-zinc-800 transition-colors"
              title="Redo last change (Ctrl+Y / ⇧⌘Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </Button>
          )}

          <Separator orientation="vertical" className="h-4 bg-zinc-800 mx-0.5" />

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
      </div>

      {/* Row 2: Status & Execution Controls (Status, Export, Import, Reset, Run/Abort) */}
      <div className="min-h-10 px-2 sm:px-4 py-1.5 flex flex-col md:flex-row md:items-center justify-between bg-zinc-950/50 gap-2">
        {/* Left: Execution Status Indicator */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/20'
                  : 'bg-emerald-400 ring-2 ring-emerald-400/20'
              }`}
            />
            <span className="font-medium text-zinc-200">
              {isRunning ? 'Running:' : 'Status:'}
            </span>
            <span className="text-zinc-400 truncate max-w-[150px] sm:max-w-none">
              {statusText || (currentWorkflow ? 'Ready' : 'No workflow loaded')}
            </span>
          </div>

          {currentWorkflow && (
            <span className="text-[11px] font-mono text-zinc-500 shrink-0">
              ({currentWorkflow.nodes?.length || 0} nodes, {currentWorkflow.edges?.length || 0} links)
            </span>
          )}
        </div>

        {/* Right: Export/Import, Reset, Run/Abort */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0 justify-between md:justify-end">
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
              className="h-7 text-xs flex items-center gap-1.5 px-4 font-semibold shadow-md shadow-emerald-950/40"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run Workflow</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
