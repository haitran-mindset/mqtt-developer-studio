# Real-Time Mini Dashboard & Data Visualization Design Spec

## Goal
Build a real-time, responsive telemetry mini dashboard and visual control panel inside MQTT Developer Studio. The dashboard enables developers and IoT engineers to visualize incoming MQTT telemetry streams (numerical metrics, status flags, time-series data) and interactively send device control commands (switches, buttons) directly from the application workspace.

---

## 1. Architecture & Data Flow

```
                      ┌──────────────────────────────────────┐
                      │        Active Broker Adapter         │
                      └──────────────────┬───────────────────┘
                                         │ Incoming Message Event
                                         ▼
                      ┌──────────────────────────────────────┐
                      │      Dashboard Telemetry Engine      │
                      │  - Auto-subscribes widget topics     │
                      │  - TopicMatcher pattern routing      │
                      │  - JSONPath / Raw Number extractor   │
                      │  - Ring buffer (sliding time-series) │
                      └──────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[📈 Line Chart Widget]          [⏱️ Radial Gauge Widget]         [🎛️ Toggle Switch Widget]
- Time-series SVG bezier        - Angle arc 240°                 - Bi-directional sync
- Min/Max/Avg indicators        - Danger thresholds              - Publish ON/OFF commands
```

### Auto-Subscription & Topic Binding
1. Each widget specifies a `topic` (or `publishTopic` / `subscribeTopic` for interactive controls).
2. When the Dashboard view is active and connected to an active broker, the dashboard telemetry hook inspects all configured widgets and ensures the connection adapter is subscribed to each unique topic.
3. When messages arrive, `MQTTTopicMatcher.matches(widget.topic, message.topic)` checks if the message belongs to that widget.
4. If matched, the payload is extracted via `extractTelemetryValue(payload, jsonPath)` and pushed into the widget's local or shared telemetry buffer.

### Telemetry Extractor Logic
- **Direct Number:** `"25.4"` -> `25.4`
- **JSON Object:** `{"temp": 28.5, "unit": "C"}` with path `$.temp` or `temp` -> `28.5`
- **Nested JSON:** `{"d": {"sensors": [{"id": 1, "val": 102.3}]}}` with path `$.d.sensors[0].val` -> `102.3`
- **Status String / Boolean:** `"ON"`, `"OFF"`, `"RUNNING"`, `true`, `false` -> parsed for Status LED / Switch state.

---

## 2. Widget Catalog & Specifications

### 2.1. Line Chart Widget (Time-Series)
- **Visuals:** SVG vector path with gradient area fill under the curve, responsive coordinates, grid lines, and smooth bezier curves.
- **Data:** Sliding window of up to 50 latest data points.
- **Metrics:** Displays current value, minimum value, maximum value, and running average.
- **Config:** `topic`, `jsonPath`, `unit`, `maxPoints`, `color` (cyan, emerald, violet, amber, rose).

### 2.2. Radial Gauge Widget
- **Visuals:** 240-degree SVG circular arc with gradient stroke, animated needle or progress sweep, min/max labels, and central numeric readout.
- **Thresholds:** Configurable low/warning/danger threshold zones (e.g. green < 70, yellow 70-90, red > 90).
- **Config:** `topic`, `jsonPath`, `min`, `max`, `unit`, `thresholds`.

### 2.3. Stat / Metric Card Widget
- **Visuals:** High-impact studio typography showing latest value, unit, label, delta compared to previous reading (`+1.2%`, `-0.5`), and last received timestamp.
- **Config:** `topic`, `jsonPath`, `label`, `unit`, `icon`.

### 2.4. Status LED Widget
- **Visuals:** Glowing status pill / beacon with pulsing indicator and semantic status text (e.g. `ONLINE`, `STANDBY`, `FAULT`).
- **Mapping:** User-configurable key-value mapping (e.g., `"1"` / `"true"` / `"RUNNING"` -> Green; `"0"` / `"false"` / `"STOPPED"` -> Zinc/Red).
- **Config:** `topic`, `jsonPath`, `mapping`.

### 2.5. Switch / Toggle Widget
- **Visuals:** Interactive tactile toggle switch with state indication and live broker feedback ack.
- **Publish Action:** On flip, publishes `onPayload` (e.g. `{"state":"ON"}`) or `offPayload` (`{"state":"OFF"}`) to `publishTopic`.
- **Feedback Sync:** Updates state if incoming message on `subscribeTopic` changes.
- **Config:** `publishTopic`, `subscribeTopic`, `onPayload`, `offPayload`, `qos`, `retain`.

### 2.6. Push Button / Trigger Widget
- **Visuals:** Studio command button with icon, label, and tactile press animation.
- **Publish Action:** Publishes defined payload (e.g. `{"command":"REBOOT"}`) to target topic with selected QoS.
- **Config:** `topic`, `payload`, `qos`, `retain`, `buttonLabel`, `color`.

---

## 3. Data Structures & Types

```typescript
export type DashboardWidgetType =
  | 'line_chart'
  | 'gauge'
  | 'stat_card'
  | 'status_led'
  | 'switch'
  | 'push_button';

export interface DashboardWidgetConfig {
  id: string;
  type: DashboardWidgetType;
  title: string;
  topic: string;
  publishTopic?: string; // For switch / button
  jsonPath?: string;
  unit?: string;
  min?: number;
  max?: number;
  color?: string;
  onPayload?: string;
  offPayload?: string;
  buttonPayload?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  statusMapping?: Array<{ value: string; label: string; color: 'emerald' | 'amber' | 'rose' | 'cyan' | 'zinc' }>;
  colSpan?: 1 | 2 | 3 | 4; // Grid sizing
}

export interface DashboardState {
  widgets: DashboardWidgetConfig[];
  telemetryData: Record<string, Array<{ timestamp: number; value: number | string }>>;
}
```

---

## 4. UI / UX Integration
1. **Studio Header & Navigation:**
   - Add `{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }` to `STUDIO_NAV_ITEMS`.
   - Update `StudioTab` type in `studioStore.ts` to include `'dashboard'`.
2. **Main Workbench:**
   - Render `<DashboardStudio />` when `activeTab === 'dashboard'`.
3. **Sidebar Integration:**
   - Add sidebar section showing widget count, quick "Add Widget" trigger, preset loader (Smart Home IoT, Industrial Sensor, Vehicle Telemetry), and reset layout button.
4. **Widget Grid:**
   - Responsive CSS Grid (1 column on mobile, 2 columns on tablet, 3-4 columns on desktop).
   - Widget actions: Edit widget configuration, duplicate, delete, and manual refresh.
