import { v4 as uuidv4 } from 'uuid';
import type { WorkflowDefinition, WorkflowRunRecord, WorkflowStepRunLog } from '../db/types';
import type { WorkflowExecutionContext, StepExecutorContext } from './types';
import { StepExecutors } from './StepExecutors';
import { VariableInterpolator } from '../template/VariableInterpolator';
import { useDataStore } from '../store/dataStore';

export type StepStatusCallback = (nodeId: string, status: 'idle' | 'running' | 'success' | 'failed', error?: string) => void;

export class WorkflowEngine {
  private aborted: boolean = false;
  private interpolator: VariableInterpolator = new VariableInterpolator();
  private context: WorkflowExecutionContext;
  private stepStatusListeners: Set<StepStatusCallback> = new Set();

  constructor(
    private workflow: WorkflowDefinition,
    private initialConnectionId: string,
    private connectionManager: any
  ) {
    this.context = {
      variables: { ...(workflow.variables || {}) },
      activeConnectionId: initialConnectionId,
    };
  }

  onStepStatus(cb: StepStatusCallback): () => void {
    this.stepStatusListeners.add(cb);
    return () => this.stepStatusListeners.delete(cb);
  }

  private notifyStepStatus(nodeId: string, status: 'idle' | 'running' | 'success' | 'failed', error?: string): void {
    this.stepStatusListeners.forEach((cb) => {
      try {
        cb(nodeId, status, error);
      } catch (e) {
        console.error('Error in step status callback:', e);
      }
    });
  }

  abort(): void {
    this.aborted = true;
  }

  getContext(): Record<string, any> {
    return { ...this.context.variables, ...this.context };
  }

  async run(fromNodeId?: string): Promise<WorkflowRunRecord> {
    this.aborted = false;
    const runId = uuidv4();
    const startedAt = Date.now();
    const stepsLog: WorkflowStepRunLog[] = [];

    const nodes = this.workflow.nodes || [];
    const edges = this.workflow.edges || [];

    if (nodes.length === 0) {
      const emptyRun: WorkflowRunRecord = {
        id: runId,
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        status: 'completed',
        startedAt,
        completedAt: Date.now(),
        stepsLog: [],
        contextSnapshot: { ...this.context.variables },
      };
      useDataStore.getState().addWorkflowRun(emptyRun);
      return emptyRun;
    }

    let initialNodes: any[] = [];

    if (fromNodeId) {
      const targeted = nodes.find((n: any) => n.id === fromNodeId && !n.data?.disabled);
      if (targeted) {
        initialNodes = [targeted];
      }
    }

    if (initialNodes.length === 0) {
      // Find starting nodes (nodes without incoming active edges and not disabled)
      const activeEdges = edges.filter((e: any) => !e.data?.disabled);
      const targets = new Set(activeEdges.map((e: any) => e.target));
      const startNodes = nodes.filter((n: any) => !targets.has(n.id) && !n.data?.disabled);

      // Fall back to first non-disabled node if cycle or none found
      initialNodes = startNodes.length > 0 
        ? startNodes 
        : nodes.filter((n: any) => !n.data?.disabled).slice(0, 1);
    }

    // Execute all independent root pipelines in parallel
    const branchResults = await Promise.all(
      initialNodes.map((startNode: any) =>
        this.executeNode(startNode, nodes, edges, stepsLog, new Map<string, number>())
      )
    );

    const allSuccessful = branchResults.length > 0 ? branchResults.every(Boolean) : true;
    let overallStatus: 'completed' | 'failed' | 'cancelled' = allSuccessful ? 'completed' : 'failed';

    if (this.aborted && overallStatus !== 'failed') {
      overallStatus = 'cancelled';
    }

    const runRecord: WorkflowRunRecord = {
      id: runId,
      workflowId: this.workflow.id,
      workflowName: this.workflow.name,
      status: overallStatus,
      startedAt,
      completedAt: Date.now(),
      stepsLog,
      contextSnapshot: { ...this.context.variables },
    };

    useDataStore.getState().addWorkflowRun(runRecord);

    return runRecord;
  }

  private async executeNode(
    node: any,
    nodes: any[],
    edges: any[],
    stepsLog: WorkflowStepRunLog[],
    visitCounts: Map<string, number>
  ): Promise<boolean> {
    if (this.aborted || node.data?.disabled) {
      return true; // Skip smoothly if aborted or node is disabled
    }

    const nodeId = node.id;
    const stepType = node.data?.stepType;
    const stepName = node.data?.label || nodeId;
    const stepConfig = node.data?.config || {};

    // Prevent runaway cycles (allow up to 500 visits per node for loops)
    const currentCount = (visitCounts.get(nodeId) || 0) + 1;
    if (currentCount > 500) {
      console.warn(`[WorkflowEngine] Max visit limit (500) exceeded at node ${nodeId}, stopping branch.`);
      return false;
    }
    const nextVisitCounts = new Map(visitCounts);
    nextVisitCounts.set(nodeId, currentCount);

    this.notifyStepStatus(nodeId, 'running');
    const stepStartTime = Date.now();

    const executorCtx: StepExecutorContext = {
      context: this.context,
      stepConfig,
      nodeId,
      stepName,
      connectionManager: this.connectionManager,
      interpolate: (str: string) => this.interpolator.interpolate(str, this.getContext()),
      isAborted: () => this.aborted,
    };

    try {
      const result = await StepExecutors.execute(stepType, executorCtx);
      const duration = Date.now() - stepStartTime;

      if (this.aborted) {
        return false;
      }

      if (result.success) {
        this.notifyStepStatus(nodeId, 'success');
        stepsLog.push({
          nodeId,
          stepName,
          stepType,
          status: 'success',
          durationMs: duration,
          output: result.output,
          timestamp: Date.now(),
        });

        // Stop node halts execution along this branch
        if (stepType === 'stop') {
          return true;
        }

        // Determine next outgoing edges (ignore disabled edges)
        const outgoing = edges.filter((e: any) => e.source === nodeId && !e.data?.disabled);
        if (outgoing.length === 0) {
          return true;
        }

        let nextEdges = outgoing;
        if (result.nextHandle) {
          const matched = outgoing.filter((e: any) => e.sourceHandle === result.nextHandle);
          nextEdges = matched;
        }

        // Resolve next target nodes (ignore disabled nodes)
        const nextNodes = nextEdges
          .map((e: any) => nodes.find((n: any) => n.id === e.target))
          .filter((n: any) => n && !n.data?.disabled);

        if (nextNodes.length === 0) {
          return true;
        }

        // Execute all outgoing child branches in parallel
        const childResults = await Promise.all(
          nextNodes.map((childNode: any) =>
            this.executeNode(childNode, nodes, edges, stepsLog, nextVisitCounts)
          )
        );

        return childResults.every(Boolean);
      } else {
        this.notifyStepStatus(nodeId, 'failed', result.error);
        stepsLog.push({
          nodeId,
          stepName,
          stepType,
          status: 'failed',
          durationMs: duration,
          error: result.error,
          timestamp: Date.now(),
        });
        return false;
      }
    } catch (err: any) {
      const duration = Date.now() - stepStartTime;
      this.notifyStepStatus(nodeId, 'failed', err.message);
      stepsLog.push({
        nodeId,
        stepName,
        stepType,
        status: 'failed',
        durationMs: duration,
        error: err.message,
        timestamp: Date.now(),
      });
      return false;
    }
  }
}
