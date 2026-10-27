import { create } from 'zustand';
import type { ConnectionStatus, ConnectionEventLog } from '@/core/mqtt/types';
import type { WorkflowStepRunLog } from '@/core/db/types';
import {
  loadActiveWorkflowIdFromSession,
  saveActiveWorkflowIdToSession,
} from '@/core/storage/sessionStorageManager';

export type StudioTab = 'connections' | 'publisher' | 'subscriber' | 'workflows';
export type BottomPanelTab = 'connection_logs' | 'workflow_console' | 'diagnostics';

interface StudioState {
  activeTab: StudioTab;
  activeConnectionId: string | null;
  activeWorkflowId: string | null;

  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: BottomPanelTab;

  connectionStatuses: Record<string, { status: ConnectionStatus; error?: string }>;
  isPausedMessageStream: boolean;

  filterTopic: string;
  filterPayloadText: string;

  logs: ConnectionEventLog[];
  workflowLogs: WorkflowStepRunLog[];

  setActiveTab: (tab: StudioTab) => void;
  setActiveConnectionId: (id: string | null) => void;
  setActiveWorkflowId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setBottomPanelOpen: (open: boolean) => void;
  toggleBottomPanel: () => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setConnectionStatus: (connectionId: string, status: ConnectionStatus, error?: string) => void;
  setIsPausedMessageStream: (paused: boolean) => void;
  setFilterTopic: (topic: string) => void;
  setFilterPayloadText: (text: string) => void;
  addLog: (log: ConnectionEventLog) => void;
  clearLogs: () => void;
  addWorkflowLog: (log: WorkflowStepRunLog) => void;
  clearWorkflowLogs: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  activeTab: 'connections',
  activeConnectionId: null,
  activeWorkflowId: loadActiveWorkflowIdFromSession(),

  sidebarOpen: (() => {
    try {
      const stored = localStorage.getItem('mqtt_studio_sidebar_open');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  })(),
  bottomPanelOpen: true,
  bottomPanelTab: 'connection_logs',

  connectionStatuses: {},
  isPausedMessageStream: false,

  filterTopic: '',
  filterPayloadText: '',

  logs: [],
  workflowLogs: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  setActiveWorkflowId: (id) => {
    saveActiveWorkflowIdToSession(id);
    set({ activeWorkflowId: id });
  },
  setSidebarOpen: (open) => {
    try {
      localStorage.setItem('mqtt_studio_sidebar_open', String(open));
    } catch {}
    set({ sidebarOpen: open });
  },
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarOpen;
      try {
        localStorage.setItem('mqtt_studio_sidebar_open', String(next));
      } catch {}
      return { sidebarOpen: next };
    }),
  setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
  toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab, bottomPanelOpen: true }),
  setConnectionStatus: (connectionId, status, error) =>
    set((state) => ({
      connectionStatuses: {
        ...state.connectionStatuses,
        [connectionId]: { status, error },
      },
    })),
  setIsPausedMessageStream: (paused) => set({ isPausedMessageStream: paused }),
  setFilterTopic: (topic) => set({ filterTopic: topic }),
  setFilterPayloadText: (text) => set({ filterPayloadText: text }),
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 1000), // Keep last 1000 logs
    })),
  clearLogs: () => set({ logs: [] }),
  addWorkflowLog: (log) =>
    set((state) => ({
      workflowLogs: [log, ...state.workflowLogs].slice(0, 500),
    })),
  clearWorkflowLogs: () => set({ workflowLogs: [] }),
}));
