use std::str::FromStr;

use bip39::Mnemonic;
use chia_bls::{PublicKey, SecretKey};
use serde::{Deserialize, Serialize};
use specta::{specta, Type};
use tauri::{command, State};
use thiserror::Error;

use crate::app_data::AppData;

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

#[derive(Error, Debug, Type)]
pub enum Error {
    #[error("invalid mnemonic")]
    Mnemonic,

    #[error("invalid secret key")]
    SecretKey,

    #[error("invalid public key")]
    PublicKey,

    #[error("fingerprint already exists")]
    DuplicateFingerprint,
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[command]
#[specta]
pub fn key_list(app: State<AppData>) -> KeyList {
    app.key_list()
}

#[command]
#[specta]
pub fn log_in(app: State<AppData>, fingerprint: Option<u32>) {
    app.log_in(fingerprint);
}

#[command]
#[specta]
pub fn delete_fingerprint(app: State<AppData>, fingerprint: u32) {
    app.delete_key(fingerprint);
}

#[command]
#[specta]
pub fn rename_fingerprint(app: State<AppData>, fingerprint: u32, name: String) {
    app.rename_key(fingerprint, name);
}

#[command]
#[specta]
pub fn import_from_mnemonic(
    app: State<AppData>,
    name: String,
    mnemonic: String,
) -> Result<(), Error> {
    let seed = Mnemonic::from_str(&mnemonic)
        .map_err(|_| Error::Mnemonic)?
        .to_seed("");
    let secret_key = SecretKey::from_seed(&seed);
    let public_key = secret_key.public_key();
    let fingerprint = public_key.get_fingerprint();

    if app.has_key(fingerprint) {
        return Err(Error::DuplicateFingerprint);
    }

    let key_info = KeyInfo {
        name,
        mnemonic: Some(mnemonic),
        secret_key: Some(hex::encode(secret_key.to_bytes())),
        public_key: hex::encode(public_key.to_bytes()),
        fingerprint,
    };

    app.add_key(key_info);

    Ok(())
}

#[command]
#[specta]
pub fn import_from_secret_key(
    app: State<AppData>,
    name: String,
    secret_key: String,
) -> Result<(), Error> {
    let bytes: [u8; 32] = hex::decode(secret_key).unwrap().try_into().unwrap();
    let secret_key = SecretKey::from_bytes(&bytes).map_err(|_| Error::SecretKey)?;
    let public_key = secret_key.public_key();
    let fingerprint = public_key.get_fingerprint();

    if app.has_key(fingerprint) {
        return Err(Error::DuplicateFingerprint);
    }

    let key_info = KeyInfo {
        name,
        mnemonic: None,
        secret_key: Some(hex::encode(secret_key.to_bytes())),
        public_key: hex::encode(public_key.to_bytes()),
        fingerprint,
    };

    app.add_key(key_info);

    Ok(())
}

#[command]
#[specta]
pub fn import_from_public_key(
    app: State<AppData>,
    name: String,
    public_key: String,
) -> Result<(), Error> {
    let bytes: [u8; 48] = hex::decode(public_key).unwrap().try_into().unwrap();
    let public_key = PublicKey::from_bytes(&bytes).map_err(|_| Error::PublicKey)?;
    let fingerprint = public_key.get_fingerprint();

    if app.has_key(fingerprint) {
        return Err(Error::DuplicateFingerprint);
    }

    let key_info = KeyInfo {
        name,
        mnemonic: None,
        secret_key: None,
        public_key: hex::encode(public_key.to_bytes()),
        fingerprint,
    };

    app.add_key(key_info);

    Ok(())
}
