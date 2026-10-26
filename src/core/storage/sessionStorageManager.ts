import type { WorkflowDefinition, PublishPreset, SubscriptionPreset, QoS } from '../db/types';

export const SESSION_STORAGE_KEYS = {
  ENABLED: 'mqtt_persist_session_enabled',
  WORKFLOWS: 'mqtt_session_workflows',
  ACTIVE_WORKFLOW_ID: 'mqtt_session_active_workflow_id',
  PUBLISH_DRAFT: 'mqtt_session_publish_draft',
  PUBLISH_PRESETS: 'mqtt_session_publish_presets',
  SUBSCRIBE_DRAFT: 'mqtt_session_subscribe_draft',
  SUBSCRIPTION_PRESETS: 'mqtt_session_subscription_presets',
  SUBSCRIBED_TOPICS: 'mqtt_session_subscribed_topics',
} as const;

export interface SavedSubscription {
  topic: string;
  qos: QoS;
}

export interface PublishDraft {
  topic: string;
  payload: string;
  qos: QoS;
  retain: boolean;
  format?: string;
}

export interface SubscribeDraft {
  topic: string;
  qos: QoS;
}

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

/**
 * Check if the user opted in to persisting session data (workflows, sub/pub topics).
 * NEVER persists broker credentials.
 */
export function isSessionPersistEnabled(): boolean {
  if (!isBrowser) return false;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEYS.ENABLED) === 'true';
}

/**
 * Enable or disable session storage. When disabled, immediately clears all cached session keys.
 */
export function setSessionPersistEnabled(enabled: boolean): void {
  if (!isBrowser) return;
  if (enabled) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.ENABLED, 'true');
  } else {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.ENABLED);
    clearAllSessionStorage();
  }
}

/**
 * Clear all cached session data (workflows, drafts, presets).
 * Absolute guarantee: No broker information is ever handled here.
 */
export function clearAllSessionStorage(): void {
  if (!isBrowser) return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.WORKFLOWS);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.ACTIVE_WORKFLOW_ID);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.PUBLISH_DRAFT);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.PUBLISH_PRESETS);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.SUBSCRIBE_DRAFT);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.SUBSCRIPTION_PRESETS);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.SUBSCRIBED_TOPICS);
}

/**
 * Synchronize current workflows, presets, and active workflow ID to session storage.
 * Note: Broker profiles are strictly excluded and never processed.
 */
export function syncCurrentDataToSession(data: {
  workflows: WorkflowDefinition[];
  publishPresets: PublishPreset[];
  subscriptionPresets: SubscriptionPreset[];
  activeWorkflowId?: string | null;
}): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  saveWorkflowsToSession(data.workflows);
  savePublishPresetsToSession(data.publishPresets);
  saveSubscriptionPresetsToSession(data.subscriptionPresets);
  if (data.activeWorkflowId !== undefined) {
    saveActiveWorkflowIdToSession(data.activeWorkflowId);
  }
}

/**
 * Enable session persistence and immediately sync current in-memory state.
 */
export function enableSessionPersistWithSync(data: {
  workflows: WorkflowDefinition[];
  publishPresets: PublishPreset[];
  subscriptionPresets: SubscriptionPreset[];
  activeWorkflowId?: string | null;
}): void {
  setSessionPersistEnabled(true);
  syncCurrentDataToSession(data);
}

// --- Workflows ---
export function saveWorkflowsToSession(workflows: WorkflowDefinition[]): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
  } catch (e) {
    console.error('Failed to save workflows to sessionStorage:', e);
  }
}

export function loadWorkflowsFromSession(): WorkflowDefinition[] | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.WORKFLOWS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse workflows from sessionStorage:', e);
    return null;
  }
}

export function saveActiveWorkflowIdToSession(id: string | null): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    if (id) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEYS.ACTIVE_WORKFLOW_ID, id);
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEYS.ACTIVE_WORKFLOW_ID);
    }
  } catch (e) {
    console.error('Failed to save activeWorkflowId to sessionStorage:', e);
  }
}

export function loadActiveWorkflowIdFromSession(): string | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEYS.ACTIVE_WORKFLOW_ID) || null;
}

// --- Publisher Draft ---
export function savePublishDraftToSession(draft: PublishDraft): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.PUBLISH_DRAFT, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save publish draft to sessionStorage:', e);
  }
}

export function loadPublishDraftFromSession(): PublishDraft | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.PUBLISH_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse publish draft from sessionStorage:', e);
    return null;
  }
}

// --- Publisher Presets ---
export function savePublishPresetsToSession(presets: PublishPreset[]): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.PUBLISH_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save publish presets to sessionStorage:', e);
  }
}

export function loadPublishPresetsFromSession(): PublishPreset[] | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.PUBLISH_PRESETS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse publish presets from sessionStorage:', e);
    return null;
  }
}

// --- Subscriber Draft ---
export function saveSubscribeDraftToSession(draft: SubscribeDraft): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.SUBSCRIBE_DRAFT, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save subscribe draft to sessionStorage:', e);
  }
}

export function loadSubscribeDraftFromSession(): SubscribeDraft | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.SUBSCRIBE_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse subscribe draft from sessionStorage:', e);
    return null;
  }
}

// --- Subscription Presets ---
export function saveSubscriptionPresetsToSession(presets: SubscriptionPreset[]): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.SUBSCRIPTION_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save subscription presets to sessionStorage:', e);
  }
}

export function loadSubscriptionPresetsFromSession(): SubscriptionPreset[] | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.SUBSCRIPTION_PRESETS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse subscription presets from sessionStorage:', e);
    return null;
  }
}

// --- Subscribed Topics List ---
export function saveSubscribedTopicsToSession(topics: SavedSubscription[]): void {
  if (!isBrowser || !isSessionPersistEnabled()) return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEYS.SUBSCRIBED_TOPICS, JSON.stringify(topics));
  } catch (e) {
    console.error('Failed to save subscribed topics to sessionStorage:', e);
  }
}

export function loadSubscribedTopicsFromSession(): SavedSubscription[] | null {
  if (!isBrowser || !isSessionPersistEnabled()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.SUBSCRIBED_TOPICS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse subscribed topics from sessionStorage:', e);
    return null;
  }
}

