import React, { useState } from 'react';
import {
  Copy,
  Check,
  Send,
  X,
  FileCode,
  FolderTree,
  Binary,
  AlignLeft,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredMessage } from '@/core/db/types';
import { format } from 'date-fns';
import { formatBytes } from '@/lib/utils';
import { JsonTreeView } from './JsonTreeView';
import { HexViewer } from './HexViewer';
import { toast } from 'sonner';

interface MessageDetailInspectorProps {
  message: StoredMessage | null;
  onClose: () => void;
  onRepublish?: (message: StoredMessage) => void;
}

export const MessageDetailInspector: React.FC<MessageDetailInspectorProps> = ({
  message,
  onClose,
  onRepublish,
}) => {
  const [activeView, setActiveView] = useState<'pretty' | 'tree' | 'hex' | 'raw'>('pretty');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedTopic, setCopiedTopic] = useState(false);
  const isMobile = useIsMobile();

  if (!message) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono select-none">
        Select a message from the stream to inspect details
      </div>
    );
  }

  let parsedJson: any = null;
  let isValidJson = false;
  try {
    parsedJson = JSON.parse(message.payload);
    isValidJson = true;
  } catch {
    isValidJson = false;
  }

  const handleCopyTopic = () => {
    navigator.clipboard.writeText(message.topic);
    setCopiedTopic(true);
    toast.success('Topic copied');
    setTimeout(() => setCopiedTopic(false), 1200);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(message.payload);
    setCopiedPayload(true);
    toast.success('Payload copied');
    setTimeout(() => setCopiedPayload(false), 1200);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800 text-xs select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 px-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 mr-1"
                title="Back to messages"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back</span>
              </Button>
            )}

            <Badge
              variant={message.direction === 'in' ? 'cyan' : 'emerald'}
              className="uppercase text-[9px] py-0 px-1.5"
            >
              {message.direction === 'in' ? 'Inbound' : 'Outbound'}
            </Badge>

            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[130px] sm:max-w-none">
              {format(message.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onRepublish && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRepublish(message)}
                className="h-6 px-2 text-[11px] text-cyan-400 hover:text-cyan-300"
                title="Republish message"
              >
                <Send className="h-3 w-3 mr-1" />
                <span>Republish</span>
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Topic display */}
        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded p-1.5 font-mono text-[11px]">
          <span className="text-cyan-400 font-semibold truncate pr-2 select-text">
            {message.topic}
          </span>
          <button
            onClick={handleCopyTopic}
            className="p-1 text-zinc-500 hover:text-cyan-400 shrink-0"
            title="Copy Topic"
          >
            {copiedTopic ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>

        {/* Message Badges: QoS, Retain, Size */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span>QoS: <strong className="text-zinc-200">{message.qos}</strong></span>
          <span>•</span>
          <span>Retain: <strong className="text-zinc-200">{message.retain ? 'true' : 'false'}</strong></span>
          <span>•</span>
          <span>Size: <strong className="text-zinc-200">{formatBytes(message.sizeBytes)}</strong></span>
          {isValidJson && (
            <>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Valid JSON</span>
            </>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="h-8 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('pretty')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeView === 'pretty'
                ? 'bg-zinc-800 text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="h-3 w-3" />
            <span>Pretty JSON</span>
          </button>

          <button
            onClick={() => setActiveView('tree')}
            disabled={!isValidJson}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeView === 'tree'
                ? 'bg-zinc-800 text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree className="h-3 w-3" />
            <span>JSON Tree</span>
          </button>

          <button
            onClick={() => setActiveView('hex')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeView === 'hex'
                ? 'bg-zinc-800 text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Binary className="h-3 w-3" />
            <span>Hex View</span>
          </button>

          <button
            onClick={() => setActiveView('raw')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeView === 'raw'
                ? 'bg-zinc-800 text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlignLeft className="h-3 w-3" />
            <span>Raw</span>
          </button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyPayload}
          className="h-6 text-[11px] text-zinc-400 hover:text-zinc-200"
          title="Copy full payload"
        >
          {copiedPayload ? (
            <Check className="h-3 w-3 text-emerald-400 mr-1" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          <span>Copy</span>
        </Button>
      </div>

      {/* Main Payload Content Body */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-2 font-mono text-xs select-text">
        {activeView === 'pretty' && (
          <pre className="p-3 text-emerald-400 leading-relaxed overflow-auto whitespace-pre-wrap">
            {isValidJson ? JSON.stringify(parsedJson, null, 2) : message.payload}
          </pre>
        )}

        {activeView === 'tree' && isValidJson && <JsonTreeView data={parsedJson} />}

        {activeView === 'hex' && <HexViewer data={message.payload} />}

        {activeView === 'raw' && (
          <pre className="p-3 text-zinc-300 leading-relaxed overflow-auto whitespace-pre-wrap">
            {message.payload}
          </pre>
        )}
      </div>

      {/* MQTT 5 User Properties Drawer if present */}
      {message.userProperties && Object.keys(message.userProperties).length > 0 && (
        <div className="border-t border-zinc-800 p-2 bg-zinc-900/40">
          <span className="text-[10px] font-mono text-zinc-400 block mb-1">
            MQTT 5 User Properties:
          </span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(message.userProperties).map(([k, v]) => (
              <span
                key={k}
                className="text-[10px] font-mono bg-zinc-800 text-cyan-300 px-1.5 py-0.5 rounded"
              >
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
