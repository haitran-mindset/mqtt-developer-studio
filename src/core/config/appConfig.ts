import packageJson from '../../../package.json';

export type PlatformTarget =
  | 'macos-arm64'
  | 'macos-intel'
  | 'windows-x64'
  | 'windows-arm64'
  | 'linux-deb'
  | 'linux-appimage';

export const APP_CONFIG = {
  name: 'MQTT Developer Studio',
  /**
   * Single Source of Truth for App Version (reads directly from root package.json)
   */
  version: packageJson.version,
  repo: 'haitran-mindset/mqtt-developer-studio',
  get releasesUrl(): string {
    return `https://github.com/${this.repo}/releases/latest`;
  },
  get downloadBaseUrl(): string {
    return `https://github.com/${this.repo}/releases/latest/download`;
  },
  getDownloadFilename(target: PlatformTarget): string {
    switch (target) {
      case 'macos-arm64':
        return `MQTT.Developer.Studio_${this.version}_aarch64.dmg`;
      case 'macos-intel':
        return `MQTT.Developer.Studio_${this.version}_x64.dmg`;
      case 'windows-x64':
        return `MQTT.Developer.Studio_${this.version}_x64-setup.exe`;
      case 'windows-arm64':
        return `MQTT.Developer.Studio_${this.version}_arm64-setup.exe`;
      case 'linux-deb':
        return `MQTT.Developer.Studio_${this.version}_amd64.deb`;
      case 'linux-appimage':
        return `MQTT.Developer.Studio_${this.version}_amd64.AppImage`;
    }
  },
  getDownloadUrl(target: PlatformTarget): string {
    return `${this.downloadBaseUrl}/${this.getDownloadFilename(target)}`;
  },
};
