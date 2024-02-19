use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use aes_gcm::{aead::Aead, AeadCore, Aes256Gcm, Key, KeyInit, Nonce};
use keyring::Entry;
use parking_lot::Mutex;
use rand::{CryptoRng, Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};
use tauri::api::path::home_dir;

use crate::{KeyInfo, KeyList};

pub struct AppData {
    rng: Mutex<ChaCha20Rng>,
    key_file: PathBuf,
    config_file: PathBuf,
    key_list: Mutex<KeyList>,
    config: Mutex<Config>,
}

#[derive(Serialize, Deserialize)]
struct EncryptedKeys {
    ciphertext: Vec<u8>,
    nonce: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct Config {
    networks: HashMap<String, Network>,
    active_network: String,
}

#[derive(Serialize, Deserialize)]
struct Network {
    dns_introducers: Vec<String>,
    agg_sig_data: String,
}

impl AppData {
    pub fn new() -> Self {
        let home = home_dir().unwrap();
        let dir = home.join(".sage");
        let key_file = dir.join("keys.bin");
        let config_file = dir.join("config.toml");

        fs::create_dir_all(dir.as_path()).unwrap();

        let mut rng = ChaCha20Rng::from_entropy();
        let key_list = Mutex::new(load_keys(&mut rng, key_file.as_path()));

        let config = if !config_file.as_path().try_exists().unwrap() {
            let mut networks = HashMap::new();
            networks.insert(
                "mainnet".to_string(),
                Network {
                    dns_introducers: vec!["dns-introducer.chia.net".to_string()],
                    agg_sig_data:
                        "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"
                            .to_string(),
                },
            );
            networks.insert(
                "simulator0".to_string(),
                Network {
                    dns_introducers: Vec::new(),
                    agg_sig_data:
                        "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"
                            .to_string(),
                },
            );

            let initial_config = Config {
                networks,
                active_network: "mainnet".to_string(),
            };

            fs::write(
                config_file.as_path(),
                toml::to_string_pretty(&initial_config).unwrap(),
            )
            .unwrap();

            initial_config
        } else {
            let text = fs::read_to_string(config_file.as_path()).unwrap();
            toml::from_str(&text).unwrap()
        };

        Self {
            rng: Mutex::new(rng),
            key_file,
            config_file,
            key_list,
            config: Mutex::new(config),
        }
    }

    pub fn networks(&self) -> Vec<String> {
        self.config.lock().networks.keys().cloned().collect()
    }

    pub fn active_network(&self) -> String {
        self.config.lock().active_network.clone()
    }

    pub fn switch_network(&self, network: String) {
        self.config.lock().active_network = network;
        self.save_config();
    }

    pub fn key_list(&self) -> KeyList {
        self.key_list.lock().clone()
    }

    pub fn add_key(&self, key_info: KeyInfo) {
        let mut key_list = self.key_list.lock();
        key_list.active_fingerprint = Some(key_info.fingerprint);
        key_list.keys.push(key_info);

        drop(key_list);
        self.save_keys();
    }

    pub fn delete_key(&self, fingerprint: u32) {
        let mut key_list = self.key_list.lock();
        key_list.keys.retain(|key| key.fingerprint != fingerprint);

        if key_list.active_fingerprint == Some(fingerprint) {
            key_list.active_fingerprint = None;
        }

        drop(key_list);
        self.save_keys();
    }

    pub fn log_in(&self, fingerprint: Option<u32>) {
        let mut key_list = self.key_list.lock();
        key_list.active_fingerprint = fingerprint;

        drop(key_list);
        self.save_keys();
    }

    pub fn rename_key(&self, fingerprint: u32, name: String) {
        let mut key_list = self.key_list.lock();

        let key = key_list
            .keys
            .iter_mut()
            .find(|key| key.fingerprint == fingerprint);

        if let Some(key) = key {
            key.name = name;

            drop(key_list);
            self.save_keys();
        }
    }

    fn save_keys(&self) {
        let data = bincode::serialize(&self.key_list.lock().keys).unwrap();

        let key = encryption_key(&mut *self.rng.lock());

        let cipher = Aes256Gcm::new(&key);
        let nonce = Aes256Gcm::generate_nonce(&mut *self.rng.lock());

        let ciphertext = cipher.encrypt(&nonce, data.as_ref()).unwrap();
        let encrypted = EncryptedKeys {
            ciphertext,
            nonce: nonce.to_vec(),
        };

        fs::write(
            self.key_file.as_path(),
            bincode::serialize(&encrypted).unwrap(),
        )
        .unwrap();
    }

    fn save_config(&self) {
        fs::write(
            self.config_file.as_path(),
            toml::to_string_pretty(&*self.config.lock()).unwrap(),
        )
        .unwrap();
    }
}

fn load_keys(rng: &mut (impl Rng + CryptoRng), path: &Path) -> KeyList {
    let key = encryption_key(rng);

    if let Ok(data) = fs::read(path) {
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

fn encryption_key(rng: &mut (impl Rng + CryptoRng)) -> Key<Aes256Gcm> {
    let entry = Entry::new("Sage Wallet", "Encryption Key").unwrap();

    match entry.get_password() {
        Ok(key) => *Key::<Aes256Gcm>::from_slice(&hex::decode(key).unwrap()),
        Err(keyring::Error::NoEntry) => {
            let key = Aes256Gcm::generate_key(rng);
            entry.set_password(&hex::encode(key)).unwrap();
            key
        }
        Err(error) => panic!("failed to get encryption key {error}"),
    }
}
