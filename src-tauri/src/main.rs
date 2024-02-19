// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_data;
mod keychain;
mod mnemonic;
mod network;

use app_data::AppData;
use keychain::*;
use mnemonic::*;
use network::*;

fn main() {
    let specta_builder = {
        let specta_builder = tauri_specta::ts::builder().commands(tauri_specta::collect_commands![
            generate_mnemonic,
            verify_mnemonic,
            key_list,
            import_from_mnemonic,
            import_from_secret_key,
            import_from_public_key,
            delete_fingerprint,
            rename_fingerprint,
            log_in,
            networks,
            active_network,
            switch_network
        ]);

        #[cfg(debug_assertions)]
        let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    tauri::Builder::default()
        .manage(AppData::new())
        .plugin(specta_builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
