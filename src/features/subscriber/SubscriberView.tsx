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
  Copy,
  Sparkles,
} from 'lucide-react';
import { useStudioStore } from '@/app/store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { useDataStore } from '@/core/store/dataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import {
  loadSubscribeDraftFromSession,
  saveSubscribeDraftToSession,
  isSessionPersistEnabled,
} from '@/core/storage/sessionStorageManager';

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

  const initialDraft = React.useMemo(() => loadSubscribeDraftFromSession(), []);

  const [subTopic, setSubTopic] = useState(initialDraft?.topic || '');
  const [subQos, setSubQos] = useState<QoS>(initialDraft?.qos ?? 0);

  // Auto-sync subscribe draft to session storage if enabled
  React.useEffect(() => {
    if (isSessionPersistEnabled()) {
      saveSubscribeDraftToSession({ topic: subTopic, qos: subQos });
    }
  }, [subTopic, subQos]);

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

  // Modal state
  const [unsubscribeAllConfirmOpen, setUnsubscribeAllConfirmOpen] = useState(false);

  // Handle Unsubscribe
  const handleUnsubscribe = async (topic: string) => {
    try {
      await activeAdapter?.unsubscribe(topic);
      toast.info(`Unsubscribed from ${topic}`);
    } catch (err: any) {
      toast.error(`Unsubscribe failed: ${err.message}`);
    }
  };

  // Handle Unsubscribe All
  const handleUnsubscribeAll = async () => {
    if (!activeAdapter || subscriptions.length === 0) return;
    try {
      for (const sub of subscriptions) {
        await activeAdapter.unsubscribe(sub.topic);
      }
      toast.info(`Unsubscribed from all ${subscriptions.length} active topics`);
    } catch (err: any) {
      toast.error(`Failed to unsubscribe all: ${err.message}`);
    }
  };

  // Quick subscribe from shortcut buttons
  const handleQuickSubscribe = async (topic: string, qos: QoS = 0) => {
    if (!activeConnectionId || currentStatus !== 'connected') {
      toast.error('Connect to broker first before subscribing.');
      return;
    }
    try {
      await activeAdapter?.subscribe(topic, qos);
      toast.success(`Subscribed to ${topic}`);
    } catch (err: any) {
      toast.error(`Subscription failed: ${err.message}`);
    }
  };

  // Copy topic path
  const handleCopyTopic = (topic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(topic);
    toast.success(`Copied topic "${topic}"`);
  };

  // Quick toggle filter stream by topic
  const handleFilterBySubTopic = (topic: string) => {
    if (topicFilter === topic) {
      setTopicFilter('');
      toast.info('Cleared topic filter');
    } else {
      const clean = topic.replace(/[#+]/g, '').replace(/\/+$/, '');
      setTopicFilter(clean || topic);
      toast.info(`Filtering stream by: ${clean || topic}`);
    }
  };

  // Format topic with highlighted MQTT wildcards
  const renderTopicParts = (topic: string) => {
    const parts = topic.split(/([+#])/g);
    return (
      <>
        {parts.map((p, i) => {
          if (p === '#') {
            return (
              <span
                key={i}
                className="text-amber-400 font-bold bg-amber-500/15 px-1 py-0.2 rounded text-[11px]"
                title="Multi-level wildcard (#)"
              >
                #
              </span>
            );
          }
          if (p === '+') {
            return (
              <span
                key={i}
                className="text-cyan-400 font-bold bg-cyan-500/15 px-1 py-0.2 rounded text-[11px]"
                title="Single-level wildcard (+)"
              >
                +
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </>
    );
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
      <div className="border-b border-zinc-800 bg-zinc-900/40 select-none">
        {/* Subscribe Input Row */}
        <div className="p-3 pb-2.5 flex items-center gap-2">
          {/* Subscription topic input */}
          <div className="flex-1 flex items-center bg-zinc-900/90 border border-zinc-800 rounded-md px-3 py-1 focus-within:ring-1 focus-within:ring-cyan-500 focus-within:border-cyan-500/80 transition-all">
            <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mr-2 shrink-0 select-none flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              SUB TOPIC:
            </span>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubscribe();
              }}
              placeholder="Enter topic filter to subscribe (e.g. sensors/# or devices/+/status)"
              className="w-full bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            {/* Quick wildcard inserter buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setSubTopic((prev) => (prev ? `${prev}/+` : '+'))}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800/70 border border-zinc-700/50 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Append single-level wildcard (+)"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setSubTopic((prev) => (prev ? `${prev}/#` : '#'))}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800/70 border border-zinc-700/50 text-amber-400 hover:bg-amber-950/60 hover:border-amber-500/50 hover:text-amber-300 transition-colors cursor-pointer"
                title="Append multi-level wildcard (#)"
              >
                #
              </button>
            </div>
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
            className="flex items-center gap-1.5 font-semibold text-xs h-8 px-4 shadow-md shadow-cyan-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Subscribe</span>
          </Button>
        </div>

        {/* Active Topics Header & Cards Section */}
        <div className="px-3 pb-3 pt-1 border-t border-zinc-800/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider">
                  Active Topics
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
              </span>
              {topicFilter && (
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                  <span>Filtered:</span>
                  <strong className="font-mono">{topicFilter}</strong>
                  <button
                    onClick={() => setTopicFilter('')}
                    className="hover:text-rose-400 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {subscriptions.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnsubscribeAllConfirmOpen(true)}
                  className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Unsubscribe from all active topics"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Unsubscribe All</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Subscription Cards */}
          {subscriptions.length === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-dashed border-zinc-800/90 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Inbox className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-[11px] text-zinc-400">
                  No active subscriptions. Enter a topic above or pick a quick start filter:
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  onClick={() => handleQuickSubscribe('#')}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-700/60 border border-zinc-800 text-[10px] font-mono text-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                  title="Subscribe to all topics (#)"
                >
                  <Plus className="w-2.5 h-2.5 text-cyan-400" />
                  <span># (All Topics)</span>
                </button>
                <button
                  onClick={() => handleQuickSubscribe('sensors/#')}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-700/60 border border-zinc-800 text-[10px] font-mono text-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                  title="Subscribe to sensors/#"
                >
                  <Plus className="w-2.5 h-2.5 text-cyan-400" />
                  <span>sensors/#</span>
                </button>
                <button
                  onClick={() => handleQuickSubscribe('devices/+/status')}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-700/60 border border-zinc-800 text-[10px] font-mono text-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                  title="Subscribe to devices/+/status"
                >
                  <Plus className="w-2.5 h-2.5 text-cyan-400" />
                  <span>devices/+/status</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-0.5 pr-1">
              {subscriptions.map((sub) => {
                const isFiltered = topicFilter && (sub.topic === topicFilter || sub.topic.includes(topicFilter));
                return (
                  <div
                    key={sub.topic}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all group select-none shadow-sm ${
                      isFiltered
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-cyan-950/30 ring-1 ring-cyan-500/40 text-cyan-300'
                        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {/* Live dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] shrink-0" />

                    {/* Topic Name */}
                    <span
                      onClick={() => handleFilterBySubTopic(sub.topic)}
                      className="font-semibold text-zinc-100 cursor-pointer hover:text-cyan-300 transition-colors tracking-tight flex items-center gap-0.5"
                      title="Click to toggle stream filter for this topic"
                    >
                      {renderTopicParts(sub.topic)}
                    </span>

                    {/* QoS Badge */}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 shrink-0 font-medium">
                      QoS {sub.qos}
                    </span>

                    {/* Message Count Badge */}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 shrink-0 font-semibold">
                      {sub.messageCount} {sub.messageCount === 1 ? 'msg' : 'msgs'}
                    </span>

                    {/* Card Actions */}
                    <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1 ml-0.5">
                      {/* Copy topic button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyTopic(sub.topic, e)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copy topic"
                      >
                        <Copy className="h-3 w-3" />
                      </button>

                      {/* Filter stream toggle */}
                      <button
                        type="button"
                        onClick={() => handleFilterBySubTopic(sub.topic)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isFiltered
                            ? 'text-cyan-400 bg-cyan-950/80 font-bold'
                            : 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800'
                        }`}
                        title={isFiltered ? 'Clear topic filter' : 'Filter stream to this topic'}
                      >
                        <Filter className="h-3 w-3" />
                      </button>

                      {/* Unsubscribe button */}
                      <button
                        type="button"
                        onClick={() => handleUnsubscribe(sub.topic)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Unsubscribe"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <div className="divide-y divide-zinc-800/60 font-mono text-xs">
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
      {/* Unsubscribe All Confirmation */}
      <ConfirmDialog
        open={unsubscribeAllConfirmOpen}
        onOpenChange={setUnsubscribeAllConfirmOpen}
        title="Unsubscribe from All Topics"
        description={`Are you sure you want to unsubscribe from all ${subscriptions.length} active topics? You will stop receiving messages on these filters.`}
        confirmText="Unsubscribe All"
        variant="destructive"
        onConfirm={handleUnsubscribeAll}
      />
    </div>
  );
};
