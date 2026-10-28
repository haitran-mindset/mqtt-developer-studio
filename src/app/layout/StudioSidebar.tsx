import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Radio,
  FileCode,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useStudioStore } from '../store/studioStore';
import { useDataStore } from '@/core/store/dataStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PromptDialog } from '@/components/ui/prompt-dialog';
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
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
  } = useStudioStore();

  const isMobile = useIsMobile();

  const profiles = useDataStore((state) => state.connectionProfiles);
  const publishPresets = useDataStore((state) => state.publishPresets);
  const workflows = useDataStore((state) => state.workflows);
  const deleteConnectionProfile = useDataStore((state) => state.deleteConnectionProfile);
  const addConnectionProfile = useDataStore((state) => state.addConnectionProfile);
  const addWorkflow = useDataStore((state) => state.addWorkflow);
  const updateWorkflow = useDataStore((state) => state.updateWorkflow);
  const deleteWorkflow = useDataStore((state) => state.deleteWorkflow);

  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [deleteWorkflowTarget, setDeleteWorkflowTarget] = useState<WorkflowDefinition | null>(null);
  const [renameWorkflowTarget, setRenameWorkflowTarget] = useState<WorkflowDefinition | null>(null);
  const [newWorkflowDialogOpen, setNewWorkflowDialogOpen] = useState(false);

  const handleConfirmDeleteProfile = async () => {
    if (!deleteProfileId) return;
    await connectionManager.disconnect(deleteProfileId);
    deleteConnectionProfile(deleteProfileId);
    if (activeConnectionId === deleteProfileId) {
      setActiveConnectionId(null);
    }
    toast.success('Broker profile deleted');
    setDeleteProfileId(null);
  };

  const handleConfirmDeleteWorkflow = () => {
    if (!deleteWorkflowTarget) return;
    deleteWorkflow(deleteWorkflowTarget.id);
    if (activeWorkflowId === deleteWorkflowTarget.id) {
      setActiveWorkflowId(null);
    }
    toast.success(`Workflow "${deleteWorkflowTarget.name}" deleted`);
    setDeleteWorkflowTarget(null);
  };

  const handleConfirmRenameWorkflow = (newName: string) => {
    if (!renameWorkflowTarget) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    updateWorkflow({
      ...renameWorkflowTarget,
      name: trimmed,
      updatedAt: Date.now(),
    });
    toast.success(`Workflow renamed to "${trimmed}"`);
    setRenameWorkflowTarget(null);
  };

  const handleConfirmNewWorkflow = (name: string) => {
    const newWf: WorkflowDefinition = {
      id: `workflow-${Date.now()}`,
      name,
      description: 'Custom automated MQTT scenario',
      nodes: [],
      edges: [],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addWorkflow(newWf);
    setActiveWorkflowId(newWf.id);
    toast.success(`Workflow "${name}" created!`);
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
    addConnectionProfile(cloned);
    toast.success('Broker profile cloned');
  };

  const handleDuplicateWorkflow = (wf: WorkflowDefinition) => {
    const newId = `workflow-${Date.now()}`;
    const newName = `${wf.name} (Copy)`;
    const cloned: WorkflowDefinition = {
      ...JSON.parse(JSON.stringify(wf)),
      id: newId,
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addWorkflow(cloned);
    setActiveWorkflowId(newId);
    if (onSelectWorkflow) onSelectWorkflow(cloned);
    toast.success(`Workflow duplicated: "${newName}"`);
  };

  const renderDialogs = () => (
    <>
      <ConfirmDialog
        open={!!deleteProfileId}
        onOpenChange={(open) => !open && setDeleteProfileId(null)}
        title="Delete Broker Profile"
        description="Are you sure you want to delete this broker profile? Any active connection will be closed immediately."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteProfile}
      />
      <ConfirmDialog
        open={!!deleteWorkflowTarget}
        onOpenChange={(open) => !open && setDeleteWorkflowTarget(null)}
        title="Delete Workflow"
        description={`Are you sure you want to delete workflow "${deleteWorkflowTarget?.name}"? All steps and connections within it will be removed.`}
        confirmText="Delete Workflow"
        variant="destructive"
        onConfirm={handleConfirmDeleteWorkflow}
      />
      <PromptDialog
        open={!!renameWorkflowTarget}
        onOpenChange={(open) => !open && setRenameWorkflowTarget(null)}
        title="Rename Workflow"
        description="Update the name of this automation workflow."
        label="Workflow Name"
        defaultValue={renameWorkflowTarget?.name || ''}
        placeholder="e.g. Device Provisioning & Command Flow"
        confirmText="Save Name"
        onConfirm={handleConfirmRenameWorkflow}
      />
      <PromptDialog
        open={newWorkflowDialogOpen}
        onOpenChange={setNewWorkflowDialogOpen}
        title="Create New Workflow"
        description="Enter a descriptive name for your visual automation flow."
        label="Workflow Name"
        defaultValue="New Automation Workflow"
        placeholder="e.g. Device Provisioning & Command Flow"
        confirmText="Create Workflow"
        onConfirm={handleConfirmNewWorkflow}
      />
    </>
  );

  // On Mobile: when sidebar is closed, don't show slim rail, only dialogs
  if (isMobile && !sidebarOpen) {
    return renderDialogs();
  }

  // On Desktop: Render Collapsed Slim Rail (w-12)
  if (!isMobile && !sidebarOpen) {
    return (
      <aside className="w-12 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none items-center py-2 justify-between transition-all duration-200">
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Expand Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>

          <div className="w-6 h-[1px] bg-zinc-800/80" />

          {/* Section Icon with count badge */}
          {activeTab === 'connections' && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-cyan-400 hover:bg-zinc-800/80 transition-colors relative"
              title={`Brokers (${profiles.length}) - Click to expand`}
            >
              <Server className="h-4 w-4" />
              {profiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[9px] font-mono rounded-full px-1">
                  {profiles.length}
                </span>
              )}
            </button>
          )}

          {activeTab === 'workflows' && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-cyan-400 hover:bg-zinc-800/80 transition-colors relative"
              title={`Workflows (${workflows.length}) - Click to expand`}
            >
              <GitBranch className="h-4 w-4" />
              {workflows.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[9px] font-mono rounded-full px-1">
                  {workflows.length}
                </span>
              )}
            </button>
          )}

          {activeTab === 'publisher' && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-cyan-400 hover:bg-zinc-800/80 transition-colors relative"
              title={`Presets (${publishPresets.length}) - Click to expand`}
            >
              <FileCode className="h-4 w-4" />
            </button>
          )}

          {activeTab === 'subscriber' && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-cyan-400 hover:bg-zinc-800/80 transition-colors relative"
              title="Subscriptions - Click to expand"
            >
              <Radio className="h-4 w-4" />
            </button>
          )}

          {/* Quick Add Button */}
          {activeTab === 'connections' && (
            <button
              onClick={onOpenNewBrokerModal}
              className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all cursor-pointer shadow-xs"
              title="Add Broker Profile"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          )}

          {activeTab === 'workflows' && (
            <button
              onClick={() => {
                setNewWorkflowDialogOpen(true);
                setSidebarOpen(true);
              }}
              className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all cursor-pointer shadow-xs"
              title="Create New Workflow"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {renderDialogs()}
      </aside>
    );
  }

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={
          isMobile
            ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 z-50 shadow-2xl flex flex-col select-none animate-in slide-in-from-left duration-200'
            : 'w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none transition-all duration-200'
        }
      >
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

        <div className="flex items-center gap-1">
          {activeTab === 'connections' && (
            <Button
              size="sm"
              onClick={onOpenNewBrokerModal}
              className="h-6 px-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-sm shadow-cyan-500/25 rounded-md text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="Add Broker Profile"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add</span>
            </Button>
          )}

          {activeTab === 'workflows' && (
            <Button
              size="sm"
              onClick={() => setNewWorkflowDialogOpen(true)}
              className="h-6 px-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-sm shadow-cyan-500/25 rounded-md text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="Create New Workflow"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New</span>
            </Button>
          )}

          {/* Close Drawer Button on Mobile / Collapse Sidebar Button on Desktop */}
          {isMobile ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(false)}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 ml-0.5 cursor-pointer"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSidebar}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 ml-0.5 cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Brokers view */}
        {activeTab === 'connections' && (
          <div className="space-y-1">
            {profiles.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-lg my-2 bg-zinc-900/20">
                <Server className="h-5 w-5 text-zinc-600 mx-auto mb-2" />
                <p className="font-medium text-zinc-400">No brokers yet</p>
                <p className="text-[10px] text-zinc-600 mt-1">Click + Add to create your broker profile</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const status = connectionStatuses[profile.id]?.status || 'disconnected';
                const isSelected = activeConnectionId === profile.id;

                return (
                  <div
                    key={profile.id}
                    onClick={() => {
                      setActiveConnectionId(profile.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
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
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => handleDuplicateProfile(e, profile)}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                          title="Duplicate Profile"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditBrokerModal(profile);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                          title="Edit Settings"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteProfileId(profile.id);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Publisher Presets */}
        {activeTab === 'publisher' && (
          <div className="space-y-1">
            {publishPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  if (onSelectPublishPreset) onSelectPublishPreset(preset);
                  if (isMobile) setSidebarOpen(false);
                }}
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
            {workflows.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500 font-sans">
                No workflows created yet. Click <span className="text-cyan-400 font-medium">+ New</span> in the studio toolbar to create one.
              </div>
            ) : (
              workflows.map((wf) => {
                const isSelected = activeWorkflowId === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => {
                    setActiveWorkflowId(wf.id);
                    if (onSelectWorkflow) onSelectWorkflow(wf);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`group p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-cyan-500/50 shadow-sm shadow-cyan-950/20'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-100 truncate pr-1 flex-1">{wf.name}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameWorkflowTarget(wf);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                        title="Rename Workflow"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateWorkflow(wf);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                        title="Duplicate Workflow"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteWorkflowTarget(wf);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Workflow"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
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
            })
          )}
          </div>
        )}

        {/* Subscriptions */}
        {activeTab === 'subscriber' && (
          <div className="p-2 text-zinc-500 text-xs font-mono text-center">
            Topic subscriptions and active wildcards appear in the subscriber stage.
          </div>
        )}
      </div>

      {renderDialogs()}
    </aside>
  </>
  );
};
