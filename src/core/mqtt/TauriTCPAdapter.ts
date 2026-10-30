import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import type { ConnectionProfile, QoS } from '../db/types';
import type {
  ConnectionStatus,
  MQTTMessageEvent,
  PublishOptions,
  SubscriptionInfo,
  ConnectionEventLog,
} from './types';
import type { StatusChangeCallback, MessageCallback, LogCallback } from './MQTTClientAdapter';

interface TauriIncomingMessage {
  connection_id: string;
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
  timestamp: number;
}

interface TauriStatusUpdate {
  connection_id: string;
  status: string;
  error?: string;
}

/**
 * Native TCP / TLS MQTT Client Adapter for Tauri Desktop environment.
 * Communicates directly with the Rust rumqttc engine over native OS sockets (1883 / 8883).
 */
export class TauriTCPAdapter {
  private status: ConnectionStatus = 'disconnected';
  private subscriptions: Map<string, SubscriptionInfo> = new Map();

  private statusCallbacks: Set<StatusChangeCallback> = new Set();
  private messageCallbacks: Set<MessageCallback> = new Set();
  private logCallbacks: Set<LogCallback> = new Set();

  private unlistenMsg: UnlistenFn | null = null;
  private unlistenStatus: UnlistenFn | null = null;

  constructor(public readonly profile: ConnectionProfile) {}

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getSubscriptions(): Map<string, SubscriptionInfo> {
    return new Map(this.subscriptions);
  }

  onStatusChange(cb: StatusChangeCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  onMessage(cb: MessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  onLog(cb: LogCallback): () => void {
    this.logCallbacks.add(cb);
    return () => this.logCallbacks.delete(cb);
  }

  private setStatus(status: ConnectionStatus, error?: string): void {
    this.status = status;
    this.statusCallbacks.forEach((cb) => {
      try {
        cb(status, error);
      } catch (e) {
        console.error('Error in status callback:', e);
      }
    });
  }

  private addLog(level: 'info' | 'warn' | 'error' | 'packet', message: string, details?: any): void {
    const log: ConnectionEventLog = {
      id: uuidv4(),
      connectionId: this.profile.id,
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    this.logCallbacks.forEach((cb) => {
      try {
        cb(log);
      } catch (e) {
        console.error('Error in log callback:', e);
      }
    });
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') {
      await this.disconnect();
    }

    this.setStatus('connecting');
    const port = this.profile.port || (this.profile.protocol === 'mqtts' ? 8883 : 1883);
    const useTls = this.profile.protocol === 'mqtts' || !!this.profile.ssl;

    this.addLog('info', `Connecting to native TCP socket at ${this.profile.host}:${port} (TLS: ${useTls})`);

    // Clean up old listeners if any
    if (this.unlistenMsg) this.unlistenMsg();
    if (this.unlistenStatus) this.unlistenStatus();

    // Listen for incoming messages from Rust rumqttc
    this.unlistenMsg = await listen<TauriIncomingMessage>(
      `mqtt-msg-${this.profile.id}`,
      (event) => {
        const data = event.payload;
        const raw = new TextEncoder().encode(data.payload);
        const msgEvent: MQTTMessageEvent = {
          id: uuidv4(),
          connectionId: this.profile.id,
          topic: data.topic,
          payload: data.payload,
          rawPayload: raw,
          qos: (data.qos ?? 0) as QoS,
          retain: data.retain,
          dup: false,
          timestamp: data.timestamp,
        };

        this.messageCallbacks.forEach((cb) => {
          try {
            cb(msgEvent);
          } catch (e) {
            console.error('Error in message callback:', e);
          }
        });
      }
    );

    // Listen for status changes from Rust rumqttc
    this.unlistenStatus = await listen<TauriStatusUpdate>(
      `mqtt-status-${this.profile.id}`,
      (event) => {
        const { status, error } = event.payload;
        if (status === 'connected') {
          this.setStatus('connected');
          this.addLog('info', `Successfully connected to native broker ${this.profile.host}:${port}`);
        } else if (status === 'disconnected') {
          this.setStatus('disconnected');
          this.addLog('warn', 'Disconnected from broker');
        } else if (status === 'error') {
          this.setStatus('error', error);
          this.addLog('error', `Connection error: ${error || 'Unknown error'}`);
        }
      }
    );

    try {
      await invoke('connect_mqtt', {
        opts: {
          connection_id: this.profile.id,
          host: this.profile.host,
          port,
          client_id: this.profile.clientId,
          keep_alive: this.profile.keepalive ?? 60,
          clean_session: this.profile.clean ?? true,
          username: this.profile.username || null,
          password: this.profile.password || null,
          use_tls: useTls,
        },
      });
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || 'Failed to connect via native TCP';
      this.setStatus('error', errMsg);
      this.addLog('error', errMsg);
      throw new Error(errMsg);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await invoke('disconnect_mqtt', { connectionId: this.profile.id });
    } catch (e) {
      console.warn('Disconnect error in Rust:', e);
    } finally {
      if (this.unlistenMsg) {
        this.unlistenMsg();
        this.unlistenMsg = null;
      }
      if (this.unlistenStatus) {
        this.unlistenStatus();
        this.unlistenStatus = null;
      }
      this.setStatus('disconnected');
      this.addLog('info', 'Disconnected from broker');
    }
  }

  async publish(topic: string, payload: string | Uint8Array, options: PublishOptions = {}): Promise<void> {
    const payloadStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload);
    const qos = options.qos ?? 0;
    const retain = options.retain ?? false;

    try {
      await invoke('publish_mqtt', {
        connectionId: this.profile.id,
        topic,
        payload: payloadStr,
        qos,
        retain,
      });
      this.addLog('packet', `Published to ${topic} (QoS ${qos})`);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || 'Publish error';
      this.addLog('error', `Publish failed to ${topic}: ${errMsg}`);
      throw new Error(errMsg);
    }
  }

  async subscribe(topic: string, qos: QoS = 0, color?: string): Promise<void> {
    try {
      await invoke('subscribe_mqtt', {
        connectionId: this.profile.id,
        topic,
        qos,
      });

      this.subscriptions.set(topic, {
        topic,
        qos,
        color: color || '#06b6d4',
        messageCount: 0,
      });
      this.addLog('info', `Subscribed to ${topic} (QoS ${qos})`);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || 'Subscribe error';
      this.addLog('error', `Subscribe failed to ${topic}: ${errMsg}`);
      throw new Error(errMsg);
    }
  }

  async unsubscribe(topic: string): Promise<void> {
    try {
      await invoke('unsubscribe_mqtt', {
        connectionId: this.profile.id,
        topic,
      });
      this.subscriptions.delete(topic);
      this.addLog('info', `Unsubscribed from ${topic}`);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || 'Unsubscribe error';
      this.addLog('error', `Unsubscribe failed from ${topic}: ${errMsg}`);
      throw new Error(errMsg);
    }
  }
}
