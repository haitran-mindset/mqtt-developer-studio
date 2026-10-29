import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, CheckSquare, Square, Layers, Search } from 'lucide-react';
import type { WorkflowDefinition } from '@/core/db/types';

interface ExportWorkflowsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflows: WorkflowDefinition[];
  defaultSelectedId?: string;
  onExport: (selectedWorkflows: WorkflowDefinition[], bundleName: string) => void;
}

export const ExportWorkflowsModal: React.FC<ExportWorkflowsModalProps> = ({
  open,
  onOpenChange,
  workflows,
  defaultSelectedId,
  onExport,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bundleName, setBundleName] = useState('mqtt-workflows-bundle');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize selected items when modal opens
  useEffect(() => {
    if (open) {
      if (defaultSelectedId) {
        setSelectedIds(new Set([defaultSelectedId]));
      } else {
        setSelectedIds(new Set(workflows.map((w) => w.id)));
      }
      setBundleName('mqtt-workflows-bundle');
      setSearchQuery('');
    }
  }, [open, defaultSelectedId, workflows]);

  const filteredWorkflows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workflows;
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q))
    );
  }, [workflows, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(workflows.map((w) => w.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleExportClick = () => {
    const selected = workflows.filter((w) => selectedIds.has(w.id));
    if (selected.length === 0) return;
    onExport(selected, bundleName.trim() || 'mqtt-workflows-bundle');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-zinc-950 border-zinc-800 text-zinc-100 p-5 font-sans">
        <DialogHeader className="pb-3 border-b border-zinc-800/80">
          <DialogTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Export Workflows Bundle</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Select the workflows you want to export into a single JSON bundle package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Bundle File Name */}
          <div>
            <label className="text-[11px] font-medium text-zinc-300 block mb-1">
              Bundle File Name
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="mqtt-workflows-bundle"
                className="h-8 text-xs font-mono bg-zinc-900 border-zinc-700/80"
              />
              <span className="text-xs text-zinc-500 font-mono">.json</span>
            </div>
          </div>

          {/* Search & Selection Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter workflows..."
                className="h-7 pl-8 text-xs bg-zinc-900/60 border-zinc-800"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 px-2 text-[11px] text-zinc-400 hover:text-cyan-400"
              >
                Select All
              </Button>
              <span className="text-zinc-600">|</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                None
              </Button>
            </div>
          </div>

          {/* Workflows List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 border border-zinc-800/80 rounded-lg p-2 bg-zinc-900/40">
            {filteredWorkflows.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No workflows match your search.
              </div>
            ) : (
              filteredWorkflows.map((wf) => {
                const isChecked = selectedIds.has(wf.id);
                const nodeCount = wf.nodes?.length || 0;

                return (
                  <div
                    key={wf.id}
                    onClick={() => toggleSelect(wf.id)}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-cyan-950/20 border-cyan-800/60 text-zinc-100'
                        : 'bg-zinc-900/20 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div className="text-cyan-400 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate text-zinc-200">
                          {wf.name}
                        </div>
                        {wf.description && (
                          <div className="text-[10px] text-zinc-500 truncate">
                            {wf.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono shrink-0 py-0 px-1.5 text-zinc-400 border-zinc-700/80 flex items-center gap-1"
                    >
                      <Layers className="h-2.5 w-2.5 text-zinc-500" />
                      <span>{nodeCount}</span>
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-right text-[11px] text-zinc-400 font-mono">
            Selected: <span className="text-cyan-400 font-semibold">{selectedIds.size}</span> of{' '}
            {workflows.length} workflows
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-800/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExportClick}
            disabled={selectedIds.size === 0}
            className="h-8 text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-sm shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Export {selectedIds.size} Workflow{selectedIds.size > 1 ? 's' : ''}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
