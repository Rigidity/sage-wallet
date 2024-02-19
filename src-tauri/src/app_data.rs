use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

use aes_gcm::{aead::Aead, AeadCore, Aes256Gcm, Key, KeyInit, Nonce};
use chia_bls::{derive_keys::master_to_wallet_unhardened_intermediate, PublicKey};
use chia_wallet_sdk::PublicKeyStore;
use keyring::Entry;
use parking_lot::Mutex;
use rand::{CryptoRng, Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::api::path::home_dir;

use crate::{
    wallet::{Wallet, WalletDb},
    KeyData, KeyInfo,
};

pub struct AppData {
    rng: Mutex<ChaCha20Rng>,
    db_path: PathBuf,
    key_file: PathBuf,
    config_file: PathBuf,
    key_list: Arc<Mutex<KeyData>>,

    pub config: Mutex<Config>,
    pub wallet: Mutex<Option<Arc<Wallet>>>,
}

#[derive(Serialize, Deserialize)]
struct EncryptedKeys {
    ciphertext: Vec<u8>,
    nonce: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub networks: HashMap<String, Network>,
    pub active_network: String,
}

impl Config {
    pub fn network(&self) -> &Network {
        &self.networks[&self.active_network]
    }
}

#[derive(Serialize, Deserialize)]
pub struct Network {
    pub dns_introducers: Vec<String>,
    pub address_prefix: String,
    pub agg_sig_data: String,
}

impl AppData {
    pub fn new() -> Self {
        let home = home_dir().unwrap();
        let dir = home.join(".sage");
        fs::create_dir_all(dir.as_path()).unwrap();

        let db_path = dir.join("db");
        fs::create_dir_all(db_path.as_path()).unwrap();

        let key_file = dir.join("keys.bin");
        let config_file = dir.join("config.toml");

        let mut rng = ChaCha20Rng::from_entropy();
        let key_list = Arc::new(Mutex::new(load_keys(&mut rng, key_file.as_path())));

        let config = if !config_file.as_path().try_exists().unwrap() {
            let mut networks = HashMap::new();
            networks.insert(
                "mainnet".to_string(),
                Network {
                    dns_introducers: vec!["dns-introducer.chia.net".to_string()],
                    address_prefix: "xch".to_string(),
                    agg_sig_data:
                        "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"
                            .to_string(),
                },
            );
            networks.insert(
                "simulator0".to_string(),
                Network {
                    dns_introducers: Vec::new(),
                    address_prefix: "xch".to_string(),
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
            db_path,
            key_file,
            config_file,
            key_list,
            config: Mutex::new(config),
            wallet: Mutex::new(None),
        }
    }

    pub async fn restart_wallet(&self) {
        let key_list = self.key_list();

        let Some(fingerprint) = key_list.active_fingerprint else {
            *self.wallet.lock() = None;
            return;
        };
        let Some(key) = key_list
            .keys
            .iter()
            .find(|key| key.fingerprint == fingerprint)
            .cloned()
        else {
            *self.wallet.lock() = None;
            return;
        };

        let bytes: [u8; 48] = hex::decode(key.public_key).unwrap().try_into().unwrap();
        let root_pk = PublicKey::from_bytes(&bytes).unwrap();
        let intermediate_pk = master_to_wallet_unhardened_intermediate(&root_pk);

        let path = self.db_path.join(format!("{fingerprint}.sqlite?mode=rwc"));
        let pool = SqlitePool::connect(path.to_str().unwrap()).await.unwrap();

        sqlx::migrate!().run(&pool).await.unwrap();

        let db = WalletDb::new(pool, intermediate_pk);
        db.derive_to_index(100).await;
        let wallet = Arc::new(Wallet::new(db));

        *self.wallet.lock() = Some(wallet);
    }

    pub fn networks(&self) -> Vec<String> {
        self.config.lock().networks.keys().cloned().collect()
    }

    pub fn active_network(&self) -> String {
        self.config.lock().active_network.clone()
    }

    pub async fn switch_network(&self, network: String) {
        self.config.lock().active_network = network;
        self.save_config();
        self.restart_wallet().await;
    }

    pub fn key_list(&self) -> KeyData {
        self.key_list.lock().clone()
    }

    pub fn add_key(&self, key_info: KeyInfo) {
        let mut key_list = self.key_list.lock();
        key_list.keys.push(key_info);

        drop(key_list);
        self.save_keys();
    }

    pub fn has_key(&self, fingerprint: u32) -> bool {
        self.key_list
            .lock()
            .keys
            .iter()
            .any(|key| key.fingerprint == fingerprint)
    }

    pub fn delete_key(&self, fingerprint: u32) {
        let mut key_list = self.key_list.lock();
        key_list.keys.retain(|key| key.fingerprint != fingerprint);

        if key_list.active_fingerprint == Some(fingerprint) {
            key_list.active_fingerprint = None;
        }

        drop(key_list);
        self.save_keys();

        fs::remove_file(self.db_path.join(format!("{fingerprint}.sqlite"))).ok();
    }

    pub async fn log_in(&self, fingerprint: Option<u32>) {
        {
            let mut key_list = self.key_list.lock();
            key_list.active_fingerprint = fingerprint;
        }

        self.save_keys();
        self.restart_wallet().await;
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
        let data = bincode::serialize(&*self.key_list.lock()).unwrap();

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

fn load_keys(rng: &mut (impl Rng + CryptoRng), path: &Path) -> KeyData {
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

    KeyData::default()
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
