# 🚀 MQTT Developer Studio

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_v2-24C8D5?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-DEA584?style=for-the-badge&logo=rust&logoColor=black)
![MQTT](https://img.shields.io/badge/MQTT_5.0_%26_3.1.1-660066?style=for-the-badge&logo=mqtt&logoColor=white)

**A professional, developer-first desktop & web IDE for MQTT testing, debugging, real-time telemetry monitoring, and visual workflow automation.**

[Key Features](#-key-features) • [Desktop App](#6-️-run-as-desktop-application-tauri-v2) • [Dashboard](#5--real-time-mini-dashboard--data-visualization) • [Workflow Engine](#4--visual-workflow-automation-engine) • [Import & Export](#6--multi-workflow-batch-import--export) • [Getting Started](#-getting-started) • [License](#-license)

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
- **16 Specialized Step Types**:
  1. `start_label`: Flow section entry marker with custom visual downstream color theming.
  2. `mqtt_trigger`: **(New)** Event-driven trigger that auto-executes the workflow when incoming MQTT messages match a topic filter.
  3. `publish`: Publish a message with topic, payload, QoS, and retain settings.
  4. `subscribe`: Subscribe to a topic and await SUBACK before proceeding.
  5. `unsubscribe`: Unsubscribe from a topic.
  6. `delay`: Pause execution for a specified duration in milliseconds.
  7. `wait_for_message`: Await a matching message on a topic within a timeout window, supporting correlation ID matching (e.g., `payload.requestId === context.requestId`).
  8. `validate_payload`: Assertion checks on payload properties (equals, contains, regex, numeric comparisons).
  9. `validate_schema`: Full JSON Schema validator for payload structure and types.
  10. `run_script`: **(New)** Custom asynchronous JavaScript sandbox powered by Monaco Code Editor to transform data, evaluate formulas, or decode binary hex.
  11. `set_variable`: Define or compute runtime variables in the workflow context.
  12. `extract_variable`: Use JSONPath expressions to extract payload values into context variables.
  13. `condition`: Evaluate JavaScript expressions to branch flow logic.
  14. `loop`: Repeat a sub-graph $N$ times or while a condition remains truthy.
  15. `log`: Write structured output to the workflow console.
  16. `stop` / `fail`: Explicit termination or failure assertion.
- **Listen Mode (Event-Driven Background Trigger)**: Arm workflows to continuously listen for matching MQTT messages in the background and auto-execute branches in real time.
- **Test Results & Assertion Summary**: Dedicated "Test Results" tab in the bottom panel displaying Pass/Fail rates, assertion breakdown, and one-click exports to standalone **HTML** and **JSON** test reports.
- **Workflow Templates Library**: Pre-built, real-world templates (Request/Response RPC, Temperature/Humidity Sensor Simulation, Device Provisioning Flow, Stress & Load Testing).
- **Execution & History Controls**: Run complete workflow, Run from Selected Node, Abort execution, Reset step markers, and Full Undo / Redo history (`Ctrl+Z` / `Ctrl+Y`).
- **Drag-and-Drop Reordering**: Easily reorder workflows in the sidebar via drag handles.

### 5. 📊 Real-Time Mini Dashboard & Data Visualization

- **Live Telemetry Monitoring**: Turn raw MQTT streams into visual control panels with zero external dependencies or server-side setups.
- **Auto-Subscription Pipeline**: Automatically subscribes active broker connections to all required telemetry topics declared by widgets.
- **6 Specialized Telemetry Widgets**:
  1. `Line Chart`: Smooth SVG bezier curve time-series with gradient area fill, sliding window history (up to 50 points), and instant Min/Max/Average calculations.
  2. `Radial Gauge`: 240-degree circular arc meter with color-coded safety and danger threshold zones, dynamic progress sweep, and central numerical readout.
  3. `Metric / Stat Card`: High-impact studio typography displaying current value, measurement unit, delta percentage trend (`+1.5%`), and last event timestamp.
  4. `Status LED`: Glowing beacon and pulsating status indicators for discrete operational flags (e.g., `ONLINE`, `WARNING`, `FAULT`) with custom key-value color mappings.
  5. `Toggle Switch`: Interactive tactile control toggle to send ON/OFF command payloads (e.g. `{"state":"ON"}`) to publish topics while synchronizing state from incoming telemetry.
  6. `Push Button`: Command trigger button for instant MQTT dispatches (e.g., `REBOOT`, `CALIBRATE`, `EMERGENCY_STOP`).
- **Data Extractor**: Built-in JSONPath parser supporting dot-notation and array indices (e.g., `$.sensor.temp`, `data.readings[0].val`) as well as raw numeric and boolean payloads.
- **Dashboard Presets**: One-click preset templates for **Smart Home & Environment** and **Industrial Motor & Hydraulics**.
- **Layout Management**: Export and import complete dashboard configurations to/from `.json` files.

### 6. 📦 Multi-Workflow Batch Import & Export

- **Flexible Export**:
  - **Export Current**: Export the active workflow into a clean `.json` file.
  - **Export All**: Export all studio workflows into a single bundle package (`mqtt-workflows-bundle.json`).
  - **Export Selected**: Interactive modal allowing users to search, select/deselect specific workflows with _Select All_ / _None_ shortcuts, and customize the bundle filename.
- **Batch Import**:
  - Select **multiple `.json` files simultaneously** via the file picker.
  - Automatically detects individual workflow files, bundle packages (`mqtt-studio-workflows-bundle`), and JSON arrays.
  - Auto-regenerates unique IDs for workflows, nodes, and edges to prevent canvas collisions.

### 7. 🔒 Privacy-First Architecture

- **In-Memory & Zero LocalStorage Tracking**: The studio operates completely in-memory with zero silent background `localStorage` tracking. Sensitive broker credentials are never saved to disk.
- **Zero Cloud Leakage**: No telemetry, analytics, or credentials leave the user's browser or machine. The application operates entirely client-side.

### 8. 📱 Responsive & Adaptive IDE Layout

- Seamlessly adapts across all screen breakpoints:
  - **Desktop (>= 1024px)**: Full 3-column developer workbench (Sidebar, Canvas/Stage, Inspector).
  - **Tablet (768px - 1023px)**: Space-efficient header with collapsed labels and preserved icon controls.
  - **Mobile (< 768px)**: Bottom Navigation bar, drawer menus, full-width touch-friendly modals, and drawer-based Step Palette & Inspector.

---

## 🛠️ Tech Stack

| Layer                | Technology                               | Purpose                                                      |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Desktop Runtime**  | Tauri v2, Rust 1.99, `rumqttc`, Tokio    | Native OS window, direct raw TCP (1883) & TLS (8883) sockets |
| **Core Framework**   | React 18, TypeScript (Strict Mode), Vite | High-performance reactive web application                    |
| **Styling & Icons**  | Tailwind CSS v4, Lucide React            | Modern dark-themed developer IDE interface                   |
| **UI Primitives**    | Radix UI (`@radix-ui/*`) / shadcn/ui     | Accessible Dialog, DropdownMenu, Select, Tabs, Tooltip       |
| **Web MQTT Client**  | `mqtt` (MQTT.js v5)                      | WebSocket transport (`ws://`, `wss://`)                      |
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

### 6. 🖥️ Run as Desktop Application (Tauri v2)

For native TCP socket connections (`mqtt://host:1883` and `mqtts://host:8883`):

```bash
# Run desktop app in development mode
npm run desktop:dev

# Build native desktop bundle (.dmg, .app, .deb, or .msi)
npm run desktop:build
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
