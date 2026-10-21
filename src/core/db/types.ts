export type MQTTVersion = '3.1.1' | '5.0';
export type Protocol = 'mqtt' | 'mqtts' | 'ws' | 'wss';
export type QoS = 0 | 1 | 2;
export type PayloadFormat = 'text' | 'json' | 'xml' | 'hex' | 'base64' | 'binary';

export interface LWTConfig {
  enabled: boolean;
  topic: string;
  payload: string;
  qos: QoS;
  retain: boolean;
  properties?: {
    willDelayInterval?: number;
    messageExpiryInterval?: number;
    contentType?: string;
    responseTopic?: string;
    correlationData?: string;
    userProperties?: Record<string, string>;
  };
}

export interface ConnectionProfile {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  path: string; // default e.g. "/mqtt"
  clientId: string;
  username?: string;
  password?: string;
  mqttVersion: MQTTVersion;
  clean: boolean;
  keepalive: number; // in seconds, default 60
  connectTimeout: number; // in ms, default 10000
  reconnectPeriod: number; // in ms, default 4000
  sessionExpiryInterval?: number; // MQTT 5
  lwt?: LWTConfig;
  userProperties?: Record<string, string>; // MQTT 5
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PublishPreset {
  id: string;
  name: string;
  topic: string;
  payload: string;
  qos: QoS;
  retain: boolean;
  format: PayloadFormat;
  userProperties?: Record<string, string>;
  tags?: string[];
  createdAt: number;
}

export interface SubscriptionPreset {
  id: string;
  name: string;
  topics: Array<{
    topic: string;
    qos: QoS;
    color?: string;
  }>;
  autoSubscribe: boolean;
  createdAt: number;
}

export interface StoredMessage {
  id: string;
  connectionId: string;
  topic: string;
  payload: string;
  format: PayloadFormat;
  qos: QoS;
  retain: boolean;
  dup?: boolean;
  timestamp: number;
  direction: 'in' | 'out';
  sizeBytes: number;
  userProperties?: Record<string, string>;
  responseTopic?: string;
  correlationData?: string;
  contentType?: string;
}

export interface WorkflowNodeData {
  label: string;
  stepType:
    | 'publish'
    | 'subscribe'
    | 'unsubscribe'
    | 'delay'
    | 'wait_for_message'
    | 'validate_payload'
    | 'set_variable'
    | 'extract_variable'
    | 'condition'
    | 'loop'
    | 'log'
    | 'stop'
    | 'fail'
    | 'switch_connection';
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'failed';
  lastRunDurationMs?: number;
  lastError?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  variables: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStepRunLog {
  nodeId: string;
  stepName: string;
  stepType: string;
  status: 'running' | 'success' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
  output?: any;
  timestamp: number;
}

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  stepsLog: WorkflowStepRunLog[];
  contextSnapshot: Record<string, any>;
}
