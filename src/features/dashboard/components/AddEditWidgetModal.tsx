import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Gauge,
  Activity,
  Lightbulb,
  ToggleLeft,
  Zap,
} from 'lucide-react';
import type { DashboardWidgetConfig, DashboardWidgetType } from '@/core/dashboard/types';

interface AddEditWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetToEdit?: DashboardWidgetConfig | null;
  onSave: (widget: DashboardWidgetConfig) => void;
}

const WIDGET_TYPES: Array<{
  type: DashboardWidgetType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    type: 'line_chart',
    label: 'Line Chart',
    icon: LineChart,
    description: 'Time-series curve for numerical telemetry streams.',
  },
  {
    type: 'gauge',
    label: 'Radial Gauge',
    icon: Gauge,
    description: 'Circular meter with min/max bounds and threshold zones.',
  },
  {
    type: 'stat_card',
    label: 'Metric / Stat Card',
    icon: Activity,
    description: 'High-impact value display with delta percentage trend.',
  },
  {
    type: 'status_led',
    label: 'Status LED',
    icon: Lightbulb,
    description: 'Visual indicator beacon for discrete flags (ON/OFF/FAULT).',
  },
  {
    type: 'switch',
    label: 'Toggle Switch',
    icon: ToggleLeft,
    description: 'Interactive switch to send commands and receive status.',
  },
  {
    type: 'push_button',
    label: 'Push Button',
    icon: Zap,
    description: 'Trigger button to dispatch instant MQTT command payloads.',
  },
];

