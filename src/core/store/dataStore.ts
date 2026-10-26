import { create } from 'zustand';
import type {
  ConnectionProfile,
  PublishPreset,
  SubscriptionPreset,
  StoredMessage,
  WorkflowDefinition,
  WorkflowRunRecord,
} from '../db/types';
import {
  DEFAULT_BROKERS,
  DEFAULT_PUBLISH_PRESETS,
  DEFAULT_SUBSCRIPTION_PRESETS,
  DEFAULT_WORKFLOWS,
} from './seedData';
import {
  loadWorkflowsFromSession,
  saveWorkflowsToSession,
  loadPublishPresetsFromSession,
  savePublishPresetsToSession,
  loadSubscriptionPresetsFromSession,
  saveSubscriptionPresetsToSession,
} from '../storage/sessionStorageManager';

const MAX_MESSAGES = 1000;
const MAX_RUNS = 100;

// Attempt to load from session storage if persistence is enabled by user.
// NOTE: Connection profiles are deliberately NEVER loaded from or saved to session storage.
const cachedWorkflows = loadWorkflowsFromSession();
const cachedPubPresets = loadPublishPresetsFromSession();
const cachedSubPresets = loadSubscriptionPresetsFromSession();

interface DataState {
  connectionProfiles: ConnectionProfile[];
  publishPresets: PublishPreset[];
  subscriptionPresets: SubscriptionPreset[];
  messageHistory: StoredMessage[];
  workflows: WorkflowDefinition[];
  workflowRuns: WorkflowRunRecord[];

  // Profiles
  addConnectionProfile: (profile: ConnectionProfile) => void;
  updateConnectionProfile: (profile: ConnectionProfile) => void;
  deleteConnectionProfile: (id: string) => void;
  clearAllConnectionProfiles: () => void;

  // Presets
  addPublishPreset: (preset: PublishPreset) => void;
  deletePublishPreset: (id: string) => void;
  addSubscriptionPreset: (preset: SubscriptionPreset) => void;
  deleteSubscriptionPreset: (id: string) => void;

  // Messages (Ring buffer)
  addMessage: (message: StoredMessage) => void;
  clearConnectionMessages: (connectionId: string) => void;
  clearAllMessages: () => void;

  // Workflows
  addWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (workflow: WorkflowDefinition) => void;
  deleteWorkflow: (id: string) => void;
  addWorkflowRun: (run: WorkflowRunRecord) => void;

  // Reset
  resetToDefaults: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  // Connection profiles are strictly in-memory or from default brokers; NEVER saved to sessionStorage.
  connectionProfiles: [...DEFAULT_BROKERS],
  publishPresets: cachedPubPresets && cachedPubPresets.length > 0 ? cachedPubPresets : [...DEFAULT_PUBLISH_PRESETS],
  subscriptionPresets: cachedSubPresets && cachedSubPresets.length > 0 ? cachedSubPresets : [...DEFAULT_SUBSCRIPTION_PRESETS],
  messageHistory: [],
  workflows: cachedWorkflows && cachedWorkflows.length > 0 ? cachedWorkflows : [...DEFAULT_WORKFLOWS],
  workflowRuns: [],

  // Connection Profiles (NEVER persisted to sessionStorage)
  addConnectionProfile: (profile) =>
    set((state) => ({
      connectionProfiles: [...state.connectionProfiles, profile],
    })),

  updateConnectionProfile: (profile) =>
    set((state) => ({
      connectionProfiles: state.connectionProfiles.map((p) =>
        p.id === profile.id ? profile : p
      ),
    })),

  deleteConnectionProfile: (id) =>
    set((state) => ({
      connectionProfiles: state.connectionProfiles.filter((p) => p.id !== id),
      messageHistory: state.messageHistory.filter((m) => m.connectionId !== id),
    })),

  clearAllConnectionProfiles: () =>
    set({
      connectionProfiles: [],
      messageHistory: [],
    }),

  // Presets (Persisted to sessionStorage if enabled by user)
  addPublishPreset: (preset) =>
    set((state) => {
      const updated = [...state.publishPresets, preset];
      savePublishPresetsToSession(updated);
      return { publishPresets: updated };
    }),

  deletePublishPreset: (id) =>
    set((state) => {
      const updated = state.publishPresets.filter((p) => p.id !== id);
      savePublishPresetsToSession(updated);
      return { publishPresets: updated };
    }),

  addSubscriptionPreset: (preset) =>
    set((state) => {
      const updated = [...state.subscriptionPresets, preset];
      saveSubscriptionPresetsToSession(updated);
      return { subscriptionPresets: updated };
    }),

  deleteSubscriptionPreset: (id) =>
    set((state) => {
      const updated = state.subscriptionPresets.filter((p) => p.id !== id);
      saveSubscriptionPresetsToSession(updated);
      return { subscriptionPresets: updated };
    }),

  // Messages
  addMessage: (message) =>
    set((state) => ({
      messageHistory: [message, ...state.messageHistory].slice(0, MAX_MESSAGES),
    })),

  clearConnectionMessages: (connectionId) =>
    set((state) => ({
      messageHistory: state.messageHistory.filter((m) => m.connectionId !== connectionId),
    })),

  clearAllMessages: () =>
    set({
      messageHistory: [],
    }),

  // Workflows (Persisted to sessionStorage if enabled by user)
  addWorkflow: (workflow) =>
    set((state) => {
      const updated = [...state.workflows, workflow];
      saveWorkflowsToSession(updated);
      return { workflows: updated };
    }),

  updateWorkflow: (workflow) =>
    set((state) => {
      const updated = state.workflows.map((w) => (w.id === workflow.id ? workflow : w));
      saveWorkflowsToSession(updated);
      return { workflows: updated };
    }),

  deleteWorkflow: (id) =>
    set((state) => {
      const updated = state.workflows.filter((w) => w.id !== id);
      saveWorkflowsToSession(updated);
      return { workflows: updated };
    }),

  addWorkflowRun: (run) =>
    set((state) => ({
      workflowRuns: [run, ...state.workflowRuns].slice(0, MAX_RUNS),
    })),

  resetToDefaults: () => {
    saveWorkflowsToSession([...DEFAULT_WORKFLOWS]);
    savePublishPresetsToSession([...DEFAULT_PUBLISH_PRESETS]);
    saveSubscriptionPresetsToSession([...DEFAULT_SUBSCRIPTION_PRESETS]);
    set({
      connectionProfiles: [...DEFAULT_BROKERS],
      publishPresets: [...DEFAULT_PUBLISH_PRESETS],
      subscriptionPresets: [...DEFAULT_SUBSCRIPTION_PRESETS],
      workflows: [...DEFAULT_WORKFLOWS],
      messageHistory: [],
      workflowRuns: [],
    });
  },
}));
