export type WorkflowStepType =
  | 'publish'
  | 'subscribe'
  | 'unsubscribe'
  | 'delay'
  | 'wait_for_message'
  | 'validate_payload'
  | 'set_variable'
  | 'extract_variable'
  | 'condition'
  | 'loop'
  | 'log'
  | 'stop'
  | 'fail'
  | 'switch_connection';

export interface StepExecutionResult {
  success: boolean;
  nextHandle?: string; // e.g. 'true' or 'false' for condition, or undefined for default next
  error?: string;
  output?: any;
}

export interface WorkflowExecutionContext {
  variables: Record<string, any>;
  lastReceivedPayload?: any;
  lastReceivedTopic?: string;
  activeConnectionId: string;
  [key: string]: any;
}

export interface StepExecutorContext {
  context: WorkflowExecutionContext;
  stepConfig: Record<string, any>;
  nodeId: string;
  stepName: string;
  connectionManager: any;
  interpolate: (str: string) => string;
  isAborted: () => boolean;
}
