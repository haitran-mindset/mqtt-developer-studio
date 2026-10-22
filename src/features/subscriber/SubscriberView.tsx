import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Plus,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  X,
  Radio,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useStudioStore } from '@/app/store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { useDataStore } from '@/core/store/dataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QoS, StoredMessage } from '@/core/db/types';
import { format } from 'date-fns';
import { formatBytes } from '@/lib/utils';
import { MessageDetailInspector } from './MessageDetailInspector';
import { toast } from 'sonner';

interface SubscriberViewProps {
  onRepublishMessage?: (message: StoredMessage) => void;
}

export const SubscriberView: React.FC<SubscriberViewProps> = ({ onRepublishMessage }) => {
  const {
    activeConnectionId,
    connectionStatuses,
    isPausedMessageStream,
    setIsPausedMessageStream,
  } = useStudioStore();

  const [subTopic, setSubTopic] = useState('');
  const [subQos, setSubQos] = useState<QoS>(0);

  // Search & Filtering
  const [topicFilter, setTopicFilter] = useState('');
  const [payloadFilter, setPayloadFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out'>('all');

  // Selected message for inspector
  const [selectedMessage, setSelectedMessage] = useState<StoredMessage | null>(null);

  // Active subscriptions for active broker
  const activeAdapter = activeConnectionId
    ? connectionManager.getConnection(activeConnectionId)
    : null;
  const subscriptions = activeAdapter ? Array.from(activeAdapter.getSubscriptions().values()) : [];

  // In-memory messages from useDataStore
  const allMessages = useDataStore((state) => state.messageHistory);
  const clearConnectionMessages = useDataStore((state) => state.clearConnectionMessages);

  const rawMessages = useMemo(() => {
    if (!activeConnectionId) return [];
    return allMessages.filter((m) => m.connectionId === activeConnectionId);
  }, [allMessages, activeConnectionId]);

  // Freeze stream view if paused
  const [frozenMessages, setFrozenMessages] = useState<StoredMessage[]>([]);
  React.useEffect(() => {
    if (!isPausedMessageStream) {
      setFrozenMessages(rawMessages);
    }
  }, [rawMessages, isPausedMessageStream]);

  const displayMessages = isPausedMessageStream ? frozenMessages : rawMessages;

  // Filter messages
  const filteredMessages = useMemo(() => {
    return displayMessages.filter((msg) => {
      if (directionFilter !== 'all' && msg.direction !== directionFilter) return false;
      if (topicFilter && !msg.topic.toLowerCase().includes(topicFilter.toLowerCase())) return false;
      if (payloadFilter && !msg.payload.toLowerCase().includes(payloadFilter.toLowerCase()))
        return false;
      return true;
    });
  }, [displayMessages, directionFilter, topicFilter, payloadFilter]);

  const currentStatus = activeConnectionId
    ? connectionStatuses[activeConnectionId]?.status || 'disconnected'
    : 'disconnected';

  // Handle Subscribe
  const handleSubscribe = async () => {
    if (!activeConnectionId || currentStatus !== 'connected') {
      toast.error('Connect to broker first before subscribing.');
      return;
    }
    if (!subTopic.trim()) {
      toast.error('Topic cannot be empty.');
      return;
    }

    try {
      await activeAdapter?.subscribe(subTopic, subQos);
      toast.success(`Subscribed to ${subTopic}`);
      setSubTopic('');
    } catch (err: any) {
      toast.error(`Subscription failed: ${err.message}`);
    }
  };

  // Handle Unsubscribe
  const handleUnsubscribe = async (topic: string) => {
    try {
      await activeAdapter?.unsubscribe(topic);
      toast.info(`Unsubscribed from ${topic}`);
    } catch (err: any) {
      toast.error(`Unsubscribe failed: ${err.message}`);
    }
  };

  // Clear Messages
  const handleClearMessages = () => {
    if (activeConnectionId) {
      clearConnectionMessages(activeConnectionId);
      setSelectedMessage(null);
      toast.success('Messages cleared for this connection');
    }
  };

  // Export Messages to JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredMessages, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mqtt_messages_${Date.now()}.json`;
    a.click();
    toast.success(`Exported ${filteredMessages.length} messages`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Top Subscription Bar */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 space-y-2.5 select-none">
        <div className="flex items-center gap-2">
          {/* Subscription topic input */}
          <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-750 rounded-md px-2.5 py-0.5 focus-within:ring-1 focus-within:ring-cyan-500 focus-within:border-cyan-500">
            <span className="text-[11px] font-mono text-cyan-400 font-semibold mr-2 select-none">
              SUB TOPIC:
            </span>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              placeholder="Enter topic filter to subscribe (e.g. sensors/# or devices/+/status)"
              className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          {/* QoS selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-zinc-400 font-medium select-none">QoS:</span>
            <Select value={String(subQos)} onValueChange={(val) => setSubQos(Number(val) as QoS)}>
              <SelectTrigger className="w-[145px] h-8 text-xs font-mono">
                <SelectValue placeholder="QoS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - At most once</SelectItem>
                <SelectItem value="1">1 - At least once</SelectItem>
                <SelectItem value="2">2 - Exactly once</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscribe Button */}
          <Button
            size="sm"
            onClick={handleSubscribe}
            className="flex items-center gap-1.5 font-semibold text-xs h-8 px-4"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Subscribe</span>
          </Button>
        </div>

        {/* Active Subscription Pills */}
        <div className="flex flex-wrap items-center gap-2 min-h-[26px]">
          <span className="text-[10px] text-zinc-500 font-mono">Active Topics:</span>
          {subscriptions.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic">
              No active subscriptions. Enter a topic above to start receiving messages.
            </span>
          ) : (
            subscriptions.map((sub) => (
              <Badge
                key={sub.topic}
                variant="outline"
                className="flex items-center gap-1.5 bg-zinc-900 border-cyan-900/60 text-cyan-400 py-1 px-2 text-xs font-mono group"
              >
                <Radio className="h-2.5 w-2.5 animate-pulse text-cyan-400" />
                <span className="font-semibold text-zinc-100">{sub.topic}</span>
                <span className="text-[9px] bg-cyan-950 px-1 py-0.5 rounded text-cyan-300">
                  QoS {sub.qos}
                </span>
                <span className="text-[9px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">
                  {sub.messageCount} msgs
                </span>
                <button
                  onClick={() => handleUnsubscribe(sub.topic)}
                  className="hover:text-rose-400 ml-1 cursor-pointer transition-colors"
                  title="Unsubscribe"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Filter & Stream Controls Toolbar */}
      <div className="h-9 px-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Topic search */}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-zinc-500" />
            <Input
              type="text"
              placeholder="Filter by topic..."
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="h-7 pl-7 pr-2 rounded text-[11px] font-mono text-zinc-200 placeholder:text-zinc-500 w-48"
            />
          </div>

          {/* Payload search */}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search payload..."
              value={payloadFilter}
              onChange={(e) => setPayloadFilter(e.target.value)}
              className="h-7 pl-7 pr-2 rounded text-[11px] font-mono text-zinc-200 placeholder:text-zinc-500 w-48"
            />
          </div>

          {/* Direction toggle */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800">
            {(['all', 'in', 'out'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-mono transition-colors cursor-pointer ${
                  directionFilter === dir
                    ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {dir === 'all' ? 'All' : dir === 'in' ? 'Inbound' : 'Outbound'}
              </button>
            ))}
          </div>
        </div>

        {/* Stream Actions */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume button */}
          <Button
            size="sm"
            variant={isPausedMessageStream ? 'destructive' : 'outline'}
            onClick={() => setIsPausedMessageStream(!isPausedMessageStream)}
            className="h-6 px-2 text-[11px] flex items-center gap-1"
            title="Pause display without stopping MQTT subscriptions"
          >
            {isPausedMessageStream ? (
              <>
                <Play className="h-3 w-3" />
                <span>Resume Stream</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                <span>Pause Display</span>
              </>
            )}
          </Button>

          {/* Clear stream */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearMessages}
            className="h-6 px-2 text-[11px] text-zinc-400 hover:text-rose-400"
            title="Clear all messages"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {/* Export JSON */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExportJson}
            className="h-6 px-2 text-[11px] text-zinc-400 hover:text-cyan-400"
            title="Export messages as JSON"
          >
            <Download className="h-3 w-3" />
          </Button>

          <span className="text-[11px] font-mono text-zinc-500">
            Showing <strong className="text-zinc-200">{filteredMessages.length}</strong> msgs
          </span>
        </div>
      </div>

      {/* Split Stage: Message Table on Left, Detail Inspector on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Message Stream Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-xs font-mono">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40 text-zinc-500" />
              <span>No messages matching current filters.</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-850 font-mono text-xs">
              {filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-900 border-l-2 border-cyan-400 shadow-sm'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Direction Icon */}
                    <span className="shrink-0">
                      {msg.direction === 'in' ? (
                        <span title="Inbound">
                          <ArrowDownLeft className="h-3.5 w-3.5 text-cyan-400" />
                        </span>
                      ) : (
                        <span title="Outbound">
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                        </span>
                      )}
                    </span>

                    {/* Timestamp */}
                    <span className="text-zinc-500 text-[11px] shrink-0 w-20">
                      {format(msg.timestamp, 'HH:mm:ss.SSS')}
                    </span>

                    {/* Topic */}
                    <span className="font-semibold text-zinc-200 text-xs shrink-0 max-w-[200px] truncate">
                      {msg.topic}
                    </span>

                    {/* Payload Snippet */}
                    <span className="flex-1 text-zinc-400 truncate text-[11px]">
                      {msg.payload.replace(/\s+/g, ' ')}
                    </span>

                    {/* Badges: QoS, Retain, Size */}
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-zinc-500">
                      <span className="bg-zinc-800 px-1 rounded text-zinc-400">
                        QoS {msg.qos}
                      </span>
                      {msg.retain && (
                        <span className="bg-amber-950 text-amber-400 px-1 rounded">
                          Retain
                        </span>
                      )}
                      <span>{formatBytes(msg.sizeBytes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail Inspector */}
        {selectedMessage && (
          <div className="w-[450px] shrink-0">
            <MessageDetailInspector
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
              onRepublish={onRepublishMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
