import React, { useState, useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  Send,
  Play,
  Square,
  Sparkles,
  AlignLeft,
  Minimize2,
  Copy,
  BookmarkPlus,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useStudioStore } from '@/app/store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { variableInterpolator } from '@/core/template/VariableInterpolator';
import { formatBytes } from '@/lib/utils';
import { db } from '@/core/db/StudioDatabase';
import type { QoS, PayloadFormat, PublishPreset } from '@/core/db/types';
import { VariableHelperModal } from './VariableHelperModal';
import { toast } from 'sonner';

interface PublisherViewProps {
  initialPreset?: PublishPreset | null;
}

export const PublisherView: React.FC<PublisherViewProps> = ({ initialPreset }) => {
  const { activeConnectionId, connectionStatuses } = useStudioStore();

  const [topic, setTopic] = useState('devices/sensor-01/telemetry');
  const [qos, setQos] = useState<QoS>(0);
  const [retain, setRetain] = useState(false);
  const [format, setFormat] = useState<PayloadFormat>('json');
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        deviceId: 'sensor-01',
        timestamp: '{{timestamp}}',
        temperature: '{{random_int(22, 34)}}',
        humidity: '{{random_int(45, 80)}}',
        sequence: '{{sequence}}',
        status: 'online',
      },
      null,
      2
    )
  );

  // Repeat & Interval
  const [isPublishingRepeat, setIsPublishingRepeat] = useState(false);
  const [repeatCount, setRepeatCount] = useState(5);
  const [repeatIntervalMs, setRepeatIntervalMs] = useState(1000);
  const repeatTimerRef = useRef<any>(null);

  // Modals & UI helpers
  const [variableModalOpen, setVariableModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resolvedPreview, setResolvedPreview] = useState('');
  const [copied, setCopied] = useState(false);

  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (initialPreset) {
      setTopic(initialPreset.topic);
      setQos(initialPreset.qos);
      setRetain(initialPreset.retain);
      setFormat(initialPreset.format);
      setPayload(initialPreset.payload);
    }
  }, [initialPreset]);

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Calculate byte size
  const payloadBytes = new TextEncoder().encode(payload).length;

  const currentStatus = activeConnectionId
    ? connectionStatuses[activeConnectionId]?.status || 'disconnected'
    : 'disconnected';

  // Publish Single Message
  const handlePublish = async () => {
    if (!activeConnectionId) {
      toast.error('No broker selected. Please select a broker first.');
      return;
    }
    if (currentStatus !== 'connected') {
      toast.error(`Cannot publish: Broker is ${currentStatus}. Connect first.`);
      return;
    }
    if (!topic.trim()) {
      toast.error('Topic cannot be empty.');
      return;
    }

    try {
      // Interpolate topic and payload with dynamic variables
      const resolvedTopic = variableInterpolator.interpolate(topic, {
        client_id: connectionManager.getConnection(activeConnectionId)?.profile.clientId,
      });
      const resolvedPayload = variableInterpolator.interpolate(payload, {
        client_id: connectionManager.getConnection(activeConnectionId)?.profile.clientId,
      });

      await connectionManager.publish(activeConnectionId, resolvedTopic, resolvedPayload, {
        qos,
        retain,
      });

      toast.success(`Published to ${resolvedTopic}`);
    } catch (err: any) {
      toast.error(`Publish failed: ${err.message}`);
    }
  };

  // Start Repeated Publish
  const handleStartRepeat = () => {
    if (currentStatus !== 'connected') {
      toast.error('Connect to broker before starting repeated publishing.');
      return;
    }

    setIsPublishingRepeat(true);
    let remaining = repeatCount;

    const executeOne = async () => {
      if (remaining <= 0) {
        handleStopRepeat();
        toast.info('Completed scheduled publishing run');
        return;
      }
      await handlePublish();
      remaining -= 1;
    };

    executeOne();
    repeatTimerRef.current = setInterval(executeOne, Math.max(100, repeatIntervalMs));
  };

  const handleStopRepeat = () => {
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    setIsPublishingRepeat(false);
  };

  // Insert Variable Token into Editor
  const handleInsertVariable = (token: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits('variable-insert', [
        {
          range: selection,
          text: token,
          forceMoveMarkers: true,
        },
      ]);
    } else {
      setPayload((prev) => prev + token);
    }
  };

  // Format (Prettify) JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payload);
      setPayload(JSON.stringify(parsed, null, 2));
      toast.success('JSON formatted');
    } catch (e: any) {
      toast.error('Cannot format: Invalid JSON');
    }
  };

  // Minify JSON
  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(payload);
      setPayload(JSON.stringify(parsed));
      toast.success('JSON minified');
    } catch (e: any) {
      toast.error('Cannot minify: Invalid JSON');
    }
  };

  // Preview Resolved Payload
  const handleOpenPreview = () => {
    const res = variableInterpolator.interpolate(payload, {
      client_id: activeConnectionId || 'mqtt_client_preview',
    });
    setResolvedPreview(res);
    setPreviewOpen(true);
  };

  // Copy Payload
  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Payload copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  // Save as Preset
  const handleSaveAsPreset = async () => {
    const name = prompt('Enter preset name:', `Preset: ${topic}`);
    if (!name) return;

    const newPreset: PublishPreset = {
      id: `preset-${Date.now()}`,
      name,
      topic,
      payload,
      qos,
      retain,
      format,
      tags: ['Custom'],
      createdAt: Date.now(),
    };

    await db.publishPresets.add(newPreset);
    toast.success(`Preset "${name}" saved`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Top Publish Controls Bar */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 space-y-3">
        <div className="flex items-center gap-2">
          {/* Topic input */}
          <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-750 rounded-md px-2.5 py-0.5">
            <span className="text-[11px] font-mono text-cyan-400 font-semibold mr-2 select-none">
              TOPIC:
            </span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. sensor/+/data or eonic/126BA0/command"
              className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          {/* QoS Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-750 rounded-md px-2 py-1 text-xs">
            <span className="text-[11px] text-zinc-400 select-none">QoS:</span>
            <select
              value={qos}
              onChange={(e) => setQos(Number(e.target.value) as QoS)}
              className="bg-transparent font-mono text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value={0}>0 - At most once</option>
              <option value={1}>1 - At least once</option>
              <option value={2}>2 - Exactly once</option>
            </select>
          </div>

          {/* Retain Switch */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-750 rounded-md px-2.5 py-1 text-xs">
            <Switch checked={retain} onCheckedChange={setRetain} />
            <span className="text-zinc-300 select-none text-[11px]">Retain</span>
          </div>

          {/* Publish Once Button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishingRepeat}
            className="flex items-center gap-1.5 font-semibold text-xs h-8 px-4"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Publish</span>
          </Button>
        </div>

        {/* Secondary Toolbar: Format, Dynamic Variables, Prettify, Repeat */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            {/* Format selector */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded border border-zinc-800">
              {(['json', 'text', 'xml', 'hex', 'base64'] as PayloadFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors uppercase ${
                    format === fmt
                      ? 'bg-zinc-800 text-cyan-400 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Variable helper button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVariableModalOpen(true)}
              className="h-6 text-[11px] flex items-center gap-1 text-cyan-400 border-cyan-800/50 hover:bg-cyan-950/40"
            >
              <Sparkles className="h-3 w-3" />
              <span>Insert Variable</span>
            </Button>

            {/* Preview button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenPreview}
              className="h-6 text-[11px] flex items-center gap-1 text-zinc-300"
            >
              <Eye className="h-3 w-3" />
              <span>Preview Resolved</span>
            </Button>

            {format === 'json' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFormatJson}
                  className="h-6 text-[11px] text-zinc-400 hover:text-zinc-200"
                  title="Format JSON"
                >
                  <AlignLeft className="h-3 w-3 mr-1" />
                  <span>Prettify</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMinifyJson}
                  className="h-6 text-[11px] text-zinc-400 hover:text-zinc-200"
                  title="Minify JSON"
                >
                  <Minimize2 className="h-3 w-3 mr-1" />
                  <span>Minify</span>
                </Button>
              </>
            )}
          </div>

          {/* Right Tools: Repeat Publish & Save Preset */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">
              Size: <span className="text-zinc-300">{formatBytes(payloadBytes)}</span>
            </span>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyPayload}
              className="h-6 text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveAsPreset}
              className="h-6 text-[11px] flex items-center gap-1 text-zinc-300"
            >
              <BookmarkPlus className="h-3 w-3" />
              <span>Save Preset</span>
            </Button>

            {/* Repeat publish controls */}
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
              <span className="text-[11px] text-zinc-400">Repeat:</span>
              <input
                type="number"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-6 px-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200 text-center"
                title="Number of times"
              />
              <span className="text-[11px] text-zinc-400">every</span>
              <input
                type="number"
                value={repeatIntervalMs}
                onChange={(e) => setRepeatIntervalMs(Math.max(100, parseInt(e.target.value) || 1000))}
                className="w-14 h-6 px-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200 text-center"
                title="Interval in ms"
              />
              <span className="text-[11px] text-zinc-500">ms</span>

              {isPublishingRepeat ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopRepeat}
                  className="h-6 px-2 text-[11px] flex items-center gap-1"
                >
                  <Square className="h-2.5 w-2.5" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleStartRepeat}
                  className="h-6 px-2 text-[11px] flex items-center gap-1 text-cyan-400"
                >
                  <Play className="h-2.5 w-2.5" />
                  <span>Loop</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={format === 'json' ? 'json' : format === 'xml' ? 'xml' : 'plaintext'}
          value={payload}
          onChange={(val) => setPayload(val || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Modals */}
      <VariableHelperModal
        open={variableModalOpen}
        onOpenChange={setVariableModalOpen}
        onInsertVariable={handleInsertVariable}
      />

      {/* Resolved Preview Drawer/Modal */}
      {previewOpen && (
        <div className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-950 border-t border-zinc-800 z-30 p-4 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>Resolved Payload Preview (Variables Evaluated)</span>
            </span>
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(false)} className="h-6 text-xs">
              Close Preview
            </Button>
          </div>
          <pre className="flex-1 overflow-auto p-3 font-mono text-xs text-zinc-200 bg-zinc-900/60 rounded mt-2">
            {resolvedPreview}
          </pre>
        </div>
      )}
    </div>
  );
};
