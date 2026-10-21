import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/core/db/StudioDatabase';
import { initializeSeedData, DEFAULT_BROKERS } from '@/core/db/seedData';

describe('StudioDatabase', () => {
  beforeEach(async () => {
    await db.connectionProfiles.clear();
    await db.publishPresets.clear();
    await db.subscriptionPresets.clear();
    await db.messageHistory.clear();
    await db.workflows.clear();
  });

  it('initializes default brokers and seed data correctly', async () => {
    await initializeSeedData();

    const brokers = await db.connectionProfiles.toArray();
    expect(brokers.length).toBe(DEFAULT_BROKERS.length);
    expect(brokers[0].host).toBe('broker.emqx.io');

    const presets = await db.publishPresets.toArray();
    expect(presets.length).toBeGreaterThan(0);

    const workflows = await db.workflows.toArray();
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows[0].name).toContain('Request / Response RPC');
  });

  it('can prune old messages efficiently', async () => {
    // Add 10 messages
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      await db.messageHistory.add({
        id: `msg-${i}`,
        connectionId: 'broker-1',
        topic: `test/topic/${i}`,
        payload: `payload-${i}`,
        format: 'text',
        qos: 0,
        retain: false,
        timestamp: now + i * 100,
        direction: 'in',
        sizeBytes: 10,
      });
    }

    const initialCount = await db.messageHistory.count();
    expect(initialCount).toBe(10);

    // Prune to max 4 messages
    await db.pruneOldMessages(4);

    const remaining = await db.messageHistory.toArray();
    expect(remaining.length).toBe(4);
    // Oldest messages should have been deleted, newest kept
    expect(remaining[0].id).toBe('msg-6');
    expect(remaining[3].id).toBe('msg-9');
  });
});
