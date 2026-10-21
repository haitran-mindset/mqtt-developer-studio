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

const MAX_MESSAGES = 1000;
const MAX_RUNS = 100;

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
  connectionProfiles: [...DEFAULT_BROKERS],
  publishPresets: [...DEFAULT_PUBLISH_PRESETS],
  subscriptionPresets: [...DEFAULT_SUBSCRIPTION_PRESETS],
  messageHistory: [],
  workflows: [...DEFAULT_WORKFLOWS],
  workflowRuns: [],

  // Connection Profiles
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

  // Presets
  addPublishPreset: (preset) =>
    set((state) => ({
      publishPresets: [...state.publishPresets, preset],
    })),

  deletePublishPreset: (id) =>
    set((state) => ({
      publishPresets: state.publishPresets.filter((p) => p.id !== id),
    })),

  addSubscriptionPreset: (preset) =>
    set((state) => ({
      subscriptionPresets: [...state.subscriptionPresets, preset],
    })),

  deleteSubscriptionPreset: (id) =>
    set((state) => ({
      subscriptionPresets: state.subscriptionPresets.filter((p) => p.id !== id),
    })),

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

  // Workflows
  addWorkflow: (workflow) =>
    set((state) => ({
      workflows: [...state.workflows, workflow],
    })),

  updateWorkflow: (workflow) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === workflow.id ? workflow : w)),
    })),

  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    })),

  addWorkflowRun: (run) =>
    set((state) => ({
      workflowRuns: [run, ...state.workflowRuns].slice(0, MAX_RUNS),
    })),

  resetToDefaults: () =>
    set({
      connectionProfiles: [...DEFAULT_BROKERS],
      publishPresets: [...DEFAULT_PUBLISH_PRESETS],
      subscriptionPresets: [...DEFAULT_SUBSCRIPTION_PRESETS],
      workflows: [...DEFAULT_WORKFLOWS],
      messageHistory: [],
      workflowRuns: [],
    }),
}));
