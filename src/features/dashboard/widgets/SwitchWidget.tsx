import React, { useState, useMemo } from 'react';
import { Power, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { DashboardWidgetConfig } from '@/core/dashboard/types';

interface SwitchWidgetProps {
  config: DashboardWidgetConfig;
  latestValue?: number | string;
  onPublish: (topic: string, payload: string, qos?: 0 | 1 | 2, retain?: boolean) => Promise<void>;
}

export const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  config,
  latestValue,
  onPublish,
}) => {
  const [isPending, setIsPending] = useState(false);

  // Compute current state based on latest incoming value
  const isChecked = useMemo(() => {
    if (latestValue === undefined || latestValue === null) return false;
    const str = String(latestValue).trim().toLowerCase();
    return ['1', 'true', 'on', 'active', 'open'].includes(str);
  }, [latestValue]);

  const handleToggle = async (nextChecked: boolean) => {
    const targetTopic = config.publishTopic || config.topic;
    if (!targetTopic) return;

    const payload = nextChecked
      ? config.onPayload || '{"state":"ON"}'
      : config.offPayload || '{"state":"OFF"}';

    setIsPending(true);
    try {
      await onPublish(targetTopic, payload, config.qos ?? 1, config.retain ?? false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full py-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              isChecked
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
            }`}
          >
            <Power className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">
              {isChecked ? 'Device Power: ON' : 'Device Power: OFF'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Pub: {config.publishTopic || config.topic}
            </span>
          </div>
        </div>

        {/* Tactile Switch */}
        <Switch
          checked={isChecked}
          onCheckedChange={handleToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* Footer Info & Publish Feedback */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60 mt-3">
        <span className="flex items-center gap-1">
          <Send className="h-2.5 w-2.5 text-zinc-400" />
          QoS {config.qos ?? 1} {config.retain ? '• Retain' : ''}
        </span>
        <span className={isChecked ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
          {isPending ? 'Sending...' : isChecked ? 'STATE: ON' : 'STATE: OFF'}
        </span>
      </div>
    </div>
  );
};
