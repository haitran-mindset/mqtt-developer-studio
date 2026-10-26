import type { WorkflowDefinition } from '@/core/db/types';

export interface WorkflowTemplateItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  tags: string[];
  workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplateItem[] = [
  {
    id: 'template-heartbeat',
    name: 'Heartbeat & Keep-Alive Checker',
    category: 'Health & Diagnostics',
    badge: 'Device Health',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40',
    description:
      'Periodically broadcasts device status ping, verifies heartbeat JSON schema format, waits, and logs connectivity telemetry.',
    tags: ['Heartbeat', 'Keep-Alive', 'Schema Validator', 'Diagnostics'],
    workflow: {
      name: 'Heartbeat & Keep-Alive Checker',
      description: 'Periodic device health reporting with JSON schema validation',
      variables: {
        deviceId: 'edge-gateway-01',
      },
      nodes: [
        {
          id: 'node-hb-1',
          type: 'workflowCustomNode',
          position: { x: 220, y: 80 },
          data: {
            label: 'Publish Heartbeat',
            stepType: 'publish',
            status: 'idle',
            config: {
              topic: 'devices/{{deviceId}}/heartbeat',
              payload: '{\n  "deviceId": "{{deviceId}}",\n  "status": "online",\n  "uptimeSec": 3600,\n  "timestamp": {{timestamp}}\n}',
              qos: 0,
              retain: false,
            },
          },
        },
        {
          id: 'node-hb-2',
          type: 'workflowCustomNode',
          position: { x: 220, y: 220 },
          data: {
            label: 'Delay 2000ms',
            stepType: 'delay',
            status: 'idle',
            config: {
              delayMs: 2000,
            },
          },
        },
        {
          id: 'node-hb-3',
          type: 'workflowCustomNode',
          position: { x: 220, y: 360 },
          data: {
            label: 'Validate Heartbeat Schema',
            stepType: 'validate_schema',
            status: 'idle',
            config: {
              targetVariable: '',
              schema: JSON.stringify(
                {
                  type: 'object',
                  required: ['deviceId', 'status', 'uptimeSec'],
                  properties: {
                    deviceId: { type: 'string' },
                    status: { type: 'string', enum: ['online', 'standby', 'offline'] },
                    uptimeSec: { type: 'number', minimum: 0 },
                  },
                },
                null,
                2
              ),
            },
          },
        },
        {
          id: 'node-hb-4',
          type: 'workflowCustomNode',
          position: { x: 220, y: 500 },
          data: {
            label: 'Log Health Status',
            stepType: 'log',
            status: 'idle',
            config: {
              message: 'Heartbeat verified successfully for {{deviceId}} at {{timestamp}}',
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-hb-1-2',
          source: 'node-hb-1',
          target: 'node-hb-2',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-hb-2-3',
          source: 'node-hb-2',
          target: 'node-hb-3',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-hb-3-4',
          source: 'node-hb-3',
          target: 'node-hb-4',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
      ],
    },
  },
  {
    id: 'template-smart-home',
    name: 'Smart Home Telemetry Simulation',
    category: 'IoT & Simulation',
    badge: 'Sensor Simulation',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40',
    description:
      'Simulates ambient environmental sensors (temperature, humidity), asserts data boundaries against JSON Schema, and logs live telemetry.',
    tags: ['Smart Home', 'Sensors', 'Simulation', 'Schema Validation'],
    workflow: {
      name: 'Smart Home Telemetry Simulation',
      description: 'Generates living room environmental telemetry and validates schema',
      variables: {
        roomId: 'living-room',
      },
      nodes: [
        {
          id: 'node-sh-1',
          type: 'workflowCustomNode',
          position: { x: 220, y: 70 },
          data: {
            label: 'Init Room Context',
            stepType: 'set_variable',
            status: 'idle',
            config: {
              varName: 'roomId',
              varValue: 'living-room',
            },
          },
        },
        {
          id: 'node-sh-2',
          type: 'workflowCustomNode',
          position: { x: 220, y: 200 },
          data: {
            label: 'Publish Sensor Reading',
            stepType: 'publish',
            status: 'idle',
            config: {
              topic: 'home/{{roomId}}/sensors',
              payload: '{\n  "deviceId": "sensor-env-01",\n  "temperature": 26.8,\n  "humidity": 58.5,\n  "timestamp": {{timestamp}}\n}',
              qos: 0,
              retain: false,
            },
          },
        },
        {
          id: 'node-sh-3',
          type: 'workflowCustomNode',
          position: { x: 220, y: 340 },
          data: {
            label: 'Validate Telemetry Schema',
            stepType: 'validate_schema',
            status: 'idle',
            config: {
              targetVariable: '',
              schema: JSON.stringify(
                {
                  type: 'object',
                  required: ['deviceId', 'temperature', 'humidity', 'timestamp'],
                  properties: {
                    deviceId: { type: 'string', minLength: 3 },
                    temperature: { type: 'number', minimum: -40, maximum: 125 },
                    humidity: { type: 'number', minimum: 0, maximum: 100 },
                    timestamp: { type: 'number' },
                  },
                },
                null,
                2
              ),
            },
          },
        },
        {
          id: 'node-sh-4',
          type: 'workflowCustomNode',
          position: { x: 220, y: 480 },
          data: {
            label: 'Telemetry Delay 1500ms',
            stepType: 'delay',
            status: 'idle',
            config: {
              delayMs: 1500,
            },
          },
        },
        {
          id: 'node-sh-5',
          type: 'workflowCustomNode',
          position: { x: 220, y: 620 },
          data: {
            label: 'Log Success Event',
            stepType: 'log',
            status: 'idle',
            config: {
              message: 'Environmental telemetry for {{roomId}} verified and published successfully.',
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-sh-1-2',
          source: 'node-sh-1',
          target: 'node-sh-2',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-sh-2-3',
          source: 'node-sh-2',
          target: 'node-sh-3',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-sh-3-4',
          source: 'node-sh-3',
          target: 'node-sh-4',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-sh-4-5',
          source: 'node-sh-4',
          target: 'node-sh-5',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
      ],
    },
  },
  {
    id: 'template-alert-response',
    name: 'Alert Triggering & Auto Response',
    category: 'Industrial Automation',
    badge: 'Safety Interlock',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-950/40',
    description:
      'Emits an alarm event, validates alert payload with JSON Schema, branches based on CRITICAL severity, and issues an emergency shutdown command.',
    tags: ['Alerts', 'Interlock', 'Branching', 'Industrial IoT'],
    workflow: {
      name: 'Alert Triggering & Auto Response',
      description: 'Catches critical alarm, validates schema, and auto-dispatches emergency shutdown command',
      variables: {},
      nodes: [
        {
          id: 'node-al-1',
          type: 'workflowCustomNode',
          position: { x: 220, y: 70 },
          data: {
            label: 'Publish Overheat Alert',
            stepType: 'publish',
            status: 'idle',
            config: {
              topic: 'factory/machine-A1/alerts',
              payload: '{\n  "alertId": "alt-{{timestamp}}",\n  "severity": "CRITICAL",\n  "errorCode": "OVERHEAT_105C",\n  "currentTemp": 105.4\n}',
              qos: 1,
              retain: false,
            },
          },
        },
        {
          id: 'node-al-2',
          type: 'workflowCustomNode',
          position: { x: 220, y: 210 },
          data: {
            label: 'Validate Alert Schema',
            stepType: 'validate_schema',
            status: 'idle',
            config: {
              targetVariable: '',
              schema: JSON.stringify(
                {
                  type: 'object',
                  required: ['alertId', 'severity', 'errorCode'],
                  properties: {
                    alertId: { type: 'string' },
                    severity: { type: 'string', enum: ['INFO', 'WARNING', 'CRITICAL'] },
                    errorCode: { type: 'string' },
                    currentTemp: { type: 'number' },
                  },
                },
                null,
                2
              ),
            },
          },
        },
        {
          id: 'node-al-3',
          type: 'workflowCustomNode',
          position: { x: 220, y: 350 },
          data: {
            label: 'Is Alert Critical?',
            stepType: 'condition',
            status: 'idle',
            config: {
              expression: "severity === 'CRITICAL' || currentTemp > 90",
            },
          },
        },
        {
          id: 'node-al-4',
          type: 'workflowCustomNode',
          position: { x: 60, y: 500 },
          data: {
            label: 'Emergency Shutdown Command',
            stepType: 'publish',
            status: 'idle',
            config: {
              topic: 'factory/machine-A1/commands',
              payload: '{\n  "command": "EMERGENCY_SHUTDOWN",\n  "reason": "Temperature exceeded 90C safety threshold",\n  "timestamp": {{timestamp}}\n}',
              qos: 2,
              retain: true,
            },
          },
        },
        {
          id: 'node-al-5',
          type: 'workflowCustomNode',
          position: { x: 380, y: 500 },
          data: {
            label: 'Log Non-Critical Warning',
            stepType: 'log',
            status: 'idle',
            config: {
              message: 'Alert received with non-critical severity. Normal machine operation continues.',
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-al-1-2',
          source: 'node-al-1',
          target: 'node-al-2',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-al-2-3',
          source: 'node-al-2',
          target: 'node-al-3',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        },
        {
          id: 'edge-al-3-4',
          source: 'node-al-3',
          sourceHandle: 'true',
          target: 'node-al-4',
          animated: true,
          style: { stroke: '#34d399', strokeWidth: 2.5 },
        },
        {
          id: 'edge-al-3-5',
          source: 'node-al-3',
          sourceHandle: 'false',
          target: 'node-al-5',
          animated: true,
          style: { stroke: '#f43f5e', strokeWidth: 2 },
        },
      ],
    },
  },
];
