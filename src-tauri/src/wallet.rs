use chia_bls::{DerivableKey, PublicKey};
use chia_wallet::{
    standard::{standard_puzzle_hash, DEFAULT_HIDDEN_PUZZLE_HASH},
    DeriveSynthetic,
};
use chia_wallet_sdk::{DerivationStore, PublicKeyStore};
use sqlx::SqlitePool;

pub struct WalletDb {
    db: SqlitePool,
    intermediate_pk: PublicKey,
}

impl WalletDb {
    pub fn new(db: SqlitePool, intermediate_pk: PublicKey) -> Self {
        Self {
            db,
            intermediate_pk,
        }
    }
}

impl PublicKeyStore for WalletDb {
    async fn count(&self) -> u32 {
        sqlx::query!(
            "
            SELECT COUNT(*) AS `count` FROM `derivations`
            "
        )
        .fetch_one(&self.db)
        .await
        .unwrap()
        .count as u32
    }

    async fn index_of_pk(&self, public_key: &PublicKey) -> Option<u32> {
        let public_key = public_key.to_bytes().to_vec();
        sqlx::query!(
            "
            SELECT `index` FROM `derivations`
            WHERE `public_key` = ?
            ",
            public_key,
        )
        .fetch_optional(&self.db)
        .await
        .unwrap()
        .map(|row| row.index as u32)
    }

    async fn public_key(&self, index: u32) -> Option<PublicKey> {
        sqlx::query!(
            "
            SELECT `public_key` FROM `derivations`
            WHERE `index` = ?
            ",
            index
        )
        .fetch_optional(&self.db)
        .await
        .unwrap()
        .map(|row| {
            let bytes: [u8; 48] = row.public_key.try_into().unwrap();
            PublicKey::from_bytes(&bytes).unwrap()
        })
    }

    async fn derive_to_index(&self, index: u32) {
        let mut tx = self.db.begin().await.unwrap();

        let start = sqlx::query!(
            "
            SELECT COUNT(*) AS `count` FROM `derivations`
            "
        )
        .fetch_one(&mut *tx)
        .await
        .unwrap()
        .count as u32;

        for index in start..index {
            let public_key = self
                .intermediate_pk
                .derive_unhardened(index)
                .derive_synthetic(&DEFAULT_HIDDEN_PUZZLE_HASH);
            let puzzle_hash = standard_puzzle_hash(&public_key);

            let public_key = public_key.to_bytes().to_vec();
            let puzzle_hash = puzzle_hash.to_vec();

            sqlx::query!(
                "
                INSERT OR IGNORE INTO `derivations` (
                    `index`,
                    `public_key`,
                    `puzzle_hash`
                )
                VALUES (?, ?, ?)
                ",
                index,
                public_key,
                puzzle_hash
            )
            .execute(&mut *tx)
            .await
            .unwrap();
        }

        tx.commit().await.unwrap();
    }
}

impl DerivationStore for WalletDb {
    async fn index_of_ph(&self, puzzle_hash: [u8; 32]) -> Option<u32> {
        let puzzle_hash = puzzle_hash.to_vec();
        sqlx::query!(
            "
            SELECT `index` FROM `derivations`
            WHERE `puzzle_hash` = ?
            ",
            puzzle_hash,
        )
        .fetch_optional(&self.db)
        .await
        .unwrap()
        .map(|row| row.index as u32)
    }

    async fn puzzle_hash(&self, index: u32) -> Option<[u8; 32]> {
        sqlx::query!(
            "
            SELECT `puzzle_hash` FROM `derivations`
            WHERE `index` = ?
            ",
            index
        )
        .fetch_optional(&self.db)
        .await
        .unwrap()
        .map(|row| row.puzzle_hash.try_into().unwrap())
    }

    async fn puzzle_hashes(&self) -> Vec<[u8; 32]> {
        sqlx::query!(
            "
            SELECT `puzzle_hash` FROM `derivations`
            ",
        )
        .fetch_all(&self.db)
        .await
        .unwrap()
        .into_iter()
        .map(|row| row.puzzle_hash.try_into().unwrap())
        .collect()
    }
}

pub struct Wallet {
    db: WalletDb,
}

impl Wallet {
    pub fn new(db: WalletDb) -> Self {
        Self { db }
    }
}
