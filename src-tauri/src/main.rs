// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::str::FromStr;

use bip39::Mnemonic;
use rand::{RngCore, SeedableRng};
use rand_chacha::ChaCha20Rng;
use specta::specta;
use tauri::command;

#[command]
#[specta]
fn generate_mnemonic(long: bool) -> String {
    let mut rng = ChaCha20Rng::from_entropy();

    let mnemonic = if long {
        let mut entropy = [0u8; 32];
        rng.fill_bytes(&mut entropy);
        Mnemonic::from_entropy(&entropy)
    } else {
        let mut entropy = [0u8; 16];
        rng.fill_bytes(&mut entropy);
        Mnemonic::from_entropy(&entropy)
    };

    mnemonic.unwrap().to_string()
}

#[command]
#[specta]
fn verify_mnemonic(mnemonic: String) -> bool {
    Mnemonic::from_str(&mnemonic).is_ok()
}

fn main() {
    let specta_builder = {
        let specta_builder = tauri_specta::ts::builder().commands(tauri_specta::collect_commands![
            generate_mnemonic,
            verify_mnemonic
        ]);

        #[cfg(debug_assertions)]
        let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    tauri::Builder::default()
        .plugin(specta_builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
