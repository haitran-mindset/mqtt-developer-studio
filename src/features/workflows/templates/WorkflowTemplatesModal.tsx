import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, ArrowRight, Check, Layers } from 'lucide-react';
import { WORKFLOW_TEMPLATES, type WorkflowTemplateItem } from './workflowTemplates';
import type { WorkflowDefinition } from '@/core/db/types';

interface WorkflowTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (workflow: WorkflowDefinition) => void;
}

export const WorkflowTemplatesModal: React.FC<WorkflowTemplatesModalProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    WORKFLOW_TEMPLATES.forEach((t) => set.add(t.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return WORKFLOW_TEMPLATES.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleApplyTemplate = (template: WorkflowTemplateItem) => {
    const timestamp = Date.now();
    const clonedWorkflow: WorkflowDefinition = {
      id: `workflow-${timestamp}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${template.name}`,
      description: template.description,
      variables: { ...template.workflow.variables },
      nodes: template.workflow.nodes.map((n) => ({
        ...n,
        id: `${n.id}-${timestamp}`,
        data: { ...n.data, status: 'idle', lastError: undefined },
      })),
      edges: template.workflow.edges.map((e) => ({
        ...e,
        id: `${e.id}-${timestamp}`,
        source: `${e.source}-${timestamp}`,
        target: `${e.target}-${timestamp}`,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    onSelectTemplate(clonedWorkflow);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Workflow Templates Marketplace</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  3 Presets
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Ready-to-use production scenarios: Heartbeat checker, IoT sensor simulation & automated interlock response.
              </DialogDescription>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Search templates or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-zinc-900/80 border-zinc-800 text-zinc-200"
              />
            </div>
            <div className="flex items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat === 'all' ? 'All Templates' : cat}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Templates Grid List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              No workflow templates matching current query.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100 group-hover:text-cyan-400 transition-colors">
                        {template.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${template.badgeColor}`}
                      >
                        {template.badge}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                      className="h-7 text-xs flex items-center gap-1.5 font-medium shadow-md shadow-cyan-500/10 cursor-pointer"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    {template.description}
                  </p>

                  {/* Flow Steps Preview Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 font-mono text-[11px]">
                    <span className="text-zinc-500 text-[10px] uppercase font-semibold mr-1 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-cyan-400" />
                      Sequence ({template.workflow.nodes.length} steps):
                    </span>
                    {template.workflow.nodes.map((n, i) => (
                      <React.Fragment key={n.id}>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {n.data.label}
                        </span>
                        {i < template.workflow.nodes.length - 1 && (
                          <span className="text-zinc-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Tags Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span>{template.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
