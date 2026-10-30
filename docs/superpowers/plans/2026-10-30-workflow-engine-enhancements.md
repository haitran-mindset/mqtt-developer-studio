# Workflow Engine Enhancements (Event-Driven Triggers, Custom Scripting & Test Reports) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement event-driven MQTT triggers (`mqtt_trigger`), Monaco-powered asynchronous JavaScript scripting (`run_script`), and comprehensive test assertion tracking with HTML/JSON reporting in Workflow Studio.

**Architecture:** Extend core step types and `StepExecutors` with isolated async script evaluation and trigger nodes. Build a trigger listener in `WorkflowEngine` that binds to `MQTTConnectionManager`. Enhance canvas nodes and inspectors with custom visuals and Monaco editor. Add a dedicated "Test Results" tab with standalone HTML/JSON report generation.

**Tech Stack:** React 18, TypeScript, `@xyflow/react`, `@monaco-editor/react`, Tailwind CSS, Lucide React, Dexie.js, Zustand.

**Spec:** [docs/superpowers/specs/2026-10-30-workflow-engine-enhancements-design.md](file:///Users/df/HaiTran/Project-DF/mqtt-tool/docs/superpowers/specs/2026-10-30-workflow-engine-enhancements-design.md)

---

## File Structure & Responsibilities

- `src/core/workflow/types.ts`: Define `mqtt_trigger` and `run_script` step types, assertion result types.
- `src/core/db/types.ts`: Add `WorkflowAssertionResult` and `assertionSummary` to `WorkflowRunRecord`.
- `src/core/workflow/StepExecutors.ts`: Implement `executeRunScript` (sandboxed async runner with timeout and variable merging) and `executeMqttTrigger`. Record assertion details during validation steps.
- `src/core/workflow/WorkflowEngine.ts`: Collect assertions during pipeline runs, compute summary metrics (`total`, `passed`, `failed`), and manage background message trigger routing.
- `src/features/workflows/nodes/WorkflowCustomNode.tsx`: Visual canvas rendering for `mqtt_trigger` (single output handle, purple theme) and `run_script` (amber theme, code icon).
- `src/features/workflows/WorkflowNodePalette.tsx`: Add trigger and script steps into the palette categories.
- `src/features/workflows/WorkflowNodeInspector.tsx`: Inspector controls for `mqtt_trigger` (topic, qos, filter) and `run_script` (embedded Monaco editor with JS templates).
- `src/features/workflows/WorkflowRunControls.tsx`: Add "Listen Mode" toggle badge and trigger indicators.
- `src/features/workflows/reports/testReportExporter.ts`: HTML and JSON test report generation.
- `src/features/workflows/reports/WorkflowTestResultsTab.tsx`: Bottom drawer tab presenting metrics cards, assertion table, and export actions.
- `src/features/workflows/WorkflowStudio.tsx`: Orchestrate trigger subscriptions, bottom tab switching, and test run persistence.

---

### Task 1: Core Types & Assertion Models

**Files:**
- Modify: `src/core/workflow/types.ts`
- Modify: `src/core/db/types.ts`

**Interfaces:**
- Produces: `WorkflowStepType` including `'mqtt_trigger' | 'run_script'`, `WorkflowAssertionResult`, `WorkflowRunRecord.assertions`, `WorkflowRunRecord.assertionSummary`.

- [ ] **Step 1: Update WorkflowStepType in `src/core/workflow/types.ts`**
  Add `'mqtt_trigger'` and `'run_script'`. Add `assertions?: WorkflowAssertionResult[]` to `StepExecutionResult`.
- [ ] **Step 2: Update WorkflowRunRecord in `src/core/db/types.ts`**
  Define `WorkflowAssertionResult` interface and add `assertions`, `assertionSummary`, `triggerType`, and `triggerTopic` to `WorkflowRunRecord`.
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 2: Step Executors for `run_script` and `mqtt_trigger`

**Files:**
- Modify: `src/core/workflow/StepExecutors.ts`

**Interfaces:**
- Consumes: `WorkflowStepType`, `StepExecutorContext`, `WorkflowAssertionResult`
- Produces: `StepExecutors.executeRunScript`, `StepExecutors.executeMqttTrigger`, and assertion outputs from `executeValidatePayload`.

- [ ] **Step 1: Implement `executeRunScript` in `StepExecutors.ts`**
  - Create async function execution using `new (Object.getPrototypeOf(async function(){}).constructor)('payload', 'context', 'variables', 'topic', 'qos', code)`.
  - Wrap execution with `Promise.race` against a configurable timeout (default 5000ms).
  - If return value is an object, merge properties into `ctx.context.variables`.
  - If return value contains `{ assert: boolean, message: string }`, record it as an assertion.
  - Return `{ success: true, output: result }` or `{ success: false, error: err.message }`.
- [ ] **Step 2: Implement `executeMqttTrigger` in `StepExecutors.ts`**
  - Passthrough node that ingests incoming `ctx.context.lastReceivedPayload` and logs trigger activation.
- [ ] **Step 3: Capture structured assertions in `executeValidatePayload` & `executeValidateSchema`**
  - Attach `assertions: WorkflowAssertionResult[]` to the returned `StepExecutionResult`.
- [ ] **Step 4: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 3: Engine Execution Updates & Assertion Tracking

**Files:**
- Modify: `src/core/workflow/WorkflowEngine.ts`

**Interfaces:**
- Consumes: `StepExecutors`, `WorkflowAssertionResult`, `WorkflowRunRecord`
- Produces: Aggregated `assertions` and `assertionSummary` on completed `WorkflowRunRecord`.

- [ ] **Step 1: Aggregate assertions in `WorkflowEngine.ts`**
  - In `WorkflowEngine.run()`, initialize `allAssertions: WorkflowAssertionResult[] = []`.
  - After executing each node in `executeNode()`, extract `result.assertions` if present and push to `allAssertions`.
- [ ] **Step 2: Compute assertion summary statistics**
  - Before saving `WorkflowRunRecord`, compute:
    `assertionSummary = { total: allAssertions.length, passed: allAssertions.filter(a => a.passed).length, failed: allAssertions.filter(a => !a.passed).length }`.
  - Store `assertions` and `assertionSummary` in the final `WorkflowRunRecord`.
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 4: Node Visual Representation & Canvas Integration

**Files:**
- Modify: `src/features/workflows/nodes/WorkflowCustomNode.tsx`
- Modify: `src/features/workflows/WorkflowNodePalette.tsx`

**Interfaces:**
- Consumes: `WorkflowStepType`
- Produces: Canvas rendering for `'mqtt_trigger'` and `'run_script'` nodes with proper icons and handle arrangements.

- [ ] **Step 1: Update `WorkflowCustomNode.tsx`**
  - Add icons: `Radio` or `Zap` for `mqtt_trigger`, `Code2` for `run_script`.
  - Add visual styles: Purple/violet accent for trigger, amber/gold accent for script.
  - Handle logic: For `stepType === 'mqtt_trigger'`, render **only the right Source handle** (`type="source"`), hide the left target handle so it functions as a root trigger.
- [ ] **Step 2: Update `WorkflowNodePalette.tsx`**
  - Add "MQTT Trigger" to the Palette (under Triggers/Entry category).
  - Add "Custom Script (JS)" to the Palette (under Data & Logic category).
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 5: Node Inspector Configuration (Monaco Editor & Trigger Settings)

**Files:**
- Modify: `src/features/workflows/WorkflowNodeInspector.tsx`

**Interfaces:**
- Consumes: Node data with step config
- Produces: Form controls for topic, QoS, filterExpression, and embedded Monaco editor for `run_script`.

- [ ] **Step 1: Add `mqtt_trigger` inspector section in `WorkflowNodeInspector.tsx`**
  - Topic input with placeholder `e.g. devices/+/telemetry`.
  - QoS dropdown (0, 1, 2).
  - Filter expression input (e.g. `payload.status === "ALERT"`).
  - Variable name input (default `lastReceivedPayload`).
- [ ] **Step 2: Add `run_script` inspector section in `WorkflowNodeInspector.tsx`**
  - Embed `@monaco-editor/react` with dark theme (`vs-dark`), `language="javascript"`.
  - Provide helper code snippets / reset button.
  - Timeout input in ms (default 5000).
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 6: Toolbar "Listen Mode" & Trigger Arming Integration

**Files:**
- Modify: `src/features/workflows/WorkflowRunControls.tsx`
- Modify: `src/features/workflows/WorkflowStudio.tsx`

**Interfaces:**
- Consumes: Active workflow nodes, `connectionManager`
- Produces: "Listen Mode" toggle in toolbar, automatic background subscription and trigger execution.

- [ ] **Step 1: Add Listen Mode toggle in `WorkflowRunControls.tsx`**
  - Toggle button: "Listen Mode" / "Listening" (with pulsing green/purple radio dot when armed).
  - Disable button if workflow has no `mqtt_trigger` nodes.
- [ ] **Step 2: Implement trigger listener in `WorkflowStudio.tsx`**
  - When Listen Mode is toggled ON:
    - Collect all `mqtt_trigger` nodes in current workflow.
    - Subscribe to topics on `activeConnectionId` via `connectionManager`.
    - Attach message event listener: upon matching message topic & filter expression, trigger `handleRunWorkflow(matchingNode.id)` with the incoming payload.
  - When Listen Mode is toggled OFF:
    - Unsubscribe and clean up listener.
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 7: Test Results & Assertion Summary Tab + HTML/JSON Export

**Files:**
- Create: `src/features/workflows/reports/testReportExporter.ts`
- Create: `src/features/workflows/reports/WorkflowTestResultsTab.tsx`
- Modify: `src/features/workflows/WorkflowStudio.tsx`

**Interfaces:**
- Consumes: `WorkflowRunRecord`, `WorkflowAssertionResult`
- Produces: UI tab for test results, Export HTML and Export JSON buttons.

- [ ] **Step 1: Implement `testReportExporter.ts`**
  - `exportTestReportToJson(run: WorkflowRunRecord)`: Triggers JSON file download.
  - `exportTestReportToHtml(run: WorkflowRunRecord)`: Generates an elegant, self-contained standalone HTML page with dark-mode styling, metrics summary, and assertion table.
- [ ] **Step 2: Create `WorkflowTestResultsTab.tsx`**
  - Metrics cards: Total Assertions, Passed, Failed, Duration ms.
  - Pass/Fail banner badge.
  - Table of assertions (Step Name, Condition, Expected, Actual, Status icon).
  - Export buttons for HTML and JSON.
- [ ] **Step 3: Integrate "Test Results" tab into `WorkflowStudio.tsx`**
  - Add tab header beside "Execution Logs" in the studio bottom drawer.
  - Automatically switch or update badge count when assertions are executed.
- [ ] **Step 4: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 8: End-to-End Build & Verification

**Files:**
- Full repository check

- [ ] **Step 1: Run TypeScript full check**
  Run: `npx tsc --noEmit`
  Expected: Code 0, no errors.
- [ ] **Step 2: Run production build**
  Run: `npm run build`
  Expected: Build succeeds with optimized output in `dist/`.
- [ ] **Step 3: Verify workflow execution & test report generation**
  Test trigger node, JS script step, assertion summary, and HTML report download.
