use chia_wallet_sdk::{encode_address, DerivationStore};
use specta::specta;
use tauri::{command, State};

use crate::app_data::AppData;

#[command]
#[specta]
pub async fn fetch_derivations(app: State<'_, AppData>) -> Result<Vec<String>, ()> {
    let wallet = app.wallet.lock().clone().unwrap();
    let puzzle_hashes = wallet.db.puzzle_hashes().await;
    let prefix = app.config.lock().network().address_prefix.clone();

    Ok(puzzle_hashes
        .into_iter()
        .map(|ph| encode_address(ph, &prefix))
        .collect::<Result<Vec<_>, _>>()
        .unwrap())
}
