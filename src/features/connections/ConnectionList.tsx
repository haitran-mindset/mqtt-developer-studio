import React, { useState } from 'react';
import {
  Server,
  Plus,
  Power,
  Edit2,
  Trash2,
  Copy,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useDataStore } from '@/core/store/dataStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { useStudioStore } from '@/app/store/studioStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import type { ConnectionProfile } from '@/core/db/types';
import { toast } from 'sonner';

interface ConnectionListProps {
  onAddNewBroker: () => void;
  onEditBroker: (profile: ConnectionProfile) => void;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
  onAddNewBroker,
  onEditBroker,
}) => {
  const {
    activeConnectionId,
    setActiveConnectionId,
    connectionStatuses,
  } = useStudioStore();

  const profiles = useDataStore((state) => state.connectionProfiles);
  const addConnectionProfile = useDataStore((state) => state.addConnectionProfile);
  const deleteConnectionProfile = useDataStore((state) => state.deleteConnectionProfile);
  const clearAllConnectionProfiles = useDataStore((state) => state.clearAllConnectionProfiles);

  const [deleteTargetProfile, setDeleteTargetProfile] = useState<ConnectionProfile | null>(null);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  const handleToggleConnect = async (profile: ConnectionProfile) => {
    const status = connectionStatuses[profile.id]?.status || 'disconnected';

    try {
      if (status === 'connected' || status === 'connecting') {
        await connectionManager.disconnect(profile.id);
        toast.info(`Disconnected from ${profile.name}`);
      } else {
        toast.loading(`Connecting to ${profile.name}...`, { id: 'conn-toast' });
        await connectionManager.connect(profile);
        toast.success(`Connected to ${profile.name}`, { id: 'conn-toast' });
        setActiveConnectionId(profile.id);
      }
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`, { id: 'conn-toast' });
    }
  };

  const handleConfirmDeleteProfile = async () => {
    if (!deleteTargetProfile) return;
    await connectionManager.disconnect(deleteTargetProfile.id);
    deleteConnectionProfile(deleteTargetProfile.id);
    if (activeConnectionId === deleteTargetProfile.id) {
      setActiveConnectionId(null);
    }
    toast.success(`Broker "${deleteTargetProfile.name}" deleted`);
    setDeleteTargetProfile(null);
  };

  const handleConfirmClearAll = async () => {
    for (const p of profiles) {
      await connectionManager.disconnect(p.id);
    }
    clearAllConnectionProfiles();
    setActiveConnectionId(null);
    toast.success('All broker profiles removed');
  };

  const handleDuplicate = async (p: ConnectionProfile) => {
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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>MQTT Broker Connections</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage multiple active MQTT brokers over WebSocket (WS/WSS). Supports MQTT 3.1.1 and 5.0.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {profiles.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setClearAllConfirmOpen(true)}
              className="text-zinc-400 hover:text-rose-400 border-zinc-800 hover:border-rose-900/50 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </Button>
          )}
          <Button size="sm" onClick={onAddNewBroker} className="flex items-center gap-1.5 shadow-md shadow-cyan-500/20">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Broker</span>
          </Button>
        </div>
      </div>

      {/* Empty State or Broker Cards Grid */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-center max-w-lg mx-auto my-8 sm:my-12">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
            <Server className="w-7 h-7 text-cyan-400/80" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">No Brokers Configured</h3>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
            There are currently no broker connection profiles. Add your own MQTT broker to connect, publish messages, and test workflows.
          </p>
          <Button onClick={onAddNewBroker} className="gap-2 shadow-lg shadow-cyan-500/20">
            <Plus className="h-4 w-4" />
            <span>Add Your Broker</span>
          </Button>
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {profiles.map((profile) => {
            const status = connectionStatuses[profile.id]?.status || 'disconnected';
            const isSelected = activeConnectionId === profile.id;

            return (
              <Card
                key={profile.id}
                onClick={() => setActiveConnectionId(profile.id)}
                className={`p-0 transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'bg-zinc-900/95 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/20'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{profile.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-cyan-400 font-mono font-normal">(Active)</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-zinc-400 mt-0.5 truncate">
                        {profile.protocol}://{profile.host}:{profile.port}{profile.path}
                      </CardDescription>
                    </div>

                    <Badge
                      variant={
                        status === 'connected'
                          ? 'emerald'
                          : status === 'connecting'
                          ? 'amber'
                          : 'outline'
                      }
                      className="capitalize text-[10px] py-0.5 px-2 font-mono shrink-0"
                    >
                      {status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  {/* Details tags */}
                  <div className="flex flex-wrap items-center gap-1.5 my-2">
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                      MQTT {profile.mqttVersion}
                    </span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                      Keepalive: {profile.keepalive}s
                    </span>
                    {profile.lwt && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded font-mono">
                        LWT Active
                      </span>
                    )}
                    {profile.clean && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                        Clean Session
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-zinc-500 truncate">
                    Client ID: <span className="text-zinc-400">{profile.clientId}</span>
                  </div>
                </CardContent>

                {/* Bottom Card Actions */}
                <CardFooter className="p-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                  <Button
                    size="sm"
                    variant={status === 'connected' ? 'destructive' : 'default'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleConnect(profile);
                    }}
                    className="h-7 text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <Power className="h-3 w-3" />
                    <span>{status === 'connected' ? 'Disconnect' : 'Connect'}</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(profile);
                          }}
                          className="h-7 w-7 text-zinc-400 hover:text-cyan-400"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clone Profile</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditBroker(profile);
                          }}
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Settings</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetProfile(profile);
                          }}
                          className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Profile</TooltipContent>
                    </Tooltip>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </TooltipProvider>
      )}

      {/* Delete Single Broker Confirmation */}
      <ConfirmDialog
        open={!!deleteTargetProfile}
        onOpenChange={(open) => !open && setDeleteTargetProfile(null)}
        title="Delete Broker Profile"
        description={`Are you sure you want to delete "${deleteTargetProfile?.name}"? Any active connection to this broker will be closed immediately.`}
        confirmText="Delete Profile"
        variant="destructive"
        onConfirm={handleConfirmDeleteProfile}
      />

      {/* Clear All Brokers Confirmation */}
      <ConfirmDialog
        open={clearAllConfirmOpen}
        onOpenChange={setClearAllConfirmOpen}
        title="Remove All Brokers"
        description="Are you sure you want to remove all configured broker connections? All active connections will be terminated."
        confirmText="Remove All"
        variant="destructive"
        onConfirm={handleConfirmClearAll}
      />
    </div>
  );
};
