import React, { useState } from 'react';
import {
  Globe,
  Download,
  Monitor,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  Cpu,
  ExternalLink,
  X,
  Layers,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Radio,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { APP_CONFIG, type PlatformTarget } from '@/core/config/appConfig';

interface WelcomeGatewayModalProps {
  isGateway?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onLaunchWeb?: () => void;
}

type SupportedOS = 'macos' | 'windows' | 'linux';

// Authentic Apple Logo SVG
const AppleLogo: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.62-7.85-11.77-14.42-6.42-10.13-11.43-21.78-15.02-34.96-3.59-13.17-5.39-25.7-5.39-37.58 0-14.59 3.59-26.68 10.77-36.27 7.18-9.59 16.32-14.51 27.42-14.75 5.44 0 11.21 1.41 17.31 4.24 6.1 2.83 10.23 4.3 12.39 4.41 1.74 0 6.09-1.58 13.06-4.73 6.96-3.15 13.17-4.53 18.61-4.13 13.93.87 24.81 5.99 32.65 15.35-12.19 7.4-18.17 17.41-17.95 30.03.22 10.01 4.03 18.39 11.43 25.14 7.4 6.75 16.32 10.45 26.77 11.1-2.39 7.62-5.44 15.45-9.14 23.5zM119.22 31.84c0-7.72 2.72-14.91 8.16-21.55 5.44-6.64 12.08-10.29 19.91-10.96.11.98.16 1.85.16 2.61 0 7.5-2.88 14.79-8.65 21.87-5.77 7.07-12.41 10.87-19.91 11.41-.11-.87-.16-1.74-.16-2.61z" />
  </svg>
);

// Authentic Windows Logo SVG
const WindowsLogo: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg className={className} viewBox="0 0 88 88" fill="currentColor">
    <path d="M0 12.402l35.689-4.86.016 34.423-35.67.203zm35.67 33.529l.026 34.453-35.67-4.891-.026-29.74zm4.326-39.043l47.995-6.888v41.671l-47.995.27zm48.004 39.936l-.009 41.774-47.995-6.756v-34.82z" />
  </svg>
);

// Authentic Linux Tux SVG
const LinuxLogo: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.25.5 2.38 1.33 3.2A6.5 6.5 0 0 0 6 15.5v1.2a2.3 2.3 0 0 0-1.8 2.2c0 1.7 1.8 2.6 3.8 2.1 1.2.6 2.5 1 4 1s2.8-.4 4-1c2 .5 3.8-.4 3.8-2.1 0-1.1-.8-2-1.8-2.2v-1.2a6.5 6.5 0 0 0-2.83-5.8A4.5 4.5 0 0 0 16.5 6.5 4.5 4.5 0 0 0 12 2zm-1.5 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
  </svg>
);

function detectUserOS(): SupportedOS {
  if (typeof window === 'undefined') return 'macos';
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'macos';
}

