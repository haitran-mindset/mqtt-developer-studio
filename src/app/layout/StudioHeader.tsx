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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataStore } from '@/core/store/dataStore';
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

  const profiles = useDataStore((state) => state.connectionProfiles);
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
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <svg role="img" viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path
                fill="#22d3ee"
                d="M10.657 23.994h-9.45A1.212 1.212 0 0 1 0 22.788v-9.18h.071c5.784 0 10.504 4.65 10.586 10.386Zm7.606 0h-4.045C14.135 16.246 7.795 9.977 0 9.942V6.038h.071c9.983 0 18.121 8.044 18.192 17.956Zm4.53 0h-.97C21.754 12.071 11.995 2.407 0 2.372v-1.16C0 .55.544.006 1.207.006h7.64C15.733 2.49 21.257 7.789 24 14.508v8.291c0 .663-.544 1.195-1.207 1.195ZM16.713.006h6.092A1.19 1.19 0 0 1 24 1.2v5.914c-.91-1.242-2.046-2.65-3.158-3.762C19.588 2.11 18.122.987 16.714.005Z"
              />
            </svg>
          </div>
          <span className="font-semibold text-xs tracking-wide bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            MQTT <span className="text-cyan-400 font-bold">STUDIO</span>
          </span>
          <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.2 bg-zinc-900/50">
            v1.0
          </span>
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Active Broker Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">Broker:</span>
            {profiles.length > 0 ? (
              <Select
                value={activeConnectionId || activeProfile?.id || ''}
                onValueChange={(val) => setActiveConnectionId(val)}
              >
                <SelectTrigger className="h-7 min-w-[190px] max-w-[240px] text-xs font-sans">
                  <SelectValue placeholder="Select broker..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => {
                    const isConn = connectionStatuses[p.id]?.status === 'connected';
                    return (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isConn
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                : 'bg-zinc-600'
                            }`}
                          />
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] text-cyan-400/80 font-mono shrink-0">
                            ({p.protocol.toUpperCase()})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-zinc-500 italic">No brokers</span>
            )}
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
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
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
