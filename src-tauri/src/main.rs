// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mqtt_manager;

use mqtt_manager::{MqttConnectOptions, MqttManager};
use tauri::{AppHandle, State};

#[tauri::command]
async fn connect_mqtt(
    app: AppHandle,
    manager: State<'_, MqttManager>,
    opts: MqttConnectOptions,
) -> Result<(), String> {
    manager.connect(app, opts).await
}

#[tauri::command]
async fn disconnect_mqtt(
    manager: State<'_, MqttManager>,
    connection_id: String,
) -> Result<(), String> {
    manager.disconnect(&connection_id).await
}

#[tauri::command]
async fn publish_mqtt(
    manager: State<'_, MqttManager>,
    connection_id: String,
    topic: String,
    payload: String,
    qos: u8,
    retain: bool,
) -> Result<(), String> {
    manager
        .publish(&connection_id, &topic, payload.into_bytes(), qos, retain)
        .await
}

#[tauri::command]
async fn subscribe_mqtt(
    manager: State<'_, MqttManager>,
    connection_id: String,
    topic: String,
    qos: u8,
) -> Result<(), String> {
    manager.subscribe(&connection_id, &topic, qos).await
}

#[tauri::command]
async fn unsubscribe_mqtt(
    manager: State<'_, MqttManager>,
    connection_id: String,
    topic: String,
) -> Result<(), String> {
    manager.unsubscribe(&connection_id, &topic).await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(MqttManager::new())
        .invoke_handler(tauri::generate_handler![
            connect_mqtt,
            disconnect_mqtt,
            publish_mqtt,
            subscribe_mqtt,
            unsubscribe_mqtt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
