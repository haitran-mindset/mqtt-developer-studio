# Workflow Templates Library, Import/Export, and JSON Schema Validator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Workflow Templates Marketplace (Heartbeat, Smart Home Telemetry, Alert Triggering), Import/Export .json functionality, and a dedicated JSON Schema Validator node in MQTT Developer Studio.

**Architecture:** 
1. Add `validate_schema` step type to `types.ts`, `StepExecutors.ts`, `WorkflowCustomNode.tsx`, and `WorkflowNodeInspector.tsx` with schema presets.
2. Build `workflowTemplates.ts` with 3 high-quality pre-built templates and a modal `WorkflowTemplatesModal.tsx` for 1-click cloning.
3. Build `workflowImportExport.ts` utility for validating and exporting/importing workflows with seamless file dialogs in `WorkflowRunControls.tsx` and `StudioSidebar.tsx`.

**Tech Stack:** React 19, TypeScript, Lucide React, Zustand, Monaco Editor, Sonner.

---

### Task 1: JSON Schema Validator Node Type & Engine Executor
**Files:**
- Modify: `src/core/db/types.ts`
- Modify: `src/core/workflow/StepExecutors.ts`
- Modify: `src/features/workflows/nodes/WorkflowCustomNode.tsx`
- Modify: `src/features/workflows/WorkflowNodeInspector.tsx`
- Modify: `src/features/workflows/WorkflowStudio.tsx`

**Interfaces:**
- Produces stepType `'validate_schema'` with config: `{ schema: string, targetVariable?: string }`
- Returns validation result with detailed error diagnostics.

- [ ] Step 1: Add `'validate_schema'` to `WorkflowNodeData.stepType` in `types.ts`
- [ ] Step 2: Implement schema validation algorithm in `StepExecutors.ts` validating object/array/primitive types, required fields, and min/max constraints
- [ ] Step 3: Add `validate_schema` styling, icon (FileCheck), and summary in `WorkflowCustomNode.tsx`
- [ ] Step 4: Add schema editor with templates in `WorkflowNodeInspector.tsx`
- [ ] Step 5: Add `validate_schema` option in `WorkflowStudio.tsx` node creation menu
- [ ] Step 6: Verify build `npm run build`

### Task 2: Workflow Templates Library (Marketplace / Preset Library)
**Files:**
- Create: `src/features/workflows/templates/workflowTemplates.ts`
- Create: `src/features/workflows/templates/WorkflowTemplatesModal.tsx`
- Modify: `src/features/workflows/WorkflowRunControls.tsx`
- Modify: `src/app/layout/StudioSidebar.tsx`

**Templates to create:**
1. **Heartbeat & Keep-Alive Checker**: Start -> Switch/Check Connection -> Publish Heartbeat (`devices/edge-01/heartbeat`) -> Delay 2000ms -> Loop/Log status.
2. **Smart Home Telemetry Simulation**: Start -> Publish Telemetry (`home/living-room/sensors`) -> Validate JSON Schema -> Delay 1000ms -> Extract Variable.
3. **Alert Triggering & Auto Response**: Start -> Publish Alarm (`factory/machine-1/alerts`) -> Validate Alert Schema -> Condition Check (`severity === "CRITICAL"`) -> Publish Emergency Command (`factory/machine-1/commands`).

- [ ] Step 1: Create `workflowTemplates.ts` with complete definitions for the 3 templates
- [ ] Step 2: Create `WorkflowTemplatesModal.tsx` with search, preview cards, tag badges, and 1-click "Use Template"
- [ ] Step 3: Add "Templates" button in `WorkflowRunControls.tsx` and in `StudioSidebar.tsx`
- [ ] Step 4: Verify build `npm run build`

### Task 3: Import / Export Workflow (.json)
**Files:**
- Create: `src/core/workflow/workflowImportExport.ts`
- Modify: `src/features/workflows/WorkflowRunControls.tsx`
- Modify: `src/app/layout/StudioSidebar.tsx`

**Capabilities:**
- Export: Downloads active workflow as `workflow-[name]-[timestamp].json`
- Import: Reads `.json` file, validates structure, regenerates IDs to prevent collision, adds to store and activates it.

- [ ] Step 1: Implement `exportWorkflowToJson(workflow)` and `importWorkflowFromJson(file)` in `workflowImportExport.ts`
- [ ] Step 2: Add "Export" and "Import" buttons with tooltip and file input in `WorkflowRunControls.tsx`
- [ ] Step 3: Add "Import Workflow" in `StudioSidebar.tsx` workflow header
- [ ] Step 4: Verify build `npm run build` and end-to-end functionality
