import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  LayoutDashboard,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/core/store/dashboardStore';
import { useStudioStore } from '@/app/store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { MQTTTopicMatcher } from '@/core/mqtt/MQTTTopicMatcher';
import { extractTelemetryValue } from '@/core/dashboard/telemetryExtractor';
import { WidgetContainer } from './components/WidgetContainer';
import { AddEditWidgetModal } from './components/AddEditWidgetModal';
import { LineChartWidget } from './widgets/LineChartWidget';
import { GaugeWidget } from './widgets/GaugeWidget';
import { StatCardWidget } from './widgets/StatCardWidget';
import { StatusLedWidget } from './widgets/StatusLedWidget';
import { SwitchWidget } from './widgets/SwitchWidget';
import { PushButtonWidget } from './widgets/PushButtonWidget';
import type { DashboardWidgetConfig } from '@/core/dashboard/types';
import { toast } from 'sonner';

export const DashboardStudio: React.FC = () => {
  const {
    widgets,
    telemetryData,
    latestValues,
    isStreaming,
    setIsStreaming,
    recordTelemetry,
    clearTelemetry,
    addWidget,
    updateWidget,
    deleteWidget,
    loadPreset,
    isAddModalOpen,
    setAddModalOpen,
    autoSubscribeTopics,
    setAutoSubscribeTopics,
  } = useDashboardStore();

  const activeConnectionId = useStudioStore((state) => state.activeConnectionId);
  const connectionStatuses = useStudioStore((state) => state.connectionStatuses);
  const currentStatus = activeConnectionId ? connectionStatuses[activeConnectionId]?.status || 'disconnected' : 'disconnected';
  const isConnected = currentStatus === 'connected';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidgetConfig | null>(null);

  const isModalVisible = modalOpen || isAddModalOpen;
  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    setAddModalOpen(open);
    if (!open) {
      setEditingWidget(null);
    }
  };

  // Auto-subscribe to all widget topics on the active connection ONLY if autoSubscribeTopics is true
  useEffect(() => {
    if (!autoSubscribeTopics || !activeConnectionId || widgets.length === 0) return;
    const adapter = connectionManager.getConnection(activeConnectionId);
    if (!adapter || adapter.getStatus() !== 'connected') return;

    // Collect all unique topics to subscribe
    const uniqueTopics = Array.from(
      new Set(widgets.map((w) => w.topic).filter((t) => Boolean(t && t.trim())))
    );

    uniqueTopics.forEach((t) => {
      adapter.subscribe(t, 0).catch(() => {});
    });
  }, [activeConnectionId, widgets, autoSubscribeTopics]);

  // Global message stream listener
  useEffect(() => {
    if (!isStreaming) return;

    const unsub = connectionManager.onGlobalMessage((msg) => {
      // Dispatch incoming message to all matching widgets
      widgets.forEach((widget) => {
        if (!widget.topic) return;

        if (MQTTTopicMatcher.matches(widget.topic, msg.topic)) {
          const extracted = extractTelemetryValue(msg.payload, widget.jsonPath);
          if (extracted !== null && extracted !== undefined) {
            recordTelemetry(widget.id, extracted, widget.chartMaxPoints || 30);
          }
        }
      });
    });

    return () => {
      unsub();
    };
  }, [isStreaming, widgets, recordTelemetry]);

  // Handle publishing commands from interactive widgets (Switch, Button)
  const handlePublishCommand = useCallback(
    async (topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain: boolean = false) => {
      if (!activeConnectionId) {
        toast.error('No active broker connected to send command');
        return;
      }

      try {
        await connectionManager.publish(activeConnectionId, topic, payload, { qos, retain });
        toast.success(`Published to ${topic}`, { duration: 1500 });
      } catch (err: any) {
        toast.error(`Publish failed: ${err.message || 'Unknown error'}`);
      }
    },
    [activeConnectionId]
  );

  const handleOpenAddModal = () => {
    setEditingWidget(null);
    setModalOpen(true);
  };

  const handleEditWidget = (widget: DashboardWidgetConfig) => {
    setEditingWidget(widget);
    setModalOpen(true);
  };

  const handleDuplicateWidget = (widget: DashboardWidgetConfig) => {
    const duplicated: DashboardWidgetConfig = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `w-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      title: `${widget.title} (Copy)`,
    };
    addWidget(duplicated);
    toast.success(`Duplicated widget: ${duplicated.title}`);
  };

  const handleSaveWidget = (widget: DashboardWidgetConfig) => {
    if (editingWidget) {
      updateWidget(widget);
      toast.success('Widget updated');
    } else {
      addWidget(widget);
      toast.success('Widget added');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-zinc-100">Live Telemetry Dashboard</h1>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Streaming status toggle / Offline indicator */}
          {!isConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-zinc-900 border-zinc-800 text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              <span>Broker Offline</span>
            </div>
          ) : (
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isStreaming
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title={isStreaming ? 'Click to pause telemetry display' : 'Click to resume telemetry display'}
            >
              {isStreaming ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <Pause className="h-3 w-3" />
                  Live Stream
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Stream Paused
                </>
              )}
            </button>
          )}

          {/* Auto-Subscribe Toggle */}
          <button
            onClick={() => {
              const next = !autoSubscribeTopics;
              setAutoSubscribeTopics(next);
              if (next) {
                toast.success('Auto-subscribe enabled for widget topics');
              } else {
                toast.info('Auto-subscribe disabled for widget topics');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              autoSubscribeTopics
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
            title="When enabled, Dashboard automatically subscribes the active broker to topics required by current widgets"
          >
            <Radio className="h-3 w-3" />
            <span>Auto-Subscribe: {autoSubscribeTopics ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearTelemetry();
              toast.info('Telemetry data buffers cleared');
            }}
            className="text-xs h-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Data
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-medium gap-1.5 shadow-sm shadow-cyan-950/40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Main Grid Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {widgets.length === 0 ? (
          /* Empty State Canvas */
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-200 mb-1">
              Your Dashboard is Empty
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
              Create real-time telemetry charts, gauges, switch controls, and status indicators
              to monitor your connected MQTT devices.
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleOpenAddModal}
                className="gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Your First Widget
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  loadPreset('preset-smart-home');
                  toast.success('Loaded Smart Home preset');
                }}
                className="gap-2 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Load Smart Home Template
              </Button>
            </div>
          </div>
        ) : (
          /* Responsive Widget Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {widgets.map((widget) => {
              const widgetData = telemetryData[widget.id] || [];
              const latestVal = latestValues[widget.id];
              const hasRecent = widgetData.length > 0;

              return (
                <WidgetContainer
                  key={widget.id}
                  config={widget}
                  hasRecentData={hasRecent}
                  onEdit={handleEditWidget}
                  onDuplicate={handleDuplicateWidget}
                  onDelete={deleteWidget}
                >
                  {widget.type === 'line_chart' && (
                    <LineChartWidget
                      config={widget}
                      data={widgetData}
                      latestValue={latestVal}
                    />
                  )}

                  {widget.type === 'gauge' && (
                    <GaugeWidget
                      config={widget}
                      latestValue={latestVal}
                    />
                  )}

                  {widget.type === 'stat_card' && (
                    <StatCardWidget
                      config={widget}
                      data={widgetData}
                      latestValue={latestVal}
                    />
                  )}

                  {widget.type === 'status_led' && (
                    <StatusLedWidget
                      config={widget}
                      latestValue={latestVal}
                    />
                  )}

                  {widget.type === 'switch' && (
                    <SwitchWidget
                      config={widget}
                      latestValue={latestVal}
                      onPublish={handlePublishCommand}
                    />
                  )}

                  {widget.type === 'push_button' && (
                    <PushButtonWidget
                      config={widget}
                      onPublish={handlePublishCommand}
                    />
                  )}
                </WidgetContainer>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Widget Modal */}
      <AddEditWidgetModal
        open={isModalVisible}
        onOpenChange={handleModalOpenChange}
        widgetToEdit={editingWidget}
        onSave={handleSaveWidget}
      />
    </div>
  );
};
