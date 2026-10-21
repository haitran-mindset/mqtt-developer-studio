import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { WorkflowNodePalette } from './WorkflowNodePalette';
import { WorkflowNodeInspector } from './WorkflowNodeInspector';
import { WorkflowRunControls } from './WorkflowRunControls';
import { WorkflowEngine } from '@/core/workflow/WorkflowEngine';
import { useStudioStore } from '@/app/store/studioStore';
import { connectionManager } from '@/core/mqtt/MQTTConnectionManager';
import { db } from '@/core/db/StudioDatabase';
import { useLiveQuery } from 'dexie-react-hooks';
import type { WorkflowDefinition } from '@/core/db/types';
import type { WorkflowStepType } from '@/core/workflow/types';
import { toast } from 'sonner';

const nodeTypes = {
  workflowCustomNode: WorkflowCustomNode,
};

export const WorkflowStudio: React.FC = () => {
  const {
    activeConnectionId,
    connectionStatuses,
    addWorkflowLog,
    activeWorkflowId,
    setActiveWorkflowId,
  } = useStudioStore();

  const workflows = useLiveQuery(() => db.workflows.toArray(), []) || [];
  const currentWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0] || null;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const currentEngineRef = useRef<WorkflowEngine | null>(null);

  // Load workflow nodes & edges into canvas when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes || []);
      setEdges(currentWorkflow.edges || []);
      setSelectedNodeId(null);
    }
  }, [currentWorkflow?.id]);

  // Node & Edge changes
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#06b6d4', strokeWidth: 2 },
          },
          eds
        )
      ),
    []
  );

  // Node click -> select for Inspector
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  // Add node from Palette
  const handleAddNode = (stepType: WorkflowStepType, label: string) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'workflowCustomNode',
      position: {
        x: 200 + (nodes.length % 5) * 40,
        y: 150 + (nodes.length % 5) * 40,
      },
      data: {
        label,
        stepType,
        status: 'idle',
        config: getDefaultConfigForStep(stepType),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
    toast.success(`Added ${label}`);
  };

  const getDefaultConfigForStep = (type: WorkflowStepType): Record<string, any> => {
    switch (type) {
      case 'publish':
        return { topic: 'eonic/device/command', payload: '{"cmd": "ping"}', qos: 0 };
      case 'subscribe':
        return { topic: 'eonic/device/response', qos: 1 };
      case 'delay':
        return { delayMs: 1000 };
      case 'wait_for_message':
        return { topic: 'eonic/device/response', timeoutMs: 5000 };
      case 'validate_payload':
        return { assertionField: 'status', operator: 'equals', expectedValue: 'success' };
      case 'set_variable':
        return { varName: 'deviceId', varValue: '126BA0' };
      case 'extract_variable':
        return { jsonPath: '$.status', varName: 'devStatus' };
      case 'condition':
        return { expression: 'batteryLevel > 20' };
      case 'loop':
        return { count: 3 };
      case 'log':
        return { message: 'Workflow step executed' };
      default:
        return {};
    }
  };

  // Update node data from Inspector
  const handleUpdateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
    );
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Save current workflow graph
  const handleSaveWorkflow = async () => {
    if (!currentWorkflow) return;

    const updated: WorkflowDefinition = {
      ...currentWorkflow,
      nodes,
      edges,
      updatedAt: Date.now(),
    };

    await db.workflows.put(updated);
    toast.success(`Workflow "${updated.name}" saved!`);
  };

  // Create new blank workflow
  const handleNewWorkflow = async () => {
    const name = prompt('Enter workflow name:', 'New Automation Workflow');
    if (!name) return;

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

    await db.workflows.add(newWf);
    setActiveWorkflowId(newWf.id);
    toast.success(`Workflow "${name}" created!`);
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
  const handleRunWorkflow = async () => {
    if (!activeConnectionId) {
      toast.error('No broker selected. Select a broker from the top bar first.');
      return;
    }

    const currentStatus = connectionStatuses[activeConnectionId]?.status || 'disconnected';
    if (currentStatus !== 'connected') {
      toast.error(`Active broker is ${currentStatus}. Connect before running workflow.`);
      return;
    }

    if (!currentWorkflow || nodes.length === 0) {
      toast.error('Workflow has no nodes to execute.');
      return;
    }

    // Reset status flags
    handleResetStatuses();
    setIsRunning(true);
    setStatusText('Executing...');

    const executableWorkflow: WorkflowDefinition = {
      ...currentWorkflow,
      nodes,
      edges,
    };

    const engine = new WorkflowEngine(executableWorkflow, activeConnectionId, connectionManager);
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
      const runRecord = await engine.run();

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
        onNewWorkflow={handleNewWorkflow}
        workflows={workflows}
        currentWorkflow={currentWorkflow}
        onSelectWorkflow={(wf) => setActiveWorkflowId(wf.id)}
        statusText={statusText}
      />

      {/* Main Studio: Palette on Left, Canvas in Middle, Inspector on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <WorkflowNodePalette onAddNode={handleAddNode} />

        {/* Center: React Flow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-950"
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
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
};
