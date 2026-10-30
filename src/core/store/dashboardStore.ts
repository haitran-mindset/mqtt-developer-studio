import { create } from 'zustand';
import type { DashboardWidgetConfig, TelemetryPoint } from '../dashboard/types';
import { DEFAULT_DASHBOARD_PRESETS } from '../dashboard/defaultDashboardPresets';

interface DashboardState {
  widgets: DashboardWidgetConfig[];
  telemetryData: Record<string, TelemetryPoint[]>;
  latestValues: Record<string, number | string>;
  isStreaming: boolean;
  autoSubscribeTopics: boolean;

  // Widget Actions
  addWidget: (widget: DashboardWidgetConfig) => void;
  updateWidget: (widget: DashboardWidgetConfig) => void;
  deleteWidget: (id: string) => void;
  setWidgets: (widgets: DashboardWidgetConfig[]) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;

  // Telemetry Actions
  recordTelemetry: (widgetId: string, value: number | string, maxPoints?: number) => void;
  clearTelemetry: (widgetId?: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setAutoSubscribeTopics: (auto: boolean) => void;

  isAddModalOpen: boolean;
  setAddModalOpen: (open: boolean) => void;

  // Preset & Import/Export
  loadPreset: (presetId: string) => void;
  exportDashboard: () => string;
  importDashboard: (jsonString: string) => boolean;
  resetToDefault: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  widgets: [],
  telemetryData: {},
  latestValues: {},
  isStreaming: true,
  autoSubscribeTopics: false,
  isAddModalOpen: false,

      setAutoSubscribeTopics: (auto) => set({ autoSubscribeTopics: auto }),
      setAddModalOpen: (open) => set({ isAddModalOpen: open }),

      addWidget: (widget) =>
        set((state) => ({
          widgets: [...state.widgets, widget],
        })),

      updateWidget: (widget) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === widget.id ? widget : w)),
        })),

      deleteWidget: (id) =>
        set((state) => {
          const nextData = { ...state.telemetryData };
          const nextLatest = { ...state.latestValues };
          delete nextData[id];
          delete nextLatest[id];
          return {
            widgets: state.widgets.filter((w) => w.id !== id),
            telemetryData: nextData,
            latestValues: nextLatest,
          };
        }),

      setWidgets: (widgets) => set({ widgets }),

      reorderWidgets: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.widgets);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { widgets: result };
        }),

      recordTelemetry: (widgetId, value, maxPoints = 30) =>
        set((state) => {
          const prevPoints = state.telemetryData[widgetId] || [];
          const newPoint: TelemetryPoint = {
            timestamp: Date.now(),
            value,
          };
          const trimmed = [...prevPoints, newPoint].slice(-maxPoints);

          return {
            telemetryData: {
              ...state.telemetryData,
              [widgetId]: trimmed,
            },
            latestValues: {
              ...state.latestValues,
              [widgetId]: value,
            },
          };
        }),

      clearTelemetry: (widgetId) =>
        set((state) => {
          if (widgetId) {
            const nextData = { ...state.telemetryData };
            const nextLatest = { ...state.latestValues };
            delete nextData[widgetId];
            delete nextLatest[widgetId];
            return { telemetryData: nextData, latestValues: nextLatest };
          }
          return { telemetryData: {}, latestValues: {} };
        }),

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      loadPreset: (presetId) => {
        const preset = DEFAULT_DASHBOARD_PRESETS.find((p) => p.id === presetId);
        if (preset) {
          set({
            widgets: JSON.parse(JSON.stringify(preset.widgets)),
            telemetryData: {},
            latestValues: {},
          });
        }
      },

      exportDashboard: () => {
        const { widgets } = get();
        return JSON.stringify({ version: '1.0', widgets }, null, 2);
      },

      importDashboard: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed.widgets)) {
            set({
              widgets: parsed.widgets,
              telemetryData: {},
              latestValues: {},
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      resetToDefault: () => {
        set({
          widgets: [],
          telemetryData: {},
          latestValues: {},
          autoSubscribeTopics: false,
        });
      },
}));