export const WelcomeGatewayModal: React.FC<WelcomeGatewayModalProps> = ({
  isGateway = false,
  isOpen = true,
  onClose,
  onLaunchWeb,
}) => {
  const userOS = detectUserOS();
  const [selectedOS, setSelectedOS] = useState<SupportedOS>(userOS);
  const [showGatekeeperTip, setShowGatekeeperTip] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen && !isGateway) return null;

  const handleDirectDownload = (target: PlatformTarget) => {
    const url = APP_CONFIG.getDownloadUrl(target);
    const filename = APP_CONFIG.getDownloadFilename(target);
    toast.success(`Starting download: ${filename}`, {
      description: 'Your download should begin automatically in your browser.',
    });
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const defaultTarget: PlatformTarget =
    userOS === 'macos'
      ? 'macos-arm64'
      : userOS === 'windows'
      ? 'windows-x64'
      : 'linux-deb';

  const defaultBtnLabel =
    userOS === 'macos'
      ? 'Download for macOS (Apple Silicon .dmg)'
      : userOS === 'windows'
      ? 'Download for Windows (.exe)'
      : 'Download for Linux (.deb)';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5 ${
        isGateway
          ? 'bg-[#06080e]/95 backdrop-blur-xl'
          : 'bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-[130px]" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0c101a]/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 my-auto">
        
        {/* Close Button for Modal Mode */}
        {!isGateway && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Compact Pro Header */}
        <div className="flex flex-col items-center text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-500/25 bg-cyan-950/40 text-cyan-300 text-[11px] font-medium mb-2.5">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>MQTT Developer Studio</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400 font-mono text-[10px]">v{APP_CONFIG.version}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Choose Your Runtime
          </h1>
          <p className="mt-1 text-xs text-slate-400 leading-normal">
            Run instantly in browser or use the native desktop app for direct TCP 1883/8883.
          </p>
        </div>

        {/* 2 Equal-Height Balanced Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          
          {/* Card 1: Web Studio */}
          <div className="relative flex flex-col justify-between rounded-xl border border-white/[0.08] bg-slate-900/40 p-5 transition-all duration-200 hover:border-cyan-500/30 hover:bg-slate-900/60">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Web Studio</h2>
                    <p className="text-[11px] text-slate-400">Instant in-browser sandbox</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 text-[10px] font-medium">
                  Zero Install
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Runs directly in your browser. Perfect for testing brokers and telemetry streams over WebSocket without installing software.
              </p>

              {/* Capability Grid */}
              <div className="space-y-2 border-t border-white/[0.06] pt-3.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>WebSocket support (<code>ws://</code> & <code>wss://</code>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Publisher, Subscriber & Dynamic templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Monaco JavaScript workflow automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Real-time IoT Mini Dashboard widgets</span>
                </div>
              </div>

              {/* Privacy badge */}
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
                <Lock className="h-3 w-3 text-cyan-500/70 shrink-0" />
                <span>Zero localStorage tracking • In-memory state</span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="mt-5 pt-2">
              <Button
                onClick={() => {
                  if (onLaunchWeb) onLaunchWeb();
                  if (onClose) onClose();
                }}
                className="w-full h-10 text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <span>Launch Web Studio</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Card 2: Desktop Edition */}
          <div className="relative flex flex-col justify-between rounded-xl border border-emerald-500/25 bg-slate-900/60 p-5 transition-all duration-200 hover:border-emerald-500/40">
            {/* Top Recommended Tag */}
            <div className="absolute -top-2.5 right-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-emerald-500/30">
                <Zap className="h-2.5 w-2.5" />
                Recommended
              </span>
            </div>

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Desktop App</h2>
                    <p className="text-[11px] text-slate-400">Native TCP 1883 / 8883</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[10px] font-medium">
                  Rust Tokio
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Direct raw socket connection via Rumqttc. Connects to any local or cloud MQTT broker without requiring WebSocket proxies.
              </p>

              {/* Platform Selector */}
              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-slate-400 font-medium">Platform:</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium text-[10px]">
                    {userOS === 'macos' && (
                      <>
                        <AppleLogo className="h-2.5 w-2.5" />
                        <span>macOS detected</span>
                      </>
                    )}
                    {userOS === 'windows' && (
                      <>
                        <WindowsLogo className="h-2.5 w-2.5" />
                        <span>Windows detected</span>
                      </>
                    )}
                    {userOS === 'linux' && (
                      <>
                        <LinuxLogo className="h-2.5 w-2.5" />
                        <span>Linux detected</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => setSelectedOS('macos')}
                    className={`py-1 px-2 text-[11px] font-medium rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedOS === 'macos'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <AppleLogo className="h-3 w-3" />
                    <span>macOS</span>
                  </button>
                  <button
                    onClick={() => setSelectedOS('windows')}
                    className={`py-1 px-2 text-[11px] font-medium rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedOS === 'windows'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <WindowsLogo className="h-2.5 w-2.5" />
                    <span>Windows</span>
                  </button>
                  <button
                    onClick={() => setSelectedOS('linux')}
                    className={`py-1 px-2 text-[11px] font-medium rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedOS === 'linux'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LinuxLogo className="h-3 w-3" />
                    <span>Linux</span>
                  </button>
                </div>

                {/* Platform Specific Installer Options */}
                <div className="mt-2.5 space-y-1.5">
                  {selectedOS === 'macos' && (
                    <>
                      <button
                        onClick={() => handleDirectDownload('macos-arm64')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-950/20 hover:bg-emerald-950/50 hover:border-emerald-500/50 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-emerald-400" />
                          <span className="font-medium text-white text-[11px]">Apple Silicon (M1/M2/M3/M4) .dmg</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-emerald-400 group-hover/link:translate-y-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => handleDirectDownload('macos-intel')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-slate-800/30 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3 text-cyan-400" />
                          <span className="font-medium text-white text-[11px]">Intel Mac (x86_64) .dmg</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-cyan-400 transition-colors" />
                      </button>
                    </>
                  )}

                  {selectedOS === 'windows' && (
                    <>
                      <button
                        onClick={() => handleDirectDownload('windows-x64')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-slate-800/30 hover:bg-slate-800/60 hover:border-blue-500/30 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3 w-3 text-blue-400" />
                          <span className="font-medium text-white text-[11px]">Windows 64-bit Installer (.exe)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-blue-400 transition-colors" />
                      </button>

                      <button
                        onClick={() => handleDirectDownload('windows-arm64')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-slate-800/30 hover:bg-slate-800/60 hover:border-teal-500/30 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-teal-400" />
                          <span className="font-medium text-white text-[11px]">Windows ARM64 Installer</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-teal-400 transition-colors" />
                      </button>
                    </>
                  )}

                  {selectedOS === 'linux' && (
                    <>
                      <button
                        onClick={() => handleDirectDownload('linux-deb')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-slate-800/30 hover:bg-slate-800/60 hover:border-orange-500/30 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="h-3 w-3 text-orange-400" />
                          <span className="font-medium text-white text-[11px]">Debian / Ubuntu (.deb)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-orange-400 transition-colors" />
                      </button>

                      <button
                        onClick={() => handleDirectDownload('linux-appimage')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-slate-800/30 hover:bg-slate-800/60 hover:border-purple-500/30 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3 text-purple-400" />
                          <span className="font-medium text-white text-[11px]">Universal Linux (.AppImage)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-purple-400 transition-colors" />
                      </button>
                    </>
                  )}
                </div>

                {/* Discrete Collapsible Gatekeeper Helper for macOS */}
                {selectedOS === 'macos' && (
                  <div className="mt-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowGatekeeperTip(!showGatekeeperTip)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer outline-none focus:outline-none"
                    >
                      <span className="underline underline-offset-2">First-time open on macOS?</span>
                      {showGatekeeperTip ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {showGatekeeperTip && (
                      <div className="mt-1.5 p-2 rounded-lg border border-amber-500/25 bg-amber-500/10 text-slate-300 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-amber-400 font-medium">Apple Gatekeeper Fix:</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('xattr -cr "/Applications/MQTT Developer Studio.app"');
                              setCopiedCmd(true);
                              setTimeout(() => setCopiedCmd(false), 2000);
                              toast.success('Fix command copied to clipboard!');
                            }}
                            className="flex items-center gap-1 text-[9px] text-amber-300 hover:text-white bg-amber-500/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {copiedCmd ? <Check className="h-2 w-2" /> : <Copy className="h-2 w-2" />}
                            <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <code className="block p-1 rounded bg-black/60 text-emerald-400 font-mono text-[9px] select-all overflow-x-auto">
                          xattr -cr "/Applications/MQTT Developer Studio.app"
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Download CTA */}
            <div className="mt-5 pt-2">
              <Button
                onClick={() => handleDirectDownload(defaultTarget)}
                className="w-full h-10 text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{defaultBtnLabel}</span>
              </Button>
            </div>
          </div>

        </div>

        {/* Compact Footer */}
        <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>v{APP_CONFIG.version} • Open-source on GitHub</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={APP_CONFIG.releasesUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px]"
            >
              <span>All Releases</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            {isGateway && onLaunchWeb && (
              <button
                onClick={onLaunchWeb}
                className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4 cursor-pointer"
              >
                Skip to Web
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
