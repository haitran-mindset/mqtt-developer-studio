import React, { useState, useEffect } from 'react';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioBottomPanel } from './StudioBottomPanel';
import { StudioBottomNav } from './StudioBottomNav';
import { ConnectionList } from '@/features/connections/ConnectionList';
import { ConnectionModal } from '@/features/connections/ConnectionModal';
import { PublisherView } from '@/features/publisher/PublisherView';
import { SubscriberView } from '@/features/subscriber/SubscriberView';
import { WorkflowStudio } from '@/features/workflows/WorkflowStudio';
import { DashboardStudio } from '@/features/dashboard/DashboardStudio';
import { useStudioStore } from '../store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import type { ConnectionProfile, PublishPreset, StoredMessage } from '@/core/db/types';
import { Toaster } from 'sonner';

export const StudioWorkbench: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setConnectionStatus,
    addLog,
  } = useStudioStore();

  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ConnectionProfile | null>(null);

  // Selected preset or republish message to populate into publisher
  const [activePublishPreset, setActivePublishPreset] = useState<PublishPreset | null>(null);

  // Wire listeners
  useEffect(() => {

    // Listen to all connection status transitions
    const unsubStatus = connectionManager.onGlobalStatus((connId, status, error) => {
      setConnectionStatus(connId, status, error);
    });

    // Listen to all log events
    const unsubLog = connectionManager.onGlobalLog((log) => {
      addLog(log);
    });

    return () => {
      unsubStatus();
      unsubLog();
    };
  }, [setConnectionStatus, addLog]);

  const handleOpenNewBroker = () => {
    setEditingProfile(null);
    setBrokerModalOpen(true);
  };

  const handleEditBroker = (profile: ConnectionProfile) => {
    setEditingProfile(profile);
    setBrokerModalOpen(true);
  };

  // When user clicks "Republish" from subscriber inspector
  const handleRepublishFromSubscriber = (msg: StoredMessage) => {
    setActivePublishPreset({
      id: `repub-${Date.now()}`,
      name: `Republish: ${msg.topic}`,
      topic: msg.topic,
      payload: msg.payload,
      qos: msg.qos,
      retain: msg.retain,
      format: msg.format,
      createdAt: Date.now(),
    });
    setActiveTab('publisher');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Studio Header Bar */}
      <StudioHeader />

      {/* Main Studio Middle Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Contextual Sidebar */}
        <StudioSidebar
          onOpenNewBrokerModal={handleOpenNewBroker}
          onEditBrokerModal={handleEditBroker}
          onSelectPublishPreset={(preset) => {
            setActivePublishPreset(preset);
          }}
        />

        {/* Center Stage based on active tab */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950 pb-14 md:pb-0">
          {activeTab === 'connections' && (
            <ConnectionList
              onAddNewBroker={handleOpenNewBroker}
              onEditBroker={handleEditBroker}
            />
          )}

          {activeTab === 'publisher' && (
            <PublisherView initialPreset={activePublishPreset} />
          )}

          {activeTab === 'subscriber' && (
            <SubscriberView onRepublishMessage={handleRepublishFromSubscriber} />
          )}

          {activeTab === 'workflows' && <WorkflowStudio />}

          {activeTab === 'dashboard' && <DashboardStudio />}
        </main>
      </div>

      {/* Studio Bottom Console & Diagnostics Panel */}
      <StudioBottomPanel />

      {/* Mobile Bottom Navigation Bar (Visible only on < 768px) */}
      <StudioBottomNav />

      {/* Broker Profile Add/Edit Dialog */}
      <ConnectionModal
        open={brokerModalOpen}
        onOpenChange={setBrokerModalOpen}
        profile={editingProfile}
      />

      {/* Global Notifications with distinctive color coding per toast type */}
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              'group border text-xs font-sans shadow-2xl backdrop-blur-md transition-all duration-200 select-none !p-3.5 !rounded-lg',
            title: 'text-xs font-semibold tracking-wide',
            description: 'text-[11px] opacity-90 leading-relaxed mt-0.5',
            actionButton:
              'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-sans text-xs px-2.5 py-1 rounded transition-colors',
            cancelButton:
              'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 font-sans text-xs px-2.5 py-1 rounded transition-colors',
            closeButton:
              '!border-zinc-800/80 !bg-zinc-900/80 !text-zinc-400 hover:!text-zinc-100 transition-colors',
            success:
              '!bg-emerald-950/95 !text-emerald-100 !border-emerald-500/70 shadow-emerald-950/50 [&_[data-icon]]:!text-emerald-400',
            error:
              '!bg-rose-950/95 !text-rose-100 !border-rose-500/70 shadow-rose-950/50 [&_[data-icon]]:!text-rose-400',
            warning:
              '!bg-amber-950/95 !text-amber-100 !border-amber-500/70 shadow-amber-950/50 [&_[data-icon]]:!text-amber-400',
            info:
              '!bg-sky-950/95 !text-sky-100 !border-sky-500/70 shadow-sky-950/50 [&_[data-icon]]:!text-sky-400',
            default:
              '!bg-zinc-900/95 !text-zinc-100 !border-zinc-800 shadow-zinc-950/50 [&_[data-icon]]:!text-cyan-400',
            loading:
              '!bg-zinc-900/95 !text-zinc-100 !border-cyan-500/50 shadow-cyan-950/40 [&_[data-icon]]:!text-cyan-400',
          },
        }}
      />
    </div>
  );
};
