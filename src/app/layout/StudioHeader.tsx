import React from 'react';
import {
  Terminal,
  Power,
  Save,
  ShieldCheck,
  Menu,
  Download,
} from 'lucide-react';
import { isTauriApp } from '@/core/mqtt/platform';
import { useStudioStore } from '../store/studioStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataStore } from '@/core/store/dataStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { toast } from 'sonner';
import {
  isSessionPersistEnabled,
  setSessionPersistEnabled,
  enableSessionPersistWithSync,
} from '@/core/storage/sessionStorageManager';

import { STUDIO_NAV_ITEMS } from './navigation';

interface StudioHeaderProps {
  onOpenDownloadModal?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({ onOpenDownloadModal }) => {
  const {
    activeTab,
    setActiveTab,
    activeConnectionId,
    setActiveConnectionId,
    connectionStatuses,
    bottomPanelOpen,
    toggleBottomPanel,
    toggleSidebar,
  } = useStudioStore();

  const [sessionPersist, setSessionPersist] = React.useState(() => isSessionPersistEnabled());

  const handleToggleSessionPersist = (checked: boolean) => {
    setSessionPersist(checked);
    if (checked) {
      const dataState = useDataStore.getState();
      const studioState = useStudioStore.getState();
      enableSessionPersistWithSync({
        workflows: dataState.workflows,
        publishPresets: dataState.publishPresets,
        subscriptionPresets: dataState.subscriptionPresets,
        activeWorkflowId: studioState.activeWorkflowId,
      });
      toast.success('Session persistence enabled', {
        description: 'Workflows & Topics saved across page reload. Broker credentials are NEVER stored.',
      });
    } else {
      setSessionPersistEnabled(false);
      toast.info('Session persistence disabled', {
        description: 'SessionStorage cache cleared.',
      });
    }
  };

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

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 px-2 sm:px-3 lg:px-4 flex items-center justify-between shrink-0 select-none gap-1.5 sm:gap-2 w-full max-w-full">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleSidebar}
          className="md:hidden h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 shrink-0"
          title="Open drawer menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
            <svg role="img" viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path
                fill="#22d3ee"
                d="M10.657 23.994h-9.45A1.212 1.212 0 0 1 0 22.788v-9.18h.071c5.784 0 10.504 4.65 10.586 10.386Zm7.606 0h-4.045C14.135 16.246 7.795 9.977 0 9.942V6.038h.071c9.983 0 18.121 8.044 18.192 17.956Zm4.53 0h-.97C21.754 12.071 11.995 2.407 0 2.372v-1.16C0 .55.544.006 1.207.006h7.64C15.733 2.49 21.257 7.789 24 14.508v8.291c0 .663-.544 1.195-1.207 1.195ZM16.713.006h6.092A1.19 1.19 0 0 1 24 1.2v5.914c-.91-1.242-2.046-2.65-3.158-3.762C19.588 2.11 18.122.987 16.714.005Z"
              />
            </svg>
          </div>
          <span className="font-semibold text-xs tracking-wide bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent hidden sm:inline whitespace-nowrap">
            MQTT <span className="text-cyan-400 font-bold">STUDIO</span>
          </span>
          <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.2 bg-zinc-900/50 hidden 2xl:inline">
            v1.0
          </span>
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block shrink-0" />

        {/* Active Broker Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 font-medium hidden xl:inline">Broker:</span>
            {profiles.length > 0 ? (
              <Select
                value={activeConnectionId || activeProfile?.id || ''}
                onValueChange={(val) => setActiveConnectionId(val)}
              >
                <SelectTrigger
                  title={activeProfile?.name || 'Select broker...'}
                  className="h-7 w-[105px] sm:w-[130px] lg:w-[160px] xl:w-[200px] text-xs font-sans"
                >
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
              <span className="text-xs text-zinc-500 italic whitespace-nowrap">No brokers</span>
            )}
          </div>

          {/* Quick Connect / Disconnect button */}
          {activeProfile && (
            <Button
              size="sm"
              variant={currentStatus === 'connected' ? 'destructive' : 'default'}
              onClick={handleToggleConnect}
              className="h-7 px-2 sm:px-2.5 text-xs flex items-center gap-1.5 shrink-0"
              title={currentStatus === 'connected' ? 'Disconnect' : 'Connect'}
            >
              <Power className="h-3 w-3" />
              <span className="hidden xl:inline">
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
            <Badge variant="emerald" className="gap-1 animate-pulse px-1.5 lg:px-2 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="hidden xl:inline">Connected</span>
            </Badge>
          ) : currentStatus === 'connecting' ? (
            <Badge variant="amber" className="gap-1 animate-spin px-1.5 lg:px-2 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="hidden xl:inline">Connecting</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-zinc-400 px-1.5 lg:px-2 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span className="hidden xl:inline">Disconnected</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Center Navigation Tabs (Tablet/Desktop: Icon-only on md, Icon+Text on lg+) */}
      <nav className="hidden md:flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80 shrink-0">
        {STUDIO_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`flex items-center gap-1.5 px-2 lg:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Session Storage Persist Switch */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-xs shadow-sm hover:border-zinc-700 transition-colors cursor-pointer shrink-0">
                <Save className={`h-3.5 w-3.5 transition-colors ${sessionPersist ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <span className="text-[11px] font-medium text-zinc-300 select-none whitespace-nowrap hidden xl:inline">
                  Save Session
                </span>
                <Switch
                  id="session-persist-switch"
                  checked={sessionPersist}
                  onCheckedChange={handleToggleSessionPersist}
                  className="scale-90"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-[280px] p-2.5 space-y-1.5 bg-zinc-950 border-zinc-800 shadow-xl">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-400 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Session Storage: {sessionPersist ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Persists workflows, subscribe topics, publish topics & presets across page reloads (F5).
              </p>
              <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-zinc-800/80 flex items-center gap-1">
                <span>🛡️ Broker credentials & profiles are NEVER stored.</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isTauriApp() && onOpenDownloadModal && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDownloadModal}
            className="h-7 px-2 lg:px-2.5 text-xs flex items-center gap-1.5 border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:text-emerald-200 hover:border-emerald-500/70 shadow-sm shadow-emerald-950 transition-all shrink-0"
            title="Download Native Desktop App (Native TCP 1883/8883)"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline font-medium text-[11px]">Download Desktop</span>
          </Button>
        )}

        <Button
          size="sm"
          variant={bottomPanelOpen ? 'secondary' : 'outline'}
          onClick={toggleBottomPanel}
          className="h-7 px-2 lg:px-3 text-xs flex items-center gap-1 text-zinc-300 shrink-0"
          title="Toggle Console Log Panel"
        >
          <Terminal className="h-3 w-3 text-cyan-400" />
          <span className="hidden lg:inline">Console</span>
        </Button>
      </div>
    </header>
  );
};
