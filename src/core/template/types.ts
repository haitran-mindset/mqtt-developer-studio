export interface VariableContext {
  client_id?: string;
  [key: string]: any;
}

export interface DynamicVariableDefinition {
  name: string;
  token: string;
  description: string;
  example: string;
}

export const BUILT_IN_VARIABLES: DynamicVariableDefinition[] = [
  {
    name: 'Timestamp (Seconds)',
    token: '{{timestamp}}',
    description: 'Current Unix timestamp in seconds',
    example: '1729512345',
  },
  {
    name: 'Timestamp (Milliseconds)',
    token: '{{timestamp_ms}}',
    description: 'Current Unix timestamp in milliseconds',
    example: '1729512345678',
  },
  {
    name: 'ISO Date',
    token: '{{iso_date}}',
    description: 'Current UTC timestamp formatted as ISO-8601',
    example: '2026-10-21T10:00:00.000Z',
  },
  {
    name: 'UUID v4',
    token: '{{uuid}}',
    description: 'Random RFC4122 v4 UUID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  },
  {
    name: 'Random Integer',
    token: '{{random_int(min, max)}}',
    description: 'Random integer between min and max (defaults to 0-100)',
    example: '42',
  },
  {
    name: 'Sequence Number',
    token: '{{sequence}}',
    description: 'Monotonic counter incremented on each publish',
    example: '1, 2, 3...',
  },
  {
    name: 'Client ID',
    token: '{{client_id}}',
    description: 'Active MQTT connection client ID',
    example: 'mqtt_client_a9f1',
  },
];
