import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Edit3 } from 'lucide-react';

export interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void | Promise<void>;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue = '',
  placeholder = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    try {
      setLoading(true);
      await onConfirm(value.trim());
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <DialogTitle className="text-sm font-semibold text-zinc-100">
                {title}
              </DialogTitle>
            </div>
            {description && (
              <DialogDescription className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-2 py-1">
            {label && (
              <Label className="text-[11px] font-medium text-zinc-300">
                {label}
              </Label>
            )}
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="text-xs font-sans h-9 bg-zinc-900 border-zinc-800 focus:border-cyan-500"
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-sans h-9 flex-1 sm:flex-initial sm:w-auto cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !value.trim()}
              className="text-xs font-sans h-9 font-medium shadow-md shadow-cyan-500/20 flex-1 sm:flex-initial sm:w-auto cursor-pointer"
            >
              {loading ? 'Processing...' : confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
