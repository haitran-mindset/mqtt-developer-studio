import React from 'react';
import {
  Radio,
  Send,
  Inbox,
  GitBranch,
  Server,
  Terminal,
  Activity,
  Power,
  ChevronDown,
} from 'lucide-react';
import { useStudioStore, type StudioTab } from '../store/studioStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db/StudioDatabase';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { toast } from 'sonner';

export const StudioHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeConnectionId,
    setActiveConnectionId,
    connectionStatuses,
    bottomPanelOpen,
    toggleBottomPanel,
  } = useStudioStore();

  const profiles = useLiveQuery(() => db.connectionProfiles.toArray(), []) || [];
  const activeProfile = profiles.find((p) => p.id === activeConnectionId) || profiles[0];

  // Set default active connection if none selected
  React.useEffect(() => {
    if (!activeConnectionId && profiles.length > 0) {
      setActiveConnectionId(profiles[0].id);
    }
  }, [profiles, activeConnectionId, setActiveConnectionId]);

  const currentStatus = activeProfile
    ? connectionStatuses[activeProfile.id]?.status || 'disconnected'
    : 'disconnected';

  const handleToggleConnect = async () => {
    if (!activeProfile) return;

    try {
      if (currentStatus === 'connected' || currentStatus === 'connecting') {
        await connectionManager.disconnect(activeProfile.id);
        toast.info(`Disconnected from ${activeProfile.name}`);
      } else {
        toast.loading(`Connecting to ${activeProfile.name}...`, { id: 'conn-toast' });
        await connectionManager.connect(activeProfile);
        toast.success(`Connected to ${activeProfile.name}`, { id: 'conn-toast' });
      }
    } catch (err: any) {
      toast.error(`Connection failed: ${err.message}`, { id: 'conn-toast' });
    }
  };

  const navItems: { tab: StudioTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'connections', label: 'Brokers', icon: <Server className="h-3.5 w-3.5" /> },
    { tab: 'publisher', label: 'Publisher', icon: <Send className="h-3.5 w-3.5" /> },
    { tab: 'subscriber', label: 'Live Stream', icon: <Inbox className="h-3.5 w-3.5" /> },
    { tab: 'workflows', label: 'Workflows', icon: <GitBranch className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="h-3.5 w-3.5 text-zinc-950 font-bold" />
          </div>
          <span className="font-semibold text-xs tracking-wide bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            MQTT <span className="text-cyan-400 font-bold">STUDIO</span>
          </span>
          <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.2 bg-zinc-900/50">
            v1.0
          </span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Active Broker Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-md px-2 py-1 text-xs">
            <span className="text-[11px] text-zinc-400">Broker:</span>
            <select
              value={activeConnectionId || ''}
              onChange={(e) => setActiveConnectionId(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-mono font-medium"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-100">
                  {p.name} ({p.protocol.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Connect / Disconnect button */}
          {activeProfile && (
            <Button
              size="sm"
              variant={currentStatus === 'connected' ? 'destructive' : 'default'}
              onClick={handleToggleConnect}
              className="h-7 text-xs flex items-center gap-1.5"
            >
              <Power className="h-3 w-3" />
              <span>
                {currentStatus === 'connected'
                  ? 'Disconnect'
                  : currentStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Connect'}
              </span>
            </Button>
          )}

          {/* Status Badge */}
          {currentStatus === 'connected' ? (
            <Badge variant="emerald" className="gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Connected
            </Badge>
          ) : currentStatus === 'connecting' ? (
            <Badge variant="amber" className="gap-1 animate-spin">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Connecting
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80">
        {navItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === item.tab
                ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700/60 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={bottomPanelOpen ? 'secondary' : 'outline'}
          onClick={toggleBottomPanel}
          className="h-7 text-xs flex items-center gap-1 text-zinc-300"
          title="Toggle Console Log Panel"
        >
          <Terminal className="h-3 w-3 text-cyan-400" />
          <span>Console</span>
        </Button>
      </div>
    </header>
  );
};
