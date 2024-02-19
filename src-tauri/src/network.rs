use specta::specta;
use tauri::{command, State};

use crate::app_data::AppData;

#[command]
#[specta]
pub fn networks(app: State<AppData>) -> Vec<String> {
    app.networks()
}

#[command]
#[specta]
pub fn active_network(app: State<AppData>) -> String {
    app.active_network()
}

#[command]
#[specta]
pub fn switch_network(app: State<AppData>, network: String) {
    app.switch_network(network);
}
