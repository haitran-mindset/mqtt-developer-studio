import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  Copy,
  Radio,
  FileCode,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db/StudioDatabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import type { ConnectionProfile, PublishPreset, WorkflowDefinition } from '@/core/db/types';
import { toast } from 'sonner';

interface StudioSidebarProps {
  onOpenNewBrokerModal: () => void;
  onEditBrokerModal: (profile: ConnectionProfile) => void;
  onSelectPublishPreset?: (preset: PublishPreset) => void;
  onSelectWorkflow?: (workflow: WorkflowDefinition) => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  onOpenNewBrokerModal,
  onEditBrokerModal,
  onSelectPublishPreset,
  onSelectWorkflow,
}) => {
  const {
    activeTab,
    activeConnectionId,
    setActiveConnectionId,
    connectionStatuses,
    activeWorkflowId,
    setActiveWorkflowId,
  } = useStudioStore();

  const profiles = useLiveQuery(() => db.connectionProfiles.toArray(), []) || [];
  const publishPresets = useLiveQuery(() => db.publishPresets.toArray(), []) || [];
  const workflows = useLiveQuery(() => db.workflows.toArray(), []) || [];

  const handleDeleteProfile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this broker profile?')) {
      await connectionManager.disconnect(id);
      await db.connectionProfiles.delete(id);
      toast.success('Broker profile deleted');
    }
  };

  const handleDuplicateProfile = async (e: React.MouseEvent, p: ConnectionProfile) => {
    e.stopPropagation();
    const cloned: ConnectionProfile = {
      ...p,
      id: `broker-${Date.now()}`,
      name: `${p.name} (Copy)`,
      clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.connectionProfiles.add(cloned);
    toast.success('Broker profile cloned');
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this workflow?')) {
      await db.workflows.delete(id);
      toast.success('Workflow deleted');
    }
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="h-10 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          {activeTab === 'connections' && (
            <>
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>Brokers ({profiles.length})</span>
            </>
          )}
          {activeTab === 'publisher' && (
            <>
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>Publish Presets ({publishPresets.length})</span>
            </>
          )}
          {activeTab === 'subscriber' && (
            <>
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span>Subscriptions</span>
            </>
          )}
          {activeTab === 'workflows' && (
            <>
              <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
              <span>Workflows ({workflows.length})</span>
            </>
          )}
        </div>

        {activeTab === 'connections' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenNewBrokerModal}
            className="h-6 px-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800"
            title="Add Broker Profile"
          >
            <Plus className="h-3.5 w-3.5 mr-0.5" />
            <span className="text-[11px]">Add</span>
          </Button>
        )}
      </div>

      {/* Sidebar List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Brokers view */}
        {activeTab === 'connections' && (
          <div className="space-y-1">
            {profiles.map((profile) => {
              const status = connectionStatuses[profile.id]?.status || 'disconnected';
              const isSelected = activeConnectionId === profile.id;

              return (
                <div
                  key={profile.id}
                  onClick={() => setActiveConnectionId(profile.id)}
                  className={`group relative p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-cyan-500/50 shadow-sm shadow-cyan-950/20'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-100 truncate pr-2">
                      {profile.name}
                    </span>
                    <Badge
                      variant={
                        status === 'connected'
                          ? 'emerald'
                          : status === 'connecting'
                          ? 'amber'
                          : 'outline'
                      }
                      className="text-[9px] py-0 px-1"
                    >
                      {status}
                    </Badge>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 truncate mb-1.5">
                    {profile.protocol}://{profile.host}:{profile.port}{profile.path}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>MQTT {profile.mqttVersion}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDuplicateProfile(e, profile)}
                        className="p-1 hover:text-cyan-400 text-zinc-400"
                        title="Duplicate Profile"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onEditBrokerModal(profile)}
                        className="p-1 hover:text-zinc-200 text-zinc-400"
                        title="Edit Settings"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteProfile(e, profile.id)}
                        className="p-1 hover:text-rose-400 text-zinc-400"
                        title="Delete Profile"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Publisher Presets */}
        {activeTab === 'publisher' && (
          <div className="space-y-1">
            {publishPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onSelectPublishPreset && onSelectPublishPreset(preset)}
                className="group p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 text-xs cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{preset.name}</span>
                  <Badge variant="cyan" className="text-[9px] py-0 px-1">
                    {preset.format.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 truncate mb-1">
                  {preset.topic}
                </div>
                <div className="flex items-center gap-1">
                  {preset.tags?.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflows */}
        {activeTab === 'workflows' && (
          <div className="space-y-1">
            {workflows.map((wf) => {
              const isSelected = activeWorkflowId === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => {
                    setActiveWorkflowId(wf.id);
                    if (onSelectWorkflow) onSelectWorkflow(wf);
                  }}
                  className={`group p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-cyan-500/50 shadow-sm shadow-cyan-950/20'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-100">{wf.name}</span>
                    <button
                      onClick={(e) => handleDeleteWorkflow(e, wf.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-1.5">
                    {wf.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{wf.nodes?.length || 0} Steps</span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Sparkles className="h-2.5 w-2.5" />
                      Ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subscriptions */}
        {activeTab === 'subscriber' && (
          <div className="p-2 text-zinc-500 text-xs font-mono text-center">
            Topic subscriptions and active wildcards appear in the subscriber stage.
          </div>
        )}
      </div>
    </aside>
  );
};
