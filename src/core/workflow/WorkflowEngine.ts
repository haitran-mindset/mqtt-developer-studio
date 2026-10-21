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

  async run(): Promise<WorkflowRunRecord> {
    this.aborted = false;
    const runId = uuidv4();
    const startedAt = Date.now();
    const stepsLog: WorkflowStepRunLog[] = [];

    const nodes = this.workflow.nodes || [];
    const edges = this.workflow.edges || [];

    // Find starting nodes (nodes without incoming edges)
    const targets = new Set(edges.map((e: any) => e.target));
    const startNodes = nodes.filter((n: any) => !targets.has(n.id));

    let currentNode = startNodes.length > 0 ? startNodes[0] : nodes[0];
    let overallStatus: 'completed' | 'failed' | 'cancelled' = 'completed';

    while (currentNode && !this.aborted) {
      const nodeId = currentNode.id;
      const stepType = currentNode.data?.stepType;
      const stepName = currentNode.data?.label || nodeId;
      const stepConfig = currentNode.data?.config || {};

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

          if (stepType === 'stop') {
            break;
          }

          // Determine next node
          const outgoing = edges.filter((e: any) => e.source === nodeId);
          if (outgoing.length === 0) {
            currentNode = null;
          } else if (result.nextHandle) {
            // Find edge with matching handle
            const branchEdge = outgoing.find((e: any) => e.sourceHandle === result.nextHandle);
            const targetId = branchEdge?.target;
            currentNode = targetId ? nodes.find((n: any) => n.id === targetId) : null;
          } else {
            const nextEdge = outgoing[0];
            currentNode = nodes.find((n: any) => n.id === nextEdge.target);
          }
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
          overallStatus = 'failed';
          break;
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
        overallStatus = 'failed';
        break;
      }
    }

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
}
