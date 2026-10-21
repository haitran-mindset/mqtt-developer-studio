# MQTT Developer Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, developer-focused web application named **MQTT Developer Studio** for MQTT debugging, monitoring, multi-broker connection management, advanced payload authoring with dynamic variables, real-time message inspection, and visual workflow automation using React Flow.

**Architecture:** A modular client-side service architecture with strict separation between UI, reactive stores, decoupled MQTT networking (`MQTTConnectionManager`), Trie-based topic matching, an asynchronous DAG workflow engine with 14 step executors, and IndexedDB persistence via Dexie.js.

**Tech Stack:** React 19 / Vite / TypeScript (strict mode), Tailwind CSS, Lucide React, Radix UI primitives, MQTT.js, Monaco Editor, React Flow (@xyflow/react), Zustand, Dexie.js, TanStack Table, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-mqtt-developer-studio-design.md`

## Global Constraints
- Browser MQTT connections must strictly use WebSocket transport (`ws://` and `wss://`).
- Credentials (such as broker passwords) must be stored locally in IndexedDB and never printed in logs or exports.
- Business logic, connection sockets, and workflow engine runtimes must not live directly inside React component render trees.
- Full support for both MQTT 3.1.1 and MQTT 5.0 protocols.
- Zero placeholder code; every step must provide complete, production-ready implementation.

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: Project build pipeline (`npm run build`, `npm run test`, `npm run dev`) and basic theme styles.

- [x] **Step 1: Create package.json with all required dependencies**
- [x] **Step 2: Create Vite & TypeScript configs**
- [x] **Step 3: Setup index.html and root mount in src/main.tsx**
- [x] **Step 4: Install dependencies and verify clean build**
- [x] **Step 5: Commit scaffolding**

---

### Task 2: Persistence Layer with Dexie.js (`core/db`)

**Files:**
- Create: `src/core/db/types.ts`
- Create: `src/core/db/StudioDatabase.ts`
- Create: `src/core/db/seedData.ts`
- Create: `tests/core/db/StudioDatabase.test.ts`

**Interfaces:**
- Produces: `db` instance extending `Dexie` with tables:
  - `connectionProfiles`: `Table<ConnectionProfile, string>`
  - `publishPresets`: `Table<PublishPreset, string>`
  - `subscriptionPresets`: `Table<SubscriptionPreset, string>`
  - `messageHistory`: `Table<StoredMessage, string>`
  - `workflows`: `Table<WorkflowDefinition, string>`
  - `workflowRuns`: `Table<WorkflowRunRecord, string>`
- Seed data: Pre-configured public test brokers (EMQX, HiveMQ, Mosquitto over WSS) and ready-to-use workflow templates.

- [x] **Step 1: Write Dexie DB unit tests**
- [x] **Step 2: Implement StudioDatabase & schemas**
- [x] **Step 3: Implement seed data generator**
- [x] **Step 4: Run test to verify DB operations pass**
- [x] **Step 5: Commit persistence layer**

---

### Task 3: Template Engine & Dynamic Variables (`core/template`)

**Files:**
- Create: `src/core/template/types.ts`
- Create: `src/core/template/VariableInterpolator.ts`
- Create: `tests/core/template/VariableInterpolator.test.ts`

**Interfaces:**
- Produces: `VariableInterpolator.interpolate(template: string, context?: Record<string, any>): string`
- Resolves:
  - `{{timestamp}}` -> epoch seconds
  - `{{timestamp_ms}}` -> epoch ms
  - `{{iso_date}}` -> ISO-8601 UTC
  - `{{uuid}}` -> crypto v4 UUID
  - `{{random_int(min, max)}}` -> integer between min and max
  - `{{client_id}}` -> context client_id
  - `{{sequence}}` -> monotonic sequence counter
  - User-defined and workflow context variables

- [x] **Step 1: Write tests for dynamic variable token replacement**
- [x] **Step 2: Implement VariableInterpolator**
- [x] **Step 3: Verify all test cases pass**
- [x] **Step 4: Commit template engine**

---

### Task 4: MQTT Protocol Engine & Wildcard Trie (`core/mqtt`)

**Files:**
- Create: `src/core/mqtt/types.ts`
- Create: `src/core/mqtt/MQTTTopicMatcher.ts`
- Create: `src/core/mqtt/MQTTClientAdapter.ts`
- Create: `src/core/mqtt/MQTTConnectionManager.ts`
- Create: `tests/core/mqtt/MQTTTopicMatcher.test.ts`
- Create: `tests/core/mqtt/MQTTConnectionManager.test.ts`

