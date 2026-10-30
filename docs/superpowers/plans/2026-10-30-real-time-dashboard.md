# Real-Time Mini Dashboard & Data Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time mini dashboard and telemetry visualization suite supporting 6 widget types (Line Chart, Radial Gauge, Stat Card, Status LED, Switch, Push Button) with live MQTT data binding, JSON path extraction, preset templates, and responsive studio layout.

**Architecture:** A centralized telemetry extraction engine hooks into incoming MQTT messages via `MQTTConnectionManager` and `useDataStore`. Widgets declare subscription topics and JSON/raw paths. State and configuration are stored with persistence in `dataStore` or a dedicated dashboard store.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, SVG vector graphics (high-performance bezier line charts and radial gauge dials).

**Spec:** `docs/superpowers/specs/2026-10-30-real-time-dashboard-design.md`

## Global Constraints
- Preserve existing documentation integrity and comments.
- Do not run `git commit` commands automatically without user approval.
- Format file links with markdown `[filename](file:///...)`.
- Follow strict TypeScript checks; no `any` where strict types are feasible.

---

### Task 1: Dashboard Types and Telemetry Extractor Utility

**Files:**
- Create: `src/core/dashboard/types.ts`
- Create: `src/core/dashboard/telemetryExtractor.ts`
- Create: `src/core/dashboard/defaultDashboardPresets.ts`

**Interfaces:**
- Produces: `DashboardWidgetConfig`, `DashboardWidgetType`, `extractTelemetryValue(payload, jsonPath)`

- [ ] **Step 1: Create `src/core/dashboard/types.ts`**
  Define types for `DashboardWidgetType`, `DashboardWidgetConfig`, `TelemetryPoint`, `StatusLedMapping`, and `DashboardPreset`.

- [ ] **Step 2: Implement `src/core/dashboard/telemetryExtractor.ts`**
  Implement robust payload extraction supporting raw numeric strings, boolean strings, and nested JSON paths (e.g. `$.sensor.temp` or `sensor.temp`).

- [ ] **Step 3: Create default preset dashboards in `src/core/dashboard/defaultDashboardPresets.ts`**
  Create default widgets for IoT Smart Home (Temperature Line Chart, Humidity Gauge, Living Room Lamp Switch, Smoke Detector LED, HVAC Mode).

---

### Task 2: Dashboard Store & Navigation Integration

**Files:**
- Modify: `src/app/store/studioStore.ts`
- Modify: `src/app/layout/navigation.ts`
- Create: `src/core/store/dashboardStore.ts`
- Modify: `src/app/layout/StudioWorkbench.tsx`
- Modify: `src/app/layout/StudioSidebar.tsx`

**Interfaces:**
- Consumes: `DashboardWidgetConfig`
- Produces: `useDashboardStore`, updated `STUDIO_NAV_ITEMS` with `'dashboard'`

- [ ] **Step 1: Add `'dashboard'` to `StudioTab` in `src/app/store/studioStore.ts`**
- [ ] **Step 2: Add Dashboard entry to `STUDIO_NAV_ITEMS` in `src/app/layout/navigation.ts`**
- [ ] **Step 3: Implement `src/core/store/dashboardStore.ts` with local storage persistence and telemetry ring buffers**
- [ ] **Step 4: Connect active tab routing in `StudioWorkbench.tsx` and sidebar in `StudioSidebar.tsx`**

---

### Task 3: Core Visual Widgets (SVG Line Chart, Radial Gauge, Stat Card, LED)

**Files:**
- Create: `src/features/dashboard/widgets/LineChartWidget.tsx`
- Create: `src/features/dashboard/widgets/GaugeWidget.tsx`
- Create: `src/features/dashboard/widgets/StatCardWidget.tsx`
- Create: `src/features/dashboard/widgets/StatusLedWidget.tsx`
- Create: `src/features/dashboard/widgets/SwitchWidget.tsx`
- Create: `src/features/dashboard/widgets/PushButtonWidget.tsx`

**Interfaces:**
- Consumes: `DashboardWidgetConfig`, telemetry data stream
- Produces: Interactive rendered widget components

- [ ] **Step 1: Implement `LineChartWidget.tsx` (SVG bezier line, gradient fill, min/max/avg metrics)**
- [ ] **Step 2: Implement `GaugeWidget.tsx` (240° radial gauge, color-coded arc, animated needle, readout)**
- [ ] **Step 3: Implement `StatCardWidget.tsx` (Large typography, trend delta, last seen time)**
- [ ] **Step 4: Implement `StatusLedWidget.tsx` (Glow beacon, state mappings, pulse animation)**
- [ ] **Step 5: Implement `SwitchWidget.tsx` (Bidirectional toggle, publish on/off, state feedback)**
- [ ] **Step 6: Implement `PushButtonWidget.tsx` (Action button, tactile feedback, publish command)**

---

### Task 4: Widget Container, Add/Edit Modal, & Main Dashboard View

**Files:**
- Create: `src/features/dashboard/components/WidgetContainer.tsx`
- Create: `src/features/dashboard/components/AddEditWidgetModal.tsx`
- Create: `src/features/dashboard/DashboardStudio.tsx`
- Create: `src/features/dashboard/DashboardSidebar.tsx`

**Interfaces:**
- Produces: Complete `<DashboardStudio />` workspace view with auto-subscription, responsive grid, and management toolbar

- [ ] **Step 1: Create `WidgetContainer.tsx` with header, live pulse badge, drag/col-span, and edit/delete actions**
- [ ] **Step 2: Create `AddEditWidgetModal.tsx` allowing configuration of all widget parameters, JSON paths, and topics**
- [ ] **Step 3: Build `DashboardSidebar.tsx` with preset loader, widget count, and layout export/import**
- [ ] **Step 4: Build `DashboardStudio.tsx` with auto-subscription hook, grid layout, and empty state guide**

---

### Task 5: Verification & Documentation

**Files:**
- Modify: `README.md`
- Verify: `npx tsc --noEmit`
- Verify: `npm run build`

- [ ] **Step 1: Run TypeScript compiler and Vite build to ensure zero errors**
- [ ] **Step 2: Update `README.md` with Dashboard documentation and screenshots/guides**
- [ ] **Step 3: Review all views and edge cases**
