# Design Specification: Workflow Engine Enhancements (Event-Driven Triggers, Custom Scripting & Test Reports)

- **Date**: 2026-10-30
- **Status**: Approved
- **Subsystem**: Workflow Studio & Core Engine (`src/core/workflow` & `src/features/workflows`)

---

## 1. Objectives & Scope

This specification details the technical architecture and UI implementation for **Phase 1: Workflow Engine Enhancements** of MQTT Developer Studio:
1. **Event-Driven MQTT Trigger Node (`mqtt_trigger`)**: Enable workflows to automatically run in response to real-time incoming MQTT messages matching configured topic wildcards and optional JSON payload filter criteria.
2. **Custom JavaScript Scripting Node (`run_script`)**: Provide an asynchronous scripting step powered by Monaco Code Editor, granting developers access to `payload`, `context`, `variables`, `topic`, and `qos` to transform data, evaluate mathematical formulas, or decode binary payloads.
3. **Test Results & Assertion Summary Report**: Track assertions from validation steps (`validate_payload`, `validate_schema`, and script assertions), display summary metrics (Pass/Fail counts, duration, details) in a dedicated bottom drawer tab, and provide one-click HTML/JSON test report exports.

---

## 2. Architecture & Data Model

### 2.1 Workflow Step Types Extension (`src/core/workflow/types.ts`)

```typescript
export type WorkflowStepType =
  | 'start_label'
  | 'mqtt_trigger'      // NEW: Event-driven entry point
  | 'publish'
  | 'subscribe'
  | 'unsubscribe'
  | 'delay'
  | 'wait_for_message'
  | 'validate_payload'
  | 'validate_schema'
  | 'run_script'        // NEW: Custom async JavaScript execution
  | 'set_variable'
  | 'extract_variable'
  | 'condition'
  | 'loop'
  | 'log'
  | 'stop'
  | 'fail'
  | 'switch_connection';
```

### 2.2 Test Assertion Record Model (`src/core/db/types.ts`)

```typescript
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

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  startedAt: number;
  completedAt?: number;
  stepsLog: WorkflowStepRunLog[];
  assertions?: WorkflowAssertionResult[]; // NEW: Detailed assertions list
  assertionSummary?: {                   // NEW: Summary statistics
    total: number;
    passed: number;
    failed: number;
  };
  contextSnapshot: Record<string, any>;
  triggerType?: 'manual' | 'mqtt_event'; // NEW: Run origin
  triggerTopic?: string;
}
```

---

## 3. Subsystem Detailed Design

### 3.1 Event-Driven MQTT Trigger Node (`mqtt_trigger`)

1. **Canvas Node Representation**:
   - Distinct appearance: Violet / Purple border and header (`ring-purple-500/50`, `bg-purple-950/30`).
   - Port layout: **Source (Output) handle only** on the right side. No target (input) handle since it serves as a root trigger.
   - Display: Displays configured topic with `Radio` / `Zap` icon.

2. **Configuration in Node Inspector**:
   - `topic`: MQTT topic string (supports `+` and `#` wildcards, e.g. `devices/+/telemetry`).
   - `qos`: Target subscription QoS (`0`, `1`, `2`).
   - `filterExpression` *(optional)*: JavaScript expression evaluated on incoming message, e.g. `payload.status === "ALERT"`.
   - `variableName` *(optional)*: Store payload into a custom named variable instead of default `lastReceivedPayload`.

3. **Engine Execution Flow**:
   - A new toggle in the workflow toolbar: **"Listen Mode"** (Armed / Disarmed).
   - When **Listen Mode** is enabled:
     - The engine inspects all active nodes of type `mqtt_trigger`.
     - Subscribes to their topics on the active connection profile via `MQTTConnectionManager`.
     - Sets up a persistent topic message listener.
   - When a message arrives:
     - Matching against trigger topics using `MQTTTopicMatcher`.
     - Evaluates `filterExpression` if specified.
     - Spawns a workflow execution instance rooted at the matching `mqtt_trigger` node, injecting `lastReceivedPayload`, `lastReceivedTopic`, and `triggerType: 'mqtt_event'`.

---

### 3.2 Custom JavaScript Script Step (`run_script`)

1. **Canvas Node Representation**:
   - Amber / Golden theme (`ring-amber-500/50`, `bg-amber-950/30`), with `Code2` icon.
   - Standard dual handles (Input on left, Output on right).

2. **Configuration in Node Inspector**:
   - Embedded **Monaco Code Editor** with `language="javascript"`.
   - Boilerplate template:
     ```javascript
     // Available in scope: payload, context, variables, topic, qos
     // Return an object to update workflow variables, e.g.:
     // return { computedValue: payload.temp * 1.8 + 32 };
     ```
   - Timeout setting (default: 5000ms).

3. **Step Executor Mechanics (`StepExecutors.ts`)**:
   - Code executes inside an isolated asynchronous function wrapper:
     ```javascript
     const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
     const fn = new AsyncFunction('payload', 'context', 'variables', 'topic', 'qos', code);
     const result = await Promise.race([
       fn(payload, context, variables, topic, qos),
       timeoutPromise(timeoutMs)
     ]);
     ```
   - If the returned value is a plain object, its keys are merged into `context.variables` and stored as the step's `output`.
   - Comprehensive error trapping captures syntax errors, unhandled rejections, and execution timeouts.

---

### 3.3 Test Results & Assertion Summary Tab

1. **Assertion Tracking in Engine**:
   - When `validate_payload` or `validate_schema` runs, each assertion is recorded in an array `assertions: WorkflowAssertionResult[]`.
   - If `run_script` returns `{ assert: boolean, message: string }`, it is also logged as an assertion.
   - When the workflow completes or fails, an `assertionSummary` is computed (`total`, `passed`, `failed`).

2. **UI: "Test Results" Tab in Bottom Panel**:
   - Added beside the existing "Execution Logs" tab.
   - Top banner:
     - Pass/Fail badge with overall test suite status.
     - Metrics: Total Assertions, Passed, Failed, Total Duration.
   - Assertion Table:
     - Step name, Node ID, Assertion Condition, Expected value, Actual value, Status (Passed checkmark / Failed X).
   - Export Actions:
     - **Export JSON**: Raw structured JSON containing assertion results.
     - **Export HTML**: Self-contained HTML report styled with modern dark mode styling, ready for sharing or CI archiving.

---

## 4. Testing & Verification Plan

1. **Automated Verification**:
   - Unit tests for `StepExecutors.executeRunScript`: Verify variable merging, error handling, and timeout behavior.
   - Unit tests for `StepExecutors.executeMqttTrigger`: Verify trigger context resolution.
   - Compilation and bundling: `npx tsc --noEmit` and `npm run build`.
2. **Manual End-to-End Verification**:
   - Create an `mqtt_trigger` listening on `test/device/command`.
   - Send a publish from the Publisher tab to `test/device/command`.
   - Confirm workflow automatically triggers and executes following nodes.
   - Add a `run_script` node that converts temperature and returns `{ tempF: ... }`.
   - Add a `validate_payload` checking `variables.tempF > 0`.
   - Review the **Test Results** tab in the bottom panel and verify the HTML report export.
