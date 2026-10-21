import { describe, it, expect, beforeEach } from 'vitest';
import { VariableInterpolator } from '@/core/template/VariableInterpolator';

describe('VariableInterpolator', () => {
  let interpolator: VariableInterpolator;

  beforeEach(() => {
    interpolator = new VariableInterpolator();
  });

  it('interpolates {{timestamp}} and {{timestamp_ms}}', () => {
    const template = 'Time: {{timestamp}} ms: {{timestamp_ms}}';
    const result = interpolator.interpolate(template);

    const match = result.match(/^Time: (\d+) ms: (\d+)$/);
    expect(match).not.toBeNull();
    const sec = parseInt(match![1], 10);
    const ms = parseInt(match![2], 10);
    expect(ms).toBeGreaterThanOrEqual(sec * 1000);
  });

  it('interpolates {{iso_date}}', () => {
    const template = '{"date": "{{iso_date}}"}';
    const result = interpolator.interpolate(template);
    const parsed = JSON.parse(result);
    expect(new Date(parsed.date).toISOString()).toBe(parsed.date);
  });

  it('interpolates {{uuid}} with valid RFC4122 v4 UUID', () => {
    const template = 'UUID: {{uuid}}';
    const result = interpolator.interpolate(template);
    expect(result).toMatch(/^UUID: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('interpolates {{random_int}} and {{random_int(min, max)}}', () => {
    const template = 'Val: {{random_int(10, 20)}}';
    for (let i = 0; i < 20; i++) {
      const result = interpolator.interpolate(template);
      const val = parseInt(result.replace('Val: ', ''), 10);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('interpolates monotonic {{sequence}}', () => {
    interpolator.resetSequence();
    const t1 = interpolator.interpolate('Seq: {{sequence}}');
    const t2 = interpolator.interpolate('Seq: {{sequence}}');
    const t3 = interpolator.interpolate('Seq: {{sequence}}');

    expect(t1).toBe('Seq: 1');
    expect(t2).toBe('Seq: 2');
    expect(t3).toBe('Seq: 3');
  });

  it('interpolates contextual variables and client_id', () => {
    const template = 'Device: {{deviceId}}, Client: {{client_id}}, Req: {{reqId}}';
    const context = {
      deviceId: 'sensor-99',
      client_id: 'mqtt_client_abc',
      reqId: 'custom-req-123',
    };
    const result = interpolator.interpolate(template, context);
    expect(result).toBe('Device: sensor-99, Client: mqtt_client_abc, Req: custom-req-123');
  });

  it('handles JSON payloads with mixed dynamic variables seamlessly', () => {
    const jsonTemplate = JSON.stringify({
      cmd: 'factory-reset',
      timestamp: '{{timestamp}}',
      requestId: '{{uuid}}',
      temp: '{{random_int(20, 25)}}',
      device: '{{target}}',
    });

    const result = interpolator.interpolate(jsonTemplate, { target: 'ESP32_01' });
    const parsed = JSON.parse(result);

    expect(parsed.cmd).toBe('factory-reset');
    expect(parsed.device).toBe('ESP32_01');
    expect(typeof parsed.timestamp).toBe('string');
    expect(Number(parsed.temp)).toBeGreaterThanOrEqual(20);
    expect(Number(parsed.temp)).toBeLessThanOrEqual(25);
    expect(parsed.requestId).toMatch(/^[0-9a-f-]+$/);
  });
});