**Interfaces:**
- Produces:
  - `MQTTTopicMatcher`: matching single (`+`) and multi (`#`) wildcards.
  - `MQTTClientAdapter`: MQTT.js wrapper handling WS/WSS, MQTT 3.1.1, MQTT 5.0, LWT, reconnect, QoS 0/1/2.
  - `MQTTConnectionManager`: Singleton registry managing multiple client connections, emitting status events (`disconnected`, `connecting`, `connected`, `reconnecting`, `error`) and packet traffic.

- [x] **Step 1: Write tests for TopicMatcher and ConnectionManager**
- [x] **Step 2: Implement MQTTTopicMatcher**
- [x] **Step 3: Implement MQTTClientAdapter & MQTTConnectionManager**
- [x] **Step 4: Run tests and verify protocol lifecycle events**
- [x] **Step 5: Commit MQTT core layer**

---

### Task 5: Workflow Execution Engine with 14 Step Executors (`core/workflow`)

**Files:**
- Create: `src/core/workflow/types.ts`
- Create: `src/core/workflow/StepExecutors.ts`
- Create: `src/core/workflow/WorkflowEngine.ts`
- Create: `tests/core/workflow/WorkflowEngine.test.ts`

**Interfaces:**
- Produces: `WorkflowEngine` supporting:
  - Sequential execution and DAG traversal
  - Request/Response correlation (`wait_for_message` with correlation criteria)
  - 14 Step Types: `publish`, `subscribe`, `unsubscribe`, `delay`, `wait_for_message`, `validate_payload`, `set_variable`, `extract_variable`, `condition`, `loop`, `log`, `stop`, `fail`, `switch_connection`
  - Lifecycle hooks: `onStepStart`, `onStepComplete`, `onStepError`, `onWorkflowComplete`
  - Real-time cancel / abort capability

- [x] **Step 1: Write unit tests covering sequential execution, wait-for-message correlation, and conditional branching**
- [x] **Step 2: Implement StepExecutors for all 14 types**
- [x] **Step 3: Implement WorkflowEngine graph runner**
- [x] **Step 4: Verify test suite passes**
- [x] **Step 5: Commit workflow engine**

---

### Task 6: Studio UI Workbench & Shared Design System

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/lib/utils.ts`
- Create: `src/app/store/studioStore.ts`
- Create: `src/app/layout/StudioHeader.tsx`
- Create: `src/app/layout/StudioSidebar.tsx`
- Create: `src/app/layout/StudioBottomPanel.tsx`
- Create: `src/app/layout/StudioWorkbench.tsx`

**Interfaces:**
- Produces: Complete IDE shell with dark-mode theme, collapsible panels, active connection selector, and tabbed view navigation (`publisher`, `subscriber`, `workflow`, `connections`).

- [x] **Step 1: Implement Tailwind utilities and Radix/shadcn UI components**
- [x] **Step 2: Create studioStore (Zustand) for active tabs and view states**
- [x] **Step 3: Build responsive workbench shell components**
- [x] **Step 4: Verify workbench renders cleanly**
- [x] **Step 5: Commit UI shell**

---

### Task 7: Connection Manager Module (`features/connections`)

**Files:**
- Create: `src/features/connections/ConnectionModal.tsx`
- Create: `src/features/connections/ConnectionList.tsx`
- Create: `src/features/connections/ConnectionCard.tsx`
- Create: `src/features/connections/ConnectionStatusBadge.tsx`

**Interfaces:**
- Allows users to:
  - Add, edit, clone, delete broker profiles
  - Configure WS/WSS, Host, Port, Path, Client ID, Username, Password, MQTT 3.1.1/5.0, Clean Session/Start, Keep Alive, Timeout, Reconnect, LWT, User Properties
  - Connect/Disconnect with live visual status
  - Load pre-configured public test brokers with 1 click

- [x] **Step 1: Implement connection configuration dialog with Zod validation**
- [x] **Step 2: Implement profile management and instant connect/disconnect triggers**
- [x] **Step 3: Connect to MQTTConnectionManager and Dexie storage**
- [x] **Step 4: Verify connection UI and profile CRUD**
- [x] **Step 5: Commit connection manager**

---

### Task 8: Advanced Message Publisher Module (`features/publisher`)

**Files:**
- Create: `src/features/publisher/PublisherView.tsx`
- Create: `src/features/publisher/PayloadEditor.tsx`
- Create: `src/features/publisher/PublishPresetManager.tsx`
- Create: `src/features/publisher/VariableHelperModal.tsx`

**Interfaces:**
- Features:
  - Monaco Editor for JSON/XML/Text/Hex/Base64
  - JSON formatting (prettify), minification, syntax error detection
  - Dynamic variable helper drawer with insertion into editor
  - Publish Once, Publish Repeatedly (N times), Publish on Interval, Delay publish
  - Save as Preset and quick preset loader

- [x] **Step 1: Integrate Monaco Editor with format switching and validation**
- [x] **Step 2: Implement dynamic variable picker and preview resolver**
- [x] **Step 3: Implement publish scheduling and repeat logic**
- [x] **Step 4: Verify message dispatch and preset saving**
- [x] **Step 5: Commit publisher module**

---

### Task 9: Real-Time Message Subscriber & Inspector Module (`features/subscriber`)

**Files:**
- Create: `src/features/subscriber/SubscriberView.tsx`
- Create: `src/features/subscriber/TopicSubscriptionBar.tsx`
- Create: `src/features/subscriber/MessageTableView.tsx`
- Create: `src/features/subscriber/MessageDetailInspector.tsx`
- Create: `src/features/subscriber/HexViewer.tsx`
- Create: `src/features/subscriber/JsonTreeView.tsx`

**Interfaces:**
- Features:
  - Topic subscription management with wildcards (`+`, `#`) and QoS settings
  - Real-time message streaming with Pause/Resume, Search & Filter (topic regex, payload text, QoS, retain)
  - Multi-tab detail inspector: Raw, Pretty JSON, JSON Tree, Hex viewer, MQTT 5 user properties
  - Message actions: Copy topic, Copy payload, Republish, Export (JSON/CSV), Clear stream