export const AddEditWidgetModal: React.FC<AddEditWidgetModalProps> = ({
  open,
  onOpenChange,
  widgetToEdit,
  onSave,
}) => {
  const [type, setType] = useState<DashboardWidgetType>('line_chart');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [publishTopic, setPublishTopic] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState<string>('0');
  const [max, setMax] = useState<string>('100');
  const [color, setColor] = useState<string>('cyan');
  const [colSpan, setColSpan] = useState<number>(1);
  const [onPayload, setOnPayload] = useState('{"state":"ON"}');
  const [offPayload, setOffPayload] = useState('{"state":"OFF"}');
  const [buttonPayload, setButtonPayload] = useState('{"action":"trigger"}');
  const [buttonLabel, setButtonLabel] = useState('Trigger');

  useEffect(() => {
    if (widgetToEdit) {
      setType(widgetToEdit.type);
      setTitle(widgetToEdit.title);
      setTopic(widgetToEdit.topic);
      setPublishTopic(widgetToEdit.publishTopic || '');
      setJsonPath(widgetToEdit.jsonPath || '');
      setUnit(widgetToEdit.unit || '');
      setMin(widgetToEdit.min !== undefined ? String(widgetToEdit.min) : '0');
      setMax(widgetToEdit.max !== undefined ? String(widgetToEdit.max) : '100');
      setColor(widgetToEdit.color || 'cyan');
      setColSpan(widgetToEdit.colSpan || 1);
      setOnPayload(widgetToEdit.onPayload || '{"state":"ON"}');
      setOffPayload(widgetToEdit.offPayload || '{"state":"OFF"}');
      setButtonPayload(widgetToEdit.buttonPayload || '{"action":"trigger"}');
      setButtonLabel(widgetToEdit.buttonLabel || 'Trigger');
    } else {
      setType('line_chart');
      setTitle('Sensor Telemetry');
      setTopic('sensor/telemetry');
      setPublishTopic('');
      setJsonPath('$.value');
      setUnit('');
      setMin('0');
      setMax('100');
      setColor('cyan');
      setColSpan(2);
      setOnPayload('{"state":"ON"}');
      setOffPayload('{"state":"OFF"}');
      setButtonPayload('{"action":"trigger"}');
      setButtonLabel('Trigger');
    }
  }, [widgetToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) return;

    const widget: DashboardWidgetConfig = {
      id: widgetToEdit ? widgetToEdit.id : `w-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      type,
      title: title.trim(),
      topic: topic.trim(),
      publishTopic: publishTopic.trim() || undefined,
      jsonPath: jsonPath.trim() || undefined,
      unit: unit.trim() || undefined,
      min: min !== '' ? parseFloat(min) : undefined,
      max: max !== '' ? parseFloat(max) : undefined,
      color,
      colSpan: colSpan as 1 | 2 | 3 | 4,
      onPayload: type === 'switch' ? onPayload : undefined,
      offPayload: type === 'switch' ? offPayload : undefined,
      buttonPayload: type === 'push_button' ? buttonPayload : undefined,
      buttonLabel: type === 'push_button' ? buttonLabel : undefined,
      chartMaxPoints: type === 'line_chart' ? 30 : undefined,
      statusMappings: widgetToEdit?.statusMappings,
    };

    onSave(widget);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-zinc-100">
            {widgetToEdit ? 'Edit Dashboard Widget' : 'Add Telemetry Widget'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Widget Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Widget Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WIDGET_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => {
                      setType(item.type);
                      if (item.type === 'line_chart') setColSpan(2);
                      else setColSpan(1);
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300 ring-1 ring-cyan-500/50'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-tight">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Topic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Widget Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Engine Temperature"
                required
                className="bg-zinc-900 border-zinc-800 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Subscribe Topic Filter</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. factory/line1/temp"
                required
                className="bg-zinc-900 border-zinc-800 font-mono text-sm"
              />
            </div>
          </div>

          {/* JSON Path & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                JSON Path <span className="text-zinc-500 font-normal">(Optional, e.g. $.value)</span>
              </Label>
              <Input
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                placeholder="Leave blank for raw numeric payload"
                className="bg-zinc-900 border-zinc-800 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Unit of Measurement</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. °C, %, bar, RPM, kW"
                className="bg-zinc-900 border-zinc-800 font-mono text-sm"
              />
            </div>
          </div>

          {/* Min / Max bounds (for chart & gauge) */}
          {(type === 'line_chart' || type === 'gauge') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Min Bound</Label>
                <Input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Max Bound</Label>
                <Input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Switch Specific settings */}
          {type === 'switch' && (
            <div className="space-y-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Publish Topic (Command)</Label>
                <Input
                  value={publishTopic}
                  onChange={(e) => setPublishTopic(e.target.value)}
                  placeholder="e.g. home/light/set"
                  className="bg-zinc-900 border-zinc-800 font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">ON Payload</Label>
                  <Input
                    value={onPayload}
                    onChange={(e) => setOnPayload(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">OFF Payload</Label>
                  <Input
                    value={offPayload}
                    onChange={(e) => setOffPayload(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Push Button Specific settings */}
          {type === 'push_button' && (
            <div className="space-y-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Publish Target Topic</Label>
                <Input
                  value={publishTopic}
                  onChange={(e) => setPublishTopic(e.target.value)}
                  placeholder="e.g. device/command/reboot"
                  className="bg-zinc-900 border-zinc-800 font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Button Display Label</Label>
                  <Input
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    placeholder="e.g. Reboot Device"
                    className="bg-zinc-900 border-zinc-800 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Command Payload</Label>
                  <Input
                    value={buttonPayload}
                    onChange={(e) => setButtonPayload(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Color & Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Accent Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="cyan">Cyan Glow</SelectItem>
                  <SelectItem value="emerald">Emerald Green</SelectItem>
                  <SelectItem value="violet">Electric Violet</SelectItem>
                  <SelectItem value="amber">Warm Amber</SelectItem>
                  <SelectItem value="rose">Neon Rose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Grid Width (Column Span)</Label>
              <Select
                value={String(colSpan)}
                onValueChange={(val) => setColSpan(parseInt(val, 10))}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="1">1 Column (Compact)</SelectItem>
                  <SelectItem value="2">2 Columns (Standard / Wide)</SelectItem>
                  <SelectItem value="3">3 Columns (Extra Wide)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
            >
              {widgetToEdit ? 'Save Changes' : 'Create Widget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
