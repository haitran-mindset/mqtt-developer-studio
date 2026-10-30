import React, { useState } from 'react';
import { Send, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardWidgetConfig } from '@/core/dashboard/types';

interface PushButtonWidgetProps {
  config: DashboardWidgetConfig;
  onPublish: (topic: string, payload: string, qos?: 0 | 1 | 2, retain?: boolean) => Promise<void>;
}

export const PushButtonWidget: React.FC<PushButtonWidgetProps> = ({ config, onPublish }) => {
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handlePress = async () => {
    const targetTopic = config.publishTopic || config.topic;
    if (!targetTopic) return;

    setIsSending(true);
    try {
      await onPublish(
        targetTopic,
        config.buttonPayload || '{}',
        config.qos ?? 0,
        config.retain ?? false
      );
      setJustSent(true);
      setTimeout(() => setJustSent(false), 1500);
    } finally {
      setIsSending(false);
    }
  };

  const colorStyles =
    config.color === 'rose'
      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
      : config.color === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
      : config.color === 'amber'
      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950/50';

  return (
    <div className="flex flex-col justify-between h-full py-1">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono text-zinc-400 truncate">
          Topic: <span className="text-zinc-200">{config.publishTopic || config.topic}</span>
        </span>

        {/* Trigger Button */}
        <Button
          onClick={handlePress}
          disabled={isSending}
          className={`w-full py-5 text-sm font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-md ${colorStyles}`}
        >
          {justSent ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Triggered!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {config.buttonLabel || 'Trigger Command'}
            </span>
          )}
        </Button>
      </div>

      {/* Payload info snippet */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60 mt-2">
        <span className="truncate max-w-[180px]">
          Data: {config.buttonPayload ? config.buttonPayload.slice(0, 24) + '...' : '{}'}
        </span>
        <span className="flex items-center gap-1">
          <Send className="h-2.5 w-2.5 text-zinc-400" />
          QoS {config.qos ?? 0}
        </span>
      </div>
    </div>
  );
};
