use std::str::FromStr;

use bip39::Mnemonic;
use rand::{RngCore, SeedableRng};
use rand_chacha::ChaCha20Rng;
use specta::specta;
use tauri::command;

#[command]
#[specta]
pub fn generate_mnemonic(long: bool) -> String {
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
pub fn verify_mnemonic(mnemonic: String) -> bool {
    Mnemonic::from_str(&mnemonic).is_ok()
}
