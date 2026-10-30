# Tauri Desktop Packaging & Native TCP (1883/8883) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package MQTT Developer Studio as a native cross-platform Desktop Application with Tauri v2, implementing native TCP socket support (`mqtt://:1883` & `mqtts://:8883`) via Rust and `rumqttc`.

**Architecture:** A lightweight Rust backend (`src-tauri`) manages connection pools and raw TCP/TLS sockets with `rumqttc`. Tauri IPC commands (`invoke`) and events (`emit`/`listen`) bridge with the TypeScript frontend. A `TauriTCPAdapter` seamlessly handles native TCP connections while preserving standard WebSockets in browser mode.

**Tech Stack:** Tauri v2, Rust 1.99, `rumqttc`, Tokio, React 18, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-10-30-tauri-desktop-native-tcp-design.md`

## Global Constraints
- Preserve existing documentation integrity and comments.
- Do not run `git commit` commands automatically without user approval.
- Format file links with markdown `[filename](file:///...)`.
- Ensure web build continues to compile cleanly without breaking on browser environments.

---

### Task 1: Scaffolding Tauri v2 Project & Installing Dependencies

**Files:**
- Modify: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/build.rs`

- [ ] **Step 1: Install `@tauri-apps/cli` and `@tauri-apps/api` in package.json**
- [ ] **Step 2: Configure `src-tauri/Cargo.toml` with `tauri`, `rumqttc`, `tokio`, `serde`, and `parking_lot`**
- [ ] **Step 3: Configure `src-tauri/tauri.conf.json` for desktop window, bundle identifiers, and security permissions**
- [ ] **Step 4: Create minimal `src-tauri/src/main.rs` and `build.rs`**
- [ ] **Step 5: Verify Rust cargo build**

---

### Task 2: Implementing Native MQTT Engine in Rust (`src-tauri`)

**Files:**
- Create: `src-tauri/src/mqtt_manager.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Implement `MqttSessionManager` with concurrent client storage using `rumqttc`**
- [ ] **Step 2: Implement commands: `connect_mqtt`, `disconnect_mqtt`, `publish_mqtt`, `subscribe_mqtt`, `unsubscribe_mqtt`**
- [ ] **Step 3: Spawn background Tokio event loop emitting incoming messages and status changes to Tauri webview**
- [ ] **Step 4: Register all commands in `tauri::Builder`**

---

### Task 3: Frontend Desktop Detection & `TauriTCPAdapter`

**Files:**
- Create: `src/core/mqtt/platform.ts`
- Create: `src/core/mqtt/TauriTCPAdapter.ts`
- Modify: `src/core/mqtt/MQTTConnectionManager.ts`
- Modify: `src/features/connections/ConnectionModal.tsx`

- [ ] **Step 1: Implement `isTauriApp()` runtime check in `platform.ts`**
- [ ] **Step 2: Implement `TauriTCPAdapter` calling Tauri invoke commands and listening for Tauri events**
- [ ] **Step 3: Update `MQTTConnectionManager` to route TCP/TLS (`mqtt://`, `mqtts://`) through `TauriTCPAdapter` when running in Tauri**
- [ ] **Step 4: Update `ConnectionModal` to show native TCP status and platform indicators**

---

### Task 4: Verification, Desktop Build & Documentation

**Files:**
- Modify: `package.json` (add `"tauri": "tauri"` scripts)
- Modify: `README.md`
- Verify: `npm run build`
- Verify: `cargo check` inside `src-tauri`

- [ ] **Step 1: Run TypeScript checks and Vite build**
- [ ] **Step 2: Run Cargo check inside `src-tauri` to ensure Rust backend compiles**
- [ ] **Step 3: Update `README.md` with Desktop setup & run instructions (`npm run tauri dev` / `npm run tauri build`)**
