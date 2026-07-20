import { openDatabaseSync } from 'expo-sqlite'

/* Native veri tabanı; web'in IndexedDB'sinden bağımsız, temiz başlangıç
   (plan kararı: web→native veri taşıma yok). Şema, @afiet/core tiplerinin
   SQL karşılığıdır; groups dizileri JSON string olarak saklanır. */
export const db = openDatabaseSync('afiet.db')

/* Migration'lar sırayla uygulanır; PRAGMA user_version kaçıncısının
   uygulandığını tutar. Şema değişikliği = diziye YENİ eleman (varolanı değiştirme). */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sex TEXT,
    birthDate TEXT,
    heightCm REAL,
    activityLevel TEXT
  );

  CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    date TEXT NOT NULL,
    meal TEXT NOT NULL,
    foodName TEXT NOT NULL,
    portionSize TEXT,
    quantity REAL NOT NULL,
    measure TEXT,
    groups TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX meals_profile_date ON meals(profileId, date);

  CREATE TABLE water (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    date TEXT NOT NULL,
    glasses INTEGER NOT NULL,
    UNIQUE(profileId, date)
  );

  CREATE TABLE customFoods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    groups TEXT NOT NULL,
    measure TEXT
  );

  CREATE TABLE measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    date TEXT NOT NULL,
    weightKg REAL NOT NULL,
    waistCm REAL,
    neckCm REAL,
    hipCm REAL,
    createdAt TEXT NOT NULL,
    UNIQUE(profileId, date)
  );
  `,
  // Menüm: kullanıcı besinine makro (JSON) ve kısa açıklama alanları
  `
  ALTER TABLE customFoods ADD COLUMN macros TEXT;
  ALTER TABLE customFoods ADD COLUMN description TEXT;
  `,
]

db.execSync('PRAGMA journal_mode = WAL')

const version =
  db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0
for (let v = version; v < MIGRATIONS.length; v++) {
  db.withTransactionSync(() => {
    db.execSync(MIGRATIONS[v])
    db.execSync(`PRAGMA user_version = ${v + 1}`)
  })
}
