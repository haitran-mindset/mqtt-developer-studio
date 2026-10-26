import type { WorkflowDefinition } from '@/core/db/types';

export interface ExportedWorkflowPackage {
  version: string;
  type: 'mqtt-studio-workflow';
  exportedAt: string;
  workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * Export a workflow definition as a formatted JSON file download.
 */
export function exportWorkflowToJson(workflow: WorkflowDefinition): void {
  const exportData: ExportedWorkflowPackage = {
    version: '1.0',
    type: 'mqtt-studio-workflow',
    exportedAt: new Date().toISOString(),
    workflow: {
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
    },
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
 * Parse and validate an imported workflow JSON file.
 * Automatically regenerates unique IDs to prevent canvas collisions.
 */
export async function importWorkflowFromJson(file: File): Promise<WorkflowDefinition> {
  const content = await file.text();
  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    throw new Error(`Invalid JSON file: ${err.message}`);
  }

  // Handle both packaged export ({ workflow: {...} }) and raw WorkflowDefinition
  const wfData = parsed.workflow || parsed;

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

  const timestamp = Date.now();
  const idMap = new Map<string, string>();

  // Map old node IDs to new unique IDs
  const nodes = wfData.nodes.map((n: any, idx: number) => {
    const oldId = String(n.id || `node-${idx}`);
    const newId = `node-${timestamp}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
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
      id: `edge-${timestamp}-${idx}`,
      source: newSource,
      target: newTarget,
    };
  });

  const importedWorkflow: WorkflowDefinition = {
    id: `workflow-${timestamp}-${Math.random().toString(36).substr(2, 4)}`,
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
