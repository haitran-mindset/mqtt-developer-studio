export type WorkflowStepType =
  | 'start_label'
  | 'mqtt_trigger'
  | 'publish'
  | 'subscribe'
  | 'unsubscribe'
  | 'delay'
  | 'wait_for_message'
  | 'validate_payload'
  | 'validate_schema'
  | 'run_script'
  | 'set_variable'
  | 'extract_variable'
  | 'condition'
  | 'loop'
  | 'log'
  | 'stop'
  | 'fail'
  | 'switch_connection';

export interface WorkflowAssertionResult {
  stepId: string;
  stepName: string;
  stepType: WorkflowStepType;
  passed: boolean;
  expected?: string;
  actual?: string;
  message: string;
  timestamp: number;
}

export interface StepExecutionResult {
  success: boolean;
  nextHandle?: string; // e.g. 'true' or 'false' for condition, or undefined for default next
  error?: string;
  output?: any;
  assertions?: WorkflowAssertionResult[];
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
