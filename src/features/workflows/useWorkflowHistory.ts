import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

export interface WorkflowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY_STEPS = 30;

function deepCloneSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

export function useWorkflowHistory() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pastRef = useRef<WorkflowSnapshot[]>([]);
  const futureRef = useRef<WorkflowSnapshot[]>([]);

  const syncState = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    const snapshot = deepCloneSnapshot({ nodes, edges });
    pastRef.current.push(snapshot);
    if (pastRef.current.length > MAX_HISTORY_STEPS) {
      pastRef.current.shift();
    }
    // Any new action invalidates redo stack
    futureRef.current = [];
    syncState();
  }, [syncState]);

  const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]): WorkflowSnapshot | null => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(deepCloneSnapshot({ nodes: currentNodes, edges: currentEdges }));
    syncState();
    return previous;
  }, [syncState]);

  const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]): WorkflowSnapshot | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current.pop()!;
    pastRef.current.push(deepCloneSnapshot({ nodes: currentNodes, edges: currentEdges }));
    syncState();
    return next;
  }, [syncState]);

  const resetHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncState();
  }, [syncState]);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
