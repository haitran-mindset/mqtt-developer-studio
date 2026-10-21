import { describe, it, expect, vi } from 'vitest';
import { MQTTConnectionManager } from '@/core/mqtt/MQTTConnectionManager';
import type { ConnectionProfile } from '@/core/db/types';

describe('MQTTConnectionManager', () => {
  it('manages connection registry and listeners properly', () => {
    const manager = new MQTTConnectionManager();
    expect(manager.getAllConnections().size).toBe(0);

    const profile: ConnectionProfile = {
      id: 'test-broker-1',
      name: 'Test Broker',
      protocol: 'wss',
      host: 'broker.emqx.io',
      port: 8084,
      path: '/mqtt',
      clientId: 'test-client',
      mqttVersion: '5.0',
      clean: true,
      keepalive: 60,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const statusSpy = vi.fn();
    const unsub = manager.onGlobalStatus(statusSpy);

    expect(typeof unsub).toBe('function');
    unsub();
  });
});
