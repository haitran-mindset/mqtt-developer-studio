/**
 * Detects whether the application is running inside a Tauri v2 Desktop environment
 * or inside a standard Web Browser.
 */
export function isTauriApp(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

export function getPlatformType(): 'desktop' | 'web' {
  return isTauriApp() ? 'desktop' : 'web';
}
