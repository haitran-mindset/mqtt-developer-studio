use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS, Transport};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MqttConnectOptions {
    pub connection_id: String,
    pub host: String,
    pub port: u16,
    pub client_id: String,
    pub keep_alive: Option<u16>,
    pub clean_session: Option<bool>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub use_tls: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MqttIncomingMessage {
    pub connection_id: String,
    pub topic: String,
    pub payload: String,
    pub qos: u8,
    pub retain: bool,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MqttStatusUpdate {
    pub connection_id: String,
    pub status: String, // "connected" | "disconnected" | "reconnecting" | "error"
    pub error: Option<String>,
}

pub struct MqttSession {
    pub client: AsyncClient,
}

pub struct MqttManager {
    sessions: Arc<RwLock<HashMap<String, MqttSession>>>,
}

impl MqttManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn connect(
        &self,
        app: AppHandle,
        opts: MqttConnectOptions,
    ) -> Result<(), String> {
        let conn_id = opts.connection_id.clone();

        // Disconnect existing session if present
        self.disconnect(&conn_id).await.ok();

        let mut mqttoptions = MqttOptions::new(
            &opts.client_id,
            &opts.host,
            opts.port,
        );

        mqttoptions.set_keep_alive(Duration::from_secs(opts.keep_alive.unwrap_or(60) as u64));
        mqttoptions.set_clean_session(opts.clean_session.unwrap_or(true));

        if let (Some(u), Some(p)) = (&opts.username, &opts.password) {
            if !u.is_empty() {
                mqttoptions.set_credentials(u, p);
            }
        }

        if opts.use_tls.unwrap_or(false) {
            mqttoptions.set_transport(Transport::tls_with_default_config());
        }

        let (client, mut eventloop) = AsyncClient::new(mqttoptions, 50);

        // Store active session
        {
            let mut lock = self.sessions.write().await;
            lock.insert(conn_id.clone(), MqttSession { client });
        }

        // Spawn async background event loop forwarding packets to webview
        let app_clone = app.clone();
        let loop_conn_id = conn_id.clone();

        tokio::spawn(async move {
            loop {
                match eventloop.poll().await {
                    Ok(event) => match event {
                        Event::Incoming(Packet::ConnAck(_)) => {
                            app_clone
                                .emit(
                                    &format!("mqtt-status-{}", loop_conn_id),
                                    MqttStatusUpdate {
                                        connection_id: loop_conn_id.clone(),
                                        status: "connected".to_string(),
                                        error: None,
                                    },
                                )
                                .ok();
                        }
                        Event::Incoming(Packet::Publish(publish)) => {
                            let payload_str = match String::from_utf8(publish.payload.to_vec()) {
                                Ok(s) => s,
                                Err(_) => format!("HEX:{}", hex::encode(&publish.payload)),
                            };

                            let qos_num = match publish.qos {
                                QoS::AtMostOnce => 0,
                                QoS::AtLeastOnce => 1,
                                QoS::ExactlyOnce => 2,
                            };

                            let now_ms = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64;

                            app_clone
                                .emit(
                                    &format!("mqtt-msg-{}", loop_conn_id),
                                    MqttIncomingMessage {
                                        connection_id: loop_conn_id.clone(),
                                        topic: publish.topic,
                                        payload: payload_str,
                                        qos: qos_num,
                                        retain: publish.retain,
                                        timestamp: now_ms,
                                    },
                                )
                                .ok();
                        }
                        Event::Incoming(Packet::Disconnect) => {
                            app_clone
                                .emit(
                                    &format!("mqtt-status-{}", loop_conn_id),
                                    MqttStatusUpdate {
                                        connection_id: loop_conn_id.clone(),
                                        status: "disconnected".to_string(),
                                        error: None,
                                    },
                                )
                                .ok();
                            break;
                        }
                        _ => {}
                    },
                    Err(err) => {
                        let err_str = err.to_string();
                        app_clone
                            .emit(
                                &format!("mqtt-status-{}", loop_conn_id),
                                MqttStatusUpdate {
                                    connection_id: loop_conn_id.clone(),
                                    status: "error".to_string(),
                                    error: Some(err_str.clone()),
                                },
                            )
                            .ok();

                        // Break loop on fatal connection error
                        if err_str.contains("ConnectionAborted")
                            || err_str.contains("Closed")
                            || err_str.contains("Refused")
                        {
                            break;
                        }
                    }
                }
            }
        });

        Ok(())
    }

    pub async fn disconnect(&self, connection_id: &str) -> Result<(), String> {
        let mut lock = self.sessions.write().await;
        if let Some(session) = lock.remove(connection_id) {
            session.client.disconnect().await.map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub async fn publish(
        &self,
        connection_id: &str,
        topic: &str,
        payload: Vec<u8>,
        qos: u8,
        retain: bool,
    ) -> Result<(), String> {
        let lock = self.sessions.read().await;
        let session = lock
            .get(connection_id)
            .ok_or_else(|| format!("Session {} not found", connection_id))?;

        let qos_enum = match qos {
            1 => QoS::AtLeastOnce,
            2 => QoS::ExactlyOnce,
            _ => QoS::AtMostOnce,
        };

        session
            .client
            .publish(topic, qos_enum, retain, payload)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn subscribe(
        &self,
        connection_id: &str,
        topic: &str,
        qos: u8,
    ) -> Result<(), String> {
        let lock = self.sessions.read().await;
        let session = lock
            .get(connection_id)
            .ok_or_else(|| format!("Session {} not found", connection_id))?;

        let qos_enum = match qos {
            1 => QoS::AtLeastOnce,
            2 => QoS::ExactlyOnce,
            _ => QoS::AtMostOnce,
        };

        session
            .client
            .subscribe(topic, qos_enum)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn unsubscribe(
        &self,
        connection_id: &str,
        topic: &str,
    ) -> Result<(), String> {
        let lock = self.sessions.read().await;
        let session = lock
            .get(connection_id)
            .ok_or_else(|| format!("Session {} not found", connection_id))?;

        session
            .client
            .unsubscribe(topic)
            .await
            .map_err(|e| e.to_string())
    }
}
