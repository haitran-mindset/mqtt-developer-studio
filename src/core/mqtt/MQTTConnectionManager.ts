import { MQTTClientAdapter, type StatusChangeCallback, type MessageCallback, type LogCallback } from './MQTTClientAdapter';
import type { ConnectionProfile, StoredMessage, QoS } from '../db/types';
import type { ConnectionStatus, MQTTMessageEvent, PublishOptions, ConnectionEventLog } from './types';
import { useDataStore } from '../store/dataStore';

export class MQTTConnectionManager {
  private connections: Map<string, MQTTClientAdapter> = new Map();
  private globalMessageListeners: Set<MessageCallback> = new Set();
  private globalStatusListeners: Set<(connectionId: string, status: ConnectionStatus, error?: string) => void> = new Set();
  private globalLogListeners: Set<LogCallback> = new Set();

  getConnection(connectionId: string): MQTTClientAdapter | undefined {
    return this.connections.get(connectionId);
  }

  getAllConnections(): Map<string, MQTTClientAdapter> {
    return new Map(this.connections);
  }

  onGlobalMessage(cb: MessageCallback): () => void {
    this.globalMessageListeners.add(cb);
    return () => this.globalMessageListeners.delete(cb);
  }

  onGlobalStatus(cb: (connectionId: string, status: ConnectionStatus, error?: string) => void): () => void {
    this.globalStatusListeners.add(cb);
    return () => this.globalStatusListeners.delete(cb);
  }

  onGlobalLog(cb: LogCallback): () => void {
    this.globalLogListeners.add(cb);
    return () => this.globalLogListeners.delete(cb);
  }

  async connect(profile: ConnectionProfile): Promise<MQTTClientAdapter> {
    let adapter = this.connections.get(profile.id);

    if (!adapter) {
      adapter = new MQTTClientAdapter(profile);
      this.connections.set(profile.id, adapter);

      // Wire adapter events to global manager listeners
      adapter.onStatusChange((status, error) => {
        this.globalStatusListeners.forEach((cb) => cb(profile.id, status, error));
      });

      adapter.onLog((log) => {
        this.globalLogListeners.forEach((cb) => cb(log));
      });

      adapter.onMessage(async (msg) => {
        // Broadcast to listeners
        this.globalMessageListeners.forEach((cb) => cb(msg));

        // Save incoming message to in-memory store
        const stored: StoredMessage = {
          id: msg.id,
          connectionId: msg.connectionId,
          topic: msg.topic,
          payload: msg.payload,
          format: this.detectFormat(msg.payload),
          qos: msg.qos,
          retain: msg.retain,
          dup: msg.dup,
          timestamp: msg.timestamp,
          direction: 'in',
          sizeBytes: msg.rawPayload.byteLength,
          userProperties: msg.properties?.userProperties,
          responseTopic: msg.properties?.responseTopic,
          correlationData: msg.properties?.correlationData,
          contentType: msg.properties?.contentType,
        };

        useDataStore.getState().addMessage(stored);
      });
    }

    await adapter.connect();
    return adapter;
  }

  async disconnect(connectionId: string, force?: boolean): Promise<void> {
    const adapter = this.connections.get(connectionId);
    if (adapter) {
      await adapter.disconnect(force);
    }
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map((adapter) => adapter.disconnect());
    await Promise.all(promises);
  }

  async publish(
    connectionId: string,
    topic: string,
    payload: string | Uint8Array,
    options: PublishOptions = {}
  ): Promise<void> {
    const adapter = this.connections.get(connectionId);
    if (!adapter) {
      throw new Error(`Connection ${connectionId} not found in manager`);
    }

    await adapter.publish(topic, payload, options);

    // Save outgoing message to in-memory store
    const payloadStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload);
    const sizeBytes = typeof payload === 'string' ? new TextEncoder().encode(payload).byteLength : payload.byteLength;

    const stored: StoredMessage = {
      id: `out-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
      connectionId,
      topic,
      payload: payloadStr,
      format: this.detectFormat(payloadStr),
      qos: options.qos || 0,
      retain: !!options.retain,
      timestamp: Date.now(),
      direction: 'out',
      sizeBytes,
      userProperties: options.properties?.userProperties,
      responseTopic: options.properties?.responseTopic,
      correlationData: options.properties?.correlationData,
    };

    useDataStore.getState().addMessage(stored);
  }

  private detectFormat(payload: string): 'json' | 'xml' | 'text' {
    const trimmed = payload.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      return 'xml';
    }
    return 'text';
  }
}

export const connectionManager = new MQTTConnectionManager();
