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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WelcomeGatewayModalProps {
  isGateway?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onLaunchWeb?: () => void;
}

type SupportedOS = 'macos' | 'windows' | 'linux';

// Authentic Apple Logo SVG
const AppleLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.62-7.85-11.77-14.42-6.42-10.13-11.43-21.78-15.02-34.96-3.59-13.17-5.39-25.7-5.39-37.58 0-14.59 3.59-26.68 10.77-36.27 7.18-9.59 16.32-14.51 27.42-14.75 5.44 0 11.21 1.41 17.31 4.24 6.1 2.83 10.23 4.3 12.39 4.41 1.74 0 6.09-1.58 13.06-4.73 6.96-3.15 13.17-4.53 18.61-4.13 13.93.87 24.81 5.99 32.65 15.35-12.19 7.4-18.17 17.41-17.95 30.03.22 10.01 4.03 18.39 11.43 25.14 7.4 6.75 16.32 10.45 26.77 11.1-2.39 7.62-5.44 15.45-9.14 23.5zM119.22 31.84c0-7.72 2.72-14.91 8.16-21.55 5.44-6.64 12.08-10.29 19.91-10.96.11.98.16 1.85.16 2.61 0 7.5-2.88 14.79-8.65 21.87-5.77 7.07-12.41 10.87-19.91 11.41-.11-.87-.16-1.74-.16-2.61z" />
  </svg>
);

// Authentic Windows Logo SVG
const WindowsLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 88 88" fill="currentColor">
    <path d="M0 12.402l35.689-4.86.016 34.423-35.67.203zm35.67 33.529l.026 34.453-35.67-4.891-.026-29.74zm4.326-39.043l47.995-6.888v41.671l-47.995.27zm48.004 39.936l-.009 41.774-47.995-6.756v-34.82z" />
  </svg>
);

// Authentic Linux Tux SVG
const LinuxLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
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

const GITHUB_RELEASES_URL = 'https://github.com/haitran-mindset/mqtt-developer-studio/releases/latest';
const GITHUB_DOWNLOAD_BASE = 'https://github.com/haitran-mindset/mqtt-developer-studio/releases/latest/download';

