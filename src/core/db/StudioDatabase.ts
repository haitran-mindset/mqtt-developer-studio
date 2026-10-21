import Dexie, { type Table } from 'dexie';
import type {
  ConnectionProfile,
  PublishPreset,
  SubscriptionPreset,
  StoredMessage,
  WorkflowDefinition,
  WorkflowRunRecord,
} from './types';

export class StudioDatabase extends Dexie {
  connectionProfiles!: Table<ConnectionProfile, string>;
  publishPresets!: Table<PublishPreset, string>;
  subscriptionPresets!: Table<SubscriptionPreset, string>;
  messageHistory!: Table<StoredMessage, string>;
  workflows!: Table<WorkflowDefinition, string>;
  workflowRuns!: Table<WorkflowRunRecord, string>;

  constructor() {
    super('MQTTDeveloperStudioDB');

    this.version(1).stores({
      connectionProfiles: 'id, name, protocol, host, port, isDefault, createdAt',
      publishPresets: 'id, name, topic, format, createdAt',
      subscriptionPresets: 'id, name, autoSubscribe, createdAt',
      messageHistory: 'id, connectionId, topic, timestamp, direction, qos, retain',
      workflows: 'id, name, createdAt, updatedAt',
      workflowRuns: 'id, workflowId, status, startedAt',
    });
  }

  // Clear messages for a specific connection
  async clearConnectionMessages(connectionId: string): Promise<void> {
    await this.messageHistory.where('connectionId').equals(connectionId).delete();
  }

  // Retain only the last N messages to keep browser memory lean
  async pruneOldMessages(maxCount: number = 2000): Promise<void> {
    const total = await this.messageHistory.count();
    if (total > maxCount) {
      const deleteCount = total - maxCount;
      const oldestKeys = await this.messageHistory
        .orderBy('timestamp')
        .limit(deleteCount)
        .primaryKeys();
      await this.messageHistory.bulkDelete(oldestKeys);
    }
  }
}

export const db = new StudioDatabase();
