# Full Project Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full responsive design across the entire MQTT Developer Studio project, supporting mobile smartphones (< 768px), tablets (768px - 1023px), and desktops (>= 1024px).

**Architecture:** Utilize Tailwind CSS v4 breakpoints with a lightweight `useIsMobile()` hook for adaptive UI patterns: a sticky mobile Bottom Navigation Bar (`StudioBottomNav`), slide-over sidebar drawer with backdrop, master-detail view in Subscriber, auto-wrapping Publisher controls, and touch-optimized Workflow Studio.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Lucide React, Radix UI, XYFlow (@xyflow/react).

**Spec:** [docs/superpowers/specs/2026-10-28-full-project-responsive-design.md](file:///Users/df/HaiTran/Project-DF/mqtt-tool/docs/superpowers/specs/2026-10-28-full-project-responsive-design.md)

## Global Constraints

- Preserve the existing desktop experience (>= 1024px) without breaking layout density or shortcuts.
- Breakpoints: Mobile `< 768px`, Tablet `768px - 1023px` (`md`), Desktop `>= 1024px` (`lg`).
- Zero new heavy runtime dependencies; use standard Tailwind classes and React hooks.
- Verification command after each task: `npm run build` (tsc -b && vite build).

---

### Task 1: Responsive Infrastructure & Hook (`useIsMobile`)

**Files:**
- Create: `src/hooks/useIsMobile.ts`

**Interfaces:**
- Produces: `export function useIsMobile(breakpoint?: number): boolean`

- [x] **Step 1: Create `src/hooks/useIsMobile.ts`**

```ts
import { useState, useEffect } from 'react';

/**
 * Hook to reactively determine if current viewport matches mobile breakpoint (< 768px by default).
 * Uses window.matchMedia for zero-lag orientation and resize detection.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const updateMatch = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    updateMatch(mediaQuery);

    try {
      mediaQuery.addEventListener('change', updateMatch);
      return () => mediaQuery.removeEventListener('change', updateMatch);
    } catch {
      // Fallback for older browser engines
      mediaQuery.addListener(updateMatch);
      return () => mediaQuery.removeListener(updateMatch);
    }
  }, [breakpoint]);

  return isMobile;
}
```

- [x] **Step 2: Verify TypeScript Compilation**

Run: `npx tsc --noEmit`
Expected: Exits with code 0.

- [x] **Step 3: Verification**

```bash
git add src/hooks/useIsMobile.ts
git commit -m "feat(responsive): add useIsMobile viewport hook"
```

---

### Task 2: Mobile Bottom Navigation Bar (`StudioBottomNav`)

**Files:**
- Create: `src/app/layout/StudioBottomNav.tsx`
- Modify: `src/app/layout/StudioWorkbench.tsx`

**Interfaces:**
- Consumes: `useStudioStore` (`activeTab`, `setActiveTab`), `useIsMobile`
- Produces: `export const StudioBottomNav: React.FC`

- [x] **Step 1: Create `src/app/layout/StudioBottomNav.tsx`**

```tsx
import React from 'react';
import { Server, Send, Radio, GitBranch } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';

interface NavItem {
  id: 'connections' | 'publisher' | 'subscriber' | 'workflows';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'connections', label: 'Brokers', icon: Server },
  { id: 'publisher', label: 'Publish', icon: Send },
  { id: 'subscriber', label: 'Subscribe', icon: Radio },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
];

export const StudioBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-md flex items-center justify-around z-40 px-2 select-none">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-all ${isActive ? 'bg-cyan-950/60 shadow-xs' : ''}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
```

- [x] **Step 2: Mount `StudioBottomNav` in `StudioWorkbench.tsx`**

In `src/app/layout/StudioWorkbench.tsx`:
- Import `StudioBottomNav`.
- Render `<StudioBottomNav />` right above the closing `</div>`.
- Add bottom padding `pb-14 md:pb-0` to the main stage container so bottom content is not obscured on mobile.

- [x] **Step 3: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 4: Commit**

```bash
git add src/app/layout/StudioBottomNav.tsx src/app/layout/StudioWorkbench.tsx
git commit -m "feat(responsive): add mobile bottom navigation bar"
```

---

### Task 3: Responsive StudioHeader & StudioSidebar

**Files:**
- Modify: `src/app/layout/StudioHeader.tsx`
- Modify: `src/app/layout/StudioSidebar.tsx`

**Interfaces:**
- Consumes: `useIsMobile`, `useStudioStore` (`sidebarOpen`, `toggleSidebar`, `setSidebarOpen`)

- [x] **Step 1: Update `StudioHeader.tsx` for Mobile**
- Hide the 4 desktop tabs on mobile (`hidden md:flex`).
- On `< md:` screens, add a Menu hamburger button on the left that calls `toggleSidebar()` to open the Brokers/Workflows drawer.
- Display a compact active connection badge with a pulsing status dot.
- Keep session storage and disconnect button visible in compact form.

- [x] **Step 2: Update `StudioSidebar.tsx` to Slide-Over Drawer on Mobile**
- When `isMobile` is true and `sidebarOpen` is true:
  - Render an overlay backdrop (`fixed inset-0 bg-black/60 backdrop-blur-xs z-50`).
  - Render the sidebar as a Slide-Over Drawer (`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 z-50 shadow-2xl`).
  - Add an explicit close button `[✕]` in the header.
  - When user clicks any broker or workflow to select it, auto-close the drawer via `setSidebarOpen(false)`.
- On desktop/tablet (>= 768px), preserve existing permanent layout (256px expanded / 48px collapsed).

- [x] **Step 3: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 4: Commit**

```bash
git add src/app/layout/StudioHeader.tsx src/app/layout/StudioSidebar.tsx
git commit -m "feat(responsive): adapt header and sidebar drawer for mobile"
```

---

### Task 4: Responsive StudioWorkbench & Bottom Panel

**Files:**
- Modify: `src/app/layout/StudioWorkbench.tsx`
- Modify: `src/app/layout/StudioBottomPanel.tsx`

**Interfaces:**
- Consumes: `useIsMobile`, `useStudioStore` (`bottomPanelOpen`, `setBottomPanelOpen`, `toggleBottomPanel`)

- [x] **Step 1: Update `StudioBottomPanel.tsx` for Mobile**
- On desktop: keep current resizable / collapsible panel (180px - 240px).
- On mobile (`md:hidden`):
  - When `bottomPanelOpen` is true: render as an animated Slide-Up Bottom Sheet (`fixed inset-x-0 bottom-14 max-h-[75vh] bg-zinc-950 border-t border-zinc-800 z-40 flex flex-col shadow-2xl`).
  - Include a swipe/drag handle and close button.
  - When collapsed, render a minimal sticky floating pill above bottom nav: `[Terminal Logs (N)]`.

- [x] **Step 2: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 3: Commit**

```bash
git add src/app/layout/StudioBottomPanel.tsx src/app/layout/StudioWorkbench.tsx
git commit -m "feat(responsive): convert bottom console panel to mobile bottom sheet"
```

---

### Task 5: Responsive ConnectionList & ConnectionModal

**Files:**
- Modify: `src/features/connections/ConnectionList.tsx`
- Modify: `src/features/connections/ConnectionModal.tsx`

- [x] **Step 1: Update `ConnectionList.tsx` Grid**
- Replace fixed column grids with `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`.
- Ensure Broker Cards have full-width touch-friendly connect buttons on mobile.
- Make top search and "Add Broker" button stack or wrap cleanly: `flex-col sm:flex-row`.

- [x] **Step 2: Update `ConnectionModal.tsx`**
- Ensure dialog wrapper uses `max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col`.
- Body content uses `overflow-y-auto pr-1`.
- Sticky footer buttons at bottom.

- [x] **Step 3: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 4: Commit**

```bash
git add src/features/connections/ConnectionList.tsx src/features/connections/ConnectionModal.tsx
git commit -m "feat(responsive): make connection list and modal responsive"
```

---

### Task 6: Responsive PublisherView

**Files:**
- Modify: `src/features/publisher/PublisherView.tsx`

- [x] **Step 1: Reorganize Control Bar for Mobile**
- On desktop: `flex items-center gap-2`.
- On mobile:
  - `flex flex-col sm:flex-row sm:items-center gap-2`.
  - Line 1: Topic input full-width.
  - Line 2: Flex row with QoS selector, Retain switch, and **Publish** button (`flex-1`).
- Secondary toolbar (Format selectors, Copy, Prettify): enable horizontal scrolling on small screens (`overflow-x-auto no-scrollbar`).
- Monaco Editor: Ensure container has `min-h-[220px] flex-1`.

- [x] **Step 2: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 3: Commit**

```bash
git add src/features/publisher/PublisherView.tsx
git commit -m "feat(responsive): adapt publisher controls for mobile viewports"
```

---

### Task 7: Responsive SubscriberView Master-Detail Pattern

**Files:**
- Modify: `src/features/subscriber/SubscriberView.tsx`
- Modify: `src/features/subscriber/MessageDetailInspector.tsx`

- [x] **Step 1: Update Subscription Header & Filter Bar**
- Subscription inputs (Topic, QoS, Subscribe): stack cleanly on mobile (`flex-col sm:flex-row`).
- Filter bar (Topic search, Payload search, Direction, Export): wrap into 2 rows on `< md:`.

- [x] **Step 2: Implement Mobile Master-Detail for Stream & Inspector**
- When `selectedMessage` is set on mobile (`< md:`):
  - Open `MessageDetailInspector` in full-screen slide-over mode: `fixed inset-0 z-50 bg-zinc-950 flex flex-col`.
  - In `MessageDetailInspector.tsx`, add a `"← Back to Messages"` button in the header when on mobile.
  - On desktop (>= 1024px), keep existing side-by-side split (`w-[450px]` right panel).
- In message stream list rows:
  - Responsive layout: On mobile, wrap into 2 compact lines per message (Line 1: Direction icon + Timestamp + Topic; Line 2: Payload snippet + QoS/Size badges).

- [x] **Step 3: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 4: Commit**

```bash
git add src/features/subscriber/SubscriberView.tsx src/features/subscriber/MessageDetailInspector.tsx
git commit -m "feat(responsive): add master-detail message inspection on mobile"
```

---

### Task 8: Responsive WorkflowStudio & Controls

**Files:**
- Modify: `src/features/workflows/WorkflowRunControls.tsx`
- Modify: `src/features/workflows/WorkflowStudio.tsx`
- Modify: `src/features/workflows/WorkflowNodeInspector.tsx`

- [x] **Step 1: Horizontal Scroll on `WorkflowRunControls.tsx`**
- Wrap Row 1 and Row 2 in `overflow-x-auto no-scrollbar` containers so all buttons (Templates, Undo, Redo, Save, Export, Import, Run) are easily accessible on small screens.

- [x] **Step 2: Mobile Node Inspector Slide-Over**
- In `WorkflowStudio.tsx`:
  - When a node is selected on mobile (`< md:`), render `WorkflowNodeInspector` as a full-screen or slide-over drawer (`fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-zinc-950 shadow-2xl`).
  - Closing inspector returns focus directly to canvas.
- Palette: On mobile, auto-collapse palette to preserve full canvas width.

- [x] **Step 3: Build Verification**

Run: `npm run build`
Expected: Exits with code 0.

- [x] **Step 4: Commit**

```bash
git add src/features/workflows/WorkflowRunControls.tsx src/features/workflows/WorkflowStudio.tsx src/features/workflows/WorkflowNodeInspector.tsx
git commit -m "feat(responsive): make workflow studio controls and inspector mobile-friendly"
```

---

### Task 9: Full Build Verification & Quality Checks

**Files:**
- Review all modified files across project.

- [x] **Step 1: Run Full TypeScript Type Check**

Run: `npx tsc --noEmit`
Expected: Exits with code 0 (zero errors).

- [x] **Step 2: Run Production Build**

Run: `npm run build`
Expected: Vite build outputs production bundle cleanly with exit code 0.

- [x] **Step 3: Verification & Commit**

```bash
git status --short
git commit -m "chore: complete full project responsive design verification"
```
