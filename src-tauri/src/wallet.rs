use sqlx::SqlitePool;

pub struct WalletDb {
    db: SqlitePool,
}

impl WalletDb {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
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
