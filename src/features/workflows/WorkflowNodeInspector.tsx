import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { WorkflowStepType } from '@/core/workflow/types';
import { X, Sparkles, Trash2 } from 'lucide-react';

interface WorkflowNodeInspectorProps {
  selectedNode: any;
  onUpdateNodeData: (nodeId: string, newData: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const WorkflowNodeInspector: React.FC<WorkflowNodeInspectorProps> = ({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
}) => {
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
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-300">Step Label</label>
          <Input
            value={data.label || ''}
            onChange={(e) => handleUpdateLabel(e.target.value)}
            placeholder="Step Name"
          />
        </div>

        {/* 1. Publish Step */}
        {stepType === 'publish' && (
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Target Topic</label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. eonic/{{deviceId}}/command"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">QoS</label>
                <select
                  value={config.qos ?? 0}
                  onChange={(e) => handleUpdateConfig('qos', Number(e.target.value))}
                  className="w-full h-8 rounded bg-zinc-900 border border-zinc-750 px-2 font-mono text-xs text-zinc-200"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={!!config.retain}
                  onCheckedChange={(val) => handleUpdateConfig('retain', val)}
                />
                <span className="text-zinc-300">Retain</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Payload</label>
              <textarea
                value={config.payload || ''}
                onChange={(e) => handleUpdateConfig('payload', e.target.value)}
                rows={5}
                placeholder='{"cmd": "restart", "reqId": "{{uuid}}"}'
                className="w-full rounded bg-zinc-900 border border-zinc-750 p-2 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* 2. Subscribe Step */}
        {stepType === 'subscribe' && (
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Subscription Topic</label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. eonic/+/response"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">QoS</label>
              <select
                value={config.qos ?? 0}
                onChange={(e) => handleUpdateConfig('qos', Number(e.target.value))}
                className="w-full h-8 rounded bg-zinc-900 border border-zinc-750 px-2 font-mono text-xs text-zinc-200"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. Delay Step */}
        {stepType === 'delay' && (
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Duration (ms)</label>
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
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Listen Topic</label>
              <Input
                value={config.topic || ''}
                onChange={(e) => handleUpdateConfig('topic', e.target.value)}
                placeholder="e.g. eonic/{{deviceId}}/response"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Timeout (ms)</label>
              <Input
                type="number"
                value={config.timeoutMs ?? 5000}
                onChange={(e) => handleUpdateConfig('timeoutMs', Number(e.target.value))}
                placeholder="5000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Correlation Field (Optional)
              </label>
              <Input
                value={config.correlationField || ''}
                onChange={(e) => handleUpdateConfig('correlationField', e.target.value)}
                placeholder="e.g. requestId"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Expected Correlation Value
              </label>
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
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Assertion Field</label>
              <Input
                value={config.assertionField || ''}
                onChange={(e) => handleUpdateConfig('assertionField', e.target.value)}
                placeholder="e.g. status or data.code"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Operator</label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleUpdateConfig('operator', e.target.value)}
                className="w-full h-8 rounded bg-zinc-900 border border-zinc-750 px-2 font-mono text-xs text-zinc-200"
              >
                <option value="equals">Equals (===)</option>
                <option value="not_equals">Not Equals (!==)</option>
                <option value="contains">Contains substring</option>
                <option value="regex">Matches Regex</option>
                <option value="gt">Greater Than (&gt;)</option>
                <option value="lt">Less Than (&lt;)</option>
                <option value="not_null">Not Null / Exists</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Expected Value</label>
              <Input
                value={config.expectedValue || ''}
                onChange={(e) => handleUpdateConfig('expectedValue', e.target.value)}
                placeholder="e.g. success"
              />
            </div>
          </div>
        )}

        {/* 6. Set Variable */}
        {stepType === 'set_variable' && (
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Variable Name</label>
              <Input
                value={config.varName || ''}
                onChange={(e) => handleUpdateConfig('varName', e.target.value)}
                placeholder="e.g. deviceId or reqId"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Value Expression</label>
              <Input
                value={config.varValue || ''}
                onChange={(e) => handleUpdateConfig('varValue', e.target.value)}
                placeholder="e.g. {{uuid}} or 126BA0"
              />
            </div>
          </div>
        )}

        {/* 7. Extract Variable */}
        {stepType === 'extract_variable' && (
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">JSONPath Field</label>
              <Input
                value={config.jsonPath || ''}
                onChange={(e) => handleUpdateConfig('jsonPath', e.target.value)}
                placeholder="e.g. $.data.firmwareVersion"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Target Variable</label>
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
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">
                Boolean Expression (JavaScript)
              </label>
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
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Iterations (Count)</label>
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
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Log Message</label>
              <Input
                value={config.message || ''}
                onChange={(e) => handleUpdateConfig('message', e.target.value)}
                placeholder="e.g. Device response received: {{reqId}}"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
