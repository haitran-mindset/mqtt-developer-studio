export type DashboardWidgetType =
  | 'line_chart'
  | 'gauge'
  | 'stat_card'
  | 'status_led'
  | 'switch'
  | 'push_button';

export interface StatusLedMapping {
  value: string;
  label: string;
  color: 'emerald' | 'amber' | 'rose' | 'cyan' | 'zinc';
}

export interface DashboardWidgetConfig {
  id: string;
  type: DashboardWidgetType;
  title: string;
  topic: string; // Subscribe topic for reading telemetry
  publishTopic?: string; // For switch or button to publish commands
  jsonPath?: string; // e.g., '$.temperature' or 'pressure'
  unit?: string; // e.g., '°C', '%', 'bar', 'RPM'
  min?: number; // For gauge or chart bounds
  max?: number;
  color?: string; // Accent color (cyan, emerald, violet, amber, rose)
  onPayload?: string; // For switch
  offPayload?: string;
  buttonPayload?: string; // For push button
  buttonLabel?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  statusMappings?: StatusLedMapping[];
  colSpan?: 1 | 2 | 3 | 4; // CSS grid column span (default 1 or 2)
  chartMaxPoints?: number; // Default 30 points
}

export interface TelemetryPoint {
  timestamp: number;
  value: number | string;
}

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidgetConfig[];
}
