import React, { useState, useEffect } from 'react';
import { StudioHeader } from './StudioHeader';
import { StudioSidebar } from './StudioSidebar';
import { StudioBottomPanel } from './StudioBottomPanel';
import { ConnectionList } from '@/features/connections/ConnectionList';
import { ConnectionModal } from '@/features/connections/ConnectionModal';
import { PublisherView } from '@/features/publisher/PublisherView';
import { SubscriberView } from '@/features/subscriber/SubscriberView';
import { WorkflowStudio } from '@/features/workflows/WorkflowStudio';
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
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
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
        </main>
      </div>

      {/* Studio Bottom Console & Diagnostics Panel */}
      <StudioBottomPanel />

      {/* Broker Profile Add/Edit Dialog */}
      <ConnectionModal
        open={brokerModalOpen}
        onOpenChange={setBrokerModalOpen}
        profile={editingProfile}
      />

      {/* Global Notifications */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: 'bg-zinc-900 text-zinc-100 border border-zinc-800 text-xs font-mono',
        }}
      />
    </div>
  );
};
