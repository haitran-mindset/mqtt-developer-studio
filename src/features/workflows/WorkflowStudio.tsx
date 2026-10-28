import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowCustomNode } from './nodes/WorkflowCustomNode';
import { WorkflowDeletableEdge } from './edges/WorkflowDeletableEdge';
import { WorkflowNodePalette } from './WorkflowNodePalette';
import { WorkflowNodeInspector } from './WorkflowNodeInspector';
import { WorkflowRunControls } from './WorkflowRunControls';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WorkflowEngine } from '@/core/workflow/WorkflowEngine';
import { useStudioStore } from '@/app/store/studioStore';
import { useDataStore } from '@/core/store/dataStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import type { WorkflowDefinition } from '@/core/db/types';
import { WorkflowStepType } from '@/core/workflow/types';
import { Button } from '@/components/ui/button';
import { GitBranch, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { WorkflowTemplatesModal } from './templates/WorkflowTemplatesModal';
import {
  exportWorkflowToJson,
  importWorkflowFromJson,
} from '@/core/workflow/workflowImportExport';
import { getRandomFlowColor, computeFlowColorMaps } from '@/core/workflow/flowColors';
import { useWorkflowHistory } from './useWorkflowHistory';

const nodeTypes = {
  workflowCustomNode: WorkflowCustomNode,
};

const edgeTypes = {
  default: WorkflowDeletableEdge,
  deletable: WorkflowDeletableEdge,
};

export const WorkflowStudio: React.FC = () => {
  const {
    activeConnectionId,
    setActiveConnectionId,
    connectionStatuses,
    addWorkflowLog,
    activeWorkflowId,
    setActiveWorkflowId,
  } = useStudioStore();

  const workflows = useDataStore((state) => state.workflows);
  const addWorkflow = useDataStore((state) => state.addWorkflow);
  const updateWorkflow = useDataStore((state) => state.updateWorkflow);
  const deleteWorkflow = useDataStore((state) => state.deleteWorkflow);

  const currentWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0] || null;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newWorkflowDialogOpen, setNewWorkflowDialogOpen] = useState(false);
  const [renameWorkflowDialogOpen, setRenameWorkflowDialogOpen] = useState(false);
  const [deleteWorkflowDialogOpen, setDeleteWorkflowDialogOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const currentEngineRef = useRef<WorkflowEngine | null>(null);

  // History management for Undo / Redo
  const { takeSnapshot, undo, redo, canUndo, canRedo, resetHistory } = useWorkflowHistory();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mqtt_workflow_palette_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePalette = () => {
    setIsPaletteCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mqtt_workflow_palette_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Load workflow nodes & edges into canvas when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes || []);
      setEdges(currentWorkflow.edges || []);
      setSelectedNodeId(null);
    } else {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
    }
    resetHistory();
  }, [currentWorkflow?.id, resetHistory]);

  // Node & Edge changes (capture removals to history)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot(nodesRef.current, edgesRef.current);
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [takeSnapshot]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot(nodesRef.current, edgesRef.current);
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [takeSnapshot]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      takeSnapshot(nodesRef.current, edgesRef.current);
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'deletable',
            animated: true,
            interactionWidth: 30,
            style: { stroke: '#06b6d4', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [takeSnapshot]
  );

  // Drag tracking for Undo/Redo on node position moves
  const dragStartSnapshotRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const onNodeDragStart = useCallback(() => {
    dragStartSnapshotRef.current = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    };
  }, []);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (dragStartSnapshotRef.current) {
        const origNode = dragStartSnapshotRef.current.nodes.find((n) => n.id === node.id);
        if (
          origNode &&
          (origNode.position.x !== node.position.x || origNode.position.y !== node.position.y)
        ) {
          takeSnapshot(dragStartSnapshotRef.current.nodes, dragStartSnapshotRef.current.edges);
        }
        dragStartSnapshotRef.current = null;
      }
    },
    [takeSnapshot]
  );

  const onSelectionDragStart = useCallback(() => {
    dragStartSnapshotRef.current = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    };
  }, []);

  const onSelectionDragStop = useCallback(() => {
    if (dragStartSnapshotRef.current) {
      takeSnapshot(dragStartSnapshotRef.current.nodes, dragStartSnapshotRef.current.edges);
      dragStartSnapshotRef.current = null;
    }
  }, [takeSnapshot]);

  // Node click -> select for Inspector
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  // Add node from Palette
  const handleAddNode = (stepType: WorkflowStepType, label: string) => {
    if (!currentWorkflow) {
      toast.info('Please create a workflow first.');
      setNewWorkflowDialogOpen(true);
      return;
    }

    const newNodeId = `node-${Date.now()}`;
    const initialConfig = getDefaultConfigForStep(stepType);
    const nodeLabel = stepType === 'start_label' && initialConfig.label ? initialConfig.label : label;

    const newNode: Node = {
      id: newNodeId,
      type: 'workflowCustomNode',
      position: {
        x: 200 + (nodes.length % 5) * 40,
        y: 150 + (nodes.length % 5) * 40,
      },
      data: {
        label: nodeLabel,
        stepType,
        status: 'idle',
        config: initialConfig,
      },
    };

    takeSnapshot(nodesRef.current, edgesRef.current);
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
    toast.success(`Added ${nodeLabel}`);
  };

  const getDefaultConfigForStep = (type: WorkflowStepType): Record<string, any> => {
    switch (type) {
      case 'start_label': {
        const count = nodes.filter((n) => n.data?.stepType === 'start_label').length;
        return {
          label: count === 0 ? 'Main Flow' : `Sub Flow ${String.fromCharCode(65 + count - 1)}`,
          color: getRandomFlowColor(),
        };
      }
      case 'publish':
        return { topic: 'devices/device-01/command', payload: '{"cmd": "ping"}', qos: 0 };
      case 'subscribe':
        return { topic: 'devices/device-01/response', qos: 1 };
      case 'unsubscribe':
        return { topic: 'devices/device-01/response' };
      case 'delay':
        return { delayMs: 1000 };
      case 'wait_for_message':
        return { topic: 'devices/device-01/response', timeoutMs: 5000 };
      case 'validate_payload':
        return { assertionField: 'status', operator: 'equals', expectedValue: 'success' };
      case 'validate_schema':
        return {
          schema: JSON.stringify(
            {
              type: 'object',
              required: ['deviceId', 'temperature'],
              properties: {
                deviceId: { type: 'string' },
                temperature: { type: 'number' },
              },
            },
            null,
            2
          ),
        };
      case 'set_variable':
        return { varName: 'deviceId', varValue: 'sensor-01' };
      case 'extract_variable':
        return { jsonPath: '$.status', varName: 'devStatus' };
      case 'condition':
        return { expression: 'batteryLevel > 20' };
      case 'loop':
        return { count: 3 };
      case 'log':
        return { message: 'Workflow step executed' };
      case 'fail':
        return { reason: 'Step assertion failed' };
      case 'switch_connection':
        return { connectionId: '' };
      default:
        return {};
    }
  };

  // Update node data from Inspector (debounced leading-edge snapshot for typing bursts)
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<any>(null);

  const recordConfigChangeSnapshot = useCallback(() => {
    if (!isTypingRef.current) {
      takeSnapshot(nodesRef.current, edgesRef.current);
      isTypingRef.current = true;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 700);
  }, [takeSnapshot]);

  const handleUpdateNodeData = (nodeId: string, newData: any) => {
    recordConfigChangeSnapshot();
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
    );
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    takeSnapshot(nodesRef.current, edgesRef.current);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Duplicate node
  const handleDuplicateNode = (nodeId: string) => {
    const nodeToDup = nodes.find((n) => n.id === nodeId);
    if (!nodeToDup) return;

    takeSnapshot(nodesRef.current, edgesRef.current);

    const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const originalLabel = String(nodeToDup.data?.label || nodeToDup.data?.stepType || 'Step');
    const newLabel = `${originalLabel} (Copy)`;

    const duplicatedNode: Node = {
      ...nodeToDup,
      id: newId,
      position: {
        x: (nodeToDup.position?.x ?? 200) + 40,
        y: (nodeToDup.position?.y ?? 150) + 40,
      },
      selected: true,
      data: {
        ...JSON.parse(JSON.stringify(nodeToDup.data || {})),
        label: newLabel,
        status: 'idle',
        lastError: undefined,
      },
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      duplicatedNode,
    ]);
    setSelectedNodeId(newId);
    toast.success(`Duplicated "${originalLabel}"`);
  };

  // Undo action
  const handleUndo = useCallback(() => {
    const previous = undo(nodesRef.current, edgesRef.current);
    if (previous) {
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setSelectedNodeId((cur) => {
        if (cur && !previous.nodes.some((n) => n.id === cur)) {
          return null;
        }
        return cur;
      });
      toast.info('Undo: reverted previous action');
    }
  }, [undo]);

  // Redo action
  const handleRedo = useCallback(() => {
    const next = redo(nodesRef.current, edgesRef.current);
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      setSelectedNodeId((cur) => {
        if (cur && !next.nodes.some((n) => n.id === cur)) {
          return null;
        }
        return cur;
      });
      toast.info('Redo: reapplied action');
    }
  }, [redo]);

  // Global Keyboard Shortcuts: Ctrl+Z / Cmd+Z (Undo), Ctrl+Y / Cmd+Shift+Z (Redo), Ctrl+D / Cmd+D (Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;

      if (isMod && !e.altKey) {
        // Redo: Cmd+Shift+Z or Ctrl+Shift+Z or Ctrl+Y
        if ((e.shiftKey && e.key.toLowerCase() === 'z') || (!isMac && e.key.toLowerCase() === 'y')) {
          e.preventDefault();
          handleRedo();
          return;
        }
        // Undo: Cmd+Z or Ctrl+Z (without shift)
        if (!e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
          return;
        }
        // Duplicate: Cmd+D or Ctrl+D
        if (e.key.toLowerCase() === 'd') {
          if (selectedNodeId) {
            e.preventDefault();
            handleDuplicateNode(selectedNodeId);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, handleDuplicateNode, handleUndo, handleRedo]);

  // Save current workflow graph
  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;

    const updated: WorkflowDefinition = {
      ...currentWorkflow,
      nodes,
      edges,
      updatedAt: Date.now(),
    };

    updateWorkflow(updated);
    toast.success(`Workflow "${updated.name}" saved!`);
  };

  // Create new blank workflow
  const handleNewWorkflow = () => {
    setNewWorkflowDialogOpen(true);
  };

  const handleConfirmNewWorkflow = (name: string) => {
    const newWf: WorkflowDefinition = {
      id: `workflow-${Date.now()}`,
      name,
      description: 'Custom automated MQTT scenario',
      nodes: [],
      edges: [],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addWorkflow(newWf);
    setActiveWorkflowId(newWf.id);
    toast.success(`Workflow "${name}" created!`);
  };

  // Rename current workflow
  const handleRenameWorkflow = () => {
    if (!currentWorkflow) return;
    setRenameWorkflowDialogOpen(true);
  };

  const handleConfirmRenameWorkflow = (newName: string) => {
    if (!currentWorkflow) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updated: WorkflowDefinition = {
      ...currentWorkflow,
      name: trimmed,
      nodes,
      edges,
      updatedAt: Date.now(),
    };

    updateWorkflow(updated);
    toast.success(`Workflow renamed to "${trimmed}"`);
  };

  // Duplicate current workflow
  const handleDuplicateWorkflow = () => {
    if (!currentWorkflow) return;

    const newId = `workflow-${Date.now()}`;
    const newName = `${currentWorkflow.name} (Copy)`;

    const duplicatedWf: WorkflowDefinition = {
      ...currentWorkflow,
      id: newId,
      name: newName,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      variables: { ...(currentWorkflow.variables || {}) },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addWorkflow(duplicatedWf);
    setActiveWorkflowId(newId);
    toast.success(`Workflow duplicated: "${newName}"`);
  };

  // Delete current workflow
  const handleDeleteWorkflow = () => {
    if (!currentWorkflow) return;
    setDeleteWorkflowDialogOpen(true);
  };

  const handleConfirmDeleteWorkflow = () => {
    if (!currentWorkflow) return;
    const idToDelete = currentWorkflow.id;
    const nameToDelete = currentWorkflow.name;
    const remaining = workflows.filter((w) => w.id !== idToDelete);
    deleteWorkflow(idToDelete);
    if (remaining.length > 0) {
      setActiveWorkflowId(remaining[0].id);
    } else {
      setActiveWorkflowId(null);
    }
    toast.info(`Deleted workflow "${nameToDelete}"`);
  };

  // Export Workflow to JSON
  const handleExportWorkflow = () => {
    if (!currentWorkflow) return;
    const fullWorkflow: WorkflowDefinition = {
      ...currentWorkflow,
      nodes,
      edges,
    };
    exportWorkflowToJson(fullWorkflow);
    toast.success(`Exported "${currentWorkflow.name}" to JSON`);
  };

  // Import Workflow from JSON
  const handleImportWorkflowClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importWorkflowFromJson(file);
      addWorkflow(imported);
      setActiveWorkflowId(imported.id);
      toast.success(`Imported "${imported.name}" with ${imported.nodes.length} nodes!`);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Select Template from Library
  const handleSelectTemplate = (templateWf: WorkflowDefinition) => {
    addWorkflow(templateWf);
    setActiveWorkflowId(templateWf.id);
    toast.success(`Loaded template: "${templateWf.name}"`);
  };

  // Reset node status markers
  const handleResetStatuses = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle', lastError: undefined },
      }))
    );
    setStatusText('Ready');
  };

  // RUN WORKFLOW
  const handleRunWorkflow = async (fromNodeId?: string) => {
    const { connectionProfiles } = useDataStore.getState();

    // Resolve target connection profile
    let targetConnectionId = activeConnectionId;
    if (!targetConnectionId || !connectionProfiles.some((p) => p.id === targetConnectionId)) {
      if (connectionProfiles.length > 0) {
        targetConnectionId = connectionProfiles[0].id;
        setActiveConnectionId(targetConnectionId);
      } else {
        toast.error('No broker profile found. Please create and connect a broker first.');
        return;
      }
    }

    const profile = connectionProfiles.find((p) => p.id === targetConnectionId);
    if (!profile) {
      toast.error('Broker profile not found.');
      return;
    }

    // Ensure connection is active and connected in connectionManager
    let adapter = connectionManager.getConnection(targetConnectionId);
    if (!adapter || adapter.getStatus() !== 'connected') {
      toast.loading(`Connecting to broker ${profile.name}...`, { id: 'conn-auto' });
      try {
        adapter = await connectionManager.connect(profile);
        toast.success(`Connected to ${profile.name}`, { id: 'conn-auto' });
      } catch (err: any) {
        toast.error(`Cannot connect to broker: ${err.message}`, { id: 'conn-auto' });
        return;
      }
    }

    if (!currentWorkflow || nodes.length === 0) {
      toast.error('Workflow has no nodes to execute.');
      return;
    }

    // Reset status flags
    handleResetStatuses();
    setIsRunning(true);
    setStatusText(fromNodeId ? 'Executing branch...' : 'Executing...');

    const executableWorkflow: WorkflowDefinition = {
      ...currentWorkflow,
      nodes,
      edges,
    };

    const engine = new WorkflowEngine(executableWorkflow, targetConnectionId, connectionManager);
    currentEngineRef.current = engine;

    // Listen to live step highlights
    engine.onStepStatus((nodeId, status, error) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, status, lastError: error } }
            : n
        )
      );
    });

    try {
      const runRecord = await engine.run(fromNodeId);

      // Log steps to global studio store for bottom panel
      runRecord.stepsLog.forEach((s) => addWorkflowLog(s));

      if (runRecord.status === 'completed') {
        setStatusText('Completed successfully');
        toast.success(`Workflow "${currentWorkflow.name}" completed!`);
      } else if (runRecord.status === 'cancelled') {
        setStatusText('Aborted');
        toast.info('Workflow execution aborted.');
      } else {
        setStatusText('Failed');
        toast.error(`Workflow failed: ${runRecord.stepsLog.find((s) => s.error)?.error || 'Check step log'}`);
      }
    } catch (err: any) {
      setStatusText('Execution error');
      toast.error(`Execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
      currentEngineRef.current = null;
    }
  };

  // Abort running workflow
  const handleAbort = () => {
    if (currentEngineRef.current) {
      currentEngineRef.current.abort();
      toast.info('Abort signal sent');
    }
  };

  // Listen to run-from-node quick triggers from custom nodes on canvas
  const handleRunWorkflowRef = useRef(handleRunWorkflow);
  handleRunWorkflowRef.current = handleRunWorkflow;

  useEffect(() => {
    const handleRunFromNodeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>;
      if (customEvent.detail?.nodeId) {
        handleRunWorkflowRef.current(customEvent.detail.nodeId);
      }
    };
    window.addEventListener('workflow:run-from-node', handleRunFromNodeEvent);
    return () => window.removeEventListener('workflow:run-from-node', handleRunFromNodeEvent);
  }, []);

  // Dynamically propagate start_label flow colors down to all connected descendant nodes and edges
  const { nodeColorMap, edgeColorMap } = useMemo(() => {
    return computeFlowColorMaps(nodes, edges);
  }, [nodes, edges]);

  const decoratedNodes = useMemo(() => {
    return nodes.map((node) => {
      const flowColor = nodeColorMap.get(node.id);
      if (node.data?.flowColor !== flowColor) {
        return {
          ...node,
          data: {
            ...node.data,
            flowColor,
          },
        };
      }
      return node;
    });
  }, [nodes, nodeColorMap]);

  const decoratedEdges = useMemo(() => {
    const nodeStatusMap = new Map<string, string>();
    nodes.forEach((n) => {
      const data = n.data as { status?: string } | undefined;
      nodeStatusMap.set(n.id, data?.status || 'idle');
    });

    return edges.map((edge) => {
      const flowColor = edgeColorMap.get(edge.id);
      const sourceStatus = nodeStatusMap.get(edge.source);
      const targetStatus = nodeStatusMap.get(edge.target);
      const isExecuted = sourceStatus === 'success' && (targetStatus === 'success' || targetStatus === 'running');

      return {
        ...edge,
        data: {
          ...edge.data,
          flowColor,
          isExecuted,
        },
      };
    });
  }, [edges, edgeColorMap, nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Top Toolbar */}
      <WorkflowRunControls
        isRunning={isRunning}
        onRun={handleRunWorkflow}
        onAbort={handleAbort}
        onReset={handleResetStatuses}
        onSave={handleSaveWorkflow}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onNewWorkflow={handleNewWorkflow}
        onRenameWorkflow={handleRenameWorkflow}
        onDuplicateWorkflow={handleDuplicateWorkflow}
        onDeleteWorkflow={handleDeleteWorkflow}
        onOpenTemplates={() => setTemplatesModalOpen(true)}
        onExportWorkflow={handleExportWorkflow}
        onImportWorkflow={handleImportWorkflowClick}
        workflows={workflows}
        currentWorkflow={currentWorkflow}
        onSelectWorkflow={(wf) => setActiveWorkflowId(wf.id)}
        statusText={statusText}
      />

      {/* Main Studio: Palette on Left, Canvas in Middle, Inspector on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <WorkflowNodePalette
          onAddNode={handleAddNode}
          isCollapsed={isPaletteCollapsed}
          onToggleCollapse={handleTogglePalette}
        />

        {/* Center: React Flow Canvas */}
        <div className="flex-1 h-full relative">

          {!currentWorkflow && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-xs text-center p-6 select-none pointer-events-auto">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">No Active Workflow</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4 leading-relaxed">
                Create a new automation workflow to orchestrate publish, subscribe, delay, and assertion steps.
              </p>
              <Button
                size="sm"
                onClick={handleNewWorkflow}
                className="text-xs font-sans gap-1.5 shadow-md shadow-cyan-500/20 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Workflow
              </Button>
            </div>
          )}

          <ReactFlow
            nodes={decoratedNodes}
            edges={decoratedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onSelectionDragStart={onSelectionDragStart}
            onSelectionDragStop={onSelectionDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            className="bg-zinc-950"
            defaultEdgeOptions={{
              type: 'deletable',
              animated: true,
              interactionWidth: 30,
              style: { stroke: '#06b6d4', strokeWidth: 2 },
            }}
            connectionLineStyle={{
              stroke: '#22d3ee',
              strokeWidth: 2.5,
              strokeDasharray: '5,5',
            }}
          >
            <Background color="#27272a" gap={16} size={1} />
            <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-200 fill-zinc-200" />
          </ReactFlow>
        </div>

        {/* Right: Node Inspector */}
        {selectedNode && (
          <WorkflowNodeInspector
            selectedNode={selectedNode}
            onUpdateNodeData={handleUpdateNodeData}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onRunFromNode={handleRunWorkflow}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* New Workflow Modal */}
      <PromptDialog
        open={newWorkflowDialogOpen}
        onOpenChange={setNewWorkflowDialogOpen}
        title="Create New Workflow"
        description="Enter a descriptive name for your visual automation flow."
        label="Workflow Name"
        defaultValue="New Automation Workflow"
        placeholder="e.g. Device Provisioning & Command Flow"
        confirmText="Create Workflow"
        onConfirm={handleConfirmNewWorkflow}
      />

      {/* Rename Workflow Modal */}
      <PromptDialog
        open={renameWorkflowDialogOpen}
        onOpenChange={setRenameWorkflowDialogOpen}
        title="Rename Workflow"
        description="Update the name of the active automation workflow."
        label="Workflow Name"
        defaultValue={currentWorkflow?.name || ''}
        placeholder="e.g. Device Provisioning & Command Flow"
        confirmText="Save Name"
        onConfirm={handleConfirmRenameWorkflow}
      />

      {/* Delete Workflow Confirmation */}
      <ConfirmDialog
        open={deleteWorkflowDialogOpen}
        onOpenChange={setDeleteWorkflowDialogOpen}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${currentWorkflow?.name}"? All nodes, connections, and step configurations will be permanently removed.`}
        confirmText="Delete Workflow"
        variant="destructive"
        onConfirm={handleConfirmDeleteWorkflow}
      />

      {/* Hidden File Input for Workflow Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Templates Library Modal */}
      <WorkflowTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};
