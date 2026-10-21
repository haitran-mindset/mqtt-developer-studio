import type { QoS, MQTTVersion, Protocol, LWTConfig } from '../db/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface MQTTMessageEvent {
  id: string;
  connectionId: string;
  topic: string;
  payload: string;
  rawPayload: Uint8Array;
  qos: QoS;
  retain: boolean;
  dup: boolean;
  timestamp: number;
  properties?: {
    userProperties?: Record<string, string>;
    contentType?: string;
    responseTopic?: string;
    correlationData?: string;
    messageExpiryInterval?: number;
  };
}

export interface PublishOptions {
  qos?: QoS;
  retain?: boolean;
  dup?: boolean;
  properties?: {
    userProperties?: Record<string, string>;
    contentType?: string;
    responseTopic?: string;
    correlationData?: string;
    messageExpiryInterval?: number;
  };
}

export interface SubscriptionInfo {
  topic: string;
  qos: QoS;
  color?: string;
  messageCount: number;
  lastMessageTimestamp?: number;
}

export interface ConnectionEventLog {
  id: string;
  connectionId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'packet';
  message: string;
  details?: any;
}
