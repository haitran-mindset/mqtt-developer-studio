# Full Project Responsive Design Specification

- **Date:** 2026-10-28
- **Topic:** Full Project Responsive Design (Mobile < 768px, Tablet 768px - 1023px, Desktop >= 1024px)
- **Status:** Approved Draft

---

## 1. Overview & Goals

MQTT Developer Studio is a high-density desktop web application for MQTT testing, debugging, and visual automation. This design specification establishes a comprehensive responsive architecture to support all screen sizes, from mobile smartphones (< 768px) and tablets (768px - 1023px) to full desktop displays (>= 1024px).

### Key Objectives
1. **Mobile-First Shell Navigation:** Implement a mobile bottom navigation bar (`StudioBottomNav`) for primary tab switching, combined with a Slide-Over Drawer for contextual sidebars (Brokers, Workflows).
2. **Master-Detail Flow for Subscriber:** Eliminate cramped multi-column layouts on mobile by adopting a Master-Detail pattern where tapping a message opens a full-screen/slide-over inspector with a back button.
3. **Adaptive Form Layouts in Publisher:** Stack and wrap topic, QoS, retain, and publish buttons on smaller viewports while keeping Monaco Editor full-width and touch-friendly.
4. **Touch-Optimized Workflow Studio:** Maximize canvas area on mobile by transforming the Node Palette into a floating "+ Add Step" sheet and the Node Inspector into a slide-over/bottom sheet.
5. **No Regressions on Desktop:** Preserve the existing 3-column, high-density desktop IDE experience intact on displays >= 1024px.

---

## 2. Breakpoint System & Responsive Infrastructure

### Standard Breakpoints (Tailwind CSS v4)
- **Mobile (`sm` / default):** `< 768px` (iPhone, Android phones in portrait/landscape)
- **Tablet (`md`):** `768px - 1023px` (iPads, Android tablets, split-screen desktop windows)
- **Desktop (`lg` / `xl`):** `>= 1024px` (Laptops, desktop monitors, ultrawide screens)

### Infrastructure: `useIsMobile` Hook
Location: `src/hooks/useIsMobile.ts`
- Uses `window.matchMedia('(max-width: 767px)')` with listener for instant adaptation during window resizing and device orientation changes.
- Avoids layout shifts and unnecessary component remounts.

---

## 3. Architecture & Component Designs

### 3.1. Core Shell Architecture (`StudioWorkbench`, `StudioHeader`, `StudioSidebar`, `StudioBottomNav`, `StudioBottomPanel`)

#### StudioHeader (`src/app/layout/StudioHeader.tsx`)
- **Desktop (>= 768px):**
  - Left: Logo & Studio branding.
  - Center: Tab navigation (`Connections`, `Publisher`, `Subscriber`, `Workflows`).
  - Right: Quick broker connection switcher, Session storage toggle, Network status indicator.
- **Mobile (< 768px):**
  - Left: Drawer toggle button (`☰` / `Menu`) to open the Brokers/Workflows list + Compact Logo.
  - Center/Right: Active broker status chip with pulsing connection dot (tap to open broker switcher).
  - Right: Quick disconnect / Session toggle compact icon buttons.
  - The 4 central tabs are hidden from the header and delegated to the bottom navigation bar.

#### Mobile Bottom Navigation Bar (`src/app/layout/StudioBottomNav.tsx`)
- **Condition:** Rendered only when viewport `< 768px` (`md:hidden`).
- **Position:** Fixed at the bottom (`fixed bottom-0 left-0 right-0 h-14 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md z-40`).
- **Tabs (4 Primary Destinations):**
  1. **Brokers** (`<Server />`) -> routes to `'connections'`
  2. **Publish** (`<Send />`) -> routes to `'publisher'`
  3. **Subscribe** (`<Radio />`) -> routes to `'subscriber'` (includes badge for incoming message indicator)
  4. **Workflows** (`<GitBranch />`) -> routes to `'workflows'`
- **Visuals:** Active tab has solid cyan icon and text with subtle glow; inactive tabs are zinc-400.

#### StudioSidebar (`src/app/layout/StudioSidebar.tsx`)
- **Desktop (>= 1024px):** Fixed left sidebar (`w-64`), collapsible to mini icon rail (`w-12`).
- **Tablet (768px - 1023px):** Defaults to collapsed icon rail (`w-12`) to preserve canvas/editor space, expands on toggle.
- **Mobile (< 768px):**
  - Functions as a **Slide-Over Drawer** (`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 z-50 shadow-2xl transition-transform`).
  - Rendered with an animated dark backdrop overlay (`fixed inset-0 bg-black/60 backdrop-blur-xs z-40`).
  - Tapping a broker or workflow selects it and automatically dismisses the drawer.
  - Includes a prominent close (`✕`) button in the drawer header.

#### StudioBottomPanel (`src/app/layout/StudioBottomPanel.tsx`)
- **Desktop (>= 768px):** Collapsible bottom console panel (180px - 240px).
- **Mobile (< 768px):**
  - Fixed panel would consume 50%+ of mobile viewport.
  - On mobile, console panel transforms into an expandable **Bottom Sheet** or full-screen diagnostic modal triggered by a floating badge / header button `"Logs (count)"`.

