import React from 'react';
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
  const resetToDefaults = useDataStore((state) => state.resetToDefaults);

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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this broker profile?')) {
      await connectionManager.disconnect(id);
      deleteConnectionProfile(id);
      toast.success('Broker profile deleted');
    }
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

  const handleLoadDefaults = () => {
    resetToDefaults();
    toast.success('Default public test brokers loaded');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>MQTT Broker Connections</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage multiple active MQTT brokers over WebSocket (WS/WSS). Supports MQTT 3.1.1 and 5.0.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profiles.length === 0 && (
            <Button size="sm" variant="outline" onClick={handleLoadDefaults}>
              Load Public Test Brokers
            </Button>
          )}
          <Button size="sm" onClick={onAddNewBroker} className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Broker</span>
          </Button>
        </div>
      </div>

      {/* Broker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const status = connectionStatuses[profile.id]?.status || 'disconnected';
          const isSelected = activeConnectionId === profile.id;

          return (
            <div
              key={profile.id}
              onClick={() => setActiveConnectionId(profile.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-zinc-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/20'
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div>
                {/* Top card bar */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                      <span>{profile.name}</span>
                      {isSelected && (
                        <span className="text-[10px] text-cyan-400 font-mono">(Active)</span>
                      )}
                    </h3>
                    <div className="text-xs font-mono text-zinc-400 mt-0.5">
                      {profile.protocol}://{profile.host}:{profile.port}{profile.path}
                    </div>
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

                {/* Details tags */}
                <div className="flex flex-wrap items-center gap-1.5 my-3">
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                    MQTT {profile.mqttVersion}
                  </span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                    Keepalive: {profile.keepalive}s
                  </span>
                  {profile.lwt?.enabled && (
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

                <div className="text-[11px] font-mono text-zinc-500 truncate mb-4">
                  Client ID: <span className="text-zinc-400">{profile.clientId}</span>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <Button
                  size="sm"
                  variant={status === 'connected' ? 'destructive' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleConnect(profile);
                  }}
                  className="h-7 text-xs flex items-center gap-1.5"
                >
                  <Power className="h-3 w-3" />
                  <span>{status === 'connected' ? 'Disconnect' : 'Connect'}</span>
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(profile);
                    }}
                    title="Clone Profile"
                    className="h-7 w-7 text-zinc-400 hover:text-cyan-400"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBroker(profile);
                    }}
                    title="Edit Settings"
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(profile.id);
                    }}
                    title="Delete Profile"
                    className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
