use std::{fs, path::PathBuf, str::FromStr};

use aes_gcm::{aead::Aead, AeadCore, Aes256Gcm, Key, KeyInit, Nonce};
use bip39::Mnemonic;
use chia_bls::SecretKey;
use keyring::{Entry, Error};
use rand::{CryptoRng, Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};
use specta::{specta, Type};
use tauri::{api::path::home_dir, command, State};

use crate::AppState;

#[derive(Default, Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct KeyList {
    pub active_fingerprint: Option<u32>,
    pub keys: Vec<KeyInfo>,
}

#[derive(Serialize, Deserialize, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct KeyInfo {
    pub name: String,
    pub mnemonic: Option<String>,
    pub secret_key: Option<String>,
    pub public_key: String,
    pub fingerprint: u32,
}

#[command]
#[specta]
pub fn key_list(state: State<AppState>) -> KeyList {
    state.key_list.lock().clone()
}

#[command]
#[specta]
pub fn log_in(state: State<AppState>, fingerprint: Option<u32>) {
    let mut key_list = state.key_list.lock();
    key_list.active_fingerprint = fingerprint;
    save_keys(&key_list);
}

#[command]
#[specta]
pub fn delete_fingerprint(state: State<AppState>, fingerprint: u32) {
    let mut key_list = state.key_list.lock();
    key_list.keys.retain(|key| key.fingerprint != fingerprint);

    if key_list.active_fingerprint == Some(fingerprint) {
        key_list.active_fingerprint = None;
    }

    save_keys(&key_list);
}

#[command]
#[specta]
pub fn import_from_mnemonic(state: State<AppState>, name: String, mnemonic: String) {
    let seed = Mnemonic::from_str(&mnemonic).unwrap().to_seed("");
    let secret_key = SecretKey::from_seed(&seed);
    let public_key = secret_key.public_key();
    let fingerprint = public_key.get_fingerprint();

    let key_info = KeyInfo {
        name,
        mnemonic: Some(mnemonic),
        secret_key: Some(hex::encode(secret_key.to_bytes())),
        public_key: hex::encode(public_key.to_bytes()),
        fingerprint,
    };

    let mut key_list = state.key_list.lock();
    key_list.keys.push(key_info);
    key_list.active_fingerprint = Some(fingerprint);
    save_keys(&key_list);
}

fn encryption_key(rng: &mut (impl Rng + CryptoRng)) -> Key<Aes256Gcm> {
    let entry = Entry::new("Sage Wallet", "Encryption Key").unwrap();

    match entry.get_password() {
        Ok(key) => *Key::<Aes256Gcm>::from_slice(&hex::decode(key).unwrap()),
        Err(Error::NoEntry) => {
            let key = Aes256Gcm::generate_key(rng);
            entry.set_password(&hex::encode(key)).unwrap();
            key
        }
        Err(error) => panic!("failed to get encryption key {error}"),
    }
}

#[derive(Serialize, Deserialize)]
struct EncryptedKeys {
    ciphertext: Vec<u8>,
    nonce: Vec<u8>,
}

fn create_dir() -> PathBuf {
    let home = home_dir().unwrap();
    let root = home.join(".sage");
    fs::create_dir_all(root.clone()).unwrap();
    root
}

pub fn load_keys() -> KeyList {
    let mut rng = ChaCha20Rng::from_entropy();
    let key = encryption_key(&mut rng);

    if let Ok(data) = fs::read(create_dir().join("keys.bin")) {
        let encrypted: EncryptedKeys = bincode::deserialize(&data).unwrap();
        let cipher = Aes256Gcm::new(&key);

        let data = cipher
            .decrypt(
                Nonce::from_slice(encrypted.nonce.as_ref()),
                encrypted.ciphertext.as_ref(),
            )
            .unwrap();

        return bincode::deserialize(&data).unwrap();
    }

    KeyList::default()
}

fn save_keys(keys: &KeyList) {
    let data = bincode::serialize(keys).unwrap();

    let mut rng = ChaCha20Rng::from_entropy();
    let key = encryption_key(&mut rng);

    let cipher = Aes256Gcm::new(&key);
    let nonce = Aes256Gcm::generate_nonce(rng);

    let ciphertext = cipher.encrypt(&nonce, data.as_ref()).unwrap();
    let encrypted = EncryptedKeys {
        ciphertext,
        nonce: nonce.to_vec(),
    };

    let path = create_dir().join("keys.bin");
    fs::write(path, bincode::serialize(&encrypted).unwrap()).unwrap();
}