export const DIRECT_DOWNLOAD_LINKS = {
  macos: {
    arm64: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_aarch64.dmg`,
    intel: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_x64.dmg`,
  },
  windows: {
    x64: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_x64-setup.exe`,
    arm64: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_arm64-setup.exe`,
  },
  linux: {
    deb: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_amd64.deb`,
    appimage: `${GITHUB_DOWNLOAD_BASE}/MQTT.Developer.Studio_1.0.0_amd64.AppImage`,
  },
};

export const WelcomeGatewayModal: React.FC<WelcomeGatewayModalProps> = ({
  isGateway = false,
  isOpen = true,
  onClose,
  onLaunchWeb,
}) => {
  const userOS = detectUserOS();
  const [selectedOS, setSelectedOS] = useState<SupportedOS>(userOS);

  if (!isOpen && !isGateway) return null;

  // Trigger direct browser download
  const handleDirectDownload = (url: string, filename: string) => {
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

  // Determine default direct download URL for the detected OS
  const defaultDownloadUrl =
    userOS === 'macos'
      ? DIRECT_DOWNLOAD_LINKS.macos.arm64
      : userOS === 'windows'
      ? DIRECT_DOWNLOAD_LINKS.windows.x64
      : DIRECT_DOWNLOAD_LINKS.linux.deb;

  const defaultFilename =
    userOS === 'macos'
      ? 'MQTT.Developer.Studio_1.0.0_aarch64.dmg'
      : userOS === 'windows'
      ? 'MQTT.Developer.Studio_1.0.0_x64-setup.exe'
      : 'MQTT.Developer.Studio_1.0.0_amd64.deb';

  const defaultBtnLabel =
    userOS === 'macos'
      ? 'Download for macOS (Apple Silicon .dmg)'
      : userOS === 'windows'
      ? 'Download for Windows (.exe)'
      : 'Download for Linux (.deb)';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 ${
        isGateway
          ? 'bg-[#06080e]/95 backdrop-blur-xl'
          : 'bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[150px]" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0d121f]/95 p-6 md:p-8 shadow-2xl backdrop-blur-2xl text-slate-100 my-auto">
        
        {/* Close Button for Modal Mode */}
        {!isGateway && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs font-medium mb-3">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Developer-First MQTT & IoT Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            MQTT Developer Studio
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Choose your environment: instant in-browser web studio or high-performance native desktop.
          </p>
        </div>

        {/* 2 Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          
          {/* Card 1: Web Studio */}
          <div className="relative flex flex-col justify-between rounded-xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-900/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <Globe className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 text-[11px]">
                  Zero Install
                </Badge>
              </div>

              <h2 className="text-xl font-bold text-white">Web Studio</h2>
              <p className="mt-1 text-xs text-slate-400">
                Runs instantly in your browser. Perfect for testing brokers and telemetry via WebSocket.
              </p>

              <div className="mt-5 space-y-2.5 border-t border-white/5 pt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>WebSocket support (<code>ws://</code> & <code>wss://</code>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Publisher, Subscriber & Filter inspector</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Workflow automation with Monaco JavaScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Real-time Mini Dashboard & IoT widgets</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Button
                onClick={() => {
                  if (onLaunchWeb) onLaunchWeb();
                  if (onClose) onClose();
                }}
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20"
              >
                <span>Launch Web Studio</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card 2: Desktop Edition */}
          <div className="relative flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-slate-900/80 p-5 sm:p-6 transition-all duration-200 hover:border-emerald-500/50">
            {/* Recommended Tag */}
            <div className="absolute -top-3 right-5">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-emerald-500/30">
                <Zap className="h-3 w-3" />
                Recommended
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Monitor className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[11px]">
                  Native TCP 1883 / 8883
                </Badge>
              </div>

              <h2 className="text-xl font-bold text-white">Desktop App</h2>
              <p className="mt-1 text-xs text-slate-400">
                Powered by Rust & Rumqttc. Direct TCP/TLS socket connections without WebSocket proxies.
              </p>

              {/* OS Selector Tabs */}
              <div className="mt-4 border-t border-white/5 pt-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-medium text-slate-300">Select Platform:</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    {userOS === 'macos' && (
                      <>
                        <AppleLogo className="h-3 w-3" />
                        <span>macOS detected</span>
                      </>
                    )}
                    {userOS === 'windows' && (
                      <>
                        <WindowsLogo className="h-3 w-3" />
                        <span>Windows detected</span>
                      </>
                    )}
                    {userOS === 'linux' && (
                      <>
                        <LinuxLogo className="h-3 w-3" />
                        <span>Linux detected</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                  <button
                    onClick={() => setSelectedOS('macos')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      selectedOS === 'macos'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <AppleLogo className="h-3.5 w-3.5" />
                    <span>macOS</span>
                  </button>
                  <button
                    onClick={() => setSelectedOS('windows')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      selectedOS === 'windows'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <WindowsLogo className="h-3 w-3" />
                    <span>Windows</span>
                  </button>
                  <button
                    onClick={() => setSelectedOS('linux')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      selectedOS === 'linux'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LinuxLogo className="h-3.5 w-3.5" />
                    <span>Linux</span>
                  </button>
                </div>

                {/* Specific OS Direct Download Options */}
                <div className="mt-3 space-y-1.5">
                  {selectedOS === 'macos' && (
                    <>
                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.macos.arm64,
                            'MQTT.Developer.Studio_1.0.0_aarch64.dmg'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/50 hover:border-emerald-500/60 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">Apple Silicon (M1/M2/M3/M4) .dmg</span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                              4.1 MB
                            </Badge>
                          </div>
                        </div>
                        <Download className="h-3.5 w-3.5 text-emerald-400 group-hover/link:translate-y-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.macos.intel,
                            'MQTT.Developer.Studio_1.0.0_x64.dmg'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-cyan-500/40 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="font-medium text-white">Intel Mac (x86_64) .dmg</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-cyan-400 transition-colors" />
                      </button>
                    </>
                  )}

                  {selectedOS === 'windows' && (
                    <>
                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.windows.x64,
                            'MQTT.Developer.Studio_1.0.0_x64-setup.exe'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-blue-500/40 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-blue-400" />
                          <span className="font-medium text-white">Windows 64-bit Installer (.exe)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-blue-400 transition-colors" />
                      </button>

                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.windows.arm64,
                            'MQTT.Developer.Studio_1.0.0_arm64-setup.exe'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-teal-500/40 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-teal-400" />
                          <span className="font-medium text-white">Windows ARM64 Installer</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-teal-400 transition-colors" />
                      </button>
                    </>
                  )}

                  {selectedOS === 'linux' && (
                    <>
                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.linux.deb,
                            'MQTT.Developer.Studio_1.0.0_amd64.deb'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-orange-500/40 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="h-3.5 w-3.5 text-orange-400" />
                          <span className="font-medium text-white">Debian / Ubuntu (.deb)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-orange-400 transition-colors" />
                      </button>

                      <button
                        onClick={() =>
                          handleDirectDownload(
                            DIRECT_DOWNLOAD_LINKS.linux.appimage,
                            'MQTT.Developer.Studio_1.0.0_amd64.AppImage'
                          )
                        }
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800/80 hover:border-purple-500/40 transition-colors text-xs text-slate-200 group/link cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-purple-400" />
                          <span className="font-medium text-white">Universal Linux (.AppImage)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-purple-400 transition-colors" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Native Specs Pill */}
              <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2.5">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Shield className="h-3 w-3" />
                  <span>Native Socket 1883/8883</span>
                </span>
                <span>Custom TLS Certificates</span>
              </div>
            </div>

            {/* Direct 1-Click Download Button */}
            <div className="mt-5 pt-1 space-y-2">
              <Button
                onClick={() => handleDirectDownload(defaultDownloadUrl, defaultFilename)}
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>{defaultBtnLabel}</span>
              </Button>

              <div className="text-center">
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span>Or view all assets on GitHub Releases v1.0.0</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>v1.0.0 • Open-source on GitHub</span>
          </div>
          <a
            href="https://github.com/haitran-mindset/mqtt-developer-studio"
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            GitHub Repository
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
