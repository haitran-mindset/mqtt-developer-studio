import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BUILT_IN_VARIABLES } from '@/core/template/types';
import { Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface VariableHelperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertVariable: (token: string) => void;
}

export const VariableHelperModal: React.FC<VariableHelperModalProps> = ({
  open,
  onOpenChange,
  onInsertVariable,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Dynamic Template Variables</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Click any variable token to insert it directly into your payload or topic. Variables resolve at the instant of publication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2 max-h-[60vh] overflow-y-auto">
          {BUILT_IN_VARIABLES.map((v) => (
            <div
              key={v.token}
              onClick={() => {
                onInsertVariable(v.token);
                toast.success(`Inserted ${v.token}`);
                onOpenChange(false);
              }}
              className="p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-900 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-400">
                    {v.token}
                  </span>
                  <span className="text-xs text-zinc-200">{v.name}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">{v.description}</p>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  Example: <span className="text-zinc-300">{v.example}</span>
                </div>
              </div>

              <Button size="sm" variant="ghost" className="text-xs text-cyan-400 group-hover:bg-zinc-800">
                Insert
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
