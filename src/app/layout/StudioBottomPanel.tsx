import React, { useState } from 'react';
import {
  Terminal,
  Activity,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { useStudioStore, type BottomPanelTab } from '../store/studioStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export const StudioBottomPanel: React.FC = () => {
  const {
    bottomPanelOpen,
    toggleBottomPanel,
    bottomPanelTab,
    setBottomPanelTab,
    logs,
    clearLogs,
    workflowLogs,
    clearWorkflowLogs,
    activeConnectionId,
    connectionStatuses,
  } = useStudioStore();

  const [logFilter, setLogFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!bottomPanelOpen) {
    return (
      <div className="h-6 border-t border-zinc-800 bg-zinc-950 px-3 flex items-center justify-between text-[11px] text-zinc-400 select-none">
        <button
          onClick={toggleBottomPanel}
          className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ChevronUp className="h-3 w-3 text-cyan-400" />
          <span className="font-mono">Console & Diagnostics</span>
          {logs.length > 0 && (
            <span className="text-[10px] bg-zinc-800 px-1.5 rounded-full text-zinc-300">
              {logs.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  const filteredLogs = logs.filter(
    (l) =>
      !logFilter ||
      l.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.level.toLowerCase().includes(logFilter.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Log entry copied to clipboard');
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="h-56 border-t border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none z-20">
      {/* Panel Tab Bar */}
      <div className="h-8 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBottomPanelTab('connection_logs')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors font-medium cursor-pointer ${
              bottomPanelTab === 'connection_logs'
                ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="h-3 w-3" />
            <span>Connection Logs</span>
            <span className="text-[10px] bg-zinc-800/80 px-1 rounded text-zinc-400">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setBottomPanelTab('workflow_console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors font-medium cursor-pointer ${
              bottomPanelTab === 'workflow_console'
                ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Workflow Console</span>
            <span className="text-[10px] bg-zinc-800/80 px-1 rounded text-zinc-400">
              {workflowLogs.length}
            </span>
          </button>

          <button
            onClick={() => setBottomPanelTab('diagnostics')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors font-medium cursor-pointer ${
              bottomPanelTab === 'diagnostics'
                ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>Diagnostics</span>
          </button>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-2">
          {bottomPanelTab === 'connection_logs' && (
            <>
              <div className="relative">
                <Search className="absolute left-1.5 top-1.5 h-3 w-3 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="h-6 pl-6 pr-2 rounded text-[11px] font-mono text-zinc-200 placeholder:text-zinc-500 w-40"
                />
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogs}
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-rose-400"
                title="Clear Logs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}

          {bottomPanelTab === 'workflow_console' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearWorkflowLogs}
              className="h-6 px-2 text-[11px] text-zinc-400 hover:text-rose-400"
              title="Clear Workflow Console"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleBottomPanel}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Panel Content Area */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-1 bg-zinc-950/80">
        {bottomPanelTab === 'connection_logs' && (
          <div>
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-6 text-xs font-sans">
                No logs recorded yet. Connect to a broker to view live event telemetry.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-0.5 px-1.5 hover:bg-zinc-900/60 rounded text-[11px] group transition-colors"
                >
                  <span className="text-zinc-500 shrink-0 select-none">
                    {format(log.timestamp, 'HH:mm:ss.SSS')}
                  </span>

                  <span className="shrink-0">
                    {log.level === 'info' && (
                      <Badge variant="cyan" className="py-0 px-1 text-[9px]">
                        INFO
                      </Badge>
                    )}
                    {log.level === 'warn' && (
                      <Badge variant="amber" className="py-0 px-1 text-[9px]">
                        WARN
                      </Badge>
                    )}
                    {log.level === 'error' && (
                      <Badge variant="rose" className="py-0 px-1 text-[9px]">
                        ERROR
                      </Badge>
                    )}
                    {log.level === 'packet' && (
                      <Badge variant="default" className="py-0 px-1 text-[9px] bg-zinc-800 text-cyan-300">
                        PACKET
                      </Badge>
                    )}
                  </span>

                  <span className="text-zinc-300 flex-1 break-all">{log.message}</span>

                  <button
                    onClick={() => handleCopy(log.id, `[${format(log.timestamp, 'HH:mm:ss.SSS')}] [${log.level.toUpperCase()}] ${log.message}`)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-cyan-400 text-zinc-500 transition-opacity"
                    title="Copy Log"
                  >
                    {copiedId === log.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {bottomPanelTab === 'workflow_console' && (
          <div>
            {workflowLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-6 text-xs font-sans">
                Workflow output is clean. Run a workflow in the Workflows tab to view execution steps.
              </div>
            ) : (
              workflowLogs.map((log, index) => (
                <div
                  key={`${log.nodeId}-${index}`}
                  className="flex items-start gap-2 py-1 px-1.5 hover:bg-zinc-900/60 rounded text-[11px]"
                >
                  <span className="text-zinc-500 shrink-0">
                    {format(log.timestamp, 'HH:mm:ss.SSS')}
                  </span>

                  <span>
                    {log.status === 'success' ? (
                      <Badge variant="emerald" className="py-0 px-1 text-[9px]">
                        PASS
                      </Badge>
                    ) : log.status === 'failed' ? (
                      <Badge variant="rose" className="py-0 px-1 text-[9px]">
                        FAIL
                      </Badge>
                    ) : (
                      <Badge variant="amber" className="py-0 px-1 text-[9px]">
                        RUN
                      </Badge>
                    )}
                  </span>

                  <span className="text-zinc-300 font-semibold">{log.stepName}</span>
                  <span className="text-zinc-500">({log.durationMs}ms)</span>

                  {log.error && <span className="text-rose-400">{log.error}</span>}
                  {log.output && (
                    <span className="text-zinc-400 text-[10px] truncate max-w-md">
                      {JSON.stringify(log.output)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {bottomPanelTab === 'diagnostics' && (
          <div className="grid grid-cols-4 gap-3 p-2 font-sans">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-md">
              <span className="text-[11px] text-zinc-400 block mb-1">Active Broker</span>
              <span className="text-xs font-mono text-zinc-100 font-semibold">
                {activeConnectionId || 'None'}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-md">
              <span className="text-[11px] text-zinc-400 block mb-1">Socket Status</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {activeConnectionId ? connectionStatuses[activeConnectionId]?.status || 'disconnected' : 'disconnected'}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-md">
              <span className="text-[11px] text-zinc-400 block mb-1">Session Protocol</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                MQTT 5.0 / WebSocket
              </span>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-md">
              <span className="text-[11px] text-zinc-400 block mb-1">Transport Security</span>
              <span className="text-xs font-mono text-zinc-200 font-semibold">
                TLS / WSS Encrypted
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
