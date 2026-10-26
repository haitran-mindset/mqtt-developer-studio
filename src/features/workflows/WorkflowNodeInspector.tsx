import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkflowStepType } from '@/core/workflow/types';
import { useDataStore } from '@/core/store/dataStore';
import { X, Sparkles, Trash2, Play, Copy } from 'lucide-react';

interface WorkflowNodeInspectorProps {
  selectedNode: any;
  onUpdateNodeData: (nodeId: string, newData: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onRunFromNode?: (nodeId: string) => void;
  onClose: () => void;
}

export const WorkflowNodeInspector: React.FC<WorkflowNodeInspectorProps> = ({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onDuplicateNode,
  onRunFromNode,
  onClose,
}) => {
  const profiles = useDataStore((state) => state.connectionProfiles);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-600 flex items-center justify-center select-none">
        Select a node to inspect and configure properties
      </div>
    );
  }

  const { id } = selectedNode;
  const data = selectedNode.data || {};
  const stepType: WorkflowStepType = data.stepType || 'publish';
  const config = data.config || {};

  const handleUpdateConfig = (key: string, value: any) => {
    onUpdateNodeData(id, {
      ...data,
      config: {
        ...config,
        [key]: value,
      },
    });
  };

  const handleUpdateLabel = (label: string) => {
    onUpdateNodeData(id, {
      ...data,
      label,
    });
  };

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div>
          <span className="text-xs font-semibold text-zinc-100 block">Step Properties</span>
          <span className="text-[10px] font-mono text-cyan-400 uppercase">{stepType}</span>
        </div>

        <div className="flex items-center gap-1">
          {onDuplicateNode && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDuplicateNode(id)}
              className="h-6 w-6 text-zinc-400 hover:text-cyan-400"
              title="Duplicate Node (Ctrl+D)"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDeleteNode(id)}
            className="h-6 w-6 text-zinc-400 hover:text-rose-400"
            title="Delete Node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-zinc-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-3 space-y-3 font-sans text-xs flex-1">
        {/* Step Label */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-zinc-300">Step Label</Label>
          <Input
            value={data.label || ''}
            onChange={(e) => handleUpdateLabel(e.target.value)}
            placeholder="Step Name"
          />
        </div>

        {/* Enable / Disable Step Switch */}
        <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-zinc-200">Enable Step</span>
            <p className="text-[10px] text-zinc-500">
              {data.disabled ? 'Step disabled (skipped in workflow)' : 'Step is active'}
            </p>
          </div>
          <Switch
            checked={!data.disabled}
            onCheckedChange={(checked) =>
              onUpdateNodeData(id, { ...data, disabled: !checked })
            }
          />
        </div>

        {/* Run From Here Button */}
        {onRunFromNode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRunFromNode(id)}
            className="w-full gap-1.5 text-xs border-cyan-800/60 bg-cyan-950/20 hover:bg-cyan-950/50 text-cyan-400 hover:text-cyan-300"
          >
            <Play className="h-3.5 w-3.5 fill-cyan-400" />
            Run from this step
          </Button>
        )}

        {/* 1. Publish Step */}
        {stepType === 'publish' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Target Topic</Label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. devices/{{deviceId}}/command"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-zinc-300">QoS</Label>
                <Select
                  value={String(config.qos ?? 0)}
                  onValueChange={(val) => handleUpdateConfig('qos', Number(val))}
                >
                  <SelectTrigger className="w-full h-8 text-xs font-mono">
                    <SelectValue placeholder="QoS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="wf-retain"
                  checked={!!config.retain}
                  onCheckedChange={(val) => handleUpdateConfig('retain', val)}
                />
                <Label htmlFor="wf-retain" className="text-zinc-300 cursor-pointer">Retain</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Payload</Label>
              <Textarea
                value={config.payload || ''}
                onChange={(e) => handleUpdateConfig('payload', e.target.value)}
                rows={5}
                placeholder='{"cmd": "restart", "reqId": "{{uuid}}"}'
                className="w-full font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* 2. Subscribe Step */}
        {stepType === 'subscribe' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Subscription Topic</Label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. devices/+/response"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">QoS</Label>
              <Select
                value={String(config.qos ?? 0)}
                onValueChange={(val) => handleUpdateConfig('qos', Number(val))}
              >
                <SelectTrigger className="w-full h-8 text-xs font-mono">
                  <SelectValue placeholder="QoS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 2b. Unsubscribe Step */}
        {stepType === 'unsubscribe' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Topic to Unsubscribe</Label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. devices/+/response or eonic/1233/state"
              />
              <span className="text-[10px] text-zinc-500 block">
                The MQTT topic or wildcard pattern to cancel subscription from.
              </span>
            </div>
          </div>
        )}

        {/* 3. Delay Step */}
        {stepType === 'delay' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Duration (ms)</Label>
              <Input
                type="number"
                value={config.delayMs ?? 1000}
                onChange={(e) => handleUpdateConfig('delayMs', Number(e.target.value))}
                placeholder="1000"
              />
            </div>
          </div>
        )}

        {/* 4. Wait for Message Step */}
        {stepType === 'wait_for_message' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Listen Topic</Label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. devices/{{deviceId}}/response"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Timeout (ms)</Label>
              <Input
                type="number"
                value={config.timeoutMs ?? 5000}
                onChange={(e) => handleUpdateConfig('timeoutMs', Number(e.target.value))}
                placeholder="5000"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Correlation Field (Optional)
              </Label>
              <Input
                value={config.correlationField || ''}
                onChange={(e) => handleUpdateConfig('correlationField', e.target.value)}
                placeholder="e.g. requestId"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Expected Correlation Value
              </Label>
              <Input
                value={config.correlationValue || ''}
                onChange={(e) => handleUpdateConfig('correlationValue', e.target.value)}
                placeholder="e.g. {{currentReqId}}"
              />
            </div>
          </div>
        )}

        {/* 5. Validate Payload */}
        {stepType === 'validate_payload' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Assertion Field</Label>
              <Input
                value={config.assertionField || ''}
                onChange={(e) => handleUpdateConfig('assertionField', e.target.value)}
                placeholder="e.g. status or data.code"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Operator</Label>
              <Select
                value={config.operator || 'equals'}
                onValueChange={(val) => handleUpdateConfig('operator', val)}
              >
                <SelectTrigger className="w-full h-8 text-xs font-mono">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals (===)</SelectItem>
                  <SelectItem value="not_equals">Not Equals (!==)</SelectItem>
                  <SelectItem value="contains">Contains substring</SelectItem>
                  <SelectItem value="regex">Matches Regex</SelectItem>
                  <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                  <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                  <SelectItem value="not_null">Not Null / Exists</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Expected Value</Label>
              <Input
                value={config.expectedValue || ''}
                onChange={(e) => handleUpdateConfig('expectedValue', e.target.value)}
                placeholder="e.g. success"
              />
            </div>
          </div>
        )}

        {/* 5b. Validate JSON Schema */}
        {stepType === 'validate_schema' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-zinc-300">Target Variable</Label>
                <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
              </div>
              <Input
                value={config.targetVariable || ''}
                onChange={(e) => handleUpdateConfig('targetVariable', e.target.value)}
                placeholder="Leave blank for last received payload"
              />
              <span className="text-[10px] text-zinc-500 block">
                Target data to validate. If empty, evaluates incoming payload.
              </span>
            </div>

            {/* Quick Schema Preset Selector */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Schema Preset</Label>
              <Select
                onValueChange={(val) => {
                  let presetSchema = '';
                  if (val === 'iot_sensor') {
                    presetSchema = JSON.stringify(
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
                    );
                  } else if (val === 'alert_event') {
                    presetSchema = JSON.stringify(
                      {
                        type: 'object',
                        required: ['alertId', 'severity', 'errorCode'],
                        properties: {
                          alertId: { type: 'string' },
                          severity: { type: 'string', enum: ['INFO', 'WARNING', 'CRITICAL'] },
                          errorCode: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                      null,
                      2
                    );
                  } else if (val === 'heartbeat') {
                    presetSchema = JSON.stringify(
                      {
                        type: 'object',
                        required: ['deviceId', 'status', 'uptime'],
                        properties: {
                          deviceId: { type: 'string' },
                          status: { type: 'string', enum: ['online', 'standby', 'offline'] },
                          uptime: { type: 'number', minimum: 0 },
                          battery: { type: 'number', minimum: 0, maximum: 100 },
                        },
                      },
                      null,
                      2
                    );
                  }
                  if (presetSchema) {
                    handleUpdateConfig('schema', presetSchema);
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Load a template schema..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iot_sensor">IoT Sensor Telemetry (temp, humidity, devId)</SelectItem>
                  <SelectItem value="alert_event">Alert / Alarm Event (severity, errorCode)</SelectItem>
                  <SelectItem value="heartbeat">Device Heartbeat (status, uptime, battery)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Schema JSON Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-zinc-300">JSON Schema Definition</Label>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(config.schema || '{}');
                      handleUpdateConfig('schema', JSON.stringify(parsed, null, 2));
                    } catch (e) {}
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-mono"
                >
                  Prettify
                </button>
              </div>
              <Textarea
                rows={10}
                className="font-mono text-xs text-zinc-200 bg-zinc-950 border-zinc-800 leading-relaxed"
                value={
                  typeof config.schema === 'object'
                    ? JSON.stringify(config.schema, null, 2)
                    : config.schema || ''
                }
                onChange={(e) => handleUpdateConfig('schema', e.target.value)}
                placeholder={'{\n  "type": "object",\n  "required": ["temperature"],\n  "properties": {\n    "temperature": { "type": "number" }\n  }\n}'}
              />
              <span className="text-[10px] text-zinc-500 block leading-tight">
                Supports <span className="text-zinc-300">type, required, properties, minimum, maximum, enum, pattern</span>.
              </span>
            </div>
          </div>
        )}

        {/* 6. Set Variable */}
        {stepType === 'set_variable' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Variable Name</Label>
              <Input
                value={config.varName || ''}
                onChange={(e) => handleUpdateConfig('varName', e.target.value)}
                placeholder="e.g. deviceId or reqId"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Value Expression</Label>
              <Input
                value={config.varValue || ''}
                onChange={(e) => handleUpdateConfig('varValue', e.target.value)}
                placeholder="e.g. {{uuid}} or sensor-01"
              />
            </div>
          </div>
        )}

        {/* 7. Extract Variable */}
        {stepType === 'extract_variable' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">JSONPath Field</Label>
              <Input
                value={config.jsonPath || ''}
                onChange={(e) => handleUpdateConfig('jsonPath', e.target.value)}
                placeholder="e.g. $.data.firmwareVersion"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Target Variable</Label>
              <Input
                value={config.varName || ''}
                onChange={(e) => handleUpdateConfig('varName', e.target.value)}
                placeholder="e.g. currentFirmware"
              />
            </div>
          </div>
        )}

        {/* 8. Condition (IF/ELSE) */}
        {stepType === 'condition' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Boolean Expression (JavaScript)
              </Label>
              <Input
                value={config.expression || ''}
                onChange={(e) => handleUpdateConfig('expression', e.target.value)}
                placeholder="e.g. batteryLevel < 20"
              />
              <span className="text-[10px] text-zinc-500 block">
                Connect the green TRUE port to the true branch and red FALSE port to the alternate branch.
              </span>
            </div>
          </div>
        )}

        {/* 9. Loop */}
        {stepType === 'loop' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Iterations (Count)</Label>
              <Input
                type="number"
                value={config.count ?? 5}
                onChange={(e) => handleUpdateConfig('count', Number(e.target.value))}
                placeholder="5"
              />
            </div>
          </div>
        )}

        {/* 10. Log Message */}
        {stepType === 'log' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Log Message</Label>
              <Input
                value={config.message || ''}
                onChange={(e) => handleUpdateConfig('message', e.target.value)}
                placeholder="e.g. Device response received: {{reqId}}"
              />
            </div>
          </div>
        )}

        {/* 11. Stop Step */}
        {stepType === 'stop' && (
          <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800 text-[11px] text-zinc-400">
            This step cleanly halts execution along this branch. Subsequent connected steps will not execute.
          </div>
        )}

        {/* 12. Fail Step */}
        {stepType === 'fail' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Failure Reason</Label>
              <Input
                value={config.reason || ''}
                onChange={(e) => handleUpdateConfig('reason', e.target.value)}
                placeholder="e.g. Assertion failed or timeout"
              />
            </div>
          </div>
        )}

        {/* 13. Switch Connection Step */}
        {stepType === 'switch_connection' && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">Target Broker Profile</Label>
              <Select
                value={config.connectionId || ''}
                onValueChange={(val) => handleUpdateConfig('connectionId', val)}
              >
                <SelectTrigger className="w-full h-8 text-xs font-sans">
                  <SelectValue placeholder="Select broker..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.protocol.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
