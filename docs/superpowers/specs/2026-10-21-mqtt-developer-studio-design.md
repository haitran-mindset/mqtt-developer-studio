# Design Specification: MQTT Developer Studio

- **Date**: 2026-10-21
- **Status**: Draft -> Under Review
- **System**: MQTT Developer Studio (Web-based IDE for MQTT Debugging, Testing, Monitoring, Automation & Simulation)

---

## 1. System Overview & Objectives

**MQTT Developer Studio** is an advanced, developer-first web application designed for IoT engineers, frontend/mobile engineers, embedded system developers (ESP32/ESP8266), and QA specialists.

The application delivers a workbench comparable to Postman, MQTTX, and MQTT Explorer, optimized for real-world asynchronous MQTT architectures with an integrated visual automation engine.

### Key Capabilities
- **Multi-Broker Connection Manager**: Support for simultaneous active connections over WebSockets (WS and WSS), supporting both MQTT 3.1.1 and MQTT 5.0 with full LWT and session configuration.
- **Advanced Publisher**: Multi-format payload authoring (JSON, XML, Plain Text, Hex, Base64, Binary) with Monaco Editor, dynamic runtime variable interpolation (`{{timestamp}}`, `{{uuid}}`, `{{sequence}}`, etc.), and recurring/scheduled publish triggers.
- **Real-Time Subscriber & Inspector**: High-throughput message ingestion with wildcard filtering (`+`, `#`), multi-view payload inspection (Raw, JSON Tree, Pretty JSON, Hex), and live search/export.
- **Visual Workflow Automation Engine**: React Flow canvas supporting DAG-based execution with 14 specialized step types, automated request/response RPC correlation, timeout/retry mechanics, JSONPath data extraction, and conditional branching.
- **Local Persistence & Privacy**: Dexie.js (IndexedDB) persistence for connection profiles, message history, presets, and workflows, keeping all credentials strictly local to the user's browser.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Framework** | React 18 / 19, TypeScript (Strict Mode), Vite | High-performance reactive web application |
| **Styling & UI Tokens** | Tailwind CSS v4, Lucide React, Radix UI primitives / shadcn/ui | Modern, responsive developer-oriented dark-themed IDE UI |
| **MQTT Client** | `mqtt` (MQTT.js v5) | Protocol parsing, WS/WSS networking, MQTT 3.1.1 & 5.0 compliance |
| **Code & Payload Editor** | `@monaco-editor/react` | JSON linting, schema validation, minification, formatting |
| **Visual Workflow Engine** | `@xyflow/react` (React Flow) | Node graph canvas, drag-and-drop workflow authoring, connection ports |
| **State Management** | Zustand | Fast UI shell state, active selection, panel collapse/expand |
| **Async State & Cache** | TanStack Query | Query caching for persisted Dexie entities |
| **Database (Persistence)** | Dexie.js | IndexedDB wrapper for connection profiles, presets, workflows, logs |
| **Data Grid** | TanStack Table | High-performance virtualized packet streams and table displays |
| **Form Handling** | React Hook Form + Zod | Strictly validated connection profile and publish schema |
| **Utilities** | `date-fns`, `uuid`, `sonner` | Date formatting, UUID generation, non-blocking toast notifications |
| **Testing** | Vitest, React Testing Library, Playwright | Unit, integration, and E2E regression tests |

---

## 3. Architecture & Separation of Concerns

The project follows a **Feature-Driven Architecture** with strict isolation of the networking and execution layer from the React rendering tree:

```
src/
├── app/                      # Shell layout, tab routing, provider hierarchy
│   ├── App.tsx
│   ├── layout/
│   │   ├── StudioWorkbench.tsx
│   │   ├── ActivityBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TabbedStage.tsx
│   │   └── BottomPanel.tsx
├── core/                     # Decoupled business logic (Independent of React)
│   ├── mqtt/
│   │   ├── MQTTConnectionManager.ts   # Active client registry & connection pool
│   │   ├── MQTTClientAdapter.ts       # Protocol wrapper for MQTT.js (3.1.1 & 5.0)
│   │   ├── MQTTTopicMatcher.ts        # Trie-based topic wildcard matching (+, #)
│   │   └── types.ts                   # Strongly typed protocol domain models
│   ├── template/
│   │   ├── VariableInterpolation.ts   # Resolver for {{uuid}}, {{timestamp}}, etc.
│   │   └── types.ts
│   ├── workflow/
│   │   ├── WorkflowEngine.ts          # Asynchronous DAG / State Machine executor
│   │   ├── StepExecutors/             # 14 distinct step implementations
│   │   │   ├── PublishStepExecutor.ts
│   │   │   ├── SubscribeStepExecutor.ts
│   │   │   ├── WaitForMessageStepExecutor.ts
│   │   │   ├── ValidatePayloadStepExecutor.ts
│   │   │   ├── ConditionalBranchExecutor.ts
│   │   │   ├── LoopStepExecutor.ts
│   │   │   ├── SetVariableExecutor.ts
│   │   │   ├── ExtractVariableExecutor.ts
│   │   │   └── ...
│   │   └── types.ts
│   └── db/
│       ├── StudioDatabase.ts          # Dexie.js schema definition
│       └── repositories/              # CRUD interfaces for profiles, presets, runs
├── features/                 # Modular UI slices
│   ├── connections/          # Broker profiles, connection modal, status badges
│   ├── publisher/            # Monaco editor, publish controls, presets
│   ├── subscriber/           # Live stream, filter bar, JSON tree, hex viewer
│   ├── workflows/            # React Flow canvas, node palette, step properties
│   └── logs/                 # Packet inspector, socket events, engine output
├── components/ui/            # Shared design system components
└── lib/                      # Pure helper utilities
```

---

## 4. Subsystem Specifications

### 4.1 Connection Management (`core/mqtt/MQTTConnectionManager`)
- **Connection Registry**: Holds active `MqttClient` references by ID, maintaining connectivity states (`disconnected`, `connecting`, `connected`, `reconnecting`, `error`).
- **Network Protocol**: Restricts browser transport to `ws://` and `wss://`. Supports user-configurable path (e.g. `/mqtt`).
- **MQTT 5.0 & 3.1.1 Support**: Configurable protocol version flag, Clean Start / Clean Session, Session Expiry Interval, Keep Alive, and Connect Timeout.
- **Last Will and Testament (LWT)**: Full support for topic, payload, QoS (0, 1, 2), retain flag, and MQTT 5 LWT properties (Will Delay Interval, User Properties).
- **Diagnostics & Latency**: Sends periodic PINGREQ or measures round-trip time (RTT) when possible to display real-time latency indicators.
- **Security & Privacy**: Passwords stored in IndexedDB are never printed in plain text in logs or telemetry exports.

### 4.2 Dynamic Template Engine (`core/template/VariableInterpolation`)
- Resolves bracketed variables before dispatch:
  - `{{timestamp}}`: Unix epoch in seconds.
  - `{{timestamp_ms}}`: Unix epoch in milliseconds.
  - `{{iso_date}}`: Standard ISO-8601 UTC date string.
  - `{{uuid}}`: Generated cryptographically secure RFC4122 v4 UUID.
  - `{{random_int(min, max)}}`: Random integer within bounds.
  - `{{client_id}}`: Active client identifier.
  - `{{sequence}}`: Auto-incrementing session sequence number.
  - Custom user-defined context variables from the workflow or publisher presets.
- **Monaco Payload Editor**:
  - Full syntax highlighting for JSON, XML, Plain Text.
  - Real-time JSON validation with error markers.
  - Payload formatting (Prettify) and Minification.
  - Live byte-size computation.

### 4.3 Live Subscriber & Message Inspector (`features/subscriber`)
- **Wildcard Trie Matching**: Supports Single-Level (`+`) and Multi-Level (`#`) MQTT wildcards with high-performance routing.
- **Inspection Modes**:
  - **Raw View**: Unaltered UTF-8 string or raw bytes.
  - **JSON Tree View**: Expandable/collapsible interactive node hierarchy with copy buttons for paths and values.
  - **Pretty JSON**: Formatted JSON code block with syntax coloring.
  - **Hex View**: Dual-column hexadecimal and ASCII representation for binary telemetry.