- [x] **Step 1: Implement subscription manager and wildcard listener**
- [x] **Step 2: Implement virtualized message table and filtering**
- [x] **Step 3: Implement JSON Tree View and Hex View inspectors**
- [x] **Step 4: Verify live message receipt, tree inspection, and export**
- [x] **Step 5: Commit subscriber module**

---

### Task 10: Visual Workflow Automation Studio with React Flow (`features/workflows`)

**Files:**
- Create: `src/features/workflows/WorkflowStudio.tsx`
- Create: `src/features/workflows/WorkflowCanvas.tsx`
- Create: `src/features/workflows/WorkflowNodePalette.tsx`
- Create: `src/features/workflows/WorkflowNodeInspector.tsx`
- Create: `src/features/workflows/WorkflowRunControls.tsx`
- Create: `src/features/workflows/nodes/WorkflowCustomNode.tsx`
- Create: `src/features/workflows/templates/defaultWorkflows.ts`

**Interfaces:**
- Features:
  - Drag-and-drop React Flow canvas with custom nodes for 14 step types
  - Visual status glow on nodes (Idle, Running, Success, Failed)
  - Node configuration inspector for topics, payloads, timeouts, extraction paths, conditions
  - Workflow execution controls (Run, Pause, Abort, Reset)
  - Preloaded templates (Request/Response RPC, Telemetry Simulator, Sequential Command Chain)

- [x] **Step 1: Implement custom React Flow nodes with port connections**
- [x] **Step 2: Build node palette, drag-and-drop canvas, and property inspector**
- [x] **Step 3: Wire WorkflowCanvas to WorkflowEngine with live step status updates**
- [x] **Step 4: Implement pre-built workflow templates and run tests**
- [x] **Step 5: Commit visual workflow studio**

---

### Task 11: Telemetry, Logs & Quality Verification (`features/logs`)

**Files:**
- Create: `src/features/logs/ConnectionLogsTab.tsx`
- Create: `src/features/logs/WorkflowConsoleTab.tsx`
- Create: `src/features/logs/NetworkDiagnosticsTab.tsx`
- Create: `tests/e2e/mqtt-studio.test.ts`

**Interfaces:**
- Features:
  - Live socket event logs (CONNECT, CONNACK, SUBACK, PING, DISCONNECT)
  - Workflow execution step console
  - Latency diagnostics and throughput monitor
  - Complete automated test suite pass

- [ ] **Step 1: Implement bottom panel log drawers**
- [ ] **Step 2: Run all unit and integration tests**
- [ ] **Step 3: Run full production build (`npm run build`) and fix any issues**
- [ ] **Step 4: Verify responsive design and developer experience**
- [ ] **Step 5: Commit final features and documentation**
