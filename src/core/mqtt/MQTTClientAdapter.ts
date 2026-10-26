import mqtt, { type MqttClient, type IClientOptions } from 'mqtt';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import type { ConnectionProfile, QoS } from '../db/types';
import type {
  ConnectionStatus,
  MQTTMessageEvent,
  PublishOptions,
  SubscriptionInfo,
  ConnectionEventLog,
} from './types';

export type StatusChangeCallback = (status: ConnectionStatus, error?: string) => void;
export type MessageCallback = (event: MQTTMessageEvent) => void;
export type LogCallback = (log: ConnectionEventLog) => void;

export class MQTTClientAdapter {
  private client: MqttClient | null = null;
  private status: ConnectionStatus = 'disconnected';
  private subscriptions: Map<string, SubscriptionInfo> = new Map();

  private statusCallbacks: Set<StatusChangeCallback> = new Set();
  private messageCallbacks: Set<MessageCallback> = new Set();
  private logCallbacks: Set<LogCallback> = new Set();

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
      // Never leak sensitive password in details
      details: details ? JSON.parse(JSON.stringify(details, (k, v) => (k === 'password' ? '***' : v))) : undefined,
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
    if (this.client) {
      await this.disconnect();
    }

    if (typeof window !== 'undefined' && (this.profile.protocol === 'mqtt' || this.profile.protocol === 'mqtts')) {
      const suggestedProtocol = this.profile.protocol === 'mqtts' ? 'wss' : 'ws';
      const suggestedPort = this.profile.protocol === 'mqtts' ? 443 : 80;
      const errorMsg = `Web browsers cannot connect to raw TCP socket '${this.profile.protocol}://${this.profile.host}:${this.profile.port}'. Please switch Protocol to '${suggestedProtocol}://' (usually port ${suggestedPort} or 8084, path '/mqtt').`;
      this.setStatus('error', errorMsg);
      this.addLog('error', errorMsg);
      throw new Error(errorMsg);
    }

    const isWs = this.profile.protocol === 'ws' || this.profile.protocol === 'wss';
    const port = this.profile.port || (isWs ? 443 : 1883);
    const path = isWs
      ? this.profile.path !== undefined && this.profile.path !== null
        ? this.profile.path.startsWith('/') || this.profile.path === ''
          ? this.profile.path
          : `/${this.profile.path}`
        : '/mqtt'
      : '';
    const brokerUrl = isWs
      ? `${this.profile.protocol}://${this.profile.host}:${port}${path}`
      : `${this.profile.protocol}://${this.profile.host}:${port}`;

    this.addLog('info', `Connecting to ${brokerUrl}`);

    const isMQTT5 = this.profile.mqttVersion === '5.0';

    const options: IClientOptions = {
      clientId: this.profile.clientId,
      protocolVersion: isMQTT5 ? 5 : 4,
      clean: this.profile.clean,
      keepalive: this.profile.keepalive ?? 60,
      connectTimeout: this.profile.connectTimeout ?? 10000,
      reconnectPeriod: this.profile.autoReconnect === false ? 0 : (this.profile.reconnectPeriod ?? 4000),
      reschedulePings: true,
      rejectUnauthorized: this.profile.sslSecure !== false,
    };

    if (this.profile.username) {
      options.username = this.profile.username;
    }
    if (this.profile.password) {
      options.password = this.profile.password;
    }

    if (isMQTT5) {
      options.properties = {};
      if (this.profile.sessionExpiryInterval !== undefined) {
        options.properties.sessionExpiryInterval = this.profile.sessionExpiryInterval;
      }
      if (this.profile.userProperties) {
        options.properties.userProperties = this.profile.userProperties;
      }
    }

    // LWT
    if (this.profile.lwt && this.profile.lwt.enabled && this.profile.lwt.topic) {
      options.will = {
        topic: this.profile.lwt.topic,
        payload: Buffer.from(this.profile.lwt.payload || ''),
        qos: this.profile.lwt.qos || 0,
        retain: this.profile.lwt.retain || false,
      };
      if (isMQTT5 && this.profile.lwt.properties) {
        options.will.properties = this.profile.lwt.properties as any;
      }
    }

