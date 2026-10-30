import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, HelpCircle, ChevronDown, Info, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTauriApp } from "@/core/mqtt/platform";
import type {
  ConnectionProfile,
  Protocol,
  MQTTVersion,
  QoS,
} from "@/core/db/types";
import { useDataStore } from "@/core/store/dataStore";
import { toast } from "sonner";

const connectionSchema = z.object({
  name: z.string().min(1, "Connection name is required"),
  protocol: z.enum(["mqtt", "mqtts", "ws", "wss"]),
  host: z.string().min(1, "Host is required"),
  port: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return 443;
    const num = Number(val);
    return isNaN(num) ? 443 : num;
  }, z.number().min(1).max(65535)),
  path: z.string().optional().default("/mqtt"),
  clientId: z.string().min(1, "Client ID is required"),
  username: z.string().optional(),
  password: z.string().optional(),
  mqttVersion: z.enum(["3.1.1", "5.0"]),
  clean: z.boolean(),
  ssl: z.boolean().default(true),
  sslSecure: z.boolean().default(true),
  keepalive: z.coerce.number().min(0).max(3600),
  connectTimeout: z.coerce.number().min(1000).max(60000),
  reconnectPeriod: z.coerce.number().min(0).max(60000),
  autoReconnect: z.boolean().default(true),
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
      name: "My MQTT Broker",
      protocol: "wss",
      host: "broker.emqx.io",
      port: 443,
      path: "/mqtt",
      clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
      username: "",
      password: "",
      mqttVersion: "5.0",
      clean: true,
      ssl: true,
      sslSecure: true,
      keepalive: 60,
      connectTimeout: 10000,
      reconnectPeriod: 4000,
      autoReconnect: true,
      sessionExpiryInterval: 3600,
      lwtEnabled: false,
      lwtTopic: "",
      lwtPayload: "",
      lwtQos: 0,
      lwtRetain: false,
    },
  });

  const protocol = watch("protocol");
  const ssl = watch("ssl");
  const sslSecure = watch("sslSecure");
  const autoReconnect = watch("autoReconnect");
  const lwtEnabled = watch("lwtEnabled");
  const mqttVersion = watch("mqttVersion");

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        protocol: profile.protocol,
        ssl: profile.ssl ?? (profile.protocol === "wss" || profile.protocol === "mqtts"),
        sslSecure: profile.sslSecure ?? true,
        host: profile.host,
        port: profile.port,
        path: profile.path,
        clientId: profile.clientId,
        username: profile.username || "",
        password: profile.password || "",
        mqttVersion: profile.mqttVersion,
        clean: profile.clean,
        keepalive: profile.keepalive,
        connectTimeout: profile.connectTimeout,
        reconnectPeriod: profile.reconnectPeriod,
        autoReconnect: profile.autoReconnect ?? (profile.reconnectPeriod !== 0),
        sessionExpiryInterval: profile.sessionExpiryInterval,
        lwtEnabled: !!profile.lwt?.enabled,
        lwtTopic: profile.lwt?.topic || "",
        lwtPayload: profile.lwt?.payload || "",
        lwtQos: profile.lwt?.qos || 0,
        lwtRetain: !!profile.lwt?.retain,
      });
    } else {
      reset({
        name: "",
        protocol: "wss",
        ssl: true,
        sslSecure: true,
        host: "",
        port: 443,
        path: "/mqtt",
        clientId: `mqtt_studio_${Math.random().toString(16).substring(2, 8)}`,
        username: "",
        password: "",
        mqttVersion: "5.0",
        clean: true,
        keepalive: 60,
        connectTimeout: 10000,
        reconnectPeriod: 4000,
        autoReconnect: true,
        sessionExpiryInterval: 3600,
        lwtEnabled: false,
        lwtTopic: "",
        lwtPayload: "",
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
        ssl: values.ssl,
        sslSecure: values.sslSecure,
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
        reconnectPeriod: values.autoReconnect ? values.reconnectPeriod : 0,
        autoReconnect: values.autoReconnect,
        sessionExpiryInterval: values.sessionExpiryInterval,
        lwt: values.lwtEnabled
          ? {
              enabled: true,
              topic: values.lwtTopic || "device/status",
              payload: values.lwtPayload || "offline",
              qos: (values.lwtQos as QoS) || 0,
              retain: !!values.lwtRetain,
            }
          : undefined,
        createdAt: profile?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (profile) {
        useDataStore.getState().updateConnectionProfile(profileData);
        toast.success("Connection profile updated");
      } else {
        useDataStore.getState().addConnectionProfile(profileData);
        toast.success("Connection profile created");
      }
      if (onSaved) onSaved(profileData);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Error saving profile: ${err.message}`);
    }
  };

  const handleToggleSsl = (checked: boolean) => {
    setValue("ssl", checked);
    if (checked) {
      if (protocol === "ws") {
        setValue("protocol", "wss");
        setValue("port", 443);
      } else if (protocol === "mqtt") {
        setValue("protocol", "mqtts");
        setValue("port", 8883);
      }
    } else {
      if (protocol === "wss") {
        setValue("protocol", "ws");
        setValue("port", 80);
      } else if (protocol === "mqtts") {
        setValue("protocol", "mqtt");
        setValue("port", 1883);
      }
    }
  };

  const [isRandomizing, setIsRandomizing] = useState(false);

  const handleRandomClientId = () => {
    setIsRandomizing(true);
    const randId = `mqtt_studio_${Math.random().toString(16).substring(2, 10)}`;
    setValue("clientId", randId, { shouldValidate: true });
    toast.success("Generated random Client ID");
    setTimeout(() => setIsRandomizing(false), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <span>
              {profile
                ? "Edit Connection Profile"
                : "New MQTT Broker Connection"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Configure broker connection parameters across mqtt://, mqtts://,
            ws://, or wss:// endpoints.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 text-xs font-sans mt-2"
        >
          {/* Section: General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Profile Name
              </Label>
              <Input {...register("name")} placeholder="e.g. EMQX Production" />
              {errors.name && (
                <span className="text-rose-400 text-[10px]">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Client ID
              </Label>
              <div className="relative flex items-center">
                <Input
                  {...register("clientId")}
                  placeholder="client id"
                  className="pr-8"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleRandomClientId}
                        className="absolute right-1.5 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer group"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 transition-transform duration-500 ${
                            isRandomizing ? "animate-spin text-cyan-400" : "group-hover:rotate-45"
                          }`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Generate random Client ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {errors.clientId && (
                <span className="text-rose-400 text-[10px]">
                  {errors.clientId.message}
                </span>
              )}
            </div>
          </div>

          {/* Section: Host, Protocol & Port */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Protocol
              </Label>
              <Select
                value={protocol}
                onValueChange={(val) => {
                  const p = val as Protocol;
                  setValue("protocol", p);
                  const isSsl = p === "wss" || p === "mqtts";
                  setValue("ssl", isSsl);
                  if (p === "mqtt") {
                    setValue("port", 1883);
                    setValue("path", "");
                  } else if (p === "mqtts") {
                    setValue("port", 8883);
                    setValue("path", "");
                  } else if (p === "ws") {
                    setValue("port", 443);
                    setValue("path", "/mqtt");
                  } else if (p === "wss") {
                    setValue("port", 443);
                    setValue("path", "/mqtt");
                  }
                }}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mqtt">mqtt:// (TCP)</SelectItem>
                  <SelectItem value="mqtts">mqtts:// (TLS)</SelectItem>
                  <SelectItem value="ws">ws:// (WS)</SelectItem>
                  <SelectItem value="wss">wss:// (WSS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-12 sm:col-span-5 space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Broker Hostname
              </Label>
              <Input {...register("host")} placeholder="broker.emqx.io" />
              {errors.host && (
                <span className="text-rose-400 text-[10px]">
                  {errors.host.message}
                </span>
              )}
            </div>

            <div className="col-span-6 sm:col-span-2 space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Port
              </Label>
              <Input type="number" {...register("port")} placeholder="443" />
              <div className="flex items-center flex-wrap gap-1 pt-0.5">
                {(protocol === "wss" || protocol === "ws") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setValue("port", 443)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-cyan-950 hover:text-cyan-400 font-mono text-zinc-400 border border-zinc-700/60 transition-colors"
                      title="Port 443 (Standard SSL/HTTPS WebSocket)"
                    >
                      443
                    </button>
                    {protocol === "wss" && (
                      <button
                        type="button"
                        onClick={() => setValue("port", 8084)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-zinc-400 border border-zinc-700/60 transition-colors"
                        title="Port 8084 (EMQX WSS)"
                      >
                        8084
                      </button>
                    )}
                    {protocol === "ws" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setValue("port", 80)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-zinc-400 border border-zinc-700/60 transition-colors"
                          title="Port 80 (Standard HTTP WebSocket)"
                        >
                          80
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("port", 8083)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-zinc-400 border border-zinc-700/60 transition-colors"
                          title="Port 8083 (EMQX WS)"
                        >
                          8083
                        </button>
                      </>
                    )}
                  </>
                )}
                {protocol === "mqtt" && (
                  <button
                    type="button"
                    onClick={() => setValue("port", 1883)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-zinc-400 border border-zinc-700/60"
                  >
                    1883
                  </button>
                )}
                {protocol === "mqtts" && (
                  <button
                    type="button"
                    onClick={() => setValue("port", 8883)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-zinc-400 border border-zinc-700/60"
                  >
                    8883
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-6 sm:col-span-2 space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Path
              </Label>
              <Input
                {...register("path")}
                placeholder={
                  protocol === "ws" || protocol === "wss" ? "/mqtt" : ""
                }
              />
            </div>

            {(protocol === "mqtt" || protocol === "mqtts") && (
              isTauriApp() ? (
                <div className="col-span-12 flex items-center gap-2.5 text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-800/60 rounded-md p-2.5">
                  <Laptop className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="leading-relaxed">
                    <strong className="text-emerald-200">Native Desktop TCP Active:</strong> Connecting directly via native OS raw TCP socket (
                    <span className="font-mono">{protocol}://</span>) with Rust rumqttc engine.
                  </span>
                </div>
              ) : (
                <div className="col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-md p-2.5">
                  <div className="leading-relaxed">
                    <strong className="text-amber-200">Browser Notice:</strong>{" "}
                    Web browsers cannot connect to raw TCP socket (
                    <span className="font-mono">{protocol}://</span>). For secure
                    encrypted connections in the browser, please use{" "}
                    <strong className="text-cyan-400 font-mono">wss://</strong>{" "}
                    (usually port 443 or 8084, path /mqtt), or run the <strong>Desktop App</strong>.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setValue("protocol", "wss");
                      setValue("ssl", true);
                      setValue("port", 443);
                      setValue("path", "/mqtt");
                    }}
                    className="h-7 text-[10px] border-cyan-500/50 hover:bg-cyan-950/50 text-cyan-300 shrink-0 shadow-sm self-start sm:self-auto"
                  >
                    Switch to wss://
                  </Button>
                </div>
              )
            )}
          </div>

          {/* Section: Authentication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Username (Optional)
              </Label>
              <Input
                {...register("username")}
                placeholder="Optional username"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-zinc-300">
                Password (Optional)
              </Label>
              <Input
                type="password"
                {...register("password")}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Section: SSL/TLS & SSL Secure */}
          <div className="pt-2 border-t border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-200">
                  SSL/TLS
                </span>
                <p className="text-[10px] text-zinc-500">
                  Enable secure encrypted connection (wss:// or mqtts://)
                </p>
              </div>
              <Switch
                id="ssl-tls"
                checked={!!ssl}
                onCheckedChange={handleToggleSsl}
              />
            </div>

            {ssl && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-200">
                    SSL Secure
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Verify server certificate chain and host name
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="ssl-secure"
                    checked={!!sslSecure}
                    onCheckedChange={(val) => setValue("sslSecure", val)}
                  />
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-zinc-400 hover:text-cyan-400 cursor-help inline-flex items-center p-0.5 rounded focus:outline-none transition-colors"
                          title="Certificate verification info"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-xs font-sans">
                        Whether a client verifies the server&apos;s certificate chain and host name
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>

          {/* Section: Advanced (Collapsible) */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>Advanced</span>
                <span className="text-[10px] text-zinc-500 font-normal">
                  (MQTT Version, Keep Alive, Timeout, LWT...)
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200",
                  showAdvanced ? "rotate-180 text-cyan-400" : ""
                )}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2">
                {/* Protocol Details Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-zinc-300">
                      MQTT Version
                    </Label>
                    <Select
                      value={mqttVersion}
                      onValueChange={(val) =>
                        setValue("mqttVersion", val as MQTTVersion)
                      }
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5.0">MQTT 5.0</SelectItem>
                        <SelectItem value="3.1.1">MQTT 3.1.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-zinc-300">
                      Keep Alive (s)
                    </Label>
                    <Input type="number" {...register("keepalive")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-zinc-300">
                      Timeout (ms)
                    </Label>
                    <Input type="number" {...register("connectTimeout")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-zinc-300">
                      Reconnect (ms)
                    </Label>
                    <Input
                      type="number"
                      disabled={!autoReconnect}
                      {...register("reconnectPeriod")}
                      className={!autoReconnect ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </div>
                </div>

                {/* Auto Reconnect switch */}
                <div className="flex items-center justify-between py-1 border-t border-zinc-800">
                  <div>
                    <span className="text-xs font-medium text-zinc-200">
                      Auto Reconnect
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      Automatically reconnect to the broker if connection drops
                    </p>
                  </div>
                  <Switch
                    checked={!!autoReconnect}
                    onCheckedChange={(checked) => {
                      setValue("autoReconnect", checked);
                      if (checked && watch("reconnectPeriod") === 0) {
                        setValue("reconnectPeriod", 4000);
                      }
                    }}
                  />
                </div>

                {/* Clean session switch */}
                <div className="flex items-center justify-between py-1 border-t border-zinc-800">
                  <div>
                    <span className="text-xs font-medium text-zinc-200">
                      {mqttVersion === "5.0" ? "Clean Start" : "Clean Session"}
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      Discard previous session state on connecting
                    </p>
                  </div>
                  <Switch
                    checked={watch("clean")}
                    onCheckedChange={(checked) => setValue("clean", checked)}
                  />
                </div>

                {/* Section: Last Will and Testament (LWT) */}
                <div className="pt-1 border-t border-zinc-800 space-y-2">
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
                      onCheckedChange={(checked) => setValue("lwtEnabled", checked)}
                    />
                  </div>

                  {lwtEnabled && (
                    <div className="grid grid-cols-12 gap-3 p-3 bg-zinc-900/60 rounded-md border border-zinc-800">
                      <div className="col-span-6 space-y-1.5">
                        <Label className="text-[10px] font-mono text-zinc-400">
                          LWT Topic
                        </Label>
                        <Input
                          {...register("lwtTopic")}
                          placeholder="device/status"
                        />
                      </div>

                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-[10px] font-mono text-zinc-400">
                          LWT QoS
                        </Label>
                        <Select
                          value={String(watch("lwtQos") ?? 0)}
                          onValueChange={(val) =>
                            setValue("lwtQos", Number(val) as QoS)
                          }
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="QoS" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 - At most once</SelectItem>
                            <SelectItem value="1">1 - At least once</SelectItem>
                            <SelectItem value="2">2 - Exactly once</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3 flex items-center gap-2 pt-6">
                        <Switch
                          checked={watch("lwtRetain")}
                          onCheckedChange={(val) => setValue("lwtRetain", val)}
                        />
                        <Label className="text-[11px] text-zinc-300 cursor-pointer">
                          Retain
                        </Label>
                      </div>

                      <div className="col-span-12 space-y-1.5">
                        <Label className="text-[10px] font-mono text-zinc-400">
                          LWT Payload
                        </Label>
                        <Input
                          {...register("lwtPayload")}
                          placeholder='{"status": "offline"}'
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex flex-row items-center justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-semibold flex-1 sm:flex-initial cursor-pointer"
            >
              {profile ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
