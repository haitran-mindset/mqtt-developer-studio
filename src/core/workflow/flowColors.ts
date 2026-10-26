export interface FlowColorPreset {
  id: string;
  name: string;
  color: string;
  ring: string;
}

export const FLOW_START_PALETTE: FlowColorPreset[] = [
  { id: 'cyan', name: 'Cyan', color: '#06b6d4', ring: 'rgba(6, 182, 212, 0.4)' },
  { id: 'emerald', name: 'Emerald', color: '#10b981', ring: 'rgba(16, 185, 129, 0.4)' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6', ring: 'rgba(139, 92, 246, 0.4)' },
  { id: 'rose', name: 'Rose', color: '#f43f5e', ring: 'rgba(244, 63, 94, 0.4)' },
  { id: 'amber', name: 'Amber', color: '#f59e0b', ring: 'rgba(245, 158, 11, 0.4)' },
  { id: 'blue', name: 'Blue', color: '#3b82f6', ring: 'rgba(59, 130, 246, 0.4)' },
  { id: 'fuchsia', name: 'Fuchsia', color: '#d946ef', ring: 'rgba(217, 70, 239, 0.4)' },
  { id: 'teal', name: 'Teal', color: '#14b8a6', ring: 'rgba(20, 184, 166, 0.4)' },
  { id: 'orange', name: 'Orange', color: '#f97316', ring: 'rgba(249, 115, 22, 0.4)' },
  { id: 'indigo', name: 'Indigo', color: '#6366f1', ring: 'rgba(99, 102, 241, 0.4)' },
  { id: 'pink', name: 'Pink', color: '#ec4899', ring: 'rgba(236, 72, 153, 0.4)' },
  { id: 'lime', name: 'Lime', color: '#84cc16', ring: 'rgba(132, 204, 22, 0.4)' },
];

export const getRandomFlowColor = (): string => {
  const item = FLOW_START_PALETTE[Math.floor(Math.random() * FLOW_START_PALETTE.length)];
  return item.color;
};

/**
 * Computes mapping of nodeId -> flowColor and edgeId -> flowColor based on BFS traversal
 * from all start_label nodes.
 */
export const computeFlowColorMaps = (nodes: any[], edges: any[]) => {
  const nodeColorMap = new Map<string, string>();
  const edgeColorMap = new Map<string, string>();

  // Find all start_label nodes with valid colors
  const startNodes = nodes.filter(
    (n) => n.data?.stepType === 'start_label' && n.data?.config?.color
  );

  for (const startNode of startNodes) {
    const color = startNode.data.config.color;
    const queue: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      // Find all edges outgoing from currentId
      const outgoingEdges = edges.filter((e) => e.source === currentId);
      for (const edge of outgoingEdges) {
        edgeColorMap.set(edge.id, color);
        const targetId = edge.target;
        if (!visited.has(targetId)) {
          visited.add(targetId);
          const targetNode = nodes.find((n) => n.id === targetId);
          // If the downstream node is not another start_label, it inherits this flow color
          if (targetNode && targetNode.data?.stepType !== 'start_label') {
            nodeColorMap.set(targetId, color);
            queue.push(targetId);
          }
        }
      }
    }
  }

  return { nodeColorMap, edgeColorMap };
};