    return new Promise((resolve, reject) => {
      let resolved = false;

      try {
        this.client = mqtt.connect(brokerUrl, options);
      } catch (err: any) {
        this.setStatus('error', err.message);
        this.addLog('error', `Failed to initialize MQTT client: ${err.message}`);
        reject(err);
        return;
      }

      this.client.on('connect', (connack: any) => {
        this.setStatus('connected');
        this.addLog('info', `Connected successfully to ${this.profile.name || this.profile.host}`, connack);

        // Resubscribe to existing subscriptions if any
        if (this.subscriptions.size > 0) {
          this.subscriptions.forEach((sub) => {
            this.client?.subscribe(sub.topic, { qos: sub.qos });
          });
        }

        if (!resolved) {
          resolved = true;
          resolve();
        }
      });

      this.client.on('reconnect', () => {
        this.setStatus('reconnecting');
        this.addLog('warn', `Reconnecting to ${this.profile.host}...`);
      });

      this.client.on('close', () => {
        if (this.status === 'connected') {
          this.setStatus('disconnected');
          this.addLog('warn', `Connection closed`);
        }
      });

      this.client.on('error', (err) => {
        this.setStatus('error', err.message);
        this.addLog('error', `MQTT Error: ${err.message}`);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      this.client.on('packetreceive', (packet: any) => {
        if (packet.cmd) {
          this.addLog('packet', `<< Received packet: ${packet.cmd.toUpperCase()}`, packet);
        }
      });

      this.client.on('packetsend', (packet: any) => {
        if (packet.cmd) {
          this.addLog('packet', `>> Sent packet: ${packet.cmd.toUpperCase()}`, packet);
        }
      });

      this.client.on('message', (topic, payloadBuffer, packet: any) => {
        const payloadStr = payloadBuffer.toString('utf-8');

        // Update message count on subscription
        const sub = this.subscriptions.get(topic);
        if (sub) {
          sub.messageCount += 1;
          sub.lastMessageTimestamp = Date.now();
        }

        const msgEvent: MQTTMessageEvent = {
          id: uuidv4(),
          connectionId: this.profile.id,
          topic,
          payload: payloadStr,
          rawPayload: new Uint8Array(payloadBuffer),
          qos: (packet.qos as QoS) || 0,
          retain: !!packet.retain,
          dup: !!packet.dup,
          timestamp: Date.now(),
          properties: packet.properties,
        };

        this.messageCallbacks.forEach((cb) => {
          try {
            cb(msgEvent);
          } catch (e) {
            console.error('Error handling message callback:', e);
          }
        });
      });
    });
  }

  async disconnect(force: boolean = false): Promise<void> {
    if (!this.client) {
      this.setStatus('disconnected');
      return;
    }

    return new Promise((resolve) => {
      this.addLog('info', `Disconnecting from broker...`);
      this.client?.end(force, {}, () => {
        this.client = null;
        this.setStatus('disconnected');
        this.addLog('info', `Disconnected`);
        resolve();
      });
    });
  }

  async subscribe(topic: string, qos: QoS = 0, color?: string): Promise<void> {
    if (!this.client || this.status !== 'connected') {
      throw new Error(`Cannot subscribe: Not connected to ${this.profile.name}`);
    }

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos }, (err, granted) => {
        if (err) {
          this.addLog('error', `Failed to subscribe to ${topic}: ${err.message}`);
          reject(err);
        } else {
          this.subscriptions.set(topic, {
            topic,
            qos,
            color,
            messageCount: 0,
            lastMessageTimestamp: undefined,
          });
          this.addLog('info', `Subscribed to ${topic} (QoS: ${qos})`, granted);
          resolve();
        }
      });
    });
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.client || this.status !== 'connected') {
      this.subscriptions.delete(topic);
      return;
    }

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, {}, (err) => {
        if (err) {
          this.addLog('error', `Failed to unsubscribe from ${topic}: ${err.message}`);
          reject(err);
        } else {
          this.subscriptions.delete(topic);
          this.addLog('info', `Unsubscribed from ${topic}`);
          resolve();
        }
      });
    });
  }

  async publish(topic: string, payload: string | Uint8Array, options: PublishOptions = {}): Promise<void> {
    if (!this.client || this.status !== 'connected') {
      throw new Error(`Cannot publish: Client is ${this.status}`);
    }

    const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload, 'utf-8') : Buffer.from(payload);

    const publishOpts: any = {
      qos: options.qos || 0,
      retain: !!options.retain,
      dup: !!options.dup,
    };

    if (this.profile.mqttVersion === '5.0' && options.properties) {
      publishOpts.properties = options.properties;
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, payloadBuffer, publishOpts, (err) => {
        if (err) {
          this.addLog('error', `Failed to publish to ${topic}: ${err.message}`);
          reject(err);
        } else {
          this.addLog('info', `Published message to ${topic} (QoS: ${options.qos || 0}, Size: ${payloadBuffer.length} B)`);
          resolve();
        }
      });
    });
  }
}
