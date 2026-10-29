import type { WorkflowDefinition } from '@/core/db/types';

export interface ExportedWorkflowPackage {
  version: string;
  type: 'mqtt-studio-workflow';
  exportedAt: string;
  workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface ExportedWorkflowsBundle {
  version: string;
  type: 'mqtt-studio-workflows-bundle';
  exportedAt: string;
  count: number;
  workflows: Array<Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface MultiImportResult {
  imported: WorkflowDefinition[];
  errors: { fileName: string; error: string }[];
}

/**
 * Sanitize a workflow for clean JSON export (reset node run states).
 */
export function sanitizeWorkflowForExport(
  workflow: WorkflowDefinition
): Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: workflow.name,
    description: workflow.description || '',
    variables: workflow.variables || {},
    nodes: (workflow.nodes || []).map((n) => ({
      ...n,
      data: {
        ...n.data,
        status: 'idle',
        lastError: undefined,
        lastRunDurationMs: undefined,
      },
    })),
    edges: workflow.edges || [],
  };
}

/**
 * Export a single workflow definition as a formatted JSON file download.
 */
export function exportWorkflowToJson(workflow: WorkflowDefinition): void {
  const exportData: ExportedWorkflowPackage = {
    version: '1.0',
    type: 'mqtt-studio-workflow',
    exportedAt: new Date().toISOString(),
    workflow: sanitizeWorkflowForExport(workflow),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = (workflow.name || 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${cleanName}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple workflows together as a single bundled JSON file.
 */
export function exportWorkflowsBundleToJson(
  workflows: WorkflowDefinition[],
  bundleName: string = 'mqtt-workflows-bundle'
): void {
  if (!workflows || workflows.length === 0) return;

  const exportData: ExportedWorkflowsBundle = {
    version: '1.0',
    type: 'mqtt-studio-workflows-bundle',
    exportedAt: new Date().toISOString(),
    count: workflows.length,
    workflows: workflows.map(sanitizeWorkflowForExport),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = bundleName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${cleanName}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to validate and convert raw workflow data to a WorkflowDefinition with new unique IDs.
 */
function parseSingleWorkflowData(wfData: any, customTimestamp?: number): WorkflowDefinition {
  if (!wfData || typeof wfData !== 'object') {
    throw new Error('Invalid workflow format: Root object not found');
  }

  if (!wfData.name || typeof wfData.name !== 'string') {
    throw new Error('Invalid workflow: Missing workflow name');
  }

  if (!Array.isArray(wfData.nodes)) {
    throw new Error('Invalid workflow: Missing or invalid nodes array');
  }

  if (!Array.isArray(wfData.edges)) {
    throw new Error('Invalid workflow: Missing or invalid edges array');
  }

  const timestamp = customTimestamp || Date.now();
  const idMap = new Map<string, string>();

  // Map old node IDs to new unique IDs
  const nodes = wfData.nodes.map((n: any, idx: number) => {
    const oldId = String(n.id || `node-${idx}`);
    const newId = `node-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    idMap.set(oldId, newId);

    return {
      ...n,
      id: newId,
      data: {
        ...(n.data || {}),
        status: 'idle',
        lastError: undefined,
        lastRunDurationMs: undefined,
      },
    };
  });

  // Remap edges to match new node IDs
  const edges = wfData.edges.map((e: any, idx: number) => {
    const newSource = idMap.get(String(e.source)) || e.source;
    const newTarget = idMap.get(String(e.target)) || e.target;
    return {
      ...e,
      id: `edge-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      source: newSource,
      target: newTarget,
    };
  });

  const importedWorkflow: WorkflowDefinition = {
    id: `workflow-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
    name: wfData.name.includes('(Imported)') ? wfData.name : `${wfData.name} (Imported)`,
    description: wfData.description || 'Imported from JSON',
    variables: wfData.variables || {},
    nodes,
    edges,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return importedWorkflow;
}

/**
 * Extract workflows from any supported parsed JSON structure (single, bundle, or array).
 */
export function extractWorkflowsFromParsedJson(parsed: any): WorkflowDefinition[] {
  // Case 1: Bundle format { type: 'mqtt-studio-workflows-bundle', workflows: [...] }
  if (parsed && Array.isArray(parsed.workflows)) {
    return parsed.workflows.map((item: any, i: number) =>
      parseSingleWorkflowData(item.workflow || item, Date.now() + i * 10)
    );
  }

  // Case 2: Array of workflows or packages [ { workflow: ... } or { name: ... } ]
  if (Array.isArray(parsed)) {
    return parsed.map((item: any, i: number) =>
      parseSingleWorkflowData(item.workflow || item, Date.now() + i * 10)
    );
  }

  // Case 3: Single workflow package ({ workflow: {...} }) or raw WorkflowDefinition ({ name, nodes, edges })
  const wfData = parsed.workflow || parsed;
  return [parseSingleWorkflowData(wfData, Date.now())];
}

/**
 * Parse and validate an imported workflow JSON file.
 * Kept for backwards compatibility.
 */
export async function importWorkflowFromJson(file: File): Promise<WorkflowDefinition> {
  const result = await importMultipleWorkflowsFromFiles([file]);
  if (result.errors.length > 0 && result.imported.length === 0) {
    throw new Error(result.errors[0].error);
  }
  if (result.imported.length === 0) {
    throw new Error('No valid workflows found in file');
  }
  return result.imported[0];
}

/**
 * Parse and validate multiple imported workflow JSON files (or bundles).
 */
export async function importMultipleWorkflowsFromFiles(
  files: FileList | File[]
): Promise<MultiImportResult> {
  const fileArray = Array.from(files);
  const result: MultiImportResult = {
    imported: [],
    errors: [],
  };

  for (let fileIndex = 0; fileIndex < fileArray.length; fileIndex++) {
    const file = fileArray[fileIndex];
    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }

      const workflows = extractWorkflowsFromParsedJson(parsed);
      result.imported.push(...workflows);
    } catch (err: any) {
      result.errors.push({
        fileName: file.name,
        error: err.message || 'Unknown error occurred',
      });
    }
  }

  return result;
}
