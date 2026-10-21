import { describe, it, expect } from 'vitest';
import { MQTTTopicMatcher, TopicTrie } from '@/core/mqtt/MQTTTopicMatcher';

describe('MQTTTopicMatcher', () => {
  it('matches exact topic strings', () => {
    expect(MQTTTopicMatcher.matches('device/01/state', 'device/01/state')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/01/state', 'device/02/state')).toBe(false);
    expect(MQTTTopicMatcher.matches('device', 'device')).toBe(true);
    expect(MQTTTopicMatcher.matches('device', 'device/01')).toBe(false);
  });

  it('matches single-level wildcard (+)', () => {
    expect(MQTTTopicMatcher.matches('device/+/state', 'device/126BA0/state')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/+/state', 'device/esp32/state')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/+/state', 'device/esp32/sub/state')).toBe(false);
    expect(MQTTTopicMatcher.matches('+/+/status', 'sensor/temp/status')).toBe(true);
    expect(MQTTTopicMatcher.matches('+/+/status', 'sensor/temp/humidity/status')).toBe(false);
    expect(MQTTTopicMatcher.matches('+', 'sensor')).toBe(true);
    expect(MQTTTopicMatcher.matches('+', 'sensor/temp')).toBe(false);
  });

  it('matches multi-level wildcard (#)', () => {
    expect(MQTTTopicMatcher.matches('device/#', 'device/126BA0')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/#', 'device/126BA0/telemetry')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/#', 'device/126BA0/telemetry/temp')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/#', 'device')).toBe(true);
    expect(MQTTTopicMatcher.matches('device/#', 'other/device')).toBe(false);
    expect(MQTTTopicMatcher.matches('#', 'any/nested/topic/here')).toBe(true);
    expect(MQTTTopicMatcher.matches('eonic/+/data/#', 'eonic/123/data/temp/sensor')).toBe(true);
  });

  it('rejects invalid wildcards per MQTT spec', () => {
    // '#' must be last character
    expect(MQTTTopicMatcher.matches('device/#/invalid', 'device/foo/invalid')).toBe(false);
  });

  it('routes correctly using TopicTrie', () => {
    const trie = new TopicTrie<string>();
    trie.subscribe('devices/+/temp', 'sub-single');
    trie.subscribe('devices/#', 'sub-multi');
    trie.subscribe('devices/sensor-01/temp', 'sub-exact');

    const matches1 = trie.match('devices/sensor-01/temp');
    expect(matches1).toContain('sub-single');
    expect(matches1).toContain('sub-multi');
    expect(matches1).toContain('sub-exact');

    const matches2 = trie.match('devices/sensor-02/humidity');
    expect(matches2).toEqual(['sub-multi']);

    // Unsubscribe
    trie.unsubscribe('devices/#', 'sub-multi');
    const matches3 = trie.match('devices/sensor-02/humidity');
    expect(matches3).toEqual([]);
  });
});
