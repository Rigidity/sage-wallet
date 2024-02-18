// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod keychain;
mod mnemonic;

use std::sync::Arc;

use keychain::*;
use mnemonic::*;
use parking_lot::Mutex;

pub struct AppState {
    key_list: Arc<Mutex<KeyList>>,
}

fn main() {
    let specta_builder = {
        let specta_builder = tauri_specta::ts::builder().commands(tauri_specta::collect_commands![
            generate_mnemonic,
            verify_mnemonic,
            key_list,
            import_from_mnemonic,
            delete_fingerprint,
            log_in
        ]);

        #[cfg(debug_assertions)]
        let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    tauri::Builder::default()
        .manage(AppState {
            key_list: Arc::new(Mutex::new(load_keys())),
        })
        .plugin(specta_builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
