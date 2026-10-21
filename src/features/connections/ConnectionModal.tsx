import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ConnectionProfile, Protocol, MQTTVersion, QoS } from '@/core/db/types';
import { useDataStore } from '@/core/store/dataStore';
import { toast } from 'sonner';

const connectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  protocol: z.enum(['ws', 'wss']),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535),
  path: z.string().min(1, 'Path is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  mqttVersion: z.enum(['3.1.1', '5.0']),
  clean: z.boolean(),
  keepalive: z.coerce.number().min(0).max(3600),
  connectTimeout: z.coerce.number().min(1000).max(60000),
  reconnectPeriod: z.coerce.number().min(0).max(60000),
  sessionExpiryInterval: z.coerce.number().optional(),
  // LWT
  lwtEnabled: z.boolean(),
  lwtTopic: z.string().optional(),
  lwtPayload: z.string().optional(),
  lwtQos: z.coerce.number().min(0).max(2).optional(),
  lwtRetain: z.boolean().optional(),
});

type FormValues = z.infer<typeof connectionSchema>;

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: ConnectionProfile | null;
  onSaved?: (profile: ConnectionProfile) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  open,
  onOpenChange,
  profile,
  onSaved,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: 'My MQTT Broker',
      protocol: 'wss',
      host: 'broker.emqx.io',
      port: 8084,
      path: '/mqtt',
      clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
      username: '',
      password: '',
      mqttVersion: '5.0',
      clean: true,
      keepalive: 60,
      connectTimeout: 10000,
      reconnectPeriod: 4000,
      sessionExpiryInterval: 3600,
      lwtEnabled: false,
      lwtTopic: '',
      lwtPayload: '',
      lwtQos: 0,
      lwtRetain: false,
    },
  });

  const protocol = watch('protocol');
  const lwtEnabled = watch('lwtEnabled');
  const mqttVersion = watch('mqttVersion');

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        protocol: profile.protocol,
        host: profile.host,
        port: profile.port,
        path: profile.path,
        clientId: profile.clientId,
        username: profile.username || '',
        password: profile.password || '',
        mqttVersion: profile.mqttVersion,
        clean: profile.clean,
        keepalive: profile.keepalive,
        connectTimeout: profile.connectTimeout,
        reconnectPeriod: profile.reconnectPeriod,
        sessionExpiryInterval: profile.sessionExpiryInterval,
        lwtEnabled: !!profile.lwt?.enabled,
        lwtTopic: profile.lwt?.topic || '',
        lwtPayload: profile.lwt?.payload || '',
        lwtQos: profile.lwt?.qos || 0,
        lwtRetain: !!profile.lwt?.retain,
      });
    } else {
      reset({
        name: 'New Broker Connection',
        protocol: 'wss',
        host: 'broker.emqx.io',
        port: 8084,
        path: '/mqtt',
        clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
        username: '',
        password: '',
        mqttVersion: '5.0',
        clean: true,
        keepalive: 60,
        connectTimeout: 10000,
        reconnectPeriod: 4000,
        sessionExpiryInterval: 3600,
        lwtEnabled: false,
        lwtTopic: '',
        lwtPayload: '',
        lwtQos: 0,
        lwtRetain: false,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const profileData: ConnectionProfile = {
        id: profile?.id || `broker-${Date.now()}`,
        name: values.name,
        protocol: values.protocol,
        host: values.host,
        port: values.port,
        path: values.path,
        clientId: values.clientId,
        username: values.username || undefined,
        password: values.password || undefined,
        mqttVersion: values.mqttVersion,
        clean: values.clean,
        keepalive: values.keepalive,
        connectTimeout: values.connectTimeout,
        reconnectPeriod: values.reconnectPeriod,
        sessionExpiryInterval: values.sessionExpiryInterval,
        lwt: values.lwtEnabled
          ? {
              enabled: true,
              topic: values.lwtTopic || 'device/status',
              payload: values.lwtPayload || 'offline',
              qos: (values.lwtQos as QoS) || 0,
              retain: !!values.lwtRetain,
            }
          : undefined,
        createdAt: profile?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (profile) {
        useDataStore.getState().updateConnectionProfile(profileData);
        toast.success('Connection profile updated');
      } else {
        useDataStore.getState().addConnectionProfile(profileData);
        toast.success('Connection profile created');
      }
      if (onSaved) onSaved(profileData);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Error saving profile: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <span>{profile ? 'Edit Connection Profile' : 'New MQTT Broker Connection'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Configure WebSocket connection parameters. WebSocket endpoints (WS/WSS) are required in browser environments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-sans mt-2">
          {/* Section: General */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Profile Name</label>
              <Input {...register('name')} placeholder="e.g. EMQX Production" />
              {errors.name && <span className="text-rose-400 text-[10px]">{errors.name.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Client ID</label>
              <Input {...register('clientId')} placeholder="client id" />
              {errors.clientId && <span className="text-rose-400 text-[10px]">{errors.clientId.message}</span>}
            </div>
          </div>

          {/* Section: Host, Protocol & Port */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Protocol</label>
              <select
                {...register('protocol')}
                onChange={(e) => {
                  const p = e.target.value as Protocol;
                  setValue('protocol', p);
                  if (p === 'wss' && watch('port') === 8083) setValue('port', 8084);
                  if (p === 'ws' && watch('port') === 8084) setValue('port', 8083);
                }}
                className="w-full h-8 rounded-md border border-zinc-750 bg-zinc-900 px-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="wss">WSS (Secure)</option>
                <option value="ws">WS (Plain)</option>
              </select>
            </div>

            <div className="col-span-5 space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Broker Hostname</label>
              <Input {...register('host')} placeholder="broker.emqx.io" />
              {errors.host && <span className="text-rose-400 text-[10px]">{errors.host.message}</span>}
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Port</label>
              <Input type="number" {...register('port')} placeholder="8084" />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Path</label>
              <Input {...register('path')} placeholder="/mqtt" />
            </div>
          </div>

          {/* Section: Authentication */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Username (Optional)</label>
              <Input {...register('username')} placeholder="Optional username" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Password (Optional)</label>
              <Input type="password" {...register('password')} placeholder="••••••••" />
            </div>
          </div>

          {/* Section: Protocol Details */}
          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-zinc-850">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">MQTT Version</label>
              <select
                {...register('mqttVersion')}
                className="w-full h-8 rounded-md border border-zinc-750 bg-zinc-900 px-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="5.0">MQTT 5.0</option>
                <option value="3.1.1">MQTT 3.1.1</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Keep Alive (s)</label>
              <Input type="number" {...register('keepalive')} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Timeout (ms)</label>
              <Input type="number" {...register('connectTimeout')} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Reconnect (ms)</label>
              <Input type="number" {...register('reconnectPeriod')} />
            </div>
          </div>

          {/* Clean session switch */}
          <div className="flex items-center justify-between py-1 border-t border-zinc-850">
            <div>
              <span className="text-xs font-medium text-zinc-200">
                {mqttVersion === '5.0' ? 'Clean Start' : 'Clean Session'}
              </span>
              <p className="text-[10px] text-zinc-500">
                Discard previous session state on connecting
              </p>
            </div>
            <Switch
              checked={watch('clean')}
              onCheckedChange={(checked) => setValue('clean', checked)}
            />
          </div>

          {/* Section: Last Will and Testament (LWT) */}
          <div className="pt-2 border-t border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-200">
                  Last Will & Testament (LWT)
                </span>
                <p className="text-[10px] text-zinc-500">
                  Broker publishes this message if client disconnects ungracefully
                </p>
              </div>
              <Switch
                checked={lwtEnabled}
                onCheckedChange={(checked) => setValue('lwtEnabled', checked)}
              />
            </div>

            {lwtEnabled && (
              <div className="grid grid-cols-12 gap-3 p-3 bg-zinc-900/60 rounded-md border border-zinc-800">
                <div className="col-span-6 space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400">LWT Topic</label>
                  <Input {...register('lwtTopic')} placeholder="device/status" />
                </div>

                <div className="col-span-3 space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400">LWT QoS</label>
                  <select
                    {...register('lwtQos')}
                    className="w-full h-8 rounded-md border border-zinc-750 bg-zinc-900 px-2 text-xs font-mono text-zinc-200"
                  >
                    <option value="0">0 - At most once</option>
                    <option value="1">1 - At least once</option>
                    <option value="2">2 - Exactly once</option>
                  </select>
                </div>

                <div className="col-span-3 flex items-center gap-2 pt-5">
                  <Switch
                    checked={watch('lwtRetain')}
                    onCheckedChange={(val) => setValue('lwtRetain', val)}
                  />
                  <span className="text-[11px] text-zinc-300">Retain</span>
                </div>

                <div className="col-span-12 space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400">LWT Payload</label>
                  <Input {...register('lwtPayload')} placeholder='{"status": "offline"}' />
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-850">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-semibold">
              {profile ? 'Save Changes' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
