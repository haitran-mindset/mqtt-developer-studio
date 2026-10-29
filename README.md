# 🚀 MQTT Developer Studio

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT_5.0_%26_3.1.1-660066?style=for-the-badge&logo=mqtt&logoColor=white)

**A professional, developer-first web-based IDE for MQTT testing, debugging, real-time monitoring, and visual workflow automation.**

[Key Features](#-key-features) • [Getting Started](#-getting-started) • [Architecture](#-project-architecture) • [Workflow Engine](#-visual-workflow-automation-engine) • [Import & Export](#-multi-workflow-batch-import--export) • [License](#-license)

</div>

---

## 📖 Overview

**MQTT Developer Studio** is an advanced, developer-first web application designed for IoT engineers, embedded systems developers (ESP32, ESP8266, STM32, Raspberry Pi), frontend/mobile developers, and QA automation specialists.

Combining the multi-connection capabilities of tools like **MQTTX** and **MQTT Explorer** with the testing and mocking depth of **Postman**, it features a **Visual Workflow Automation Engine** (powered by React Flow). This allows teams to simulate devices, automate complex asynchronous request-response RPC patterns, and test telemetry pipelines directly from the browser without setting up backend test harnesses.

---

## ✨ Key Features

### 1. 🌐 Multi-Broker Connection Manager

- **Concurrent Connections**: Connect to and manage multiple active MQTT brokers simultaneously over WebSockets (`ws://` and `wss://`).
- **Comprehensive Protocol Support**: Full compliance with both **MQTT 3.1.1** and **MQTT 5.0**.
- **Granular Configurations**: Custom Client ID, Username/Password authentication, Clean Session / Clean Start, Session Expiry Interval, Keep Alive, and Connect Timeout.
- **Last Will and Testament (LWT)**: Full support for LWT topic, payload, QoS (0, 1, 2), retain flag, and MQTT 5 User Properties.
- **Diagnostics & Auto-Reconnect**: Real-time connection status badges, disconnection alerts, and automatic reconnection handling.

### 2. 📤 Advanced Publisher

- **Monaco Code Editor**: Professional payload editing with syntax highlighting, real-time JSON validation, automatic formatting (_Prettify_), and minification (_Minify_).
- **Multi-Format Payloads**: Author payloads in JSON, Plain Text, Hex, XML, or Base64.
- **Dynamic Template Engine**: Inject dynamic runtime variables into topics and payloads:
  - `{{timestamp}}`: Unix epoch in seconds.
  - `{{timestamp_ms}}`: Unix epoch in milliseconds.
  - `{{iso_date}}`: Standard ISO-8601 UTC date string.
  - `{{uuid}}`: Cryptographically secure RFC4122 v4 UUID.
  - `{{random_int(min, max)}}`: Random integer within bounds.
  - `{{client_id}}`: Active client identifier.
  - `{{sequence}}`: Auto-incrementing session sequence number.
- **Periodic Publishing Scheduler**: Schedule recurring message dispatches at specified intervals (ms) to simulate continuous sensor telemetry.
- **Publish Presets**: Save frequently used topic and payload templates for one-click re-use.

### 3. 📥 Live Subscriber & Real-Time Message Inspector

- **Flexible Topic Subscriptions**: Subscribe to multiple topics with full wildcard support (`+` single-level, `#` multi-level).
- **Instant Filtering & Search**: Filter messages by topic, full-text payload search, QoS level, retained flag, or broker connection ID.
- **Multi-Inspection Views**:
  - **Raw View**: Unaltered raw UTF-8 text representation.
  - **JSON Tree View**: Interactive, expandable/collapsible tree with quick path and value copying.
  - **Pretty JSON**: Colorized, formatted JSON block.
  - **Hex Viewer**: Dual-column Hex and ASCII view for binary telemetry analysis.
- **Stream Controls**: Pause and resume live rendering streams without disconnecting network subscriptions.
- **Data Export**: Export received message history to JSON or CSV files.

### 4. ⚡ Visual Workflow Automation Engine

- **Interactive Node Graph Canvas** (powered by `@xyflow/react` / React Flow):
  - Drag-and-drop workflow step palette.
  - Direct connections: Main flow, conditional `true` / `false` branches, and loop back-edges.
  - Live execution status badges: _Idle, Running (pulsing), Succeeded, Failed_.
- **14 Specialized Step Types**:
  1. `publish`: Publish a message with topic, payload, QoS, and retain settings.
  2. `subscribe`: Subscribe to a topic and await SUBACK before proceeding.
  3. `unsubscribe`: Unsubscribe from a topic.
  4. `delay`: Pause execution for a specified duration in milliseconds.
  5. `wait_for_message`: Await a matching message on a topic within a timeout window, supporting correlation ID matching (e.g., `payload.requestId === context.requestId`).
  6. `validate_payload`: Assertion checks on payload properties (equals, contains, regex, numeric comparisons).
  7. `set_variable`: Define or compute runtime variables in the workflow context.
  8. `extract_variable`: Use JSONPath expressions to extract payload values into context variables.
  9. `condition`: Evaluate JavaScript expressions to branch flow logic.
  10. `loop`: Repeat a sub-graph $N$ times or while a condition remains truthy.
  11. `log`: Write structured output to the workflow console.
  12. `stop`: Explicit graceful termination.
  13. `fail`: Abort execution with a custom error message.
  14. `trigger_event`: Dispatch custom internal events.
- **Workflow Templates Library**: Pre-built, real-world templates (Request/Response RPC, Temperature/Humidity Sensor Simulation, Device Provisioning Flow, Stress & Load Testing).
- **Execution & History Controls**: Run complete workflow, Run from Selected Node, Abort execution, Reset step markers, and Full Undo / Redo history (`Ctrl+Z` / `Ctrl+Y`).
- **Drag-and-Drop Reordering**: Easily reorder workflows in the sidebar via drag handles.

### 5. 📦 Multi-Workflow Batch Import & Export

- **Flexible Export**:
  - **Export Current**: Export the active workflow into a clean `.json` file.
  - **Export All**: Export all studio workflows into a single bundle package (`mqtt-workflows-bundle.json`).
  - **Export Selected**: Interactive modal allowing users to search, select/deselect specific workflows with _Select All_ / _None_ shortcuts, and customize the bundle filename.
- **Batch Import**:
  - Select **multiple `.json` files simultaneously** via the file picker.
  - Automatically detects individual workflow files, bundle packages (`mqtt-studio-workflows-bundle`), and JSON arrays.
  - Auto-regenerates unique IDs for workflows, nodes, and edges to prevent canvas collisions.

### 6. 🔒 Privacy-First Architecture

- **Strictly Local Storage**: Connection credentials, passwords, message histories, presets, and workflows are stored exclusively in the browser using **IndexedDB** (Dexie.js) and **LocalStorage** (Zustand persist).
- **Zero Cloud Leakage**: No telemetry, analytics, or credentials leave the user's browser. The application operates entirely client-side.

### 7. 📱 Responsive & Adaptive IDE Layout

- Seamlessly adapts across all screen breakpoints:
  - **Desktop (>= 1024px)**: Full 3-column developer workbench (Sidebar, Canvas/Stage, Inspector).
  - **Tablet (768px - 1023px)**: Space-efficient header with collapsed labels and preserved icon controls.
  - **Mobile (< 768px)**: Bottom Navigation bar, drawer menus, full-width touch-friendly modals, and drawer-based Step Palette & Inspector.

---

## 🛠️ Tech Stack

| Layer                | Technology                               | Purpose                                                      |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Core Framework**   | React 18, TypeScript (Strict Mode), Vite | High-performance reactive web application                    |
| **Styling & Icons**  | Tailwind CSS v4, Lucide React            | Modern dark-themed developer IDE interface                   |
| **UI Primitives**    | Radix UI (`@radix-ui/*`) / shadcn/ui     | Accessible Dialog, DropdownMenu, Select, Tabs, Tooltip       |
| **MQTT Client**      | `mqtt` (MQTT.js v5)                      | WebSocket transport, MQTT 3.1.1 & 5.0 protocol engine        |
| **Code Editor**      | `@monaco-editor/react`                   | Payload editing, JSON validation, and formatting             |
| **Workflow Canvas**  | `@xyflow/react` (React Flow)             | Drag-and-drop node graph canvas and edges                    |
| **State Management** | Zustand (with Persist Middleware)        | UI workbench state and persisted user preferences            |
| **Local Database**   | Dexie.js (IndexedDB)                     | Local persistence for profiles, presets, logs, and workflows |
| **Notifications**    | `sonner`                                 | Non-blocking toast notifications                             |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm** (or `pnpm` / `yarn`)

### 1. Clone the repository

```bash
git clone https://github.com/haitran-mindset/mqtt-developer-studio.git
cd mqtt-developer-studio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Open your browser and navigate to: `http://localhost:3000`

### 4. Build for production

```bash
npm run build
```

The optimized production bundle will be generated in the `dist/` directory.

### 5. Preview production build

```bash
npm run preview
```

---

## 📂 Project Architecture

```
mqtt-tool/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Shell layout & provider hierarchy
│   │   ├── layout/             # StudioHeader, StudioSidebar, StudioBottomNav
│   │   └── navigation.ts       # Unified navigation configuration
│   ├── components/             # Reusable UI component library
│   │   └── ui/                 # Button, Dialog, Select, Dropdown, Tabs, Input...
│   ├── core/                   # Decoupled business logic
│   │   ├── db/                 # Dexie database & schema models
│   │   ├── mqtt/               # MQTTClientAdapter, MQTTConnectionManager, Types
│   │   ├── store/              # Zustand stores (studioStore, dataStore)
│   │   ├── template/           # Dynamic variable engine ({{timestamp}}, {{uuid}}...)
│   │   └── workflow/           # WorkflowEngine, Step Executors, Batch Import/Export
│   ├── features/               # Modular application slices
│   │   ├── connections/        # Broker profiles, connection modal, status badges
│   │   ├── publisher/          # Monaco editor, publish controls, presets, scheduler
│   │   ├── subscriber/         # Message stream, topic filters, JSON tree & hex viewer
│   │   ├── workflows/          # React Flow canvas, node palette, step inspector
│   │   └── logs/               # Packet inspector, socket events, console output
│   ├── hooks/                  # Custom React hooks (useIsMobile, useWorkflowHistory...)
│   ├── lib/                    # Helper utilities (cn, formatting)
│   ├── index.css               # Tailwind CSS styles and theme design tokens
│   └── main.tsx                # Application entry point
├── docs/                       # Architecture specifications and plans
├── package.json                # Project dependencies and npm scripts
└── vite.config.ts              # Vite configuration and path aliases
```

---

## 💡 Quick Workflow Guide

1. Open the **Workflows** tab via the sidebar or top navigation bar.
2. Click the **✨ Templates** button in the studio toolbar to browse pre-built scenarios.
3. Select a template (e.g., _Device Telemetry Simulation_ or _Remote Control Peripheral_).
4. Verify your active broker connection from the **Workflow** selector or top Header.
5. Click **▶ Run** to execute the workflow and observe live node progression on the canvas.
6. When finished, use the **Export** dropdown to save single or bundled workflows to your disk.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and contribute to the IoT and open-source developer community.