---

### 3.2. Feature Views

#### ConnectionList (`src/features/connections/ConnectionList.tsx`)
- **Grid Layout:**
  - Desktop: `grid-cols-3 xl:grid-cols-4`
  - Tablet: `grid-cols-2`
  - Mobile: `grid-cols-1` (single column full width)
- **Broker Cards:**
  - Full-width tap targets for connection actions.
  - All action buttons (Copy, Edit, Delete) remain accessible with comfortable 36px+ tap targets.

#### PublisherView (`src/features/publisher/PublisherView.tsx`)
- **Control Bar:**
  - Desktop: Single flex row (`[TOPIC: input] [QoS] [Retain] [Publish]`).
  - Mobile:
    - Row 1: Full-width Topic input field.
    - Row 2: QoS selector + Retain switch + Big **Publish** button (`bg-cyan-500 text-zinc-950 font-semibold h-9`).
    - Row 3: Horizontal scrollable format pill selector (`JSON`, `TEXT`, `XML`, `HEX`, `BASE64`).
- **Monaco Editor:**
  - Responsive height container (`min-h-[220px] flex-1`), maintaining touch scrolling without parent container scroll lock.

#### SubscriberView (`src/features/subscriber/SubscriberView.tsx`)
- **Subscription Bar:**
  - Desktop: Horizontal input bar with Topic, QoS, Subscribe button.
  - Mobile: Responsive flex-wrap: Topic field on line 1, QoS and Subscribe button on line 2.
- **Master-Detail Stream & Inspector:**
  - Desktop (>= 1024px): Split view with message stream table on left and `w-[450px]` detail inspector on right.
  - Mobile (< 1024px):
    - **Stream Mode:** Message stream takes 100% width. Rows use a 2-line layout (Line 1: Direction + Time + Topic; Line 2: Payload snippet + QoS/Size).
    - **Detail Mode:** Tapping any message opens `MessageDetailInspector` as a full-screen slide-over sheet with a header containing a `"← Back to Messages"` button.

#### WorkflowStudio (`src/features/workflows/WorkflowStudio.tsx`)
- **Top Toolbar (`WorkflowRunControls`):**
  - Desktop: Two neat rows.
  - Mobile: Both rows support smooth horizontal scroll (`overflow-x-auto no-scrollbar py-1`), ensuring templates, duplicate, rename, undo, redo, save, and run workflow are reachable.
- **Node Palette (`WorkflowNodePalette`):**
  - Mobile: Palette auto-collapses completely off-canvas. A floating action button `[+ Add Step]` appears at the bottom-right of the canvas, opening a quick step selector bottom sheet.
- **Node Inspector (`WorkflowNodeInspector`):**
  - Desktop: Pinned 320px right column.
  - Mobile: Opens as a **Slide-Over Sheet** (`fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-zinc-950 shadow-2xl`) with an explicit close button and the sticky "Run From This Step" footer.
- **ReactFlow Canvas:**
  - Utilizes `@xyflow/react` native multi-touch gestures (two-finger pan, pinch zoom).

---

### 3.3. Dialogs & Modals

- `ConnectionModal`, `PromptDialog`, `ConfirmDialog`, `WorkflowTemplatesModal`:
  - Enforce `max-w-[95vw]` and `max-h-[85vh]` on mobile viewports.
  - Dialog body has `overflow-y-auto` with sticky footer buttons (`Cancel`, `Confirm`), ensuring submit buttons remain visible when virtual keyboards open.

---

## 4. Implementation Phasing

1. **Phase 1: Shell & Navigation Foundation**
   - Create `useIsMobile` hook.
   - Implement `StudioBottomNav` component.
   - Refactor `StudioHeader` and `StudioSidebar` to support mobile drawer mode and bottom nav.
   - Adapt `StudioWorkbench` layout margins for bottom nav.

2. **Phase 2: Subscriber & Publisher Responsiveness**
   - Implement Master-Detail view in `SubscriberView`.
   - Wrap and stack controls in `PublisherView`.

3. **Phase 3: Workflow Studio Responsive Adaptation**
   - Add horizontal scroll containers in `WorkflowRunControls`.
   - Mobile slide-over drawer mode for `WorkflowNodeInspector`.
   - Mobile floating trigger for `WorkflowNodePalette`.

4. **Phase 4: Connections & Modal Polish**
   - Grid adjustments in `ConnectionList`.
   - Mobile dialog overflow and keyboard safety checks.

---

## 5. Verification & Testing Criteria

- **Automated Verification:** `npx tsc --noEmit` and `npm run build` must succeed without errors.
- **Viewport Testing:**
  - Mobile: 375x667 (iPhone SE), 390x844 (iPhone 14/15), 412x915 (Pixel 7).
  - Tablet: 768x1024 (iPad Portrait), 1024x768 (iPad Landscape).
  - Desktop: 1440x900, 1920x1080.
- **Touch Interaction Verification:**
  - Drawer open/close gestures and backdrop clicks.
  - Tab switching via bottom nav.
  - Message selection -> detail view -> back to list navigation.
  - Workflow node touch pan and zoom.
