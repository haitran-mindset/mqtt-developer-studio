import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngine } from '@/core/workflow/WorkflowEngine';
import type { WorkflowDefinition } from '@/core/db/types';

describe('WorkflowEngine', () => {
  let mockConnectionManager: any;

  beforeEach(() => {
    mockConnectionManager = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      getConnection: vi.fn().mockReturnValue({
        getStatus: () => 'connected',
        onMessage: vi.fn().mockReturnValue(() => {}),
      }),
    };
  });

  it('executes a linear workflow with set_variable, delay, publish and log', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf-1',
      name: 'Linear Test Workflow',
      description: 'Testing linear flow',
      variables: {
        devId: '126BA0',
      },
      nodes: [
        {
          id: 'n1',
          data: {
            stepType: 'set_variable',
            config: { varName: 'reqId', varValue: 'REQ-1234' },
          },
        },
        {
          id: 'n2',
          data: {
            stepType: 'delay',
            config: { delayMs: 50 },
          },
        },
        {
          id: 'n3',
          data: {
            stepType: 'publish',
            config: {
              topic: 'eonic/{{devId}}/command',
              payload: '{"requestId": "{{reqId}}"}',
              qos: 1,
            },
          },
        },
        {
          id: 'n4',
          data: {
            stepType: 'log',
            config: { message: 'Workflow done for {{reqId}}' },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const engine = new WorkflowEngine(workflow, 'broker-1', mockConnectionManager);
    const runResult = await engine.run();

    expect(runResult.status).toBe('completed');
    expect(mockConnectionManager.publish).toHaveBeenCalledWith(
      'broker-1',
      'eonic/126BA0/command',
      '{"requestId": "REQ-1234"}',
      expect.objectContaining({ qos: 1 })
    );
    expect(engine.getContext().reqId).toBe('REQ-1234');
    expect(runResult.stepsLog.length).toBe(4);
  });

  it('handles conditional branching (IF/ELSE) based on context expressions', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf-condition',
      name: 'Condition Workflow',
      description: 'Branching test',
      variables: {
        batteryLevel: 15,
      },
      nodes: [
        {
          id: 'n-start',
          data: {
            stepType: 'condition',
            config: { expression: 'batteryLevel < 20' },
          },
        },
        {
          id: 'n-low-battery',
          data: {
            stepType: 'log',
            config: { message: 'Warning: low battery {{batteryLevel}}%' },
          },
        },
        {
          id: 'n-normal-battery',
          data: {
            stepType: 'log',
            config: { message: 'Battery normal' },
          },
        },
      ],
      edges: [
        { id: 'e-true', source: 'n-start', sourceHandle: 'true', target: 'n-low-battery' },
        { id: 'e-false', source: 'n-start', sourceHandle: 'false', target: 'n-normal-battery' },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const engine = new WorkflowEngine(workflow, 'broker-1', mockConnectionManager);
    const result = await engine.run();

    expect(result.status).toBe('completed');
    // Low battery branch should have run, normal battery skipped
    const executedNodeIds = result.stepsLog.map((s) => s.nodeId);
    expect(executedNodeIds).toContain('n-low-battery');
    expect(executedNodeIds).not.toContain('n-normal-battery');
  });

  it('validates payload assertions correctly and fails if assertion fails', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf-validate',
      name: 'Validate Assertion Workflow',
      description: 'Test validate payload',
      variables: {
        status: 'error_hardware_fault',
      },
      nodes: [
        {
          id: 'v1',
          data: {
            stepType: 'validate_payload',
            config: {
              assertionField: 'status',
              operator: 'equals',
              expectedValue: 'success',
            },
          },
        },
      ],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const engine = new WorkflowEngine(workflow, 'broker-1', mockConnectionManager);
    const result = await engine.run();

    expect(result.status).toBe('failed');
    expect(result.stepsLog[0].error).toContain('Assertion failed');
  });
});