- **Stream Controls**:
  - **Pause / Resume**: Pauses UI rendering stream without closing network subscriptions.
  - **Filter & Search**: Quick filter by topic, payload text search, QoS, retain flag, or connection ID.
  - **Actions**: One-click "Republish", "Copy as cURL/Code", "Save as Preset", and JSON/CSV export.

### 4.4 Visual Workflow Automation Engine (`core/workflow` & `features/workflows`)
- **Visual Canvas (@xyflow/react)**:
  - Drag-and-drop palette of workflow nodes.
  - Directed connections: standard flow output, conditional `true` and `false` branches, and loop back-edges.
  - Real-time step execution badge: Pending (gray), Running (pulsing blue), Succeeded (green), Failed (red).
- **14 Supported Step Types**:
  1. `publish`: Publish topic, payload, QoS, retain.
  2. `subscribe`: Subscribe to topic and await SUBACK before proceeding.
  3. `unsubscribe`: Unsubscribe from topic.
  4. `delay`: Wait specified duration in milliseconds.
  5. `wait_for_message`: Listen on a topic for a matching message within a timeout window, with optional correlation ID matching (e.g. `payload.requestId === context.requestId`).
  6. `validate_payload`: Assertion checks on payload fields (equals, contains, regex, numeric comparisons).
  7. `set_variable`: Assign or compute variable into workflow runtime context.
  8. `extract_variable`: Use JSONPath to extract value from received payload into context.
  9. `condition`: Evaluate JavaScript expression / conditional logic to branch flow.
  10. `loop`: Repeat a sub-graph $N$ times or while condition holds.
  11. `log`: Write structured message to workflow execution console.
  12. `stop`: Explicit graceful termination.
  13. `fail`: Abort workflow with custom error reason.
  14. `switch_connection`: Switch active target broker connection mid-workflow.
- **Race Condition Prevention**: Enforces subscription confirmation before publishing commands that expect responses.
- **Execution Run History**: Complete execution timeline with step durations, context snapshots, and error traces saved to Dexie DB.

### 4.5 Built-In Seed Data & Templates
- **Default Broker Presets**:
  - EMQX Public WSS (`broker.emqx.io:8084/mqtt`)
  - HiveMQ Public WSS (`broker.hivemq.com:8884/mqtt`)
  - Eclipse Mosquitto Public WSS (`test.mosquitto.org:8081/mqtt`)
- **Ready-to-Run Workflow Templates**:
  - *Request-Response RPC*: Command publication with correlation ID and response validation.
  - *Device Telemetry Simulator*: Looped sensor metric broadcast with jitter and dynamic timestamping.
  - *Sequential Maintenance Chain*: Multi-step device restart and firmware status polling.

---

## 5. UI/UX Workbench Layout

The workbench adopts an integrated IDE aesthetic inspired by Postman and VS Code:
- **Left Activity Bar**: Vertical icons for Connection Manager, Publisher, Live Inspector, Workflows, and Global Settings.
- **Sidebar**: Contextual panels showing connection list, topic tree, and preset libraries.
- **Tabbed Stage**: Multi-tab interface allowing developers to keep a workflow canvas open side-by-side or tab-switched with live message streams.
- **Bottom Panel**: Collapsible drawer with tabs for Connection Logs, Socket Traffic, and Workflow Console.

---

## 6. Testing & Quality Verification Strategy

- **Unit Tests (Vitest)**:
  - Topic wildcard matching algorithms (`+`, `#`).
  - Variable interpolation parser with all built-in tokens.
  - Workflow step executors (Publish, Wait, Validate, Extract, Loop, Condition).
- **Component Tests (React Testing Library)**:
  - Connection form validation and Zod schema compliance.
  - Monaco Editor integration and payload format switching.
- **End-to-End Tests (Playwright)**:
  - Establishing connection to public WSS test broker.
  - Publishing message and verifying receipt in live subscriber stream.
  - Running a complete 3-step automation workflow to success.

---

## 7. Approval & Next Steps

Upon review and approval of this specification, implementation will proceed systematically under the `writing-plans` workflow.
