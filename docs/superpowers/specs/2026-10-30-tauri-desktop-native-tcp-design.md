# Tauri Desktop Packaging & Native TCP (1883/8883) Architecture Spec

## Goal
Package MQTT Developer Studio as a high-performance, cross-platform Desktop Application using **Tauri v2**. Enable true native TCP/TLS socket connections (`mqtt://host:1883` and `mqtts://host:8883`), overcoming the browser's WebSocket-only limitation, while maintaining 100% feature parity with the web version.

---

## 1. Problem Statement & Motivation
- **Web Limitation:** Browsers (Chrome, Firefox, Safari) cannot open raw TCP sockets (`net.Socket`). Web-based MQTT clients can only communicate with brokers exposing a WebSocket listener (`ws://host:8083/mqtt` or `wss://host:8084/mqtt`).
- **IoT & Industrial Reality:** The vast majority of production and legacy MQTT brokers (Mosquitto, EMQX, HiveMQ, AWS IoT, local industrial gateways) default to standard TCP port **1883** (unencrypted) and TLS port **8883** (secure).
- **Solution:** A native desktop build powered by Tauri v2 with a Rust networking core using `rumqttc`. When running on desktop, TCP/TLS connections bypass WebSocket restrictions and communicate directly over native OS sockets. When running in a standard browser, the app falls back seamlessly to WebSocket connections.

---

## 2. Architecture & Communication Flow

```
+-------------------------------------------------------------------------+
|                              FRONTEND (React)                           |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                    MQTTConnectionManager                         |   |
|   +-----------------------------------------------------------------+   |
|            |                                            |               |
|            | if WebSocket (ws://, wss://)               | if TCP / TLS  |
|            v                                            v               |
|   +----------------------+                     +--------------------+   |
|   |  MQTTClientAdapter   |                     |  TauriTCPAdapter   |   |
|   |     (mqtt.js)        |                     |   (Tauri IPC)      |   |
|   +----------------------+                     +--------------------+   |
|            |                                            |               |
+------------|--------------------------------------------|---------------+
             | (Browser WS)                               | (Tauri IPC invoke/event)
             v                                            v
     [Broker WS Port]                             +-----------------------+
        (8083/8084)                               |   RUST BACKEND        |
                                                  |   (Tauri v2 Core)     |
                                                  |                       |
                                                  |  - rumqttc client pool|
                                                  |  - Native TCP: 1883   |
                                                  |  - Native TLS: 8883   |
                                                  |  - Async event loop   |
                                                  +-----------------------+
                                                              | Native TCP/TLS
                                                              v
                                                      [MQTT Broker TCP]
                                                         (1883 / 8883)
```

---

## 3. Rust Backend (`src-tauri`)

### Dependencies (`Cargo.toml`)
- `tauri = { version = "2", features = [] }`
- `tauri-build = { version = "2" }`
- `serde = { version = "1.0", features = ["derive"] }`
- `serde_json = "1.0"`
- `tokio = { version = "1", features = ["full"] }`
- `rumqttc = "0.24"` (High-performance, async-native Rust MQTT 3.1.1/5.0 client)
- `parking_lot = "0.12"` (Fast concurrent mutexes)

### Tauri Commands
1. `connect_mqtt(connection_id, options)`: Creates an async `rumqttc::AsyncClient`, configures keep-alive, clean session, auth, TLS, and starts an event loop forwarding incoming packets to frontend via `app.emit("mqtt-event-<conn_id>", event)`.
2. `disconnect_mqtt(connection_id)`: Disconnects client and terminates event loop.
3. `publish_mqtt(connection_id, topic, payload, qos, retain)`: Publishes payload via `client.publish(...)`.
4. `subscribe_mqtt(connection_id, topic, qos)`: Subscribes topic via `client.subscribe(...)`.
5. `unsubscribe_mqtt(connection_id, topic)`: Unsubscribes topic via `client.unsubscribe(...)`.

---

## 4. Frontend Integration (`src/core/mqtt`)

### 1. `isTauri()` Runtime Detector
Checks `window.__TAURI_INTERNALS__` or `@tauri-apps/api/core.isTauri()`.

### 2. `TauriTCPAdapter`
Implements the same interface as `MQTTClientAdapter`:
- `connect(): Promise<void>`
- `disconnect(): Promise<void>`
- `publish(topic, payload, options): Promise<void>`
- `subscribe(topic, qos): Promise<void>`
- `unsubscribe(topic): Promise<void>`
- `onMessage(cb)`, `onStatusChange(cb)`, `onLog(cb)`

### 3. Smart Protocol Routing in `ConnectionModal` & `ConnectionList`
- Protocol selector options:
  - `ws` (WebSocket - Browser & Desktop)
  - `wss` (WebSocket Secure - Browser & Desktop)
  - `mqtt` (Raw TCP Port 1883 - Native Desktop Only)
  - `mqtts` (Raw TLS Port 8883 - Native Desktop Only)
- In Browser mode: If a user selects `mqtt` or `mqtts`, a helpful tooltip/badge indicates: *"Raw TCP is available in the Desktop App. In web mode, please use ws:// or wss://, or download the Desktop App"*.
