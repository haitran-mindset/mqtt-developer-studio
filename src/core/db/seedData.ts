import { db } from './StudioDatabase';
import type { ConnectionProfile, PublishPreset, SubscriptionPreset, WorkflowDefinition } from './types';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_BROKERS: ConnectionProfile[] = [
  {
    id: 'broker-emqx-public',
    name: 'EMQX Public Broker (WSS)',
    protocol: 'wss',
    host: 'broker.emqx.io',
    port: 8084,
    path: '/mqtt',
    clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
    mqttVersion: '5.0',
    clean: true,
    keepalive: 60,
    connectTimeout: 10000,
    reconnectPeriod: 4000,
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'broker-hivemq-public',
    name: 'HiveMQ Public Broker (WSS)',
    protocol: 'wss',
    host: 'broker.hivemq.com',
    port: 8884,
    path: '/mqtt',
    clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
    mqttVersion: '3.1.1',
    clean: true,
    keepalive: 60,
    connectTimeout: 10000,
    reconnectPeriod: 4000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'broker-mosquitto-public',
    name: 'Eclipse Mosquitto (WSS)',
    protocol: 'wss',
    host: 'test.mosquitto.org',
    port: 8081,
    path: '/mqtt',
    clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
    mqttVersion: '3.1.1',
    clean: true,
    keepalive: 60,
    connectTimeout: 10000,
    reconnectPeriod: 4000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DEFAULT_PUBLISH_PRESETS: PublishPreset[] = [
  {
    id: 'preset-telemetry',
    name: 'Device Telemetry Sensor',
    topic: 'devices/sensor-01/telemetry',
    format: 'json',
    qos: 0,
    retain: false,
    payload: JSON.stringify(
      {
        deviceId: 'sensor-01',
        timestamp: '{{timestamp}}',
        temperature: '{{random_int(22, 34)}}',
        humidity: '{{random_int(45, 80)}}',
        status: 'online',
        sequence: '{{sequence}}',
      },
      null,
      2
    ),
    tags: ['IoT', 'Telemetry', 'Sensor'],
    createdAt: Date.now(),
  },
  {
    id: 'preset-rpc-command',
    name: 'RPC Command Request',
    topic: 'eonic/126BA0/command',
    format: 'json',
    qos: 1,
    retain: false,
    payload: JSON.stringify(
      {
        cmd: 'get-status',
        requestId: '{{uuid}}',
        timestamp: '{{timestamp_ms}}',
      },
      null,
      2
    ),
    tags: ['RPC', 'Command'],
    createdAt: Date.now(),
  },
];

export const DEFAULT_SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  {
    id: 'sub-preset-sensors',
    name: 'All Device Telemetry',
    autoSubscribe: true,
    topics: [
      { topic: 'devices/+/telemetry', qos: 0, color: '#06b6d4' },
      { topic: 'eonic/+/status', qos: 1, color: '#10b981' },
      { topic: 'eonic/+/response', qos: 1, color: '#f59e0b' },
    ],
    createdAt: Date.now(),
  },
];

export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'workflow-rpc-request-response',
    name: 'Request / Response RPC Validation',
    description: 'Subscribes to response topic, publishes command with correlation ID, waits for matching response, and validates payload.',
    variables: {
      deviceId: '126BA0',
    },
    nodes: [
      {
        id: 'node-start',
        type: 'workflowCustomNode',
        position: { x: 100, y: 150 },
        data: {
          label: '1. Set Request ID',
          stepType: 'set_variable',
          config: {
            varName: 'currentReqId',
            varValue: '{{uuid}}',
          },
        },
      },
      {
        id: 'node-sub',
        type: 'workflowCustomNode',
        position: { x: 380, y: 150 },
        data: {
          label: '2. Subscribe Response Topic',
          stepType: 'subscribe',
          config: {
            topic: 'eonic/{{deviceId}}/response',
            qos: 1,
          },
        },
      },
      {
        id: 'node-pub',
        type: 'workflowCustomNode',
        position: { x: 660, y: 150 },
        data: {
          label: '3. Publish Command',
          stepType: 'publish',
          config: {
            topic: 'eonic/{{deviceId}}/command',
            qos: 1,
            retain: false,
            payload: JSON.stringify({
              cmd: 'get-status',
              requestId: '{{currentReqId}}',
              timestamp: '{{timestamp_ms}}',
            }),
          },
        },
      },
      {
        id: 'node-wait',
        type: 'workflowCustomNode',
        position: { x: 940, y: 150 },
        data: {
          label: '4. Wait for Matching Response',
          stepType: 'wait_for_message',
          config: {
            topic: 'eonic/{{deviceId}}/response',
            timeoutMs: 6000,
            correlationField: 'requestId',
            correlationValue: '{{currentReqId}}',
          },
        },
      },
      {
        id: 'node-validate',
        type: 'workflowCustomNode',
        position: { x: 1220, y: 150 },
        data: {
          label: '5. Validate Response Payload',
          stepType: 'validate_payload',
          config: {
            assertionField: 'status',
            operator: 'equals',
            expectedValue: 'success',
          },
        },
      },
      {
        id: 'node-log',
        type: 'workflowCustomNode',
        position: { x: 1500, y: 150 },
        data: {
          label: '6. Log Success',
          stepType: 'log',
          config: {
            message: 'RPC Command finished successfully for request {{currentReqId}}!',
          },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-start', target: 'node-sub' },
      { id: 'e2-3', source: 'node-sub', target: 'node-pub' },
      { id: 'e3-4', source: 'node-pub', target: 'node-wait' },
      { id: 'e4-5', source: 'node-wait', target: 'node-validate' },
      { id: 'e5-6', source: 'node-validate', target: 'node-log' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'workflow-sequential-reboot',
    name: 'Sequential Device Reset & Restart',
    description: 'Executes sequential command chain with configured time delays.',
    variables: {
      targetDevice: '126BA0',
    },
    nodes: [
      {
        id: 'seq-1',
        type: 'workflowCustomNode',
        position: { x: 100, y: 150 },
        data: {
          label: '1. Send Factory Reset',
          stepType: 'publish',
          config: {
            topic: 'eonic/{{targetDevice}}/command',
            qos: 1,
            payload: JSON.stringify({ cmd: 'factory-reset' }),
          },
        },
      },
      {
        id: 'seq-2',
        type: 'workflowCustomNode',
        position: { x: 380, y: 150 },
        data: {
          label: '2. Delay 2000ms',
          stepType: 'delay',
          config: {
            delayMs: 2000,
          },
        },
      },
      {
        id: 'seq-3',
        type: 'workflowCustomNode',
        position: { x: 660, y: 150 },
        data: {
          label: '3. Send Restart Command',
          stepType: 'publish',
          config: {
            topic: 'eonic/{{targetDevice}}/command',
            qos: 1,
            payload: JSON.stringify({ cmd: 'restart' }),
          },
        },
      },
      {
        id: 'seq-4',
        type: 'workflowCustomNode',
        position: { x: 940, y: 150 },
        data: {
          label: '4. Log Completion',
          stepType: 'log',
          config: {
            message: 'Device restart sequence finished.',
          },
        },
      },
    ],
    edges: [
      { id: 'e-seq-1-2', source: 'seq-1', target: 'seq-2' },
      { id: 'e-seq-2-3', source: 'seq-2', target: 'seq-3' },
      { id: 'e-seq-3-4', source: 'seq-3', target: 'seq-4' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export async function initializeSeedData(): Promise<void> {
  const profileCount = await db.connectionProfiles.count();
  if (profileCount === 0) {
    await db.connectionProfiles.bulkAdd(DEFAULT_BROKERS);
  }

  const presetCount = await db.publishPresets.count();
  if (presetCount === 0) {
    await db.publishPresets.bulkAdd(DEFAULT_PUBLISH_PRESETS);
  }

  const subPresetCount = await db.subscriptionPresets.count();
  if (subPresetCount === 0) {
    await db.subscriptionPresets.bulkAdd(DEFAULT_SUBSCRIPTION_PRESETS);
  }

  const workflowCount = await db.workflows.count();
  if (workflowCount === 0) {
    await db.workflows.bulkAdd(DEFAULT_WORKFLOWS);
  }
}
